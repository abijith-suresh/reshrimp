import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockImageLoading, mockObjectUrls } from "../../../test/mocks";
import { createDecodedObjectUrl } from "./imageAppObjectUrls";

describe("createDecodedObjectUrl", () => {
  beforeEach(() => {
    mockObjectUrls();
    mockImageLoading();
  });

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

// jsdom has no image decoder. Control this browser boundary to check ownership
// while decoding is pending; the browser suite checks actual encoded images.
describe("decoded preview ownership", () => {
  function pendingDecode() {
    mockObjectUrls();
    const decode = Promise.withResolvers<void>();
    let image: HTMLImageElement;
    vi.stubGlobal(
      "Image",
      class {
        src = "";
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          image = this as unknown as HTMLImageElement;
        }
        decode() {
          return decode.promise;
        }
      }
    );
    return {
      decode,
      get image() {
        return image;
      },
    };
  }

  it("waits for decode even if the load event has fired", async () => {
    const browser = pendingDecode();
    const resolved = vi.fn();
    const promise = createDecodedObjectUrl(new Blob(["pixels"])).then(resolved);
    browser.image.onload?.(new Event("load"));
    await Promise.resolve();
    expect(resolved).not.toHaveBeenCalled();
    browser.decode.resolve();
    await promise;
    expect(resolved).toHaveBeenCalledWith("blob:mock-url");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("revokes a rejected decode exactly once", async () => {
    const browser = pendingDecode();
    const promise = createDecodedObjectUrl(new Blob(["pixels"]));
    browser.decode.reject(new Error("bad frame"));
    await expect(promise).rejects.toThrow("could not be decoded");
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:mock-url");
  });

  it("revokes a cancelled decode and ignores its later completion", async () => {
    const browser = pendingDecode();
    const controller = new AbortController();
    const promise = createDecodedObjectUrl(new Blob(["pixels"]), controller.signal);
    controller.abort();
    await expect(promise).rejects.toThrow("cancelled");
    browser.decode.resolve();
    await Promise.resolve();
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:mock-url");
  });

  it("does not start decoding with an already cancelled signal", async () => {
    const browser = pendingDecode();
    const controller = new AbortController();
    controller.abort();
    await expect(createDecodedObjectUrl(new Blob(["pixels"]), controller.signal)).rejects.toThrow(
      "cancelled"
    );
    expect(browser.image.src).toBe("");
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:mock-url");
  });
});
