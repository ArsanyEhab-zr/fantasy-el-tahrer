import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export const topic = 'fanta_live_fans';
export function messaging() {
  if (!getApps().length) {
    const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : { project_id: process.env.FIREBASE_PROJECT_ID, client_email: process.env.FIREBASE_CLIENT_EMAIL, private_key: process.env.FIREBASE_PRIVATE_KEY };
    account.private_key = account.private_key?.replace(/\\n/g, '\n');
    initializeApp({credential: cert(account)});
  }
  return getMessaging();
}
export function postOnly(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'POST') return true;
  res.setHeader('Allow','POST');
  res.status(405).json({ok:false});
  return false;
}
