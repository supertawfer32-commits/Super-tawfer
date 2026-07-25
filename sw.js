/* ================= Service Worker - سوبر توفير =================
   بيسمح بتثبيت الموقع كتطبيق (PWA)، ويكاش شكل التطبيق الأساسي
   (الصفحة + الأيقونات + الخطوط) عشان يفتح بسرعة ويشتغل حتى مع نت ضعيف/منقطع.
   ملحوظة: أي طلبات لفايربيز/فايرستور بتتسيب تروح للنت مباشرة زي ما هي،
   عشان بيانات المنتجات والطلبات تفضل محدثة لحظيًا ومفيش بيانات قديمة اتكاشت غلط.
================================================================= */

const CACHE_VERSION = 'super-tawfer-v1';
const APP_SHELL = [
  './super_tawfer-22-4.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('تعذر تجهيز الكاش الأولي:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // نتعامل بس مع طلبات GET
  if (request.method !== 'GET') return;

  // أي حاجة برة نفس النطاق (Firebase, Firestore, خطوط جوجل, صور خارجية...) تسيبها تروح للنت مباشرة من غير كاش
  if (new URL(request.url).origin !== self.location.origin) return;

  // Stale-While-Revalidate: يرجّع النسخة المحفوظة فورًا لو موجودة (سرعة + شغال أوفلاين)،
  // وفي نفس الوقت يجيب نسخة جديدة من النت ويحدث بيها الكاش لمرة الجاية
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
