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
  progress: (key: string, current: number, total: number) => void;
};

// Model plus runtime files listed in scripts/background-removal-resources.json.
export const BACKGROUND_REMOVAL_DOWNLOAD_BYTES = 99_998_062;

let initializationRetryAttempt = 0;
let modelLoaded = false;
let progressListener: BackgroundRemovalProgressCallback | undefined;
const downloadedBytes = new Map<string, number>();

// The library memoizes initialization by config without its functions, so the
// first caller's progress callback receives every later event. Route events
// through one stable function to whichever run is currently listening.
function reportProgress(key: string, current: number, total: number): void {
  if (total === 0) return;
  if (key.startsWith("fetch:")) {
    downloadedBytes.set(key, current);
    let downloaded = 0;
    for (const bytes of downloadedBytes.values()) downloaded += bytes;
    progressListener?.("download", Math.min(downloaded / BACKGROUND_REMOVAL_DOWNLOAD_BYTES, 1));
    return;
  }
  progressListener?.("compute", Math.min(current / total, 1));
}

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
    progress: reportProgress,
  };
}

function advanceInitializationRetry(): void {
  initializationRetryAttempt += 1;
  downloadedBytes.clear();
}

function loadBackgroundRemovalModule() {
  backgroundRemovalModulePromise ??= import("@imgly/background-removal").catch((err: unknown) => {
    // Permit a new import after a failure.
    backgroundRemovalModulePromise = undefined;
    throw err;
  });
  return backgroundRemovalModulePromise;
}

async function initialize(): Promise<typeof import("@imgly/background-removal")> {
  let library: typeof import("@imgly/background-removal");
  try {
    library = await loadBackgroundRemovalModule();
    await library.preload(getBackgroundRemovalConfig());
  } catch (error) {
    // A new model cache key lets the next attempt retry initialization.
    advanceInitializationRetry();
    throw new Error(
      "Could not download the background-removal model. Check your connection and try again.",
      { cause: error }
    );
  }
  modelLoaded = true;
  return library;
}

export function isBackgroundRemovalModelLoaded(): boolean {
  return modelLoaded;
}

// Starts loading the runtime and model.
export async function preloadBackgroundRemoval(): Promise<void> {
  await initialize();
}

// Progress values range from 0 to 1. The output is a transparent PNG.
export async function removeBackground(
  imageFile: File,
  onProgress?: BackgroundRemovalProgressCallback
): Promise<Blob> {
  progressListener = onProgress;
  const { removeBackground: imglyRemoveBackground } = await initialize();
  return imglyRemoveBackground(imageFile, getBackgroundRemovalConfig());
}
