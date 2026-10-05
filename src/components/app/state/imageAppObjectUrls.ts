import type { ProcessedImage } from "@/types/image";

// Decode the full image before the preview uses its URL.
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

    image.onerror = () => fail();
    signal?.addEventListener("abort", abort, { once: true });

    if (signal?.aborted) {
      abort();
      return;
    }

    // The load event can precede full decoding. Use it only if decode() is unavailable.
    if (typeof image.decode === "function") {
      image.src = url;
      void image.decode().then(finish, () => fail());
    } else {
      image.onload = finish;
      image.src = url;
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
