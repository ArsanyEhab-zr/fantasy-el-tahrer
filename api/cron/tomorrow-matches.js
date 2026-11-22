import {
  applyCors,
  broadcastNotification,
  firestore,
  parseJsonBody,
} from '../../server/messaging.js';
import { buildTomorrowReminderPayload } from '../../src/utils/tomorrowMatches.js';

const STATE_DOC_PATH = 'config/notification_state';

function isAuthorizedCron(req) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization;
  return Boolean(cronSecret && auth === `Bearer ${cronSecret}`);
}

function isAuthorizedAdmin(req) {
  const target = process.env.VITE_APP_TARGET || 'viewer';
  if (target !== 'admin' && target !== 'viewer') return false;
  const adminPin = process.env.VITE_ADMIN_PIN || '2026';
  return req.headers?.['x-fanta-pin'] === adminPin;
}

export default async function tomorrowMatchesCron(req, res) {
  if (applyCors(req, res, 'GET, POST, OPTIONS')) return;
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ ok: false });
  }

  const isCron = req.method === 'GET';
  if (isCron) {
    if (!isAuthorizedCron(req)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const target = process.env.VITE_APP_TARGET || 'viewer';
    // Only the viewer project runs the daily cron so the shared repo doesn't trigger 3x across projects.
    if (target !== 'viewer') {
      return res.status(200).json({ ok: true, skipped: `target=${target}` });
    }
  } else if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const bodyData = isCron ? {} : parseJsonBody(req);
  const previewOnly = !isCron && Boolean(bodyData?.preview);
  const forceSend = !isCron && Boolean(bodyData?.force);

  try {
    const db = firestore();
    const [matchesSnap, teamsSnap, stateSnap] = await Promise.all([
      db.collection('matches').get(),
      db.collection('teams').get(),
      db.doc(STATE_DOC_PATH).get(),
    ]);

    const matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const reminder = buildTomorrowReminderPayload({ matches, teams });
    const state = stateSnap.exists ? stateSnap.data() || {} : {};
    const alreadySent = state.lastTomorrowReminderDate === reminder.tomorrowDate;

    if (previewOnly) {
      return res.status(200).json({
        ok: true,
        preview: true,
        alreadySent,
        lastSentAt: state.lastTomorrowReminderSentAt || null,
        ...reminder,
      });
    }

    if (reminder.count === 0) {
      return res.status(200).json({
        ok: true,
        sent: false,
        reason: 'no_matches',
        tomorrowDate: reminder.tomorrowDate,
        count: 0,
      });
    }

    if (!forceSend) {
      const claimed = await db.runTransaction(async tx => {
        const ref = db.doc(STATE_DOC_PATH);
        const snap = await tx.get(ref);
        if (snap.exists && snap.data()?.lastTomorrowReminderDate === reminder.tomorrowDate) {
          return false;
        }
        tx.set(ref, {
          lastTomorrowReminderDate: reminder.tomorrowDate,
          lastTomorrowReminderSentAt: new Date().toISOString(),
          lastTomorrowReminderCount: reminder.count,
        }, { merge: true });
        return true;
      });

      if (!claimed) {
        return res.status(200).json({
          ok: true,
          sent: false,
          alreadySent: true,
          reason: 'already_sent',
          tomorrowDate: reminder.tomorrowDate,
          count: reminder.count,
        });
      }
    }

    try {
      await broadcastNotification({
        type: 'reminder',
        title: reminder.title,
        body: reminder.body,
        matchId: '',
        url: '/',
        ttlSeconds: 3600,
      });
    } catch (sendError) {
      if (!forceSend) {
        // Release the daily lock so a retry can still deliver the reminder.
        await db.doc(STATE_DOC_PATH).set({
          lastTomorrowReminderDate: null,
        }, { merge: true }).catch(() => {});
      }
      throw sendError;
    }

    if (forceSend) {
      await db.doc(STATE_DOC_PATH).set({
        lastTomorrowReminderDate: reminder.tomorrowDate,
        lastTomorrowReminderSentAt: new Date().toISOString(),
        lastTomorrowReminderCount: reminder.count,
      }, { merge: true });
    }

    return res.status(200).json({
      ok: true,
      sent: true,
      tomorrowDate: reminder.tomorrowDate,
      count: reminder.count,
      title: reminder.title,
      body: reminder.body,
    });
  } catch (error) {
    console.error('Tomorrow matches reminder failed:', error?.code, error?.message);
    return res.status(503).json({ ok: false, error: 'Failed to send tomorrow matches reminder' });
  }
}
