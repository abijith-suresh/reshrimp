import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_REMOVAL_ASSET_PATH_PREFIX,
  BACKGROUND_REMOVAL_MODEL,
  getBackgroundRemovalPublicPath,
} from "../config/backgroundRemoval";

vi.mock("@imgly/background-removal", () => ({
  removeBackground: vi.fn(async () => new Blob([], { type: "image/png" })),
  preload: vi.fn(async () => undefined),
}));

import {
  preload as imglyPreload,
  removeBackground as imglyRemoveBackground,
} from "@imgly/background-removal";
import { preloadBackgroundRemoval, removeBackground } from "./backgroundRemovalService";

const mockImglyPreload = imglyPreload as ReturnType<typeof vi.fn>;
const mockImglyRemoveBackground = imglyRemoveBackground as ReturnType<typeof vi.fn>;

describe("removeBackground", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a same-origin public path for mirrored model assets", () => {
    expect(getBackgroundRemovalPublicPath("https://reshrimp.test")).toBe(
      `https://reshrimp.test${BACKGROUND_REMOVAL_ASSET_PATH_PREFIX}`
    );
  });

  it("preloads the runtime with the mirrored public path", async () => {
    await preloadBackgroundRemoval();

    expect(mockImglyPreload).toHaveBeenCalledWith({
      publicPath: getBackgroundRemovalPublicPath(window.location.origin),
    });
  });

  it("forwards the shared model and public path configuration", async () => {
    const file = new File([], "photo.jpg", { type: "image/jpeg" });

    await removeBackground(file);

    expect(mockImglyRemoveBackground).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        model: BACKGROUND_REMOVAL_MODEL,
        publicPath: getBackgroundRemovalPublicPath(window.location.origin),
        device: "cpu",
      })
    );
  });

  it("normalizes library progress events to a 0-1 callback", async () => {
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    const onProgress = vi.fn();

    await removeBackground(file, onProgress);

    const config = mockImglyRemoveBackground.mock.calls[0]?.[1] as {
      progress?: (key: string, current: number, total: number) => void;
    };

    config.progress?.("download", 25, 100);
    expect(onProgress).toHaveBeenCalledWith(0.25);
  });

  it("ignores progress events with a zero total", async () => {
    const file = new File([], "photo.jpg", { type: "image/jpeg" });
    const onProgress = vi.fn();

    await removeBackground(file, onProgress);

    const config = mockImglyRemoveBackground.mock.calls[0]?.[1] as {
      progress?: (key: string, current: number, total: number) => void;
    };

    config.progress?.("download", 10, 0);
    expect(onProgress).not.toHaveBeenCalled();
  });
});

describe("module loading", () => {
  it("retries a failed dynamic import on the next call", async () => {
    let importShouldFail = true;
    vi.doMock("@imgly/background-removal", () => {
      if (importShouldFail) {
        throw new Error("Simulated transient import failure");
      }
      return {
        removeBackground: vi.fn(async () => new Blob([], { type: "image/png" })),
        preload: vi.fn(async () => undefined),
      };
    });

    // Fresh service module instance so the retry is not served by a cached
    // import promise from the tests above.
    vi.resetModules();
    const { removeBackground: freshRemoveBackground } = await import("./backgroundRemovalService");
    const file = new File([], "photo.jpg", { type: "image/jpeg" });

    // Vitest wraps the thrown factory error, so only assert that the import
    // rejects; the retry assertion below proves the promise cache was reset.
    await expect(freshRemoveBackground(file)).rejects.toThrow();

    importShouldFail = false;
    await expect(freshRemoveBackground(file)).resolves.toBeInstanceOf(Blob);

    vi.doUnmock("@imgly/background-removal");
  });
});
