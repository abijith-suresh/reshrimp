import {
  BACKGROUND_REMOVAL_MODEL,
  getBackgroundRemovalPublicPath,
} from "../config/backgroundRemoval";
import type { BackgroundRemovalProgressCallback } from "../types/processing";

let backgroundRemovalModulePromise: Promise<typeof import("@imgly/background-removal")> | undefined;

type BackgroundRemovalConfig = {
  model: typeof BACKGROUND_REMOVAL_MODEL;
  publicPath: string;
  device: "cpu";
  fetchArgs?: RequestInit;
  progress?: (key: string, current: number, total: number) => void;
};

let initializationRetryAttempt = 0;

function getBackgroundRemovalConfig(): BackgroundRemovalConfig {
  return {
    model: BACKGROUND_REMOVAL_MODEL,
    publicPath: getBackgroundRemovalPublicPath(window.location.origin),
    // Pinned so the WebGPU onnxruntime stays unreachable — the build excludes
    // its ~24 MB jsep wasm, and the self-hosted mirror carries CPU assets only.
    device: "cpu",
    ...(initializationRetryAttempt > 0
      ? {
          // The library memoizes initialization by the serialized config and
          // retains rejected promises. A unique same-origin header gives a
          // later attempt a fresh cache key without changing model behavior.
          fetchArgs: {
            headers: { "X-Reshrimp-Initialization-Attempt": String(initializationRetryAttempt) },
          },
        }
      : {}),
  };
}

function advanceInitializationRetry(): void {
  initializationRetryAttempt += 1;
}

function loadBackgroundRemovalModule() {
  backgroundRemovalModulePromise ??= import("@imgly/background-removal").catch((err: unknown) => {
    // A rejected import must not stay cached — a single transient failure
    // would otherwise kill background removal for the whole session.
    backgroundRemovalModulePromise = undefined;
    throw err;
  });
  return backgroundRemovalModulePromise;
}

/**
 * Preloads the WASM runtime and ML model in the background. Call from an idle
 * callback after the app has rendered so it never delays the initial bundle.
 */
export async function preloadBackgroundRemoval(): Promise<void> {
  const { preload } = await loadBackgroundRemovalModule();
  try {
    await preload(getBackgroundRemovalConfig());
  } catch (error) {
    advanceInitializationRetry();
    throw error;
  }
}

/**
 * Removes the background from an image using imgly's client-side ML model
 * Output will always be PNG to preserve transparency
 *
 * @param imageFile - The input image file
 * @param onProgress - Optional callback for loading progress (0-1)
 * @returns Promise resolving to a Blob containing the transparent PNG
 */
export async function removeBackground(
  imageFile: File,
  onProgress?: BackgroundRemovalProgressCallback
): Promise<Blob> {
  const config = getBackgroundRemovalConfig();

  if (onProgress) {
    config.progress = (_key: string, current: number, total: number) => {
      if (total === 0) return;
      const progress = Math.min(current / total, 1);
      onProgress(progress);
    };
  }

  const { removeBackground: imglyRemoveBackground } = await loadBackgroundRemovalModule();
  try {
    return await imglyRemoveBackground(imageFile, config);
  } catch (error) {
    advanceInitializationRetry();
    throw error;
  }
}
