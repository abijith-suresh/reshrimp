import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";
import {
  BACKGROUND_REMOVAL_MODEL,
  getBackgroundRemovalPublicPath,
} from "../config/backgroundRemoval";
import type { BackgroundRemovalProgressCallback } from "../types/processing";

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
  } = {};

  if (onProgress) {
    config.progress = (key: string, current: number, total: number) => {
      if (total === 0) return;
      const progress = Math.min(current / total, 1);
      onProgress(progress);
    };
  }

  config.model = BACKGROUND_REMOVAL_MODEL;
  config.publicPath = getBackgroundRemovalPublicPath(window.location.origin);

  const blob = await imglyRemoveBackground(imageFile, config);

  return blob;
}
