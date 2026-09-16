// Temporary cleanup for service workers shipped by earlier Reshrimp builds.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith("reshrimp") || key.startsWith("imgly-"))
          .map((key) => caches.delete(key))
      );

      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: "window" });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
    })()
  );
});
