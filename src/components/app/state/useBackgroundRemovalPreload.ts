import { onCleanup, onMount } from "solid-js";
import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";

function scheduleIdleTask(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (
    typeof idleWindow.requestIdleCallback === "function" &&
    typeof idleWindow.cancelIdleCallback === "function"
  ) {
    const id = idleWindow.requestIdleCallback(() => callback(), { timeout: 1500 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const id = globalThis.setTimeout(callback, 300);
  return () => globalThis.clearTimeout(id);
}

export function useBackgroundRemovalPreload(): void {
  onMount(() => {
    const cancelIdleTask = scheduleIdleTask(() => {
      void preloadBackgroundRemoval().catch(() => {
        // Silently ignore preload failures — will retry on actual use.
      });
    });

    onCleanup(cancelIdleTask);
  });
}
