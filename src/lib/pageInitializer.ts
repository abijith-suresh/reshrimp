export type PageInitializerCleanup = (() => void) | undefined;

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
export function registerPageInitializer(
  key: string,
  init: (isSpaNavigation: boolean) => PageInitializerCleanup
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (!window.__reshrimpPageInitializers) {
    window.__reshrimpPageInitializers = new Set<string>();
  }
  const registry = window.__reshrimpPageInitializers;
  if (registry.has(key)) {
    return;
  }

  registry.add(key);

  let cleanup: (() => void) | undefined;

  const run = (isSpaNavigation: boolean) => {
    cleanup?.();

    const nextCleanup = init(isSpaNavigation);
    cleanup = typeof nextCleanup === "function" ? nextCleanup : undefined;
  };

  // Run on every SPA navigation — cleanup runs before each re-init
  document.addEventListener("astro:page-load", () => run(true));
  // Also run immediately for the initial page load
  run(false);
}
