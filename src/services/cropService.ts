import type { CropRegion } from "@/types/processing";

export function validateCropRegion(
  region: CropRegion,
  imageWidth: number,
  imageHeight: number
): string | null {
  if (region.x < 0) return "x must be non-negative";
  if (region.y < 0) return "y must be non-negative";
  if (region.x + region.width > imageWidth) return "crop width exceeds image width";
  if (region.y + region.height > imageHeight) return "crop height exceeds image height";
  if (region.width <= 0) return "width must be positive";
  if (region.height <= 0) return "height must be positive";
  return null;
}

export function cropOnCanvas(img: HTMLImageElement, region: CropRegion): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = region.width;
  canvas.height = region.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    img,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height
  );

  return canvas;
}
