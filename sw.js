/* PF Fitness Tracker — service worker
   ------------------------------------------------------------------
   Goal: make the app installable + fully usable offline, while still
   picking up new deploys when you're online.

   Strategy:
     • Navigations (the app page)  -> network-first, fall back to the
       cached page when offline. Online users always get the freshest
       build you've pushed to the NAS.
     • Same-origin assets (icons, manifest) -> cache-first.
     • Cross-origin (Google Fonts)  -> stale-while-revalidate.
     • POST/PUT etc. are never intercepted, so the future "Back Up to
       NAS" sync calls pass straight through.

   Updating: bump CACHE_VERSION below on each deploy. The page detects
   the new worker and shows a "new version ready — Reload" banner.
   ------------------------------------------------------------------ */

const CACHE_VERSION = 'pf-cache-v7';        // <-- bump this string on each deploy
const APP_SHELL = './pf_workout_tracker.html';
const PRECACHE_URLS = [
  './pf_workout_tracker.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Absolute paths of the shell assets, resolved relative to where sw.js lives,
// so caching works whether the app is served at the domain root or a subpath.
const SW_DIR = self.location.pathname.replace(/sw\.js$/, '');
const SHELL_PATHS = ['pf_workout_tracker.html', 'manifest.json', 'icon-192.png', 'icon-512.png']
  .map(function (f) { return SW_DIR + f; });
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// --- Install: pre-cache the app shell -------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Note: we intentionally do NOT skipWaiting() here. The new worker waits
  // until the user taps "Reload" in the update banner (see SKIP_WAITING).
});

// --- Activate: drop old caches --------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// --- Allow the page to trigger an immediate update ------------------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// --- Fetch routing --------------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never handle non-GET (lets future NAS backup PUT/POST pass through).
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // 1) Page navigations -> network-first with offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(APP_SHELL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(APP_SHELL).then((r) => r || caches.match(req)))
    );
    return;
  }

  // 2) Cross-origin: only Google Fonts are cached (stale-while-revalidate).
  //    Anything else cross-origin (e.g. a NAS backup on another host) is left
  //    untouched, so it's always fetched fresh and never served from cache.
  if (url.origin !== self.location.origin) {
    if (FONT_HOSTS.indexOf(url.host) === -1) return;
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res && (res.ok || res.type === 'opaque')) {
                cache.put(req, res.clone()).catch(() => {});
              }
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // 3) Same-origin: only the known shell assets are cache-first. Any other
  //    same-origin GET (the NAS backup JSON, future data endpoints, etc.) is
  //    left to the network so backups are never stale or duplicated in cache.
  if (SHELL_PATHS.indexOf(url.pathname) === -1) return;
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});

/* ------------------------------------------------------------------
   Timer notifications.

   The page fires these via registration.showNotification() when a rest
   or cardio timer runs out while the app is in the background. Tapping
   one should bring the app back rather than opening a second copy, so
   focus an existing window when there is one.
   ------------------------------------------------------------------ */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) return w.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(APP_SHELL);
    })
  );
});
