// Service worker mínimo: no cachea nada, solo existe para que Chrome/Android
// consideren la app "instalable" (piden un SW con handler de fetch registrado).
// Si en el futuro se quiere soporte offline real, acá se agregaría una
// estrategia de cache (cache-first para estáticos, network-first para datos).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
