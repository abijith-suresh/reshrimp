import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RotationDeg, FlipAxis } from "../types/processing";
import { flipImage, rotateImage } from "./transformService";

let mockCtx: {
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  imageSmoothingEnabled: boolean;
  imageSmoothingQuality: ImageSmoothingQuality;
  canvas: HTMLCanvasElement | null;
};

let createdCanvases: HTMLCanvasElement[];

beforeEach(() => {
  createdCanvases = [];

  mockCtx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "high" as ImageSmoothingQuality,
    canvas: null,
  };

  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag !== "canvas") {
      return document.createElementNS("http://www.w3.org/1999/xhtml", tag) as HTMLElement;
    }

    // Build a lightweight fake canvas with real width/height properties
    const fakeCanvas = Object.create(HTMLCanvasElement.prototype) as HTMLCanvasElement;
    let w = 0;
    let h = 0;
    Object.defineProperty(fakeCanvas, "width", {
      get: () => w,
      set: (v: number) => {
        w = v;
      },
      configurable: true,
    });
    Object.defineProperty(fakeCanvas, "height", {
      get: () => h,
      set: (v: number) => {
        h = v;
      },
      configurable: true,
    });
    fakeCanvas.getContext = ((contextId: string) => {
      if (contextId === "2d") {
        mockCtx.canvas = fakeCanvas;
        return mockCtx as unknown as CanvasRenderingContext2D;
      }
      return null;
    }) as HTMLCanvasElement["getContext"];

    createdCanvases.push(fakeCanvas);
    return fakeCanvas;
  });
});

function makeImage(w: number, h: number): HTMLImageElement {
  return { width: w, height: h } as HTMLImageElement;
}

describe("transformService", () => {
  describe("rotateImage", () => {
    it.each<[RotationDeg, number, number]>([
      [90, 800, 600],
      [180, 600, 800],
      [270, 800, 600],
    ])("rotating by %d° swaps dimensions correctly", (degrees, expectedW, expectedH) => {
      const canvas = rotateImage(makeImage(600, 800), degrees);

      expect(canvas.width).toBe(expectedW);
      expect(canvas.height).toBe(expectedH);
    });

    it("translates to center and rotates by the correct radian angle", () => {
      rotateImage(makeImage(600, 800), 90);

      // translate(outW/2, outH/2) = translate(400, 300)
      expect(mockCtx.translate).toHaveBeenCalledWith(400, 300);
      expect(mockCtx.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180);
    });

    it("draws the image centered at origin", () => {
      rotateImage(makeImage(600, 800), 180);

      // translate(outW/2, outH/2) = translate(300, 400)
      expect(mockCtx.translate).toHaveBeenCalledWith(300, 400);
      // drawImage(img, -w/2, -h/2, w, h) = drawImage(img, -300, -400, 600, 800)
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        expect.objectContaining({ width: 600, height: 800 }),
        -300,
        -400,
        600,
        800
      );
    });
  });

  describe("flipImage", () => {
    it("preserves dimensions", () => {
      const canvas = flipImage(makeImage(640, 480), "horizontal");

      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
    });

    it.each<FlipAxis>(["horizontal", "vertical"])(
      "applies correct scale transform for %s flip",
      (axis) => {
        flipImage(makeImage(640, 480), axis);

        if (axis === "horizontal") {
          expect(mockCtx.translate).toHaveBeenCalledWith(640, 0);
          expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
        } else {
          expect(mockCtx.translate).toHaveBeenCalledWith(0, 480);
          expect(mockCtx.scale).toHaveBeenCalledWith(1, -1);
        }
      }
    );
  });
});
