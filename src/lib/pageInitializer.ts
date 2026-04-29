export type PageInitializerCleanup = void | (() => void);

declare global {
  interface Window {
    __reshrimpPageInitializers?: Set<string>;
  }
}

/**
 * Register a page initializer exactly once across Astro SPA navigations.
 *
 * The initializer runs immediately on first registration and again on every
 * `astro:page-load` event. If it returns a cleanup function, that cleanup runs
 * before the initializer is invoked again.
 */
export function registerPageInitializer(key: string, init: () => PageInitializerCleanup): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const registry = (window.__reshrimpPageInitializers ??= new Set<string>());
  if (registry.has(key)) {
    return;
  }

  registry.add(key);

  let cleanup: (() => void) | undefined;

  const run = () => {
    cleanup?.();

    const nextCleanup = init();
    cleanup = typeof nextCleanup === "function" ? nextCleanup : undefined;
  };

  document.addEventListener("astro:page-load", run);
  run();
}
