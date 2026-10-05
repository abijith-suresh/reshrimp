import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PIXEL_DIMENSION, MAX_TOTAL_PIXELS } from "../config/constants";
import type { ProcessOptions, ResizeOptions } from "../types/processing";
import {
  calculateDimensions,
  getImageMetadata,
  prepareImageFile,
  processImage,
} from "./imageService";

const mockCanvas = {} as HTMLCanvasElement;

vi.mock("./canvasService", () => ({
  loadImage: vi.fn(),
  resizeOnCanvas: vi.fn(),
  canvasToBlob: vi.fn(),
  canvasToBlobAtFileSizeTarget: vi.fn(),
  getBestFormat: vi.fn(),
}));

vi.mock("./backgroundRemovalService", () => ({
  removeBackground: vi.fn(),
}));

vi.mock("./formatDetectionService", () => ({
  decodeHeicBlob: vi.fn(),
  isHeicBlob: vi.fn(),
}));

import { removeBackground } from "./backgroundRemovalService";
import {
  canvasToBlob,
  canvasToBlobAtFileSizeTarget,
  getBestFormat,
  loadImage,
  resizeOnCanvas,
} from "./canvasService";
import { decodeHeicBlob, isHeicBlob } from "./formatDetectionService";

const mockLoadImage = vi.mocked(loadImage);
const mockResizeOnCanvas = vi.mocked(resizeOnCanvas);
const mockCanvasToBlob = vi.mocked(canvasToBlob);
const mockCanvasToBlobAtFileSizeTarget = vi.mocked(canvasToBlobAtFileSizeTarget);
const mockGetBestFormat = vi.mocked(getBestFormat);
const mockRemoveBackground = vi.mocked(removeBackground);
const mockDecodeHeicBlob = vi.mocked(decodeHeicBlob);
const mockIsHeicBlob = vi.mocked(isHeicBlob);

function makeMockImg(width = 800, height = 600) {
  return { width, height } as HTMLImageElement;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockLoadImage.mockResolvedValue(makeMockImg());
  mockResizeOnCanvas.mockReturnValue(mockCanvas);
  mockCanvasToBlob.mockResolvedValue(new Blob([], { type: "image/png" }));
  mockCanvasToBlobAtFileSizeTarget.mockResolvedValue({
    blob: new Blob([], { type: "image/jpeg" }),
    targetReached: true,
  });
  mockGetBestFormat.mockImplementation((format) => format);
  mockRemoveBackground.mockResolvedValue(new Blob([], { type: "image/png" }));
  mockDecodeHeicBlob.mockResolvedValue(new Blob([], { type: "image/png" }));
  mockIsHeicBlob.mockResolvedValue(false);
});

describe("calculateDimensions", () => {
  const cases: Array<[number, number, ResizeOptions, { width: number; height: number }]> = [
    [
      800,
      600,
      { width: 400, height: 300, maintainAspectRatio: false },
      { width: 400, height: 300 },
    ],
    [800, 600, { maintainAspectRatio: false }, { width: 800, height: 600 }],
    [800, 600, { width: 400, maintainAspectRatio: true }, { width: 400, height: 300 }],
    [800, 600, { height: 300, maintainAspectRatio: true }, { width: 400, height: 300 }],
    [800, 600, { width: 400, height: 200, maintainAspectRatio: true }, { width: 267, height: 200 }],
    [800, 600, { maintainAspectRatio: true }, { width: 800, height: 600 }],
    [3, 2, { width: 10, maintainAspectRatio: true }, { width: 10, height: 7 }],
    [16384, 1, { width: 1, maintainAspectRatio: true }, { width: 1, height: 1 }],
    [1, 16384, { height: 1, maintainAspectRatio: true }, { width: 1, height: 1 }],
  ];

  it.each(cases)("resizes %i × %i with %j to %j", (width, height, options, expected) => {
    expect(calculateDimensions(width, height, options)).toEqual(expected);
  });
});

