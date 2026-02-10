/**
 * Calculate aspect ratio from width and height
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) {
    throw new Error('Height cannot be zero');
  }
  return width / height;
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image dimensions'));
    };

    img.src = url;
  });
}

/**
 * Create a download link and trigger download
 */
export function createDownloadLink(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Calculate dimensions for a given width while maintaining aspect ratio
 */
export function calculateHeightFromWidth(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number
): number {
  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);
  return Math.round(targetWidth / aspectRatio);
}

/**
 * Calculate dimensions for a given height while maintaining aspect ratio
 */
export function calculateWidthFromHeight(
  originalWidth: number,
  originalHeight: number,
  targetHeight: number
): number {
  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);
  return Math.round(targetHeight * aspectRatio);
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
