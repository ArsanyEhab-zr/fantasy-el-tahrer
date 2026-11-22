import {
  applyCors,
  broadcastNotification,
  parseJsonBody,
  postOnly,
} from '../server/messaging.js';

const types = new Set([
  'kickoff',
  'goal',
  'yellow',
  'red',
  'sub',
  'penalty',
  'forfeit',
  'fulltime',
  'undo',
  'reminder',
]);

export default async function notify(req, res) {
  if (applyCors(req, res, 'POST, OPTIONS')) return;
  if (!postOnly(req, res)) return;

  const pin = req.headers?.['x-fanta-pin'];
  const target = process.env.VITE_APP_TARGET || 'viewer';
  const pins = {
    admin: process.env.VITE_ADMIN_PIN || '2026',
    referee: process.env.VITE_REFEREE_PIN || '1111',
  };
  if (!Object.hasOwn(pins, target) || pin !== pins[target]) {
    return res.status(403).json({ ok: false });
  }

  const bodyData = parseJsonBody(req);
  if (req.query?.verify === '1') {
    const validRole = bodyData?.role === target;
    return res.status(validRole ? 200 : 403).json({ ok: validRole });
  }

  const { type, title, body, matchId = '', url = '/live' } = bodyData;
  const maxBodyLen = type === 'reminder' ? 1500 : 500;
  if (
    !types.has(type) ||
    typeof title !== 'string' || !title || title.length > 160 ||
    typeof body !== 'string' || !body || body.length > maxBodyLen ||
    typeof matchId !== 'string' || matchId.length > 160 ||
    typeof url !== 'string' || !/^\/(live|standings)?(\?[^#\\]*)?$/.test(url)
  ) {
    return res.status(400).json({ ok: false });
  }

  try {
    await broadcastNotification({
      type,
      title,
      body,
      matchId,
      url,
      ttlSeconds: type === 'reminder' ? 3600 : 120,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('FCM broadcast failed', error?.code, error?.message);
    return res.status(503).json({ ok: false });
  }
}
