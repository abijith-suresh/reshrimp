import heic2anyScriptUrl from "heic2any/dist/heic2any.min.js?url";

type Heic2AnyResult = Blob | Blob[];

type Heic2AnyConverter = (options: {
  blob: Blob;
  toType: string;
  quality?: number;
  gifInterval?: number;
  multiple?: boolean;
}) => Promise<Heic2AnyResult>;

declare global {
  interface Window {
    heic2any?: Heic2AnyConverter;
  }
}

let heic2anyLoaderPromise: Promise<Heic2AnyConverter> | undefined;

function loadHeic2AnyConverter(): Promise<Heic2AnyConverter> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("HEIC decoding is only available in the browser"));
  }

  if (window.heic2any) {
    return Promise.resolve(window.heic2any);
  }

  heic2anyLoaderPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = heic2anyScriptUrl;
    script.async = true;
    script.dataset.heic2anyLoader = "true";

    script.onload = () => {
      if (window.heic2any) {
        resolve(window.heic2any);
        return;
      }

      heic2anyLoaderPromise = undefined;
      script.remove();
      reject(new Error("heic2any loaded without exposing a browser decoder"));
    };

    script.onerror = () => {
      heic2anyLoaderPromise = undefined;
      script.remove();
      reject(new Error("Failed to load the HEIC decoder"));
    };

    document.head.appendChild(script);
  });

  return heic2anyLoaderPromise;
}

/**
 * Decode a HEIC/HEIF blob into a PNG blob using the heic2any library.
 *
 * The conversion happens entirely in-browser; no data leaves the device.
 */
export async function decodeHeicBlob(blob: Blob): Promise<Blob> {
  const heic2any = await loadHeic2AnyConverter();
  const result = await heic2any({ blob, toType: "image/png" });
  if (Array.isArray(result)) {
    if (!result[0]) {
      throw new Error("HEIC decoding produced no output image");
    }
    return result[0];
  }
  return result;
}
