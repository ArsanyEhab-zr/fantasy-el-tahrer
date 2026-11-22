import {
  applyCors,
  getAdminProjectId,
  messaging,
  parseJsonBody,
  postOnly,
  savePushSubscription,
  topic,
} from '../server/messaging.js';

export default async function subscribe(req, res) {
  if (applyCors(req, res, 'POST, OPTIONS')) return;
  if (!postOnly(req, res)) return;

  const body = parseJsonBody(req);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token || token.length > 4096) {
    return res.status(400).json({ ok: false, code: 'invalid_token' });
  }

  try {
    const msg = messaging();
    const saProjectId = getAdminProjectId();
    const clientProjectId = process.env.VITE_FIREBASE_PROJECT_ID || '';
    if (saProjectId && clientProjectId && saProjectId !== clientProjectId) {
      console.error('Firebase project mismatch between service account and VITE_FIREBASE_PROJECT_ID', {
        saProjectId,
        clientProjectId,
      });
    }

    let topicSubscribed = false;
    let lastTopicError = null;

    const v1Result = await msg.subscribeToTopic([token], topic);
    if (!v1Result.failureCount) {
      topicSubscribed = true;
    } else {
      lastTopicError = v1Result.errors?.[0]?.error || null;
      console.warn('FCM v1 topic subscribe failed', {
        code: lastTopicError?.code,
        message: lastTopicError?.message,
        saProjectId,
        clientProjectId,
      });

      if (typeof msg.subscribeToTopicLegacy === 'function') {
        try {
          const legacyResult = await msg.subscribeToTopicLegacy([token], topic);
          if (!legacyResult.failureCount) {
            topicSubscribed = true;
          } else {
            const legacyErr = legacyResult.errors?.[0]?.error || null;
            lastTopicError = legacyErr || lastTopicError;
            console.warn('FCM legacy topic subscribe failed', {
              code: legacyErr?.code,
              message: legacyErr?.message,
            });
          }
        } catch (legacyThrow) {
          console.warn('FCM legacy topic subscribe threw', legacyThrow?.code || legacyThrow?.message);
        }
      }
    }

    if (topicSubscribed) {
      try {
        await savePushSubscription(token, true);
      } catch (storeErr) {
        console.warn('Firestore push_subscriptions save skipped/failed:', storeErr?.code || storeErr?.message);
      }
      return res.status(200).json({ ok: true, mode: 'topic' });
    }

    // Topic API failed (e.g., FCM v1 topicSubscriptions error). Validate token via dry-run send and persist for multicast.
    try {
      await msg.send({ token, data: { fanta_check: '1' } }, true);
      const saved = await savePushSubscription(token, false);
      if (saved) {
        return res.status(200).json({ ok: true, mode: 'multicast' });
      }
    } catch (verifyError) {
      console.error('FCM token dry-run validation failed', {
        code: verifyError?.code || lastTopicError?.code,
        message: verifyError?.message || lastTopicError?.message,
        saProjectId,
        clientProjectId,
      });
      return res.status(422).json({
        ok: false,
        code: verifyError?.code || lastTopicError?.code || 'topic_subscribe_failed',
      });
    }

    return res.status(422).json({
      ok: false,
      code: lastTopicError?.code || 'topic_subscribe_failed',
    });
  } catch (error) {
    console.error('FCM subscription failed', error?.code, error?.message);
    return res.status(503).json({ ok: false, code: error?.code || 'service_unavailable' });
  }
}
