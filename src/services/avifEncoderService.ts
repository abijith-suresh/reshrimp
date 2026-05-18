/**
 * AVIF encoder service with explicit quality and effort control.
 *
 * Currently delegates to the browser's canvas.toBlob('image/avif') with
 * quality mapping. A dedicated WebAssembly encoder can be swapped in
 * without changing the public API.
 */

/**
 * Map a 1-100 quality value to an AVIF quantization parameter.
 * Lower quantization = higher quality. AVIF encoders typically use
 * a range of 0 (lossless) to 63 (worst).
 */
export function mapAvifQuality(quality: number): number {
  const clamped = Math.max(1, Math.min(100, quality));
  return Math.round(20 + ((100 - clamped) / 100) * 43);
}

export async function encodeAvif(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const avifQuality = mapAvifQuality(quality);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to encode AVIF"));
        }
      },
      "image/avif",
      avifQuality / 100
    );
  });
}
