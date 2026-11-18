/* Sirtanio 360 service worker: app shell offline + runtime cache for images/fonts. */
const VERSION = "sirtanio360-html-v2";
const SHELL = "./";
const PAGES = [SHELL, "lot.html", "portal.html", "js/portal.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(PAGES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigations: network first, fall back to cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(SHELL))),
    );
    return;
  }

  const cacheable =
    url.origin === self.location.origin ||
    url.hostname === "images.unsplash.com" ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com";
  if (!cacheable) return;

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
