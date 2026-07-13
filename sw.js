// Service Worker minimal untuk Manajemen Keuangan Masjid
// Tujuan: (1) memenuhi syarat "installable" di Chrome/Android supaya muncul sebagai
// ikon aplikasi asli, bukan sekadar shortcut bookmark, dan (2) cadangan tampilan
// dasar saat benar-benar offline.
//
// SENGAJA pakai strategi "network-first": selalu coba ambil versi TERBARU dulu dari
// server. Cache HANYA dipakai sebagai cadangan kalau benar-benar tidak ada koneksi.
// Ini penting supaya pembaruan aplikasi ke depannya langsung terlihat, tidak
// "tersangkut" di versi lama gara-gara cache yang terlalu agresif.

const CACHE_NAME = 'masjid-app-shell-v1';
const APP_SHELL_URL = './';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(APP_SHELL_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani navigasi ke halaman utama aplikasi (bukan permintaan ke Google
  // Sheets/Apps Script atau CDN eksternal -- itu semua tetap berjalan seperti biasa).
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Berhasil online -- simpan salinan terbaru untuk cadangan offline nanti
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, responseClone));
        return response;
      })
      .catch(() => {
        // Gagal (offline) -- pakai salinan terakhir yang tersimpan
        return caches.match(APP_SHELL_URL);
      })
  );
});
