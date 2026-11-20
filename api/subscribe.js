import { messaging, postOnly, topic } from '../server/messaging.js';

export default async function subscribe(req,res) {
  if (!postOnly(req,res)) return;
  const token = req.body?.token;
  if (typeof token !== 'string' || !token.trim() || token.length > 4096) return res.status(400).json({ok:false});
  try {
    const result = await messaging().subscribeToTopic([token],topic);
    if (result.failureCount) return res.status(422).json({ok:false});
    return res.status(200).json({ok:true});
  } catch (error) {
    console.error('FCM subscription failed', error.code);
    return res.status(503).json({ok:false});
  }
}
