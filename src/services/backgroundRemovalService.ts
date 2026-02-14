import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import type { BackgroundRemovalProgressCallback } from '../types/processing';

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
    model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
  } = {};

  if (onProgress) {
    config.progress = (key: string, current: number, total: number) => {
      const progress = current / total;
      onProgress(progress);
    };
  }

  config.model = 'isnet_fp16';

  const blob = await imglyRemoveBackground(imageFile, config);

  return blob;
}

/**
 * Checks if the background removal library is supported in the current environment
 * This is always true in modern browsers, but useful for feature detection
 *
 * @returns boolean indicating support
 */
export function isBackgroundRemovalSupported(): boolean {
  return typeof window !== 'undefined' && 'WebAssembly' in window;
}
