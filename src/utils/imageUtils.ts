export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) {
    throw new Error("Height cannot be zero");
  }
  return width / height;
}

export function createDownloadLink(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  let appended = false;
  try {
    document.body.appendChild(link);
    appended = true;
    link.click();
  } catch (error) {
    if (appended) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
    throw error;
  }

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(1)} ${units[i]}`;
}

export function calculateHeightFromWidth(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number
): number {
  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);
  return Math.max(1, Math.round(targetWidth / aspectRatio));
}

export function calculateWidthFromHeight(
  originalWidth: number,
  originalHeight: number,
  targetHeight: number
): number {
  const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);
  return Math.max(1, Math.round(targetHeight * aspectRatio));
}

// Percentage values use the source dimension. Physical units use DPI.
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
