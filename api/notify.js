import { messaging, postOnly, topic } from '../server/messaging.js';

const types = new Set(['kickoff','goal','yellow','red','sub','penalty','forfeit','fulltime']);
export default async function notify(req,res) {
  if (!postOnly(req,res)) return;
  const pin = req.headers['x-fanta-pin'];
  const target = process.env.VITE_APP_TARGET || 'viewer';
  const pins = {admin:process.env.VITE_ADMIN_PIN || '2026',referee:process.env.VITE_REFEREE_PIN || '1111'};
  if (!Object.hasOwn(pins,target) || pin !== pins[target]) return res.status(403).json({ok:false});
  if (req.query?.verify === '1') return res.status(req.body?.role === target ? 200 : 403).json({ok:req.body?.role === target});
  const { type, title, body, matchId = '', url = '/live' } = req.body || {};
  if (!types.has(type) || typeof title !== 'string' || !title || title.length > 160 ||
      typeof body !== 'string' || !body || body.length > 500 || typeof matchId !== 'string' || matchId.length > 160 ||
      typeof url !== 'string' || !/^\/(live|standings)(\?[^#\\]*)?$/.test(url)) return res.status(400).json({ok:false});
  try {
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    const icon = '/icons/viewer/icon-192.png';
    const webpush = {
      headers:{Urgency:'high',TTL:'120'},
      notification:{icon,badge:icon,dir:'rtl',lang:'ar',vibrate:[200,100,200],requireInteraction:false},
    };
    // FCM requires HTTPS here. The viewer worker resolves data.url on the installed viewer's origin.
    if (host) webpush.fcmOptions = {link: new URL(url,'https://' + host).href};
    await messaging().send({topic,notification:{title,body},data:{type,matchId,url},webpush});
    return res.status(200).json({ok:true});
  } catch (error) {
    console.error('FCM broadcast failed', error.code);
    return res.status(503).json({ok:false});
  }
}
