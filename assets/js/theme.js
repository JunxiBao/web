// Apply theme immediately (before CSS renders) to prevent flash
(function () {
  var urlTheme = new URLSearchParams(window.location.search).get('theme');
  if (urlTheme === 'dark' || urlTheme === 'light') {
    document.documentElement.setAttribute('data-theme', urlTheme);
  }
  // No URL param → no attribute → CSS media query (system theme) takes over
}());

function _themeUpdateURL(theme) {
  try {
    var url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    history.replaceState(null, '', url.toString());
  } catch (e) {}
}

// Water-wave reveal animation when switching themes
function _themeRipple(x, y, applyChange) {
  var maxR = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  if (document.startViewTransition) {
    var tr = document.startViewTransition(applyChange);
    tr.ready.then(function () {
      document.documentElement.animate(
        {
          clipPath: [
            'circle(0px at ' + x + 'px ' + y + 'px)',
            'circle(' + maxR + 'px at ' + x + 'px ' + y + 'px)'
          ]
        },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
  } else {
    // Fallback: apply theme first, then show expanding overlay
    applyChange();
    var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim()
      || (document.documentElement.getAttribute('data-theme') === 'dark' ? '#0a0a0a' : '#ffffff');
    var ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999', 'pointer-events:none',
      'background:' + bg,
      'clip-path:circle(0px at ' + x + 'px ' + y + 'px)',
      'transition:clip-path .5s ease-in-out'
    ].join(';');
    document.body.appendChild(ov);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ov.style.clipPath = 'circle(' + maxR + 'px at ' + x + 'px ' + y + 'px)';
      });
    });
    ov.addEventListener('transitionend', function () { ov.remove(); }, { once: true });
  }
}