describe("processImage dimension guards", () => {
  it("rejects sources beyond MAX_PIXEL_DIMENSION before any heavy work runs", async () => {
    mockLoadImage.mockResolvedValue(makeMockImg(MAX_PIXEL_DIMENSION + 1, 100));
    const file = new File([], "huge.png", { type: "image/png" });

    await expect(processImage(file, { removeBackground: true })).rejects.toThrow(
      /exceed the maximum/
    );
    expect(mockRemoveBackground).not.toHaveBeenCalled();
    expect(mockCanvasToBlob).not.toHaveBeenCalled();
  });

  it("rejects sources beyond the total pixel budget before canvas work", async () => {
    mockLoadImage.mockResolvedValue(makeMockImg(8000, 4001));
    const file = new File([], "huge.png", { type: "image/png" });

    await expect(processImage(file, {})).rejects.toThrow(String(MAX_TOTAL_PIXELS.toLocaleString()));
    expect(mockResizeOnCanvas).not.toHaveBeenCalled();
  });

  it("rejects resize targets beyond MAX_PIXEL_DIMENSION", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const opts: ProcessOptions = {
      resize: { width: MAX_PIXEL_DIMENSION + 1, maintainAspectRatio: true },
    };

    await expect(processImage(file, opts)).rejects.toThrow(/exceeds the maximum/);
  });

  it("rejects resize targets beyond the total pixel budget", async () => {
    const file = new File([], "test.png", { type: "image/png" });

    await expect(
      processImage(file, {
        resize: { width: 8000, height: 4001, maintainAspectRatio: false },
      })
    ).rejects.toThrow(String(MAX_TOTAL_PIXELS.toLocaleString()));
  });

  it("rejects non-positive and non-finite resize targets", async () => {
    const file = new File([], "test.png", { type: "image/png" });

    await expect(
      processImage(file, { resize: { width: 0, maintainAspectRatio: false } })
    ).rejects.toThrow(/at least 1px/);

    await expect(
      processImage(file, { resize: { height: -10, maintainAspectRatio: false } })
    ).rejects.toThrow(/at least 1px/);

    await expect(
      processImage(file, { resize: { width: Number.NaN, maintainAspectRatio: false } })
    ).rejects.toThrow(/at least 1px/);
  });

  it("rejects targets that overflow the limit via aspect-ratio derivation", async () => {
    mockLoadImage.mockResolvedValue(makeMockImg(200, 16000));
    const file = new File([], "tall.png", { type: "image/png" });
    const opts: ProcessOptions = {
      resize: { width: MAX_PIXEL_DIMENSION, maintainAspectRatio: true },
    };

    await expect(processImage(file, opts)).rejects.toThrow(/exceed the maximum/);
    expect(mockResizeOnCanvas).not.toHaveBeenCalled();
  });
});

