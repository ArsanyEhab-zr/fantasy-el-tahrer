import { useEffect, useState } from 'react';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const savedKey = 'fanta_viewer_push_token';
const syncVersionKey = 'fanta_viewer_push_sync';
const CURRENT_SYNC_VERSION = 'v2';
const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Ignore storage restrictions. */ }
}

async function ensureServiceWorkerReady() {
  let registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch {
      throw new Error('انتظر اكتمال تحميل التطبيق ثم حاول مرة أخرى.');
    }
  }

  let timeoutId;
  try {
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('استغرق تجهيز خدمة الإشعارات وقتاً طويلاً. أعد تحميل الصفحة وحاول مرة أخرى.')),
          8000
        );
      }),
    ]);
    return ready || registration;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapPushErrorMessage(error) {
  const code = String(error?.code || '');
  const name = String(error?.name || '');

  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    return 'تم حظر الإشعارات من إعدادات المتصفح أو الهاتف. افتح إعدادات الموقع واسمح بالإشعارات ثم أعد المحاولة.';
  }
  if (code === 'messaging/permission-blocked' || name === 'NotAllowedError') {
    return 'تم حظر الإشعارات من إعدادات المتصفح أو الهاتف. اسمح بالإشعارات للموقع ثم أعد المحاولة.';
  }
  if (code === 'messaging/unsupported-browser') {
    return 'هذا المتصفح لا يدعم إشعارات التطبيق. افتح الموقع من Chrome أو Safari (بعد التثبيت على الشاشة الرئيسية للآيفون).';
  }
  if (code === 'messaging/failed-service-worker-registration') {
    return 'تعذّر تسجيل خدمة الإشعارات في المتصفح. أعد تحميل الصفحة وحاول مرة أخرى.';
  }
  if (code === 'messaging/token-subscribe-failed' || name === 'AbortError') {
    return 'تعذّر ربط المتصفح بخدمة الإشعارات. تأكد من الاتصال بالإنترنت وعدم استخدام التصفح الخفي أو مانع التتبع.';
  }
  if (error?.code) {
    return 'تعذّر تفعيل الإشعارات حالياً. تأكد من السماح بالإشعارات في إعدادات المتصفح وحاول مرة أخرى.';
  }
  return error?.message || 'تعذّر تفعيل الإشعارات. حاول مرة أخرى.';
}

async function subscribe() {
  if (!await isSupported()) {
    throw new Error('هذا المتصفح لا يدعم إشعارات التطبيق. جرّب فتحه من Chrome أو Safari.');
  }
  const serviceWorkerRegistration = await ensureServiceWorkerReady();
  const token = await getToken(getMessaging(), { vapidKey, serviceWorkerRegistration });
  if (!token) {
    throw new Error('تعذّر تسجيل هذا الجهاز لاستقبال الإشعارات.');
  }

  const alreadySynced =
    readStorage(savedKey) === token && readStorage(syncVersionKey) === CURRENT_SYNC_VERSION;
  if (!alreadySynced) {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok) {
      console.error('[Push] /api/subscribe failed', response.status, payload);
      if (response.status === 503) {
        throw new Error('خدمة الإشعارات غير متوفرة مؤقتاً من الخادم. حاول بعد قليل.');
      }
      throw new Error('تعذّر تسجيل جهازك في خدمة الإشعارات. حاول مرة أخرى.');
    }
    writeStorage(savedKey, token);
    writeStorage(syncVersionKey, CURRENT_SYNC_VERSION);
  }
}

export function usePushNotifications() {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let disposed = false;
    let stop;
    isSupported().then(async supported => {
      if (disposed || !supported) return;
      stop = onMessage(getMessaging(), payload => {
        setNotice([payload.notification?.title, payload.notification?.body].filter(Boolean).join(' — '));
        navigator.vibrate?.(60);
      });
      if (readStorage(savedKey) && vapidKey && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
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
      if (isIos() && !isStandalone()) {
        throw new Error('على الآيفون والآيباد: افتح قائمة المشاركة (Share) واختر "إضافة إلى الشاشة الرئيسية"، ثم افتح التطبيق من الشاشة الرئيسية لتفعيل الإشعارات.');
      }
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('هذا المتصفح لا يدعم إشعارات التطبيق. افتح الموقع عبر Chrome أو Safari.');
      }
      if (!vapidKey) {
        throw new Error('الإشعارات غير مفعّلة بعد من إدارة الدوري.');
      }
      if (Notification.permission === 'denied') {
        throw new Error('تم حظر الإشعارات في إعدادات المتصفح أو الهاتف. افتح إعدادات الموقع واسمح بالإشعارات ثم أعد المحاولة.');
      }
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        throw new Error('تم رفض الإشعارات. لتفعيلها، اسمح بالإشعارات للموقع من إعدادات المتصفح أو الهاتف.');
      }
      if (permission !== 'granted') {
        throw new Error('لم يتم منح إذن الإشعارات. اضغط "سماح" عند ظهور الطلب.');
      }
      await subscribe();
      setActive(true);
      setNotice('تم تفعيل الإشعارات بنجاح');
    } catch (error) {
      console.warn('[Push] enable failed:', error?.code || error?.name || '', error?.message || error);
      setNotice(mapPushErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return { active, busy, notice, enable };
}
