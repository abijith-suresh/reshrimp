import { registerSW } from "virtual:pwa-register";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

declare global {
  interface Window {
    __reshrimpPwaRegistered?: boolean;
  }
}

const DEV_SW_RESET_KEY = "__reshrimpDevSwReset";
const CACHE_PREFIX = "reshrimp";

async function resetDevServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (!registrations.length) {
    sessionStorage.removeItem(DEV_SW_RESET_KEY);
    return;
  }

  const wasControlled = navigator.serviceWorker.controller !== null;

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))
    );
  }

  if (wasControlled && !sessionStorage.getItem(DEV_SW_RESET_KEY)) {
    sessionStorage.setItem(DEV_SW_RESET_KEY, "true");
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(DEV_SW_RESET_KEY);
}

if (typeof window !== "undefined" && !window.__reshrimpPwaRegistered) {
  window.__reshrimpPwaRegistered = true;

  if (import.meta.env.DEV) {
    void resetDevServiceWorkers();
  } else {
    const options: RegisterSWOptions = {
      immediate: true,
      onRegisterError(error) {
        console.error("Service worker registration failed", error);
      },
    };

    registerSW(options);
  }
}
