import { vi } from "vitest";

export function mockObjectUrls() {
  const createObjectURL = vi.fn(() => "blob:mock-url");
  const revokeObjectURL = vi.fn();
  // Keep URL parsing available to services that enforce same-origin assets.
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    }
  );
  return { createObjectURL, revokeObjectURL };
}

export function mockImageLoading() {
  vi.stubGlobal(
    "Image",
    class {
      width = 100;
      height = 80;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private currentSrc = "";

      get src() {
        return this.currentSrc;
      }
      set src(value: string) {
        this.currentSrc = value;
        queueMicrotask(() => (value === "blob:error-url" ? this.onerror?.() : this.onload?.()));
      }
    }
  );
}

export function makeCanvasMock(format = "image/png") {
  const canvas = document.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "canvas"
  ) as HTMLCanvasElement;
  const ctx = {
    drawImage: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low" as ImageSmoothingQuality,
  };
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(canvas, "toDataURL").mockImplementation((type = format) => `data:${type};base64,abc`);
  vi.spyOn(canvas, "toBlob").mockImplementation((callback, type = format) => {
    callback(new Blob(["encoded pixels"], { type }));
  });
  return { canvas, ctx };
}

export function mockCanvasCreation() {
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    return tag === "canvas" ? makeCanvasMock().canvas : createElement(tag);
  });
}
