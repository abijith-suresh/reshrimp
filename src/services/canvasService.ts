import type { ImageFormat } from '../types/image';

/**
 * Load an image from a File object into an HTMLImageElement
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resize an image on a canvas element
 * Returns a canvas with the resized image drawn on it
 */
export function resizeOnCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, 0, 0, width, height);

  return canvas;
}

/**
 * Convert a canvas to a Blob with specified format and quality
 * Returns a Promise that resolves to the Blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'image/png',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to convert canvas to ${format}`));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Check if the browser supports a specific image format
 */
export function supportsFormat(format: ImageFormat): boolean {
  const canvas = document.createElement('canvas');
  const dataUrl = canvas.toDataURL(format);
  return dataUrl.startsWith(`data:${format}`);
}

/**
 * Get the best supported format, falling back to PNG if needed
 */
export function getBestFormat(requestedFormat: ImageFormat): ImageFormat {
  if (supportsFormat(requestedFormat)) {
    return requestedFormat;
  }

  // Fallback to PNG for unsupported formats
  console.warn(`Format ${requestedFormat} not supported, falling back to PNG`);
  return 'image/png';
}
