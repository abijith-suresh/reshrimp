import { renderHook } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";
import { getImageMetadata, prepareImageFile, processImage } from "@/services/imageService";
import { mockImageLoading, mockObjectUrls } from "@/test/mocks";
import type { ImageMetadata } from "@/types/image";
import type { ProcessResult } from "@/types/processing";
import { createDownloadLink } from "@/utils/imageUtils";
import { ImageAppProvider, useImageApp } from "./ImageAppContext";

vi.mock("@/services/imageService", () => ({
  getImageMetadata: vi.fn(),
  prepareImageFile: vi.fn(),
  processImage: vi.fn(),
}));
vi.mock("@/services/backgroundRemovalService", () => ({ preloadBackgroundRemoval: vi.fn() }));
vi.mock("@/utils/imageUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/imageUtils")>()),
  createDownloadLink: vi.fn(),
}));

const metadata = vi.mocked(getImageMetadata);
const prepare = vi.mocked(prepareImageFile);
const process = vi.mocked(processImage);
const preload = vi.mocked(preloadBackgroundRemoval);
const download = vi.mocked(createDownloadLink);
const source = () => new File(["source"], "photo.png", { type: "image/png" });
function result(content = "output", width = 1200, height = 800): ProcessResult {
  const blob = new Blob([content], { type: "image/png" });
  return {
    blob,
    requestedFormat: "image/png",
    metadata: { width, height, format: "image/png", fileSize: blob.size },
  };
}
function session() {
  return renderHook(useImageApp, { wrapper: ImageAppProvider });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockImageLoading();
  const urls = mockObjectUrls();
  let id = 0;
  urls.createObjectURL.mockImplementation(() => `blob:session-${++id}`);
  vi.stubGlobal(
    "requestIdleCallback",
    vi.fn(() => 1)
  );
  vi.stubGlobal("cancelIdleCallback", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
  prepare.mockReset().mockImplementation(async (file) => ({ file, format: file.type }));
  metadata.mockReset().mockImplementation(async (file) => ({
    width: 1200,
    height: 800,
    format: file.type,
    fileSize: file.size,
    fileName: file.name,
  }));
  process.mockReset().mockResolvedValue(result());
  preload.mockReset().mockResolvedValue(undefined);
  download.mockReset();
});

