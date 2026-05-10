import { describe, expect, it, vi } from "vitest";
import type { BatchQueueItem } from "../types/batch";
import {
  createBulkArchive,
  extractDownloadableItems,
  triggerDownload,
} from "./bulkDownloadService";

// Mock JSZip so we don't exercise WASM in unit tests
vi.mock("jszip", () => {
  return {
    default: class MockJSZip {
      files: Record<string, Blob> = {};
      file(name: string, blob: Blob) {
        this.files[name] = blob;
      }
      generateAsync = vi.fn().mockResolvedValue(new Blob(["zip-content"]));
    },
  };
});

describe("bulkDownloadService", () => {
  describe("extractDownloadableItems", () => {
    it("filters to succeeded items with processResult", () => {
      const items: BatchQueueItem[] = [
        {
          id: "a",
          status: "succeeded",
          file: new File([], "photo1.png", { type: "image/png" }),
          originalUrl: "blob:a",
          processedUrl: "blob:a:processed",
          metadata: {
            width: 100,
            height: 100,
            format: "image/png",
            fileSize: 50,
            fileName: "photo1.png",
          },
          processing: false,
          error: null,
          processResult: {
            blob: new Blob(["data"], { type: "image/png" }),
            metadata: { width: 100, height: 100, format: "image/png", fileSize: 50 },
          },
        },
        {
          id: "b",
          status: "failed",
          file: new File([], "photo2.png", { type: "image/png" }),
          originalUrl: "blob:b",
          processedUrl: null,
          metadata: {
            width: 200,
            height: 200,
            format: "image/png",
            fileSize: 80,
            fileName: "photo2.png",
          },
          processing: false,
          error: "fail",
          processResult: null,
        },
        {
          id: "c",
          status: "succeeded",
          file: new File([], "photo3.jpg", { type: "image/jpeg" }),
          originalUrl: "blob:c",
          processedUrl: "blob:c:processed",
          metadata: {
            width: 300,
            height: 300,
            format: "image/jpeg",
            fileSize: 120,
            fileName: "photo3.jpg",
          },
          processing: false,
          error: null,
          processResult: {
            blob: new Blob(["jpeg-data"], { type: "image/jpeg" }),
            metadata: { width: 300, height: 300, format: "image/jpeg", fileSize: 120 },
          },
        },
      ];

      const result = extractDownloadableItems(items);

      expect(result).toHaveLength(2);
      expect(result[0]!.filename).toBe("photo1-processed.png");
      expect(result[1]!.filename).toBe("photo3-processed.jpg");
    });

    it("returns empty for no succeeded items", () => {
      expect(extractDownloadableItems([])).toEqual([]);
    });
  });

  describe("createBulkArchive", () => {
    it("creates a ZIP blob from download items", async () => {
      const items = [
        { blob: new Blob(["a"], { type: "image/png" }), filename: "img1.png" },
        { blob: new Blob(["b"], { type: "image/jpeg" }), filename: "img2.jpg" },
      ];

      const archive = await createBulkArchive(items);

      expect(archive).toBeInstanceOf(Blob);
    });
  });

  describe("triggerDownload", () => {
    it("creates an anchor element and clicks it", () => {
      const clickSpy = vi.fn();
      vi.spyOn(document, "createElement").mockReturnValue({
        href: "",
        download: "",
        click: clickSpy,
      } as unknown as HTMLAnchorElement);

      const urlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      triggerDownload(new Blob(["test"]), "image.png");

      expect(urlSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith("blob:fake");
    });
  });
});
