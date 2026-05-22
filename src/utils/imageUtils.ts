/**
 * Calculate aspect ratio from width and height
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) {
    throw new Error("Height cannot be zero");
  }
  return width / height;
}

/**
 * Create a download link and trigger download
 */
export function createDownloadLink(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

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
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
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
 * Convert a value in display units to pixels.
 * - px: identity
 * - %: percentage of the original dimension in pixels
 * - in: inches × DPI
 * - cm: centimetres × DPI ÷ 2.54
 */
export function convertToPx(
  value: number,
  unit: import("../types/processing").ResizeUnit,
  originalPx: number,
  dpi: number
): number {
  switch (unit) {
    case "px":
      return Math.round(value);
    case "%":
      return Math.round((value / 100) * originalPx);
    case "in":
      return Math.round(value * dpi);
    case "cm":
      return Math.round((value * dpi) / 2.54);
  }
}

/**
 * Convert pixels back to display units.
 * The inverse of convertToPx — used when switching units to preserve the
 * user's entered value.
 */
export function convertFromPx(
  px: number,
  unit: import("../types/processing").ResizeUnit,
  originalPx: number,
  dpi: number
): number {
  switch (unit) {
    case "px":
      return px;
    case "%":
      return originalPx === 0 ? 0 : (px / originalPx) * 100;
    case "in":
      return dpi === 0 ? 0 : px / dpi;
    case "cm":
      return dpi === 0 ? 0 : (px * 2.54) / dpi;
  }
}
