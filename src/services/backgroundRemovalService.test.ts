import { beforeEach, describe, expect, it, vi } from "vitest";
import resources from "../../scripts/background-removal-resources.json";

const library = { preload: vi.fn(), removeBackground: vi.fn() };

let service: typeof import("./backgroundRemovalService");

beforeEach(async () => {
  library.preload.mockReset().mockResolvedValue(undefined);
  library.removeBackground
    .mockReset()
    .mockResolvedValue(new Blob(["pixels"], { type: "image/png" }));
  vi.doMock("@imgly/background-removal", () => library);
  // Reset the import cache and retry count for each test.
  vi.resetModules();
  service = await import("./backgroundRemovalService");
});

describe("background removal", () => {
  it("uses the same local CPU model for preload and processing", async () => {
    const file = new File(["source"], "photo.jpg", { type: "image/jpeg" });
    const output = new Blob(["transparent pixels"], { type: "image/png" });
    library.removeBackground.mockResolvedValueOnce(output);
    const config = {
      model: "isnet_fp16",
      publicPath: `${window.location.origin}/background-removal/1.7.0/dist/`,
      device: "cpu",
      progress: expect.any(Function),
    };

    expect(service.isBackgroundRemovalModelLoaded()).toBe(false);
    await service.preloadBackgroundRemoval();
    expect(service.isBackgroundRemovalModelLoaded()).toBe(true);
    expect(await service.removeBackground(file)).toBe(output);

    expect(library.preload).toHaveBeenNthCalledWith(1, config);
    expect(library.preload).toHaveBeenNthCalledWith(2, config);
    expect(library.removeBackground).toHaveBeenCalledExactlyOnceWith(file, config);
  });

  it("uses a new model cache key after each preload failure", async () => {
    library.preload.mockRejectedValue(new Error("asset failure"));
    const downloadFailure = "Could not download the background-removal model";
    await expect(service.preloadBackgroundRemoval()).rejects.toThrow(downloadFailure);
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    await expect(service.removeBackground(file)).rejects.toThrow(downloadFailure);
    expect(library.removeBackground).not.toHaveBeenCalled();
    expect(service.isBackgroundRemovalModelLoaded()).toBe(false);

    library.preload.mockResolvedValue(undefined);
    await service.removeBackground(file);

    expect(library.preload.mock.calls[0][0]).not.toHaveProperty("fetchArgs");
    expect(library.preload.mock.calls[1][0].fetchArgs.headers).toEqual({
      "X-Reshrimp-Initialization-Attempt": "1",
    });
    expect(library.preload.mock.calls[2][0].fetchArgs.headers).toEqual({
      "X-Reshrimp-Initialization-Attempt": "2",
    });
  });

  it("keeps the model cache key after an image processing failure", async () => {
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    library.removeBackground.mockRejectedValueOnce(new Error("invalid image"));
    await expect(service.removeBackground(file)).rejects.toThrow("invalid image");
    await service.removeBackground(file);

    expect(library.preload).toHaveBeenCalledTimes(2);
    expect(library.preload.mock.calls[1][0]).toEqual(library.preload.mock.calls[0][0]);
    expect(library.preload.mock.calls[1][0]).not.toHaveProperty("fetchArgs");
  });

  it("reports downloads against the total asset size and compute steps separately", async () => {
    const onProgress = vi.fn();
    await service.removeBackground(new File([], "photo.jpg", { type: "image/jpeg" }), onProgress);
    // The library keeps the progress function from the first initialization.
    const { progress } = library.preload.mock.calls[0][0];
    const total = service.BACKGROUND_REMOVAL_DOWNLOAD_BYTES;

    progress("fetch:/models/isnet_fp16", 10, 0);
    progress("fetch:/models/isnet_fp16", total / 2, total);
    progress("fetch:/onnxruntime-web/ort-wasm-simd-threaded.wasm", total / 4, total);
    progress("fetch:/models/isnet_fp16", total, total);
    progress("compute:inference", 1, 4);

    expect(onProgress.mock.calls).toEqual([
      ["download", 0.5],
      ["download", 0.75],
      ["download", 1],
      ["compute", 0.25],
    ]);
  });

  it("sends progress to the latest run", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    await service.removeBackground(file, first);
    await service.removeBackground(file, second);
    library.preload.mock.calls[0][0].progress("compute:decode", 0, 4);
    library.preload.mock.calls[0][0].progress("compute:mask", 2, 4);

    expect(first).not.toHaveBeenCalled();
    expect(second.mock.calls).toEqual([
      ["compute", 0],
      ["compute", 0.5],
    ]);
  });

  it("matches the mirrored asset sizes", () => {
    const sizes = Object.values(resources as Record<string, { size: number }>).map(
      ({ size }) => size
    );
    expect(service.BACKGROUND_REMOVAL_DOWNLOAD_BYTES).toBe(sizes.reduce((a, b) => a + b, 0));
  });

  it("retries a failed library import", async () => {
    let failImport = true;
    vi.doMock("@imgly/background-removal", () => {
      if (failImport) throw new Error("import failure");
      return library;
    });
    vi.resetModules();
    try {
      const freshService = await import("./backgroundRemovalService");
      // Vitest wraps errors from mock factories.
      await expect(freshService.preloadBackgroundRemoval()).rejects.toThrow();
      expect(library.preload).not.toHaveBeenCalled();
      failImport = false;
      await freshService.preloadBackgroundRemoval();
      expect(library.preload).toHaveBeenCalledOnce();
    } finally {
      vi.doUnmock("@imgly/background-removal");
    }
  });
});
