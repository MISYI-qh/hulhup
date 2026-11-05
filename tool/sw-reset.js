// Service worker pembersih: menggantikan sw.js versi lama (cache-first) supaya pengunjung lama
// otomatis melihat Hulhup baru. Menghapus semua cache, mencabut dirinya, lalu memuat ulang halaman.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach((c) => c.navigate(c.url));
  })());
});
