/* PML Console demo — online only. Removes the offline worker of the first demo (24.10): clears caches, unregisters. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(K => Promise.all(K.filter(k => k.startsWith('pmlc-')).map(k => caches.delete(k))))
  .then(() => self.registration.unregister())
  .then(() => self.clients.matchAll({type: 'window'}))
  .then(C => C.forEach(c => c.navigate(c.url)))));
