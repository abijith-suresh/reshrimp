import { beforeEach, describe, expect, it, vi } from "vitest";

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
      publicPath: window.location.origin + "/background-removal/1.7.0/dist/",
      device: "cpu",
    };

    await service.preloadBackgroundRemoval();
    expect(await service.removeBackground(file)).toBe(output);

    expect(library.preload).toHaveBeenNthCalledWith(1, config);
    expect(library.preload).toHaveBeenNthCalledWith(2, config);
    expect(library.removeBackground).toHaveBeenCalledExactlyOnceWith(file, config);
  });

  it("uses a new model cache key after each preload failure", async () => {
    library.preload.mockRejectedValue(new Error("asset failure"));
    await expect(service.preloadBackgroundRemoval()).rejects.toThrow("asset failure");
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    await expect(service.removeBackground(file)).rejects.toThrow("asset failure");
    expect(library.removeBackground).not.toHaveBeenCalled();

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

  it("reports fractional progress, caps completed work, and ignores zero totals", async () => {
    const onProgress = vi.fn();
    await service.removeBackground(new File([], "photo.jpg", { type: "image/jpeg" }), onProgress);
    const { progress } = library.removeBackground.mock.calls[0][1];

    progress("download", 10, 0);
    progress("download", 25, 100);
    progress("download", 150, 100);

    expect(onProgress.mock.calls).toEqual([[0.25], [1]]);
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
