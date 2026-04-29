import { vi } from "vitest";

/**
 * Canvas 2D context stub
 */
export function makeCtxStub() {
  return {
    drawImage: vi.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low" as ImageSmoothingQuality,
  };
}

/**
 * Build a mock HTMLCanvasElement
 */
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

/**
 * Set up all browser API mocks.
 * Call in beforeEach.
 */
export function setupBrowserMocks() {
  // URL stubs
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });

  // createElement interceptor — canvas gets a mock, anything else uses real impl
  const realCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return makeCanvasMock().canvas;
    }
    return realCreateElement(tag);
  });

  vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
  vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  // Image mock — fires onload after a microtask; sentinel URL triggers onerror
  const ERROR_URL = "blob:error-url";
  const OrigImage = globalThis.Image;
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
        Promise.resolve().then(() => this.onerror?.());
      } else {
        Promise.resolve().then(() => this.onload?.());
      }
    }
  };
  vi.stubGlobal("Image", MockImage);

  return { ERROR_URL, OrigImage };
}

/**
 * Restore all mocks.
 * Call in afterEach.
 */
export function restoreMocks() {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
}
