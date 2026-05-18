import { loadImage } from "./canvasService";

/**
 * Try browser-native HEIC/HEIF decoding by loading the image
 * and re-encoding it to PNG via canvas.
 */
async function decodeHeicNatively(blob: Blob): Promise<Blob | null> {
  try {
    const img = await loadImage(new File([blob], "input.heic", { type: blob.type }));
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result ?? null), "image/png");
    });
  } catch {
    return null;
  }
}

let heicDecoderPromise: Promise<(blob: Blob) => Promise<Blob>> | undefined;

async function loadHeic2AnyFallback(): Promise<(blob: Blob) => Promise<Blob>> {
  if (!heicDecoderPromise) {
    heicDecoderPromise = (async () => {
      const mod = await import("heic2any");
      const heic2any = mod.default;
      return (blob: Blob) =>
        heic2any({ blob, toType: "image/png" }).then((r: Blob | Blob[]) =>
          Array.isArray(r) ? r[0]! : r
        );
    })();
  }
  return heicDecoderPromise;
}

/**
 * Decode a HEIC/HEIF blob to PNG.
 * Uses browser-native decoding first, falls back to heic2any.
 */
export async function decodeHeicBlob(blob: Blob): Promise<Blob> {
  const nativeResult = await decodeHeicNatively(blob);
  if (nativeResult) return nativeResult;

  const fallback = await loadHeic2AnyFallback();
  return fallback(blob);
}