describe("processImage", () => {
  it("uses PNG after background removal and forwards progress", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    const onProgress = vi.fn();

    const result = await processImage(file, { removeBackground: true }, onProgress);

    expect(mockRemoveBackground).toHaveBeenCalledWith(file, onProgress);
    expect(result.metadata.format).toBe("image/png");
    expect(mockCanvasToBlob).toHaveBeenCalledWith(mockCanvas, "image/png", undefined);
  });

  it("reuses the background-removed source when output controls change", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });

    await processImage(file, { removeBackground: true });
    await processImage(file, {
      removeBackground: true,
      resize: { width: 400, maintainAspectRatio: true },
      format: "image/png",
    });

    expect(mockRemoveBackground).toHaveBeenCalledTimes(1);
  });

  it("retries background removal after a failed result", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    mockRemoveBackground.mockRejectedValueOnce(new Error("temporary failure"));

    await expect(processImage(file, { removeBackground: true })).rejects.toThrow(
      "temporary failure"
    );
    await expect(processImage(file, { removeBackground: true })).resolves.toMatchObject({
      metadata: { format: "image/png" },
    });

    expect(mockRemoveBackground).toHaveBeenCalledTimes(2);
  });

  it("runs background removal against the decoded png for heic uploads", async () => {
    const file = new File(["heic"], "test.heic", { type: "image/heic" });
    const decodedBlob = new Blob(["decoded"], { type: "image/png" });
    mockDecodeHeicBlob.mockResolvedValue(decodedBlob);

    await processImage(file, { removeBackground: true });

    expect(mockDecodeHeicBlob).toHaveBeenCalledWith(file);
    expect(mockRemoveBackground).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test.png",
        type: "image/png",
      }),
      undefined
    );
  });

  it("reuses the background-removed result for repeated HEIC edits", async () => {
    const file = new File(["heic"], "test.heic", { type: "image/heic" });
    mockDecodeHeicBlob.mockResolvedValue(new Blob(["decoded"], { type: "image/png" }));

    await processImage(file, { removeBackground: true });
    await processImage(file, {
      removeBackground: true,
      resize: { width: 400, maintainAspectRatio: true },
    });

    expect(mockRemoveBackground).toHaveBeenCalledTimes(1);
    expect(mockRemoveBackground).toHaveBeenCalledWith(
      expect.objectContaining({ name: "test.png", type: "image/png" }),
      undefined
    );
  });

  it("decodes heic content that ships with an empty mime type", async () => {
    const file = new File(["heic"], "photo", { type: "" });
    mockIsHeicBlob.mockResolvedValue(true);

    await processImage(file, {});

    expect(mockIsHeicBlob).toHaveBeenCalledWith(file);
    expect(mockDecodeHeicBlob).toHaveBeenCalledWith(file);
  });

  it("skips heic decoding for ordinary uploads", async () => {
    const file = new File(["png"], "test.png", { type: "image/png" });

    await processImage(file, {});

    expect(mockDecodeHeicBlob).not.toHaveBeenCalled();
  });

  it("returns the encoded file with the selected dimensions, format, and quality", async () => {
    const file = new File(["source"], "photo.png", { type: "image/png" });
    const output = new Blob(["encoded jpeg"], { type: "image/jpeg" });
    mockCanvasToBlob.mockResolvedValueOnce(output);

    const result = await processImage(file, {
      resize: { width: 400, height: 300, maintainAspectRatio: false },
      format: "image/jpeg",
      quality: 0.75,
    });

    expect(mockResizeOnCanvas).toHaveBeenCalledWith(
      expect.objectContaining({ width: 800, height: 600 }),
      400,
      300
    );
    expect(mockCanvasToBlob).toHaveBeenCalledWith(mockCanvas, "image/jpeg", 0.75);
    expect(result).toEqual({
      blob: output,
      requestedFormat: "image/jpeg",
      metadata: { width: 400, height: 300, format: "image/jpeg", fileSize: output.size },
    });
  });

  it("uses target-size encoding for quality-adjustable formats", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    const targetFileSizeBytes = 500 * 1024;
    const outputBlob = new Blob(["small"], { type: "image/jpeg" });
    mockCanvasToBlobAtFileSizeTarget.mockResolvedValue({
      blob: outputBlob,
      targetReached: false,
    });

    const result = await processImage(file, {
      format: "image/jpeg",
      targetFileSizeBytes,
    });

    expect(mockCanvasToBlobAtFileSizeTarget).toHaveBeenCalledWith(
      mockCanvas,
      "image/jpeg",
      targetFileSizeBytes
    );
    expect(result.blob).toBe(outputBlob);
    expect(result.metadata).toMatchObject({
      targetFileSizeBytes,
      targetFileSizeStatus: "unmet",
    });
  });

  it("reports unsupported targets when the actual output has no quality control", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const targetFileSizeBytes = 100_000;

    const result = await processImage(file, { targetFileSizeBytes });

    expect(mockCanvasToBlobAtFileSizeTarget).not.toHaveBeenCalled();
    expect(result.metadata).toMatchObject({
      targetFileSizeBytes,
      targetFileSizeStatus: "unsupported",
    });
  });

  it("rejects invalid target sizes before decoding the image", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });

    await expect(processImage(file, { targetFileSizeBytes: 0 })).rejects.toThrow(
      "Maximum file size must be a positive whole number of bytes"
    );
    expect(mockLoadImage).not.toHaveBeenCalled();
  });

  it("keeps the source dimensions and format when no options are set", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const output = new Blob(["pixels"], { type: "image/png" });
    mockCanvasToBlob.mockResolvedValueOnce(output);
    const result = await processImage(file, {});

    expect(result).toEqual({
      blob: output,
      requestedFormat: "image/png",
      metadata: { width: 800, height: 600, format: "image/png", fileSize: output.size },
    });
  });
});

describe("prepareImageFile", () => {
  it("returns ordinary input unchanged", async () => {
    const file = new File(["png"], "photo.png", { type: "image/png" });

    await expect(prepareImageFile(file)).resolves.toEqual({ file, format: "image/png" });
    expect(mockDecodeHeicBlob).not.toHaveBeenCalled();
  });

  it("decodes HEIC input before metadata extraction and preserves its input format", async () => {
    const file = new File(["heic"], "photo.heic", { type: "image/heic" });
    const decodedBlob = new Blob(["decoded"], { type: "image/png" });
    mockDecodeHeicBlob.mockResolvedValue(decodedBlob);

    const prepared = await prepareImageFile(file);

    expect(mockDecodeHeicBlob).toHaveBeenCalledWith(file);
    expect(prepared.format).toBe("image/heic");
    expect(prepared.file).toEqual(
      expect.objectContaining({ name: "photo.png", type: "image/png" })
    );
  });

  it("detects HEIC content when the MIME type is empty", async () => {
    const file = new File(["heic"], "photo", { type: "" });
    mockIsHeicBlob.mockResolvedValue(true);

    const prepared = await prepareImageFile(file);

    expect(mockIsHeicBlob).toHaveBeenCalledWith(file);
    expect(prepared.format).toBe("image/heic");
    expect(mockDecodeHeicBlob).toHaveBeenCalledWith(file);
  });
});

describe("getImageMetadata", () => {
  it("returns the decoded dimensions and source file details", async () => {
    mockLoadImage.mockResolvedValue(makeMockImg(1920, 1080));
    const file = new File(["abc"], "photo.jpg", { type: "image/jpeg" });

    expect(await getImageMetadata(file)).toEqual({
      width: 1920,
      height: 1080,
      format: "image/jpeg",
      fileSize: 3,
      fileName: "photo.jpg",
    });
  });
});
