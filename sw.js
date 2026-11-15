/* Service worker: app shell in cache e funzionamento offline. */
importScripts("./version.js");

const VERSION = self.APP_VERSION || "dev";
const CACHE = `rings-turn-log-v${VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./i18n.js",
  "./version.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./bookmark.svg",
  "./bookmark-filled.svg",
  "./pencil-1.svg",
  "./trash.svg",
  "./reload.svg",
  "./reset.svg",
  "./update.svg",
  "./cross-2.svg",
  "./plus.svg",
  "./enter-full-screen.svg",
  "./exit-full-screen.svg",
  "./willpower.png",
  "./threat.png",
  "./progress.png",
  "./tap.mp3",
  "./undo.mp3",
  "./new-round.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Un asset opzionale mancante non deve bloccare l'installazione.
      .then((cache) =>
        Promise.all(ASSETS.map((asset) => cache.add(asset).catch(() => null)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") return caches.match("./index.html");
          return Response.error();
        });
    })
  );
});
