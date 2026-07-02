self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch handler is required by mobile browsers for PWA installation
self.addEventListener('fetch', (event) => {
  // Pass-through
});