describe("image sessions", () => {
  it("debounces edits and does not process again when completion changes the preview", async () => {
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    actions.handleWidthInput("600");
    actions.handleWidthInput("300");
    await vi.advanceTimersByTimeAsync(399);
    expect(process).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(process).toHaveBeenCalledExactlyOnceWith(
      expect.any(File),
      expect.objectContaining({ resize: { width: 300, height: 200, maintainAspectRatio: true } }),
      undefined
    );
    expect(state.downloadActive()).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(process).toHaveBeenCalledTimes(1);
  });

  it("keeps original HEIC metadata while using its decoded PNG as the working file", async () => {
    const original = new File(["heic"], "photo.heic", { type: "image/heic" });
    const decoded = new File(["decoded pixels"], "photo.png", { type: "image/png" });
    prepare.mockResolvedValueOnce({ file: decoded, format: "image/heic" });
    metadata.mockResolvedValueOnce({
      width: 1200,
      height: 800,
      format: "image/heic",
      fileSize: decoded.size,
      fileName: decoded.name,
    });
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(original);
    expect(state.currentImage()).toMatchObject({
      file: decoded,
      metadata: { fileName: original.name, fileSize: original.size, format: "image/heic" },
    });
    expect(state.currentOutputFormat()).toBe("image/jpeg");
    await vi.advanceTimersByTimeAsync(400);
    expect(process).toHaveBeenCalledWith(
      decoded,
      expect.objectContaining({ format: "image/jpeg" }),
      undefined
    );
  });

  it("revokes replaced previews and both URLs when a new image is loaded", async () => {
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    const first = state.currentImage();
    actions.handleWidthInput("600");
    expect(state.downloadActive()).toBe(false);
    expect(state.currentImage()?.processedUrl).toBe(first?.processedUrl);
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(first?.processedUrl);
    await vi.advanceTimersByTimeAsync(400);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first?.processedUrl);
    const second = state.currentImage();
    await actions.handleFileUpload(source());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(second?.originalUrl);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(second?.processedUrl);
  });

  it("keeps the previous preview until the replacement has completely decoded", async () => {
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    const previous = state.currentImage();
    const decoding = Promise.withResolvers<void>();
    vi.stubGlobal(
      "Image",
      class {
        src = "";
        decode() {
          return decoding.promise;
        }
      }
    );
    process.mockResolvedValueOnce(result("resized", 600, 400));
    actions.handleWidthInput("600");
    await vi.advanceTimersByTimeAsync(400);
    expect(state.currentImage()?.processedUrl).toBe(previous?.processedUrl);
    expect(state.lastCompletedResult()?.metadata.width).toBe(1200);
    expect(state.downloadActive()).toBe(false);
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(previous?.processedUrl);
    decoding.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.currentImage()?.processedUrl).not.toBe(previous?.processedUrl);
    expect(state.lastCompletedResult()?.metadata.width).toBe(600);
    expect(state.downloadActive()).toBe(true);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(previous?.processedUrl);
  });

  it("cancels a pending preview decode when another image is uploaded", async () => {
    const decoding = Promise.withResolvers<void>();
    vi.stubGlobal(
      "Image",
      class {
        src = "";
        decode() {
          return decoding.promise;
        }
      }
    );
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    expect(state.isProcessing()).toBe(true);
    mockImageLoading();
    const second = new File(["second"], "second.png", { type: "image/png" });
    await actions.handleFileUpload(second);
    await vi.advanceTimersByTimeAsync(400);
    const current = state.currentImage();
    expect(state.downloadActive()).toBe(true);
    decoding.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.currentImage()).toBe(current);
    expect(state.currentImage()?.file).toBe(second);
    expect(
      vi.mocked(URL.revokeObjectURL).mock.calls.filter(([url]) => url === "blob:session-2")
    ).toHaveLength(1);
  });

  it("revokes the active URLs on unmount", async () => {
    const {
      result: { actions, state },
      cleanup,
    } = session();
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    const image = state.currentImage();
    cleanup();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image?.originalUrl);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(image?.processedUrl);
  });

  it("keeps the last output visible when processing fails and recovers on another edit", async () => {
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    const previousUrl = state.currentImage()?.processedUrl;
    process.mockRejectedValueOnce(new Error("Encoding failed"));
    actions.handleWidthInput("600");
    await vi.advanceTimersByTimeAsync(400);
    expect(state.error()).toBe("Encoding failed");
    expect(state.currentImage()?.processedUrl).toBe(previousUrl);
    expect(state.downloadActive()).toBe(false);
    expect(state.isProcessing()).toBe(false);
    actions.handleWidthInput("300");
    await vi.advanceTimersByTimeAsync(400);
    expect(state.error()).toBeNull();
    expect(state.downloadActive()).toBe(true);
  });

  it("allows a new upload to finish while an older run is still pending", async () => {
    const pending = Promise.withResolvers<ProcessResult>();
    process.mockReturnValueOnce(pending.promise);
    const first = source();
    const second = new File(["second"], "second.png", { type: "image/png" });
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(first);
    await vi.advanceTimersByTimeAsync(400);
    await actions.handleFileUpload(second);
    await vi.advanceTimersByTimeAsync(400);
    expect(state.currentImage()?.file).toBe(second);
    expect(state.downloadActive()).toBe(true);
    const current = state.currentImage();
    const stale = result("stale");
    pending.resolve(stale);
    await vi.advanceTimersByTimeAsync(0);
    expect(state.currentImage()).toBe(current);
    expect(vi.mocked(URL.createObjectURL).mock.calls.some(([blob]) => blob === stale.blob)).toBe(
      false
    );
  });

  it("ignores progress and failures from a previous image", async () => {
    const pending = Promise.withResolvers<ProcessResult>();
    let reportProgress: ((value: number) => void) | undefined;
    process.mockImplementationOnce((_file, _options, progress) => {
      reportProgress = progress;
      return pending.promise;
    });
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    actions.handleRemoveBackgroundChange(true);
    reportProgress?.(0.25);
    expect(state.progressLabel()).toBe("Removing background 25%…");
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    reportProgress?.(0.9);
    pending.reject(new Error("Old run failed"));
    await vi.advanceTimersByTimeAsync(0);
    expect(state.error()).toBeNull();
    expect(state.progressLabel()).toBeNull();
    expect(state.downloadActive()).toBe(true);
  });

  it("keeps an active run after an invalid upload attempt", async () => {
    const pending = Promise.withResolvers<ProcessResult>();
    process.mockReturnValueOnce(pending.promise);
    const file = source();
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(file);
    await vi.advanceTimersByTimeAsync(400);
    await actions.handleFileUpload(new File(["pdf"], "document.pdf", { type: "application/pdf" }));
    expect(state.validation()).toMatchObject({ valid: false });
    expect(state.currentImage()?.file).toBe(file);
    expect(state.isProcessing()).toBe(true);
    pending.resolve(result());
    await vi.advanceTimersByTimeAsync(0);
    expect(state.downloadActive()).toBe(true);
    expect(process).toHaveBeenCalledTimes(1);
  });

  it("processes edits made during an active run after it settles", async () => {
    const pending = Promise.withResolvers<ProcessResult>();
    process.mockReturnValueOnce(pending.promise);
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    await vi.advanceTimersByTimeAsync(400);
    actions.handleWidthInput("600");
    await vi.advanceTimersByTimeAsync(400);
    expect(process).toHaveBeenCalledTimes(1);
    const stale = result("outdated dimensions");
    pending.resolve(stale);
    await vi.advanceTimersByTimeAsync(0);
    expect(state.downloadActive()).toBe(false);
    expect(vi.mocked(URL.createObjectURL).mock.calls.some(([blob]) => blob === stale.blob)).toBe(
      false
    );
    await vi.advanceTimersByTimeAsync(400);
    expect(process).toHaveBeenLastCalledWith(
      expect.any(File),
      expect.objectContaining({ resize: { width: 600, height: 400, maintainAspectRatio: true } }),
      undefined
    );
    expect(state.downloadActive()).toBe(true);
  });

  it.each(["preparation", "metadata"] as const)(
    "ignores stale %s after a newer upload succeeds",
    async (stage) => {
      const first = source();
      const second = new File(["second"], "second.png", { type: "image/png" });
      const preparation = Promise.withResolvers<{ file: File; format: string }>();
      const meta = Promise.withResolvers<ImageMetadata>();
      if (stage === "preparation") prepare.mockReturnValueOnce(preparation.promise);
      else metadata.mockReturnValueOnce(meta.promise);
      const {
        result: { actions, state },
      } = session();
      const oldUpload = actions.handleFileUpload(first);
      await vi.advanceTimersByTimeAsync(0);
      await actions.handleFileUpload(second);
      await vi.advanceTimersByTimeAsync(400);
      const current = state.currentImage();
      if (stage === "preparation") preparation.reject(new Error("Old upload failed"));
      else
        meta.resolve({
          width: 100,
          height: 100,
          format: first.type,
          fileSize: first.size,
          fileName: first.name,
        });
      await oldUpload;
      expect(state.currentImage()).toBe(current);
      expect(state.error()).toBeNull();
      expect(process).toHaveBeenCalledTimes(1);
    }
  );

  it.each(["preparation", "processing"] as const)("stops %s work after unmount", async (stage) => {
    const preparation = Promise.withResolvers<{ file: File; format: string }>();
    const processing = Promise.withResolvers<ProcessResult>();
    if (stage === "preparation") prepare.mockReturnValueOnce(preparation.promise);
    else process.mockReturnValueOnce(processing.promise);
    const {
      result: { actions },
      cleanup,
    } = session();
    const file = source();
    const upload = actions.handleFileUpload(file);
    await vi.advanceTimersByTimeAsync(400);
    cleanup();
    const completed = result();
    preparation.resolve({ file, format: file.type });
    processing.resolve(completed);
    await upload;
    await vi.advanceTimersByTimeAsync(0);
    expect(
      vi.mocked(URL.createObjectURL).mock.calls.some(([blob]) => blob === completed.blob)
    ).toBe(false);
    if (stage === "preparation") expect(metadata).not.toHaveBeenCalled();
    else expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:session-1");
  });

  it("names a download after the encoded format when the browser falls back", async () => {
    const fallback = { ...result(), requestedFormat: "image/avif" as const };
    process.mockResolvedValue(fallback);
    const {
      result: { actions, state },
    } = session();
    await actions.handleFileUpload(source());
    actions.setFormatValue("image/avif");
    await vi.advanceTimersByTimeAsync(400);
    expect(state.formatNotice()).toContain("could not export AVIF");
    actions.handleDownload();
    expect(download).toHaveBeenCalledWith(fallback.blob, "photo-processed.png");
  });
});

