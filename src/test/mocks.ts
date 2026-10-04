import { vi } from "vitest";

function makeCtxStub() {
  return {
    drawImage: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low" as ImageSmoothingQuality,
  };
}

export function makeCanvasMock(format = "image/png") {
  const ctx = makeCtxStub();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toDataURL: vi.fn((f: string = format) => `data:${f};base64,abc`),
    toBlob: vi.fn((cb: BlobCallback) => {
      cb(new Blob([]));
    }),
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}

export function setupBrowserMocks() {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });

  // jsdom has no canvas renderer. Keep real DOM elements for the UI tests.
  const realCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return makeCanvasMock().canvas;
    }
    return realCreateElement(tag);
  });

  vi.spyOn(document.body, "appendChild");
  vi.spyOn(document.body, "removeChild");
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  // Load asynchronously, with a sentinel URL for decode failures.
  const ERROR_URL = "blob:error-url";
  const MockImage = class {
    width = 100;
    height = 80;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      if (value === ERROR_URL) {
        setTimeout(() => this.onerror?.(), 0);
      } else {
        setTimeout(() => this.onload?.(), 0);
      }
    }
  };
  vi.stubGlobal("Image", MockImage);
}

export function restoreMocks() {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
}
