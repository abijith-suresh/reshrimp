/**
 * Rotation and flip transforms for canvas-based image processing.
 *
 * All transforms are pure functions that take a source image element and
 * return a new HTMLCanvasElement with the transform applied.  The caller
 * is responsible for converting the canvas to the desired output format.
 */
import type { RotationDeg, FlipAxis } from "../types/processing";
import { resizeOnCanvas } from "./canvasService";

/**
 * Rotate a source image by a multiple of 90° clockwise.
 *
 * 90° and 270° swaps the output width and height.
 * 180° preserves them.
 */
export function rotateImage(img: HTMLImageElement, degrees: RotationDeg): HTMLCanvasElement {
  const { width, height } = img;
  const swap = degrees === 90 || degrees === 270;
  const outW = swap ? height : width;
  const outH = swap ? width : height;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.save();
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();

  return canvas;
}

/**
 * Flip (mirror) a source image along the given axis.
 *
 * Dimensions are preserved.
 */
export function flipImage(img: HTMLImageElement, axis: FlipAxis): HTMLCanvasElement {
  // Reuse resizeOnCanvas for a simple 1:1 copy first
  const copy = resizeOnCanvas(img, img.width, img.height);
  const ctx = copy.getContext("2d")!;

  ctx.save();
  if (axis === "horizontal") {
    ctx.translate(copy.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, copy.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(copy, 0, 0);
  ctx.restore();

  return copy;
}
