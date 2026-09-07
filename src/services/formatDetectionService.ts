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

const HEIC_FTYP_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

/**
 * Detect HEIC/HEIF content by reading the ISO-BMFF "ftyp" box magic bytes.
 * Some devices export HEIC files with an empty or generic MIME type, so the
 * declared Content-Type alone is not enough to recognize them.
 */
export async function isHeicBlob(blob: Blob): Promise<boolean> {
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  if (header.length < 12) {
    return false;
  }

  const boxType = String.fromCharCode(...header.subarray(4, 8));
  if (boxType !== "ftyp") {
    return false;
  }

  const brand = String.fromCharCode(...header.subarray(8, 12));
  return HEIC_FTYP_BRANDS.has(brand);
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
