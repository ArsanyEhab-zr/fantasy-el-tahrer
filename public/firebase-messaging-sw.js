// Workbox imports this worker once. Config and both compat libraries are emitted by Vite.
self.addEventListener('notificationclick', event => {
  const data = event.notification.data?.FCM_MSG?.data || event.notification.data;
  if (!data?.type) return;
  event.stopImmediatePropagation();
  event.notification.close();
  const path = data.matchId ? '/live?matchId=' + encodeURIComponent(data.matchId) : data.url === '/standings' ? '/standings' : '/live';
  const url = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    for (const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})) {
      if (new URL(client.url).origin === self.location.origin) {
        const tab = await client.navigate(url);
        if (tab) return tab.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
importScripts('/push/config.js', '/push/firebase-app-compat.js', '/push/firebase-messaging-compat.js');
firebase.initializeApp(self.fantaFirebaseConfig);
firebase.messaging().onBackgroundMessage(payload => {
  // FCM already displays notification messages. Only data-only pushes need a manual banner.
  if (payload.notification || !payload.data?.title) return;
  return self.registration.showNotification(payload.data.title, {
    body:payload.data.body, data:payload.data, lang:'ar',dir:'rtl', icon:'/icons/viewer/icon-192.png',
    badge:'/icons/viewer/icon-192.png',vibrate:[200,100,200],
  });
});
