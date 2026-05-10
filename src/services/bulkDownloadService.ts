/**
 * Bulk download strategy for batch-processed images.
 *
 * Provides two approaches:
 * 1. Sequential individual downloads — simple, no archive overhead
 * 2. ZIP archive — single download, better UX for many files
 *
 * All processing happens in-browser. No data leaves the device.
 */
import JSZip from "jszip";
import type { BatchQueueItem } from "../types/batch";

export interface BulkDownloadItem {
  blob: Blob;
  filename: string;
}

export interface BulkDownloadResult {
  /** Number of items successfully included */
  count: number;
  /** Total archive/file size in bytes */
  totalBytes: number;
}

/**
 * Build a ZIP archive from a list of processed blobs.
 *
 * Each item is placed at the root of the archive with its filename.
 * Returns the ZIP as a Blob ready for download.
 */
export async function createBulkArchive(items: BulkDownloadItem[]): Promise<Blob> {
  const zip = new JSZip();

  for (const item of items) {
    zip.file(item.filename, item.blob);
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/**
 * Extract BulkDownloadItems from batch queue items that have
 * successfully completed processing.
 *
 * Only items with a `processResult` and a valid blob are included.
 */
export function extractDownloadableItems(queueItems: BatchQueueItem[]): BulkDownloadItem[] {
  return queueItems
    .filter((item) => item.status === "succeeded" && item.processResult)
    .map((item) => ({
      blob: item.processResult!.blob,
      filename:
        item.metadata.fileName.replace(/\.[^.]+$/, "") +
        "-processed." +
        extensionForBlob(item.processResult!.blob),
    }));
}

/**
 * Trigger a browser download for a single blob.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function extensionForBlob(blob: Blob): string {
  const type = blob.type;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  };
  return map[type] ?? "png";
}
