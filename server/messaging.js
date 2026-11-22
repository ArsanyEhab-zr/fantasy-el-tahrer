import { createHash } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export const topic = 'fanta_live_fans';
export const SUBSCRIPTIONS_COLLECTION = 'push_subscriptions';
const DEFAULT_VIEWER_ORIGIN = 'https://fantasy-el-tahrer.vercel.app';
const ALLOWED_ORIGINS = new Set([
  'https://fantasy-el-tahrer.vercel.app',
  'https://fanta-ref.vercel.app',
  'https://fanta-admin-one.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

let cachedAccountProjectId = '';

function parseServiceAccount() {
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
      };
  if (account?.private_key) {
    account.private_key = account.private_key.replace(/\\n/g, '\n');
  }
  if (account?.project_id) {
    cachedAccountProjectId = String(account.project_id);
  }
  return account;
}

export function ensureAdminApp() {
  if (!getApps().length) {
    const account = parseServiceAccount();
    initializeApp({ credential: cert(account) });
  } else if (!cachedAccountProjectId && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed?.project_id) cachedAccountProjectId = String(parsed.project_id);
    } catch {
      // Ignore parse error here; credential init already happened.
    }
  }
  return getApps()[0];
}

export function getAdminProjectId() {
  ensureAdminApp();
  return cachedAccountProjectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
}

export function messaging() {
  return getMessaging(ensureAdminApp());
}

export function firestore() {
  return getFirestore(ensureAdminApp());
}

export function viewerOrigin() {
  if (process.env.VIEWER_URL) return process.env.VIEWER_URL;
  const target = process.env.VITE_APP_TARGET || 'viewer';
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (target === 'viewer' && host) return 'https://' + host;
  return DEFAULT_VIEWER_ORIGIN;
}

export function applyCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers?.origin;
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-fanta-pin, Authorization');
  if (allowOrigin !== '*') res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.setHeader('Cache-Control', 'no-store');
    res.status(204).json({ ok: true });
    return true;
  }
  return false;
}

export function parseJsonBody(req) {
  if (!req?.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return typeof req.body === 'object' ? req.body : {};
}

export function postOnly(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'POST') return true;
  res.setHeader('Allow', 'POST, OPTIONS');
  res.status(405).json({ ok: false });
  return false;
}

function tokenDocId(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function savePushSubscription(token, topicSubscribed) {
  if (process.env.FANTA_SKIP_PUSH_STORE === '1') return false;
  const db = firestore();
  await db.collection(SUBSCRIPTIONS_COLLECTION).doc(tokenDocId(token)).set({
    token,
    topic,
    topicSubscribed: Boolean(topicSubscribed),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  return true;
}

async function listStoredSubscriptions() {
  if (process.env.FANTA_SKIP_PUSH_STORE === '1') return [];
  try {
    const snap = await firestore().collection(SUBSCRIPTIONS_COLLECTION).get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => typeof d.token === 'string' && d.token.trim());
  } catch (error) {
    console.warn('Could not read push_subscriptions:', error?.code || error?.message);
    return [];
  }
}

async function cleanupInvalidTokens(entries) {
  if (!entries.length || process.env.FANTA_SKIP_PUSH_STORE === '1') return;
  try {
    const db = firestore();
    await Promise.all(entries.map(entry => db.collection(SUBSCRIPTIONS_COLLECTION).doc(entry.id).delete()));
  } catch (error) {
    console.warn('Failed to clean up stale push tokens:', error?.code || error?.message);
  }
}

export async function broadcastNotification({ type, title, body, matchId = '', url = '/live', ttlSeconds = 120 }) {
  const msg = messaging();
  const icon = '/icons/viewer/icon-192.png';
  const origin = viewerOrigin();
  const webpush = {
    headers: { Urgency: 'high', TTL: String(ttlSeconds) },
    notification: {
      icon,
      badge: icon,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      requireInteraction: false,
    },
    fcmOptions: { link: new URL(url, origin).href },
  };
  const payload = {
    notification: { title, body },
    data: { type, matchId, url },
    webpush,
  };

  let topicSent = false;
  let topicError = null;
  try {
    await msg.send({ topic, ...payload });
    topicSent = true;
  } catch (error) {
    topicError = error;
    console.error('FCM topic send failed:', error?.code || 'unknown', error?.message || '');
  }

  const stored = await listStoredSubscriptions();
  const multicastTargets = topicSent
    ? stored.filter(item => item.topicSubscribed !== true)
    : stored;

  let multicastSuccess = 0;
  const staleEntries = [];

  for (let i = 0; i < multicastTargets.length; i += 500) {
    const batch = multicastTargets.slice(i, i + 500);
    const tokens = batch.map(item => item.token);
    try {
      const response = await msg.sendEachForMulticast({ tokens, ...payload });
      multicastSuccess += response.successCount || 0;
      response.responses?.forEach((resItem, idx) => {
        if (!resItem.success && INVALID_TOKEN_CODES.has(resItem.error?.code)) {
          staleEntries.push(batch[idx]);
        }
      });
    } catch (error) {
      console.error('FCM multicast send failed:', error?.code || 'unknown', error?.message || '');
    }
  }

  if (staleEntries.length) {
    await cleanupInvalidTokens(staleEntries);
  }

  if (!topicSent && multicastSuccess === 0 && topicError) {
    throw topicError;
  }

  return {
    ok: true,
    topicSent,
    multicastSent: multicastSuccess,
    cleanedUp: staleEntries.length,
  };
}
