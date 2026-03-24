/// <reference lib="webworker" />

import { clientsClaim, setCacheNameDetails } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { revision: string | null; url: string }>;
};

setCacheNameDetails({ prefix: "reshrimp" });
clientsClaim();
cleanupOutdatedCaches();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST, {
  cleanURLs: true,
  directoryIndex: "index.html",
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

registerRoute(
  ({ request, url }) =>
    request.method === "GET" &&
    url.origin === "https://staticimgly.com" &&
    url.pathname.startsWith("/@imgly/background-removal-data/"),
  new CacheFirst({
    cacheName: "imgly-background-removal-cdn",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

registerRoute(
  ({ request, url }) =>
    request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.includes("/_astro/") &&
    /\/ort(?:[.-]|$)/.test(url.pathname),
  new CacheFirst({
    cacheName: "imgly-background-removal-runtime",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);
