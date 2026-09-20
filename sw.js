/* PWA service worker — offline gyorsítótár */
const GY = "zaszlo-v2-2";
const FAJLOK = [
  "./", "./index.html", "./style.css", "./app-v2.js",
  "./flags.js", "./lobogas-webgl.js", "./zaszlo-app.js",
  "./manifest.webmanifest"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(GY).then(function (c) {
    return c.addAll(FAJLOK).catch(function () {});
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (kulcsok) {
    return Promise.all(kulcsok.filter(function (k) { return k !== GY; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // külső (font) — hagyjuk a hálózatra
  /* HÁLÓZAT-ELSŐ: mindig a friss fájlt hozzuk, a cache csak offline tartalék */
  e.respondWith(
    fetch(e.request).then(function (valasz) {
      const masolat = valasz.clone();
      caches.open(GY).then(function (c) { c.put(e.request, masolat); });
      return valasz;
    }).catch(function () {
      return caches.match(e.request).then(function (t) {
        return t || caches.match("./index.html");
      });
    })
  );
});
