import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKGROUND_REMOVAL_MODEL,
  BACKGROUND_REMOVAL_PUBLIC_PATH,
} from "../config/backgroundRemoval";

vi.mock("@imgly/background-removal", () => ({
  removeBackground: vi.fn(async () => new Blob([], { type: "image/png" })),
}));

import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";
import { removeBackground } from "./backgroundRemovalService";

const mockImglyRemoveBackground = imglyRemoveBackground as ReturnType<typeof vi.fn>;

describe("removeBackground", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the shared model and public path configuration", async () => {
    const file = new File([], "photo.jpg", { type: "image/jpeg" });

    await removeBackground(file);

    expect(mockImglyRemoveBackground).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        model: BACKGROUND_REMOVAL_MODEL,
        publicPath: BACKGROUND_REMOVAL_PUBLIC_PATH,
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
