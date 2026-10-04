import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restoreMocks, setupBrowserMocks } from "../../../test/mocks";
import { createDecodedObjectUrl } from "./imageAppObjectUrls";

describe("createDecodedObjectUrl", () => {
  beforeEach(setupBrowserMocks);
  afterEach(restoreMocks);

  it("revokes a preview URL when its decode is cancelled", async () => {
    const controller = new AbortController();
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:pending-preview");

    const previewPromise = createDecodedObjectUrl(
      new Blob(["processed"], { type: "image/png" }),
      controller.signal
    );
    controller.abort();

    await expect(previewPromise).rejects.toThrow("decoding was cancelled");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:pending-preview");
  });

  it("revokes a preview URL when the browser cannot decode it", async () => {
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:error-url");

    const previewPromise = createDecodedObjectUrl(new Blob(["processed"], { type: "image/png" }));

    await expect(previewPromise).rejects.toThrow("could not be decoded");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:error-url");
  });
});
