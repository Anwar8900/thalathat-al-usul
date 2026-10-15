/* ==========================================================================
   ثلاثة الأصول — ملف السكربت الموحّد
   الوضع الليلي/النهاري + شريط التقدّم + زر الأعلى + النسخ/المشاركة
   + قائمة الجوال + الانتقال السلس + ظهور تدريجي
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORE_KEY = 'thalathat-al-usul-theme';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) الوضع الليلي / النهاري ---------- */
  function currentTheme() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem(STORE_KEY, t); } catch (e) { }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#04120c' : '#0e8253');
    var btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.setAttribute('title', theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي');
      btn.setAttribute('aria-label', btn.getAttribute('title'));
    }
  }

  var saved = currentTheme();
  if (!saved) {
    saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(saved);

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        saveTheme(next);
        toast(next === 'dark' ? 'تم التبديل إلى الوضع الليلي' : 'تم التبديل إلى الوضع النهاري');
      });
    }
  });

  /* ---------- 2) أدوات مساعدة ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- 3) شريط تقدّم القراءة + ظل الترويسة ---------- */
  var bar = $('#progressBar');
  var header = $('.header');
  var toTop = $('.to-top');
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop;
    var height = (doc.scrollHeight - window.innerHeight);
    var pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
    if (bar) bar.style.width = pct + '%';
    if (header) header.classList.toggle('scrolled', scrollTop > 12);
    if (toTop) toTop.classList.toggle('show', scrollTop > 420);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- 4) زر العودة للأعلى ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
    onScroll();
  });

  /* ---------- 5) قائمة الجوال ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var navBtn = $('.nav-toggle');
    var nav = $('#primaryNav');
    if (!navBtn || !nav) return;

    function closeNav() {
      nav.classList.remove('open');
      navBtn.setAttribute('aria-expanded', 'false');
    }
    navBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  });

  /* ---------- 6) نسخ الرابط / المشاركة ---------- */
  var toastEl, toastTimer;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      toastEl.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
        '<span class="toast-text"></span>';
      document.body.appendChild(toastEl);
    }
    $('.toast-text', toastEl).textContent = message;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function sharePage() {
    var data = {
      title: document.title,
      text: document.querySelector('meta[name="description"]') ? document.querySelector('meta[name="description"]').content : document.title,
      url: location.href
    };
    if (navigator.share) {
      navigator.share(data).then(function () {
        toast('تمت المشاركة');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        copyPage();
      });
    } else {
      copyPage();
    }
  }

  function copyPage() {
    copyText(location.href).then(function (ok) {
      toast(ok ? 'تم نسخ رابط الصفحة' : 'تعذّر النسخ — انسخ الرابط من شريط العنوان');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $$('[data-share]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); sharePage(); });
    });
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); copyPage(); });
    });
  });

  /* ---------- 7) الانتقال السلس بين الصفحات ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.hasAttribute('data-share') || a.hasAttribute('data-copy')) return;
    if (/^(https?:|mailto:|tel:|javascript:|#)/i.test(href)) return;
    e.preventDefault();

    var go = function () { window.location.href = href; };
    if (reduceMotion) { go(); return; }
    document.body.classList.add('leaving');
    setTimeout(go, 240);
  });

  // استعادة التمرير لأعلى عند الدخول بالرجوع
  window.addEventListener('pageshow', function () {
    if (location.hash === '' && !document.referrer) window.scrollTo(0, 0);
  });

  /* ---------- 8) الظهور التدريجي للعناصر ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = (i * 70) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  });

  /* ---------- 9) إبراز الرابط الحالي في القائمة ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var here = location.pathname.split('/').pop() || 'index.html';
    $$('#primaryNav a').forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('/').pop();
      if (target === here) a.setAttribute('aria-current', 'page');
    });
  });
})();