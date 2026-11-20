import { useEffect, useState } from 'react';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const savedKey = 'fanta_viewer_push_token';
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installed = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;
function savedToken() {
  try { return localStorage.getItem(savedKey); } catch { return null; }
}

async function subscribe() {
  if (!await isSupported()) throw new Error('هذا المتصفح لا يدعم إشعارات التطبيق.');
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) throw new Error('انتظر اكتمال تحميل التطبيق ثم حاول مرة أخرى.');
  const token = await getToken(getMessaging(), { vapidKey, serviceWorkerRegistration: await navigator.serviceWorker.ready });
  if (!token) throw new Error('تعذّر تسجيل هذا الجهاز.');
  if (savedToken() !== token) {
    const r = await fetch('/api/subscribe', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
    if (!r.ok || !(await r.json()).ok) throw new Error('تعذّر تفعيل الإشعارات. حاول مرة أخرى.');
    try { localStorage.setItem(savedKey, token); } catch { /* Subscription still applies to this device. */ }
  }
}

export function usePushNotifications() {
  const [active,setActive] = useState(false);
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  useEffect(() => {
    let disposed = false;
    let stop;
    isSupported().then(async supported => {
      if (disposed || !supported) return;
      stop = onMessage(getMessaging(), payload => {
        setNotice([payload.notification?.title,payload.notification?.body].filter(Boolean).join(' — '));
        navigator.vibrate?.(60);
      });
      if (savedToken() && vapidKey && Notification.permission === 'granted') {
        await subscribe();
        if (!disposed) setActive(true);
      }
    }).catch(() => {});
    return () => { disposed = true; stop?.(); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function enable() {
    if (busy || active) return;
    setBusy(true);
    try {
      if (ios() && !installed()) throw new Error('على الآيفون: اضغط تثبيت التطبيق أولاً ثم افتحه من الشاشة الرئيسية لتفعيل الإشعارات');
      if (!('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('هذا المتصفح لا يدعم الإشعارات.');
      if (!vapidKey) throw new Error('الإشعارات غير مفعّلة بعد من إدارة الدوري.');
      if (await Notification.requestPermission() !== 'granted') throw new Error('اسمح بالإشعارات من إعدادات المتصفح لتفعيلها.');
      await subscribe();
      setActive(true);
      setNotice('الإشعارات مفعّلة');
    } catch (error) {
      setNotice(error.code ? 'تعذّر تفعيل الإشعارات. حاول مرة أخرى.' : error.message);
    } finally { setBusy(false); }
  }
  return { active,busy,notice,enable };
}
