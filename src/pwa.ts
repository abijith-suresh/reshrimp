import { registerSW } from "virtual:pwa-register";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

declare global {
  interface Window {
    __reshrimpPwaRegistered?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__reshrimpPwaRegistered) {
  window.__reshrimpPwaRegistered = true;

  const options: RegisterSWOptions = {
    immediate: true,
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    },
  };

  registerSW(options);
}

export {};