describe("model preloading", () => {
  it("waits for idle time and reuses the preload when background removal is toggled", async () => {
    const {
      result: { actions },
      cleanup,
    } = session();
    expect(preload).not.toHaveBeenCalled();
    const idle = vi.mocked(window.requestIdleCallback).mock.calls[0][0];
    idle({ didTimeout: false, timeRemaining: () => 50 });
    await vi.advanceTimersByTimeAsync(0);
    expect(preload).toHaveBeenCalledTimes(1);
    actions.handleRemoveBackgroundChange(true);
    actions.handleRemoveBackgroundChange(false);
    actions.handleRemoveBackgroundChange(true);
    expect(preload).toHaveBeenCalledTimes(1);
    cleanup();
    expect(window.cancelIdleCallback).toHaveBeenCalledWith(1);
  });

  it.each([
    { saveData: true, effectiveType: "4g", downlink: 10 },
    { saveData: false, effectiveType: "3g", downlink: 10 },
    { saveData: false, effectiveType: "4g", downlink: 3 },
  ])("avoids automatic downloads with connection %j", async (connection) => {
    vi.stubGlobal("navigator", { connection });
    session();
    await vi.advanceTimersByTimeAsync(5000);
    expect(window.requestIdleCallback).not.toHaveBeenCalled();
    expect(preload).not.toHaveBeenCalled();
  });

  it("uses the fallback delay when idle callbacks and connection information are unavailable", async () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    const { cleanup } = session();
    await vi.advanceTimersByTimeAsync(1999);
    expect(preload).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(preload).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("cancels scheduled preloading on unmount", async () => {
    const { cleanup } = session();
    cleanup();
    expect(window.cancelIdleCallback).toHaveBeenCalledWith(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(preload).not.toHaveBeenCalled();
  });
});
