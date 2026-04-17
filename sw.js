/* sw.js — PYL0N Suite v5 (Safari Optimized) */

const CACHE_NAME = 'pyl0n-v5'; // Versiyonu v5 yaptık

const PRECACHE_ASSETS = [
  './index.html',
  './favicon.svg',
  './logo.svg',
  './vendor/pyl0n-native.js',
  './vendor/pyl0n-suite.js',
  './vendor/pyl0n-state.js',
  './vendor/pyl0n-validate.js',
  './libs/fonts.css'
];

// Uygulama sayfaları (Uzantısız erişimler için)
const PAGES = [
  'timecast', 'resourcecast', 'orgcast', 'rfqcast', 
  'dorcast', 'riskcast', 'calccast', 'lettercast', 
  'cashflow', 'w2w-report', 'cvcast', 'actionlog', 'bidscore'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Sadece aynı kökenli GET isteklerini işle
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // STRATEJİ: Sayfa Navigasyonu ise (HTML dosyaları)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Safari hatasını önlemek için: Eğer cevap yönlendirilmişse (redirected), temiz bir kopya oluştur
          if (response.redirected) {
            return new Response(response.body, {
              headers: response.headers,
              status: response.status,
              statusText: response.statusText
            });
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          // OFFLINE: Önce tam eşleşme, sonra .html ekleyerek dene
          const cached = await caches.match(event.request);
          if (cached) return cached;
          
          const path = url.pathname.split('/').pop();
          if (PAGES.includes(path)) {
             return caches.match(`./${path}.html`);
          }
          return caches.match('./index.html');
        })
    );
    return;
  }

  // STRATEJİ: Assetler (JS, CSS, Resim) için Network-First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
