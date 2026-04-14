var CACHE = 'fade-v2';
var ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.indexOf('supabase.co') !== -1) return;
  if (e.request.url.indexOf('googleapis.com') !== -1) return;
  if (e.request.url.indexOf('jsdelivr.net') !== -1) return;

  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/index.html');
      });
    })
  );
});

// PUSH NOTIFICATION RECEIVED
self.addEventListener('push', function(e) {
  var data = {};
  if (e.data) {
    try { data = e.data.json(); } catch(err) { data = { title: 'Fade', body: e.data.text() }; }
  }

  var title = data.title || 'Fade';
  var options = {
    body: data.body || 'You have a new notification',
    icon: 'https://xmgmpewuevzgriqgsoct.supabase.co/storage/v1/object/public/avatars/android-chrome-512x512.png',
    badge: 'https://xmgmpewuevzgriqgsoct.supabase.co/storage/v1/object/public/avatars/android-chrome-512x512.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200]
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// NOTIFICATION CLICKED
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) ? e.notification.data.url : '/';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
