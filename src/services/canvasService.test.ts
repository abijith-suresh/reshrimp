import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeCanvasMock, restoreMocks, setupBrowserMocks } from "../test/mocks";
import type { ImageFormat } from "../types/image";
import {
  canvasToBlob,
  canvasToBlobAtFileSizeTarget,
  getBestFormat,
  loadImage,
  resizeOnCanvas,
  supportsFormat,
} from "./canvasService";

describe("loadImage", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it("resolves with an HTMLImageElement", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const img = await loadImage(file);
    expect(img).toBeDefined();
    expect(img.width).toBe(100);
    expect(img.height).toBe(80);
  });

  it("creates and revokes an object URL", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    await loadImage(file);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("rejects when the image fails to load", async () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:error-url"),
      revokeObjectURL: vi.fn(),
    });
    const file = new File([], "bad.png", { type: "image/png" });
    await expect(loadImage(file)).rejects.toThrow("Failed to load image");
  });

  it("revokes URL even on error", async () => {
    const revokeMock = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:error-url"),
      revokeObjectURL: revokeMock,
    });
    const file = new File([], "bad.png", { type: "image/png" });
    await loadImage(file).catch(() => {});
    expect(revokeMock).toHaveBeenCalledWith("blob:error-url");
  });
});

describe("resizeOnCanvas", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it("returns a canvas element with the correct dimensions", () => {
    const img = { width: 200, height: 100 } as HTMLImageElement;
    const canvas = resizeOnCanvas(img, 400, 200);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
  });

  it("enables high-quality image smoothing", () => {
    const img = { width: 200, height: 100 } as HTMLImageElement;
    const { canvas, ctx } = makeCanvasMock();
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    resizeOnCanvas(img, 400, 200);

    expect(ctx.imageSmoothingEnabled).toBe(true);
    expect(ctx.imageSmoothingQuality).toBe("high");
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, 400, 200);
  });

  it("throws when canvas context is null", () => {
    const { canvas } = makeCanvasMock();
    (canvas.getContext as ReturnType<typeof vi.fn>).mockReturnValue(null);
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    const img = { width: 200, height: 100 } as HTMLImageElement;
    expect(() => resizeOnCanvas(img, 400, 200)).toThrow("Failed to get canvas context");
  });
});

describe("canvasToBlob", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it("resolves with a Blob", async () => {
    const { canvas } = makeCanvasMock();
    const blob = await canvasToBlob(canvas);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("rejects when toBlob callback receives null", async () => {
    const { canvas } = makeCanvasMock();
    (canvas.toBlob as ReturnType<typeof vi.fn>).mockImplementation((cb: BlobCallback) => cb(null));

    await expect(canvasToBlob(canvas, "image/png")).rejects.toThrow(
      "Failed to convert canvas to image/png"
    );
  });

  it("uses default format and quality when not specified", async () => {
    const { canvas } = makeCanvasMock();
    await canvasToBlob(canvas);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.92);
  });

  it("passes specified format and quality", async () => {
    const { canvas } = makeCanvasMock();
    await canvasToBlob(canvas, "image/jpeg", 0.7);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.7);
  });
});

describe("canvasToBlobAtFileSizeTarget", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  function setEncodedSizeByQuality(canvas: HTMLCanvasElement): number[] {
    const qualities: number[] = [];
    (canvas.toBlob as ReturnType<typeof vi.fn>).mockImplementation(
      (callback: BlobCallback, format: string, quality: number) => {
        qualities.push(quality);
        const byteCount = Math.round(100 + quality * 900);
        callback(new Blob([new Uint8Array(byteCount)], { type: format }));
      }
    );
    return qualities;
  }

  it("returns the highest-quality sample found within the target", async () => {
    const { canvas } = makeCanvasMock();
    const qualities = setEncodedSizeByQuality(canvas);

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/jpeg", 600);

    expect(result.targetReached).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(600);
    expect(qualities).toHaveLength(8);
    expect(qualities.at(-1)).toBeGreaterThan(0.5);
  });

  it("returns the smallest attempt and reports an unreachable target", async () => {
    const { canvas } = makeCanvasMock();
    const qualities = setEncodedSizeByQuality(canvas);

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/webp", 50);

    expect(result).toEqual({ blob: expect.any(Blob), targetReached: false });
    expect(result.blob.size).toBe(109);
    expect(qualities).toEqual([1, 0.01]);
  });

  it("uses maximum quality when it already fits", async () => {
    const { canvas } = makeCanvasMock();
    const qualities = setEncodedSizeByQuality(canvas);

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/avif", 1000);

    expect(result.targetReached).toBe(true);
    expect(result.blob.size).toBe(1000);
    expect(qualities).toEqual([1]);
  });

  it("rejects invalid byte limits", async () => {
    const { canvas } = makeCanvasMock();

    await expect(canvasToBlobAtFileSizeTarget(canvas, "image/jpeg", 0)).rejects.toThrow(
      "Maximum file size must be a positive whole number of bytes"
    );
  });
});

describe("supportsFormat", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it("returns true when toDataURL output starts with data:{format}", () => {
    const { canvas } = makeCanvasMock("image/webp");
    (canvas.toDataURL as ReturnType<typeof vi.fn>).mockImplementation(
      (f: string) => `data:${f};base64,abc`
    );
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(supportsFormat("image/webp")).toBe(true);
  });

  it("returns false when toDataURL output does not match format", () => {
    const { canvas } = makeCanvasMock();
    // Simulate unsupported format — browser falls back to PNG
    (canvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue("data:image/png;base64,abc");
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(supportsFormat("image/webp" as ImageFormat)).toBe(false);
  });
});

describe("getBestFormat", () => {
  beforeEach(() => {
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  it("returns the requested format when supported", () => {
    const { canvas } = makeCanvasMock("image/webp");
    (canvas.toDataURL as ReturnType<typeof vi.fn>).mockImplementation(
      (f: string) => `data:${f};base64,abc`
    );
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(getBestFormat("image/webp")).toBe("image/webp");
  });

  it("returns image/png fallback when format is not supported", () => {
    const { canvas } = makeCanvasMock();
    (canvas.toDataURL as ReturnType<typeof vi.fn>).mockReturnValue("data:image/png;base64,abc");
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(getBestFormat("image/webp" as ImageFormat)).toBe("image/png");
  });
});
