/* ==========================================================================
   ثلاثة الأصول — Service Worker
   يُخزّن مسبقاً كل صفحات الموقع وموارده، ليعمل بالكامل دون إنترنت.
   ========================================================================== */

const VERSION    = 'v1.1.4';
const CACHE_NAME = 'thalathat-al-usul-' + VERSION;

/* كل ما يحتاجه الموقع ليعمل بلا إنترنت */
const PRECACHE = [
  './',
  './index.html',
  './asl-1.html',
  './asl-2.html',
  './asl-3.html',
  './quiz.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/quiz-data.js',
  './assets/js/quiz.js',
  './assets/img/logo.svg',
  './assets/img/makka.jpg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/icon-180.png',
  './assets/img/icon-maskable.png'
];

/* ---------- التثبيت: تخزين كل شيء مسبقاً ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        // نضيف كل ملف على حدة كي لا يفشل التثبيت كله بسبب ملف واحد
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' }))
            .catch((err) => console.warn('[sw] تعذّر تخزين:', url, err))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

/* ---------- التفعيل: حذف النسخ القديمة ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k.startsWith('thalathat-al-usul-'))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- طلب التحديث فوراً ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ---------- intercept الطلبات ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // نتجاهل كل ما ليس GET أو ليس من نطاق الموقع
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // صفحات HTML: من المخزن أولاً (يعمل فوراً ودون إنترنت)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // نحدّث النسخة المحفوظة عند توفّر الشبكة
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req)
            .then((cached) =>
              cached ||
              // أي صفحة غير محفوظة: نرجع للرئيسية بدل صفحة الخطأ
              caches.match('./index.html')
            )
        )
    );
    return;
  }

  // بقية الموارد (CSS / JS / صور): من المخزن فوراً مع تحديث في الخلفية
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});