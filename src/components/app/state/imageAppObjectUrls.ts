import type { ProcessedImage } from "@/types/image";

export function replaceProcessedObjectUrl(previousUrl: string | null, blob: Blob): string {
  if (previousUrl) {
    URL.revokeObjectURL(previousUrl);
  }

  return URL.createObjectURL(blob);
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
