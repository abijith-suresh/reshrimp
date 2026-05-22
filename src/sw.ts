/// <reference lib="webworker" />

import {
  BACKGROUND_REMOVAL_ASSET_PATH_PREFIX,
  BACKGROUND_REMOVAL_RUNTIME_ASSET_PATTERN,
  BACKGROUND_REMOVAL_RUNTIME_CACHE_NAME,
  BACKGROUND_REMOVAL_SELF_HOSTED_CACHE_NAME,
} from "./config/backgroundRemoval";
import { setCacheNameDetails } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { revision: string | null; url: string }>;
};

setCacheNameDetails({ prefix: "reshrimp" });
cleanupOutdatedCaches();

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
    url.origin === self.location.origin &&
    url.pathname.startsWith(BACKGROUND_REMOVAL_ASSET_PATH_PREFIX),
  new CacheFirst({
    cacheName: BACKGROUND_REMOVAL_SELF_HOSTED_CACHE_NAME,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

registerRoute(
  ({ request, url }) =>
    request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.includes("/_astro/") &&
    BACKGROUND_REMOVAL_RUNTIME_ASSET_PATTERN.test(url.pathname),
  new CacheFirst({
    cacheName: BACKGROUND_REMOVAL_RUNTIME_CACHE_NAME,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);
