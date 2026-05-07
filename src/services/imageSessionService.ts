import { createDownloadLink } from "../utils/imageUtils";

export function replaceObjectUrl(previousUrl: string | null, blob: Blob): string {
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl);
  }

  return URL.createObjectURL(blob);
}

export function downloadProcessedBlob(blob: Blob, filename: string): void {
  createDownloadLink(blob, filename);
}

export function revokeImageUrls(
  urls: {
    originalUrl: string;
    processedUrl: string | null;
  } | null
): void {
  if (!urls) {
    return;
  }

  URL.revokeObjectURL(urls.originalUrl);

  if (urls.processedUrl) {
    URL.revokeObjectURL(urls.processedUrl);
  }
}
