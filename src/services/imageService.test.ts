import { describe, it, expect, beforeEach, vi } from "vitest";
import { calculateDimensions, processImage, getImageMetadata } from "./imageService";
import type { ResizeOptions, ProcessOptions } from "../types/processing";

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toDataURL: vi.fn(),
  toBlob: vi.fn(),
} as unknown as HTMLCanvasElement;

vi.mock("./canvasService", () => ({
  loadImage: vi.fn(),
  resizeOnCanvas: vi.fn(() => mockCanvas),
  canvasToBlob: vi.fn(async () => new Blob([], { type: "image/png" })),
  getBestFormat: vi.fn((f: string) => f),
}));

vi.mock("./backgroundRemovalService", () => ({
  removeBackground: vi.fn(async () => new Blob([], { type: "image/png" })),
}));

vi.mock("./formatDetectionService", () => ({
  decodeHeicBlob: vi.fn(async () => new Blob([], { type: "image/png" })),
  isHeicInput: vi.fn((mimeType: string) => mimeType === "image/heic" || mimeType === "image/heif"),
}));

import { loadImage, resizeOnCanvas, canvasToBlob, getBestFormat } from "./canvasService";
import { removeBackground } from "./backgroundRemovalService";
import { decodeHeicBlob } from "./formatDetectionService";

const mockLoadImage = loadImage as ReturnType<typeof vi.fn>;
const mockResizeOnCanvas = resizeOnCanvas as ReturnType<typeof vi.fn>;
const mockCanvasToBlob = canvasToBlob as ReturnType<typeof vi.fn>;
const mockGetBestFormat = getBestFormat as ReturnType<typeof vi.fn>;
const mockRemoveBackground = removeBackground as ReturnType<typeof vi.fn>;
const mockDecodeHeicBlob = decodeHeicBlob as ReturnType<typeof vi.fn>;

function makeMockImg(width = 800, height = 600) {
  return { width, height } as HTMLImageElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadImage.mockResolvedValue(makeMockImg());
  mockResizeOnCanvas.mockReturnValue(mockCanvas);
  mockCanvasToBlob.mockResolvedValue(new Blob([], { type: "image/png" }));
  mockGetBestFormat.mockImplementation((f: string) => f);
  mockDecodeHeicBlob.mockResolvedValue(new Blob([], { type: "image/png" }));
});

// ─── calculateDimensions ─────────────────────────────────────────────────────

describe("calculateDimensions", () => {
  describe("maintainAspectRatio = false", () => {
    it("uses exact width and height when both provided", () => {
      const opts: ResizeOptions = { width: 400, height: 300, maintainAspectRatio: false };
      expect(calculateDimensions(800, 600, opts)).toEqual({ width: 400, height: 300 });
    });

    it("uses original dimensions when neither width nor height provided", () => {
      const opts: ResizeOptions = { maintainAspectRatio: false };
      expect(calculateDimensions(800, 600, opts)).toEqual({ width: 800, height: 600 });
    });
  });

  describe("maintainAspectRatio = true", () => {
    it("derives height from width when only width provided", () => {
      // 800x600 → aspect 4:3 → width 400 → height 300
      const opts: ResizeOptions = { width: 400, maintainAspectRatio: true };
      expect(calculateDimensions(800, 600, opts)).toEqual({ width: 400, height: 300 });
    });

    it("derives width from height when only height provided", () => {
      // 800x600 → aspect 4:3 → height 300 → width 400
      const opts: ResizeOptions = { height: 300, maintainAspectRatio: true };
      expect(calculateDimensions(800, 600, opts)).toEqual({ width: 400, height: 300 });
    });

    it("uses width and ignores height when both provided (width takes precedence)", () => {
      // 800x600 → aspect 4:3 → width 400 → computed height 300 (not 200)
      const opts: ResizeOptions = { width: 400, height: 200, maintainAspectRatio: true };
      const result = calculateDimensions(800, 600, opts);
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
    });

    it("returns original dimensions when neither provided", () => {
      const opts: ResizeOptions = { maintainAspectRatio: true };
      expect(calculateDimensions(800, 600, opts)).toEqual({ width: 800, height: 600 });
    });

    it("handles fractional aspect ratios with rounding", () => {
      // 3x2 image → width 10 → height = 10 / 1.5 = 6.666 → rounds to 7
      const opts: ResizeOptions = { width: 10, maintainAspectRatio: true };
      expect(calculateDimensions(3, 2, opts)).toEqual({ width: 10, height: 7 });
    });
  });
});

// ─── processImage ────────────────────────────────────────────────────────────

describe("processImage", () => {
  it("applies background removal and forces PNG format", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    const opts: ProcessOptions = { removeBackground: true };

    const result = await processImage(file, opts);

    expect(mockRemoveBackground).toHaveBeenCalledWith(file, undefined);
    expect(result.metadata.format).toBe("image/png");
  });

  it("forwards the progress callback to removeBackground", async () => {
    const file = new File([], "test.jpg", { type: "image/jpeg" });
    const onProgress = vi.fn();
    const opts: ProcessOptions = { removeBackground: true };

    await processImage(file, opts, onProgress);

    expect(mockRemoveBackground).toHaveBeenCalledWith(file, onProgress);
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

  it("applies resize when resize option provided", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const opts: ProcessOptions = {
      resize: { width: 400, height: 300, maintainAspectRatio: false },
    };

    await processImage(file, opts);

    expect(mockResizeOnCanvas).toHaveBeenCalledWith(expect.anything(), 400, 300);
  });

  it("applies format conversion", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const opts: ProcessOptions = { format: "image/jpeg" };

    await processImage(file, opts);

    expect(mockGetBestFormat).toHaveBeenCalledWith("image/jpeg");
  });

  it("applies quality for JPEG output", async () => {
    mockGetBestFormat.mockReturnValue("image/jpeg");
    const file = new File([], "test.jpeg", { type: "image/jpeg" });
    const opts: ProcessOptions = { quality: 0.75 };

    await processImage(file, opts);

    expect(mockCanvasToBlob).toHaveBeenCalledWith(expect.anything(), "image/jpeg", 0.75);
  });

  it("returns ProcessResult with blob and metadata", async () => {
    const file = new File([], "test.png", { type: "image/png" });
    const result = await processImage(file, {});

    expect(result).toHaveProperty("blob");
    expect(result).toHaveProperty("metadata");
    expect(result.metadata).toMatchObject({
      width: expect.any(Number),
      height: expect.any(Number),
      format: expect.any(String),
      fileSize: expect.any(Number),
    });
  });
});

// ─── getImageMetadata ─────────────────────────────────────────────────────────

describe("getImageMetadata", () => {
  it("returns width and height from the loaded image", async () => {
    mockLoadImage.mockResolvedValue(makeMockImg(1920, 1080));
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    const meta = await getImageMetadata(file);

    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
  });

  it("returns format and fileSize from the file object", async () => {
    const file = new File(["abc"], "photo.jpg", { type: "image/jpeg" });
    const meta = await getImageMetadata(file);

    expect(meta.format).toBe("image/jpeg");
    expect(meta.fileSize).toBe(file.size);
  });

  it("returns fileName from the file object", async () => {
    const file = new File([], "my-photo.png", { type: "image/png" });
    const meta = await getImageMetadata(file);
    expect(meta.fileName).toBe("my-photo.png");
  });
});