// Public API
window.ThemeManager = {
  // Returns 'dark', 'light', or null (no URL param = follow system)
  get: function () {
    return document.documentElement.getAttribute('data-theme');
  },
  // Only accepts 'dark' or 'light'
  set: function (theme, x, y) {
    var self = this;
    var applyChange = function () {
      document.documentElement.setAttribute('data-theme', theme);
      _themeUpdateURL(theme);
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    };
    if (typeof x === 'number' && typeof y === 'number') {
      _themeRipple(x, y, applyChange);
    } else {
      applyChange();
    }
  },
  // Toggle: dark ↔ light
  cycle: function (x, y) {
    this.set(this.getEffective() === 'dark' ? 'light' : 'dark', x, y);
  },
  getEffective: function () {
    var t = this.get();
    return t || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
};

// Carry theme URL param when navigating to internal pages
document.addEventListener('click', function (e) {
  var link = e.target.closest && e.target.closest('a[href]');
  if (!link) return;
  var theme = document.documentElement.getAttribute('data-theme');
  if (!theme) return; // no user selection → let destination page use its own system default
  var href = link.getAttribute('href');
  if (!href || /^(https?:|mailto:|javascript:|tel:|#)/.test(href)) return;
  e.preventDefault();
  try {
    var url = new URL(href, window.location.href);
    url.searchParams.set('theme', theme);
    window.location.href = url.toString();
  } catch (err) {}
}, true);

// Global progressive image loading:
// Phase 1 (DOMContentLoaded): scan <img data-src> → set src to lowres (blur)
// Phase 2 (after langready): IntersectionObserver → swap to full-res on demand
(function () {
  var PREPARED_ATTR = 'data-progressive-prepared';
  var FULL_ATTR = 'data-fullres-src';
  var OPT_OUT_ATTR = 'data-progressive-off';
  // 1×1 transparent GIF as placeholder when no lowres exists
  var PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  function detectAssetPrefix() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute('src');
      if (!src || !/assets\/js\/theme\.js(\?|#|$)/.test(src)) continue;
      var parsed = normalizeURL(src);
      if (!parsed) continue;
      return parsed.pathname.replace(/assets\/js\/theme\.js$/, 'assets/');
    }
    return '/assets/';
  }

  var ASSET_PREFIX = detectAssetPrefix();
  var BASE = ASSET_PREFIX + 'images/';
  var LOWRES_BASE = BASE + '.lowres/';

  function injectStyles() {
    if (document.getElementById('progressive-image-style')) return;
    var style = document.createElement('style');
    style.id = 'progressive-image-style';
    style.textContent = [
      '.progressive-image{transition:filter .4s ease, opacity .4s ease;}',
      '.progressive-image.is-lowres{filter:blur(12px);opacity:.88;transform:scale(1.02);}',
      '.progressive-image.is-fullres{filter:none;opacity:1;transform:scale(1);}',
      'img[data-src]:not([src]){min-height:60px;background:var(--bg-tertiary,#1e1e21);}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function normalizeURL(url) {
    try {
      return new URL(url, window.location.href);
    } catch (e) {
      return null;
    }
  }

  function toLowresURL(fullURL) {
    var parsed = normalizeURL(fullURL);
    if (!parsed || parsed.pathname.indexOf(BASE) !== 0) return null;
    // Skip if already a lowres URL
    if (parsed.pathname.indexOf(LOWRES_BASE) === 0) return null;
    parsed.pathname = LOWRES_BASE + parsed.pathname.slice(BASE.length);
    return parsed.toString();
  }

  function markLow(img) {
    img.classList.add('progressive-image', 'is-lowres');
    img.classList.remove('is-fullres');
  }

  function markFull(img) {
    img.classList.add('progressive-image', 'is-fullres');
    img.classList.remove('is-lowres');
  }

  // ─── Phase 1: Prepare images (lowres or placeholder) ────────────────────────
  // Handles both new data-src images and legacy src images
  var preparedImages = [];

  function prepareImage(img) {
    if (!img) return;
    if (img.getAttribute(PREPARED_ATTR) === '1') return;
    if (img.getAttribute(OPT_OUT_ATTR) === '1') return;

    // Determine the full-res URL from data-src or src
    var dataSrc = img.getAttribute('data-src');
    var rawSrc = img.getAttribute('src');
    var fullURL = null;

    if (dataSrc) {
      // New pattern: <img data-src="...">
      fullURL = normalizeURL(dataSrc);
    } else if (rawSrc && !/^(data:|blob:)/i.test(rawSrc)) {
      // Legacy pattern: <img src="..."> (backward compatible)
      var parsed = normalizeURL(rawSrc);
      if (parsed && parsed.origin === window.location.origin && parsed.pathname.indexOf(BASE) === 0 && parsed.pathname.indexOf(LOWRES_BASE) !== 0) {
        fullURL = parsed;
      }
    }

    if (!fullURL) return;

    var lowURL = toLowresURL(fullURL.toString());

    img.setAttribute(PREPARED_ATTR, '1');
    img.setAttribute(FULL_ATTR, fullURL.toString());
    img.decoding = 'async';

    if (lowURL) {
      // Set src to lowres — browser downloads tiny image
      markLow(img);

      var onLowError = function () {
        img.removeEventListener('error', onLowError);
        // Lowres missing — use placeholder, will load full-res in Phase 2
        img.src = PLACEHOLDER;
      };
      img.addEventListener('error', onLowError);
      img.src = lowURL;
    } else {
      // No lowres available — use placeholder
      img.src = PLACEHOLDER;
    }

    preparedImages.push(img);
  }

  function prepareAllInDOM() {
    // Handle new data-src images
    var dataSrcImgs = document.querySelectorAll('img[data-src]');
    dataSrcImgs.forEach(prepareImage);
    // Handle legacy src images (backward compatible)
    var srcImgs = document.querySelectorAll('img[src]');
    srcImgs.forEach(prepareImage);
  }

  // ─── Phase 2: On-demand full-res loading via IntersectionObserver ───────────
  function swapToFull(img) {
    if (!img || !img.isConnected) return;
    var fullURL = img.getAttribute(FULL_ATTR);
    if (!fullURL) return;

    var preload = new Image();
    preload.decoding = 'async';
    preload.src = fullURL;

    var commit = function () {
      if (!img.isConnected) return;
      img.src = fullURL;
      markFull(img);
    };

    if (typeof preload.decode === 'function') {
      preload.decode().then(commit).catch(function () {
        if (preload.complete) commit();
        else {
          preload.onload = commit;
          preload.onerror = commit;
        }
      });
      return;
    }

    if (preload.complete) commit();
    else {
      preload.onload = commit;
      preload.onerror = commit;
    }
  }

  function startIntersectionLoading() {
    if (!preparedImages.length) return;

    // Use IntersectionObserver for on-demand loading
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            swapToFull(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        // Start loading when image is within 200px of viewport
        rootMargin: '200px 0px'
      });

      preparedImages.forEach(function (img) {
        observer.observe(img);
      });
    } else {
      // Fallback: load all images sequentially
      preparedImages.forEach(swapToFull);
    }
  }

  function startLoadingAfterLang() {
    // Use requestIdleCallback if available, otherwise setTimeout
    var scheduleLoad = window.requestIdleCallback || function (fn) { setTimeout(fn, 50); };
    scheduleLoad(startIntersectionLoading);
  }

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  injectStyles();

  // Phase 1: prepare images as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAllInDOM, { once: true });
  } else {
    prepareAllInDOM();
  }

  // Phase 2: wait for translations, then start on-demand loading
  if (window.__langReady) {
    // Translations already done (e.g., script loaded late)
    startLoadingAfterLang();
  } else {
    // Wait for langready event
    window.addEventListener('langready', startLoadingAfterLang, { once: true });
    // Safety net: if langready never fires (e.g., lang.js missing), start after 800ms
    setTimeout(function () {
      if (!window.__langReady) startLoadingAfterLang();
    }, 800);
  }
})();
