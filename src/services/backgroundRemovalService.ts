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
    // The local asset mirror contains only the CPU runtime.
    device: "cpu",
    ...(initializationRetryAttempt > 0
      ? {
          // A new header bypasses failed initialization in the library cache.
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
    // Permit a new import after a failure.
    backgroundRemovalModulePromise = undefined;
    throw err;
  });
  return backgroundRemovalModulePromise;
}

// Call during idle time to load the runtime and model.
export async function preloadBackgroundRemoval(): Promise<void> {
  const { preload } = await loadBackgroundRemovalModule();
  try {
    await preload(getBackgroundRemovalConfig());
  } catch (error) {
    advanceInitializationRetry();
    throw error;
  }
}

// Progress values range from 0 to 1. The output is a transparent PNG.
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

  const { preload, removeBackground: imglyRemoveBackground } = await loadBackgroundRemovalModule();
  try {
    // Only initialization failures require a new model cache key.
    await preload(config);
  } catch (error) {
    advanceInitializationRetry();
    throw error;
  }

  return imglyRemoveBackground(imageFile, config);
}
