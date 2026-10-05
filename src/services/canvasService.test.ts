import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeCanvasMock,
  mockCanvasCreation,
  mockImageLoading,
  mockObjectUrls,
} from "../test/mocks";
import {
  canvasToBlob,
  canvasToBlobAtFileSizeTarget,
  getBestFormat,
  loadImage,
  resizeOnCanvas,
  supportsFormat,
} from "./canvasService";

beforeEach(() => {
  mockObjectUrls();
  mockImageLoading();
  mockCanvasCreation();
});

describe("loadImage", () => {
  it("loads the image and releases its temporary URL", async () => {
    const file = new File([], "test.png", { type: "image/png" });

    const img = await loadImage(file);

    expect(img).toMatchObject({ width: 100, height: 80 });
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("releases the temporary URL when decoding fails", async () => {
    vi.mocked(URL.createObjectURL).mockReturnValue("blob:error-url");
    const file = new File([], "bad.png", { type: "image/png" });

    await expect(loadImage(file)).rejects.toThrow("Failed to load image");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:error-url");
  });
});

describe("resizeOnCanvas", () => {
  it("draws the image at the selected dimensions with high-quality smoothing", () => {
    const img = { width: 200, height: 100 } as HTMLImageElement;
    const { canvas, ctx } = makeCanvasMock();
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    resizeOnCanvas(img, 400, 200);

    expect(canvas).toMatchObject({ width: 400, height: 200 });
    expect(ctx.imageSmoothingEnabled).toBe(true);
    expect(ctx.imageSmoothingQuality).toBe("high");
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0, 400, 200);
  });

  it("throws when canvas context is null", () => {
    const { canvas } = makeCanvasMock();
    vi.mocked(canvas.getContext).mockReturnValue(null);
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    const img = { width: 200, height: 100 } as HTMLImageElement;
    expect(() => resizeOnCanvas(img, 400, 200)).toThrow("Failed to get canvas context");
  });
});

describe("canvasToBlob", () => {
  it("rejects when toBlob callback receives null", async () => {
    const { canvas } = makeCanvasMock();
    vi.mocked(canvas.toBlob).mockImplementation((cb: BlobCallback) => cb(null));

    await expect(canvasToBlob(canvas, "image/png")).rejects.toThrow(
      "Failed to convert canvas to image/png"
    );
  });

  it.each([
    { format: undefined, quality: undefined, expectedFormat: "image/png", expectedQuality: 0.92 },
    {
      format: "image/jpeg" as const,
      quality: 0.7,
      expectedFormat: "image/jpeg",
      expectedQuality: 0.7,
    },
  ])(
    "returns the encoder output for $expectedFormat at quality $expectedQuality",
    async ({ format, quality, expectedFormat, expectedQuality }) => {
      const { canvas } = makeCanvasMock();
      const encoded = new Blob(["pixels"], { type: expectedFormat });
      vi.mocked(canvas.toBlob).mockImplementation((callback) => callback(encoded));

      expect(await canvasToBlob(canvas, format, quality)).toBe(encoded);
      expect(canvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        expectedFormat,
        expectedQuality
      );
    }
  );
});

describe("canvasToBlobAtFileSizeTarget", () => {
  function mockEncoder(canvas: HTMLCanvasElement): Blob[] {
    const samples: Blob[] = [];
    vi.mocked(canvas.toBlob).mockImplementation((callback, format, quality) => {
      const byteCount = Math.round(100 + Number(quality) * 900);
      const blob = new Blob([new Uint8Array(byteCount)], { type: format });
      samples.push(blob);
      callback(blob);
    });
    return samples;
  }

  it("keeps the highest-quality fitting sample without changing dimensions or format", async () => {
    const { canvas } = makeCanvasMock();
    canvas.width = 1200;
    canvas.height = 800;
    const samples = mockEncoder(canvas);

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/jpeg", 600);
    const fittingSamples = samples.filter((blob) => blob.size <= 600);

    expect(result.targetReached).toBe(true);
    expect(result.blob.size).toBe(Math.max(...fittingSamples.map((blob) => blob.size)));
    expect(result.blob.size).toBeGreaterThanOrEqual(580);
    expect(result.blob.type).toBe("image/jpeg");
    expect(canvas).toMatchObject({ width: 1200, height: 800 });
  });

  it("keeps the smallest sample and reports an unreachable target", async () => {
    const { canvas } = makeCanvasMock();
    const samples = mockEncoder(canvas);

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/webp", 50);

    expect(result.targetReached).toBe(false);
    expect(result.blob.size).toBeGreaterThan(50);
    expect(result.blob.size).toBe(Math.min(...samples.map((blob) => blob.size)));
    expect(result.blob.type).toBe("image/webp");
  });

  it("uses maximum quality when it already fits", async () => {
    const { canvas } = makeCanvasMock();
    mockEncoder(canvas);

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/avif", 1000);

    expect(result.targetReached).toBe(true);
    expect(result.blob.size).toBe(1000);
    expect(result.blob.type).toBe("image/avif");
  });

  it("returns the smallest attempted output even when minimum quality produces more bytes", async () => {
    const { canvas } = makeCanvasMock();
    const smaller = new Blob([new Uint8Array(800)], { type: "image/webp" });
    const larger = new Blob([new Uint8Array(1000)], { type: "image/webp" });
    vi.mocked(canvas.toBlob)
      .mockImplementationOnce((callback) => callback(smaller))
      .mockImplementationOnce((callback) => callback(larger));

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/webp", 100);

    expect(result.targetReached).toBe(false);
    expect(result.blob.size).toBe(800);
  });

  it("prefers quality over byte count among fitting outputs from a non-monotonic encoder", async () => {
    const { canvas } = makeCanvasMock();
    const attempts: Array<{ quality: number; blob: Blob }> = [];
    vi.mocked(canvas.toBlob).mockImplementation((callback, format, quality) => {
      const q = Number(quality);
      const blob = new Blob([new Uint8Array(q === 1 ? 1000 : q > 0.5 ? 300 : 500)], {
        type: format,
      });
      attempts.push({ quality: q, blob });
      callback(blob);
    });

    const result = await canvasToBlobAtFileSizeTarget(canvas, "image/webp", 600);

    const fitting = attempts.filter(({ blob }) => blob.size <= 600);
    const best = fitting.reduce((a, b) => (a.quality > b.quality ? a : b));
    expect(result.targetReached).toBe(true);
    expect(result.blob).toBe(best.blob);
    expect(best.quality).toBeGreaterThan(0.9);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects byte limit %s before encoding",
    async (limit) => {
      const { canvas } = makeCanvasMock();

      await expect(canvasToBlobAtFileSizeTarget(canvas, "image/jpeg", limit)).rejects.toThrow(
        "Maximum file size must be a positive whole number of bytes"
      );
      expect(canvas.toBlob).not.toHaveBeenCalled();
    }
  );
});

describe("supportsFormat", () => {
  it("returns true when toDataURL output starts with data:{format}", () => {
    const { canvas } = makeCanvasMock("image/webp");
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(supportsFormat("image/webp")).toBe(true);
  });

  it("returns false when toDataURL output does not match format", () => {
    const { canvas } = makeCanvasMock();
    vi.mocked(canvas.toDataURL).mockReturnValue("data:image/png;base64,abc");
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(supportsFormat("image/webp")).toBe(false);
  });
});

describe("getBestFormat", () => {
  it("returns the requested format when supported", () => {
    const { canvas } = makeCanvasMock("image/webp");
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(getBestFormat("image/webp")).toBe("image/webp");
  });

  it("returns image/png fallback when format is not supported", () => {
    const { canvas } = makeCanvasMock();
    vi.mocked(canvas.toDataURL).mockReturnValue("data:image/png;base64,abc");
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    expect(getBestFormat("image/webp")).toBe("image/png");
  });
});
