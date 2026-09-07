import {
  BACKGROUND_REMOVAL_MODEL,
  getBackgroundRemovalPublicPath,
} from "../config/backgroundRemoval";
import type { BackgroundRemovalProgressCallback } from "../types/processing";

let backgroundRemovalModulePromise: Promise<typeof import("@imgly/background-removal")> | undefined;

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
 * Preloads the WASM runtime and ML model in the background.
 * Call this when the user first enables background removal, never on app
 * mount — the model assets are large (~100 MB) and most visits never use it.
 */
export async function preloadBackgroundRemoval(): Promise<void> {
  const publicPath = getBackgroundRemovalPublicPath(window.location.origin);
  const { preload } = await loadBackgroundRemovalModule();
  await preload({ publicPath });
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
  const config: {
    progress?: (key: string, current: number, total: number) => void;
    model?: "isnet" | "isnet_fp16" | "isnet_quint8";
    publicPath?: string;
    device?: "cpu" | "gpu";
  } = {};

  if (onProgress) {
    config.progress = (_key: string, current: number, total: number) => {
      if (total === 0) return;
      const progress = Math.min(current / total, 1);
      onProgress(progress);
    };
  }

  config.model = BACKGROUND_REMOVAL_MODEL;
  config.publicPath = getBackgroundRemovalPublicPath(window.location.origin);
  // Pinned so the WebGPU onnxruntime stays unreachable — the build excludes
  // its ~24 MB jsep wasm (see excludeOnnxruntimeWebGpu in astro.config.ts),
  // and the self-hosted mirror only carries the CPU runtime assets.
  config.device = "cpu";

  const { removeBackground: imglyRemoveBackground } = await loadBackgroundRemovalModule();
  const blob = await imglyRemoveBackground(imageFile, config);

  return blob;
}
