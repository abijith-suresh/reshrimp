import type { ProcessedImage } from "@/types/image";

/**
 * Create a preview URL only after the browser has decoded the complete image.
 *
 * Assigning a blob URL directly to the visible preview lets the browser paint
 * a partially decoded image while it is still working. Keeping the URL out of
 * the visible image until decoding finishes makes the preview replacement
 * atomic from the user's perspective.
 */
export function createDecodedObjectUrl(blob: Blob, signal?: AbortSignal): Promise<string> {
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener("abort", abort);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(url);
    };

    const fail = (error: Error = new Error("Processed preview could not be decoded")) => {
      if (settled) return;
      settled = true;
      cleanup();
      URL.revokeObjectURL(url);
      reject(error);
    };

    const abort = () => {
      fail(new Error("Processed preview decoding was cancelled"));
    };

    image.onload = finish;
    image.onerror = () => fail();
    signal?.addEventListener("abort", abort, { once: true });

    if (signal?.aborted) {
      abort();
      return;
    }

    image.src = url;

    // `decode()` resolves after the full frame is decoded, which is the
    // stronger guarantee we want before swapping the visible preview. The
    // load-event fallback keeps this compatible with older browsers.
    if (typeof image.decode === "function") {
      void image.decode().then(finish, () => fail());
    }
  });
}

export function revokeProcessedObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function revokeImageSessionUrls(
  image: Pick<ProcessedImage, "originalUrl" | "processedUrl"> | null
): void {
  if (!image) {
    return;
  }

  URL.revokeObjectURL(image.originalUrl);

  if (image.processedUrl) {
    URL.revokeObjectURL(image.processedUrl);
  }
}
