/**
 * Detect whether the browser can encode AVIF output.
 *
 * Uses a small canvas + toBlob probe. Result should be cached by the caller.
 */
export function detectAvifSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob(
        (blob) => {
          resolve(blob !== null && blob.type === "image/avif");
        },
        "image/avif",
        0.5
      );
    } catch {
      resolve(false);
    }
  });
}

/**
 * Decode a HEIC/HEIF blob into a PNG blob using the heic2any library.
 *
 * The conversion happens entirely in-browser; no data leaves the device.
 */
export async function decodeHeicBlob(blob: Blob): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({ blob, toType: "image/png" });
  return Array.isArray(result) ? result[0]! : result;
}
