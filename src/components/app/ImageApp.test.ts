import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcessResult } from "@/types/processing";
import { restoreMocks, setupBrowserMocks } from "../../test/mocks";

vi.mock("@/services/imageService", () => ({
  getImageMetadata: vi.fn(),
  prepareImageFile: vi.fn(),
  processImage: vi.fn(),
}));

vi.mock("@/utils/imageUtils", async () => {
  const actual = await vi.importActual<typeof import("@/utils/imageUtils")>("@/utils/imageUtils");

  return {
    ...actual,
    createDownloadLink: vi.fn(),
  };
});

vi.mock("@/services/backgroundRemovalService", async () => {
  const actual = await vi.importActual<typeof import("@/services/backgroundRemovalService")>(
    "@/services/backgroundRemovalService"
  );
  return {
    ...actual,
    preloadBackgroundRemoval: vi.fn().mockResolvedValue(undefined),
  };
});

import { preloadBackgroundRemoval } from "@/services/backgroundRemovalService";
import { getImageMetadata, prepareImageFile, processImage } from "@/services/imageService";
import { createDownloadLink, formatFileSize } from "@/utils/imageUtils";
import ImageApp from "./ImageApp";
import { createDecodedObjectUrl } from "./state/imageAppObjectUrls";

const mockGetImageMetadata = vi.mocked(getImageMetadata);
const mockPrepareImageFile = vi.mocked(prepareImageFile);
const mockProcessImage = vi.mocked(processImage);
const mockCreateDownloadLink = vi.mocked(createDownloadLink);
const mockPreloadBackgroundRemoval = vi.mocked(preloadBackgroundRemoval);

// Solid stores delegated click handlers on the element in jsdom tests.
function triggerDelegatedClick(element: HTMLButtonElement): void {
  const delegatedElement = element as HTMLButtonElement & {
    $$click?: (event: MouseEvent) => void;
  };

  delegatedElement.$$click?.(new MouseEvent("click", { bubbles: true }));
}

// Solid also delegates mousedown; used for custom Select options.
function triggerDelegatedMouseDown(element: HTMLElement): void {
  const delegatedElement = element as HTMLElement & {
    $$mousedown?: (event: MouseEvent) => void;
  };

  delegatedElement.$$mousedown?.(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
}

function mockEditorBreakpoint() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    matches: false,
    media: "(min-width: 56rem)",
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  } as unknown as MediaQueryList;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList)
  );

  return (matches: boolean) => {
    for (const listener of listeners) {
      listener({ matches, media: mediaQueryList.media } as MediaQueryListEvent);
    }
  };
}

describe("ImageApp", () => {
  let dispose: (() => void) | undefined;
  let idleCallbackDescriptor: PropertyDescriptor | undefined;
  let cancelIdleCallbackDescriptor: PropertyDescriptor | undefined;
  let connectionDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    setupBrowserMocks();
    idleCallbackDescriptor = Object.getOwnPropertyDescriptor(window, "requestIdleCallback");
    cancelIdleCallbackDescriptor = Object.getOwnPropertyDescriptor(window, "cancelIdleCallback");
    connectionDescriptor = Object.getOwnPropertyDescriptor(navigator, "connection");
    mockGetImageMetadata.mockReset();
    mockPrepareImageFile.mockReset();
    mockPrepareImageFile.mockImplementation(async (file) => ({ file, format: file.type }));
    mockProcessImage.mockReset();
    mockCreateDownloadLink.mockReset();
    mockPreloadBackgroundRemoval.mockClear();
    // jsdom does not implement scrollIntoView; the custom Select scrolls the
    // highlighted option into view when its listbox opens.
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = "";
    restoreMocks();
    if (idleCallbackDescriptor) {
      Object.defineProperty(window, "requestIdleCallback", idleCallbackDescriptor);
    } else {
      Reflect.deleteProperty(window, "requestIdleCallback");
    }
    if (cancelIdleCallbackDescriptor) {
      Object.defineProperty(window, "cancelIdleCallback", cancelIdleCallbackDescriptor);
    } else {
      Reflect.deleteProperty(window, "cancelIdleCallback");
    }
    if (connectionDescriptor) {
      Object.defineProperty(navigator, "connection", connectionDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "connection");
    }
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

  it("auto-processes after upload and allows download", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: {
        width: 1200,
        height: 800,
        format: "image/png",
        fileSize: processedBlob.size,
      },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [sourceFile],
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete — original image should be shown
    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(sourceFile);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:original"
      );
      expect((view.container.querySelector("#width-input") as HTMLInputElement).value).toBe("1200");
      expect((view.container.querySelector("#height-input") as HTMLInputElement).value).toBe("800");
    });

    // Info strip should show filename and original metadata
    expect(view.container.querySelector("[data-testid='info-strip']")).toHaveTextContent(
      "photo.png"
    );
    expect(view.container.querySelector("[data-testid='info-strip']")).toHaveTextContent(
      "1200 × 800px"
    );

    // Auto-process should fire after debounce
    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalled();
    });

    // After processing, the preview should update to processed URL
    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:processed"
      );
      expect(view.container.querySelectorAll(".preview-frame img")).toHaveLength(1);
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    const renderedIds = Array.from(
      view.container.querySelectorAll<HTMLElement>("[id]"),
      (element) => element.id
    );
    expect(new Set(renderedIds).size).toBe(renderedIds.length);

    // Download should work
    const downloadBtn = view.container.querySelector("#download-button") as HTMLButtonElement;
    triggerDelegatedClick(downloadBtn);

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
  });

  it("preserves the width caret while aspect-ratio lock updates height", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 500,
      height: 400,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: { width: 500, height: 400, format: "image/png", fileSize: processedBlob.size },
    });
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    const heightInput = view.container.querySelector("#height-input") as HTMLInputElement;
    widthInput.value = "40";
    widthInput.setSelectionRange(1, 1);
    fireEvent.input(widthInput);

    expect(widthInput.value).toBe("40");
    expect(widthInput.selectionStart).toBe(1);
    expect(heightInput.value).toBe("32");
  });

  it("does not re-process once a run settles without new input", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: processedBlob.size },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [sourceFile],
    });

    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:processed"
      );
    });

    // Regression guard for the auto-process loop: a completion rewrites the
    // currentImage object, which must not re-trigger processing. Wait past a
    // full debounce window and confirm no further runs were queued.
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
  });

  it("uses the decoded HEIC preview while preserving source metadata", async () => {
    const sourceFile = new File(["original heic"], "photo.heic", { type: "image/heic" });
    const decodedFile = new File(["decoded png with more bytes"], "photo.png", {
      type: "image/png",
    });

    mockPrepareImageFile.mockResolvedValueOnce({ file: decodedFile, format: "image/heic" });
    mockGetImageMetadata.mockResolvedValueOnce({
      width: 1200,
      height: 800,
      format: "image/heic",
      fileSize: decodedFile.size,
      fileName: decodedFile.name,
    });
    mockProcessImage.mockImplementationOnce(() => new Promise<ProcessResult>(() => {}));
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:decoded-preview");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(decodedFile, "image/heic");
      expect(URL.createObjectURL).toHaveBeenCalledWith(decodedFile);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:decoded-preview"
      );
    });

    const info = view.container.querySelector("[data-testid='info-strip']");
    expect(info).toHaveTextContent("photo.heic");
    expect(info).toHaveTextContent(formatFileSize(sourceFile.size));
  });

  it("keeps the current preview until the replacement is fully decoded", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });
    const decodeResolvers: Array<() => void> = [];

    class DeferredImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private currentSrc = "";

      get src(): string {
        return this.currentSrc;
      }

      set src(value: string) {
        this.currentSrc = value;
        // A browser may finish loading before decode() has settled. The
        // preview must ignore this event while using the decode path.
        this.onload?.();
      }

      decode(): Promise<void> {
        return new Promise((resolve) => {
          decodeResolvers.push(resolve);
        });
      }
    }

    vi.stubGlobal("Image", DeferredImage);

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstBlob,
        requestedFormat: "image/png",
        metadata: {
          width: 1200,
          height: 800,
          format: "image/png",
          fileSize: firstBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondBlob,
        requestedFormat: "image/png",
        metadata: {
          width: 600,
          height: 400,
          format: "image/png",
          fileSize: secondBlob.size,
        },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
      expect(decodeResolvers).toHaveLength(1);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:original"
      );
    });

    decodeResolvers.shift()?.();

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "600" } });

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(decodeResolvers).toHaveLength(1);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
      expect(view.container.querySelector("[data-testid='info-strip']")).toHaveTextContent(
        "1200 × 800px"
      );
    });

    decodeResolvers.shift()?.();

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
      expect(view.container.querySelector("[data-testid='info-strip']")).toHaveTextContent(
        "600 × 400px"
      );
    });
  });

  it("keeps the previous processed URL until replacement is ready", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstBlob,
        requestedFormat: "image/png",
        metadata: {
          width: 1200,
          height: 800,
          format: "image/png",
          fileSize: firstBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondBlob,
        requestedFormat: "image/png",
        metadata: {
          width: 600,
          height: 400,
          format: "image/png",
          fileSize: secondBlob.size,
        },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [sourceFile],
    });

    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    // The quality slider cannot trigger anything for PNG output (quality
    // control unsupported), so drive the reprocess with a real dimension
    // input. 1200×800 with linked aspect ratio: width 400 → height 267.
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });

    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:first-processed"
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:first-processed");
    expect(view.container.querySelector("#download-button")).toBeDisabled();

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-processed");
  });

  it("revokes the previous session URLs when a new file is uploaded", async () => {
    const firstFile = new File(["first"], "first.png", { type: "image/png" });
    const secondFile = new File(["second"], "second.png", { type: "image/png" });
    const firstProcessedBlob = new Blob(["first-processed"], { type: "image/png" });
    const secondProcessedBlob = new Blob(["second-processed"], { type: "image/png" });

    mockGetImageMetadata
      .mockResolvedValueOnce({
        width: 1200,
        height: 800,
        format: "image/png",
        fileSize: firstFile.size,
        fileName: firstFile.name,
      })
      .mockResolvedValueOnce({
        width: 800,
        height: 600,
        format: "image/png",
        fileSize: secondFile.size,
        fileName: secondFile.name,
      });

    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstProcessedBlob,
        requestedFormat: "image/png",
        metadata: {
          width: 1200,
          height: 800,
          format: "image/png",
          fileSize: firstProcessedBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondProcessedBlob,
        requestedFormat: "image/png",
        metadata: {
          width: 800,
          height: 600,
          format: "image/png",
          fileSize: secondProcessedBlob.size,
        },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:first-original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-original")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [firstFile],
    });

    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [secondFile],
    });

    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(secondFile);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-original");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-processed");
  });

  it("revokes the active session URLs when the app unmounts", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: {
        width: 1200,
        height: 800,
        format: "image/png",
        fileSize: processedBlob.size,
      },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [sourceFile],
    });

    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:processed"
      );
    });

    view.unmount();
    dispose = undefined;

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:processed");
  });

  it("disables the quality slider for png output", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: {
        width: 1200,
        height: 800,
        format: "image/png",
        fileSize: processedBlob.size,
      },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [sourceFile],
    });

    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#quality-slider")).toBeDisabled();
      expect(view.container).not.toHaveTextContent("Fixed");
    });
  });

  it("shows a user-facing error when processing fails", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockRejectedValue(new Error("Processing exploded"));

    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:original");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      value: [sourceFile],
    });

    fireEvent.change(fileInput);

    // Wait for auto-process to fire and fail
    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalled();
      expect(view.container.querySelector("#error-text")).toHaveTextContent("Processing exploded");
      expect(view.container.querySelector("#download-button")).toBeDisabled();
    });
  });

  it("keeps the previous output visible when a reprocess fails", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstBlob,
        requestedFormat: "image/png",
        metadata: { width: 1200, height: 800, format: "image/png", fileSize: firstBlob.size },
      })
      .mockRejectedValueOnce(new Error("Second run failed"));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#error-text")).toHaveTextContent("Second run failed");
      expect(view.container.querySelector("#download-button")).toBeDisabled();
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });
  });

  it("does not create a processed URL after unmounting during processing", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });

    let resolveProcessing!: (result: ProcessResult) => void;
    mockProcessImage.mockImplementationOnce(
      () =>
        new Promise<ProcessResult>((resolve) => {
          resolveProcessing = resolve;
        })
    );
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:original");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
      expect(view.container).toHaveTextContent("Updating preview…");
    });

    view.unmount();
    dispose = undefined;
    resolveProcessing({
      blob: new Blob(["processed"], { type: "image/png" }),
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: 9 },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
  });

  it("renders the snap sheet (not the old tab-bar drawer) and starts hidden with no image", () => {
    const view = render(() => ImageApp());
    dispose = view.unmount;

    // No legacy "Adjust" / "Batch" app modes should be present
    expect(view.container).not.toHaveTextContent("Adjust");
    expect(view.container).not.toHaveTextContent("Batch");

    // Old bottom-tab drawer element is gone
    expect(view.container.querySelector("#app-controls-drawer")).toBeNull();

    // New snap sheet is present and starts hidden (no image loaded)
    const sheet = view.container.querySelector('[aria-label="Image controls"]') as HTMLDivElement;
    expect(sheet).not.toBeNull();
    expect(sheet).toHaveAttribute("aria-hidden", "true");
    expect(sheet.inert).toBe(true);

    const ids = Array.from(
      view.container.querySelectorAll<HTMLElement>("[id]"),
      (element) => element.id
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("moves focus from the mobile back link to desktop navigation at the editor breakpoint", async () => {
    const changeBreakpoint = mockEditorBreakpoint();

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const mobileBackButton = view.container.querySelector(
      "[data-mobile-back-button]"
    ) as HTMLAnchorElement;
    const desktopBackButton = view.container.querySelector(
      '[aria-label="App navigation"] a[aria-label="Back to home"]'
    ) as HTMLAnchorElement;

    mobileBackButton.focus();
    expect(document.activeElement).toBe(mobileBackButton);
    mobileBackButton.style.display = "none";
    mobileBackButton.blur();
    expect(document.activeElement).toBe(document.body);

    changeBreakpoint(true);

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(desktopBackButton);
    });
  });

  it("moves focus from the mobile empty-state upload button to desktop upload at the breakpoint", async () => {
    const changeBreakpoint = mockEditorBreakpoint();
    const view = render(() => ImageApp());
    dispose = view.unmount;

    const mobileUploadButton = view.container.querySelector(
      "[data-mobile-empty-state-upload]"
    ) as HTMLButtonElement;
    const desktopUploadControl = view.container.querySelector(
      '.app-control-panel [aria-label="Upload image or drag and drop"]'
    ) as HTMLDivElement;

    mobileUploadButton.focus();
    expect(document.activeElement).toBe(mobileUploadButton);
    mobileUploadButton.style.display = "none";
    mobileUploadButton.blur();
    expect(document.activeElement).toBe(document.body);

    changeBreakpoint(true);

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(desktopUploadControl);
    });
  });

  it("closes a desktop Select portal and returns focus to the mobile sheet at the breakpoint", async () => {
    const changeBreakpoint = mockEditorBreakpoint();
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: new Blob(["processed"], { type: "image/png" }),
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: 9 },
    });
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#mobile-width-input")).toBeEnabled();
    });

    const desktopUnitSelect = view.container.querySelector("#unit-select") as HTMLButtonElement;
    triggerDelegatedClick(desktopUnitSelect);

    await vi.waitFor(() => {
      const listbox = document.querySelector('[role="listbox"]');
      expect(listbox).not.toBeNull();
      expect(document.activeElement).toBe(listbox);
    });
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(view.container.querySelector("[data-app-shell]")).not.toContainElement(listbox);

    const desktopPanel = view.container.querySelector(".app-control-panel") as HTMLElement;
    desktopPanel.style.display = "none";
    changeBreakpoint(false);

    await vi.waitFor(() => {
      expect(document.querySelector('[role="listbox"]')).toBeNull();
      expect(document.activeElement).toBe(
        view.container.querySelector('button[aria-label="Open controls"]')
      );
    });
    expect(desktopUnitSelect).toHaveAttribute("aria-expanded", "false");
  });

  it("lets Escape close a mobile Select before collapsing its sheet", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: new Blob(["processed"], { type: "image/png" }),
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: 9 },
    });
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#mobile-width-input")).toBeEnabled();
    });

    const sheet = view.container.querySelector('[aria-label="Image controls"]') as HTMLElement;
    const openButton = sheet.querySelector(
      'button[aria-label="Open controls"]'
    ) as HTMLButtonElement;
    triggerDelegatedClick(openButton);
    await vi.waitFor(() => expect(sheet).toHaveAttribute("role", "dialog"));

    const mobileUnitSelect = view.container.querySelector(
      "#mobile-unit-select"
    ) as HTMLButtonElement;
    triggerDelegatedClick(mobileUnitSelect);

    await vi.waitFor(() => {
      const listbox = document.querySelector('[role="listbox"]');
      expect(listbox).not.toBeNull();
      expect(document.activeElement).toBe(listbox);
    });
    const listbox = document.querySelector('[role="listbox"]');
    if (!listbox) throw new Error("Expected the mobile Unit listbox to open");

    fireEvent.keyDown(listbox, { key: "Escape" });

    await vi.waitFor(() => {
      expect(document.querySelector('[role="listbox"]')).toBeNull();
      expect(sheet).toHaveAttribute("role", "dialog");
      expect(sheet).toHaveAttribute("aria-modal", "true");
    });

    fireEvent.keyDown(mobileUnitSelect, { key: "Escape" });
    await vi.waitFor(() => {
      expect(sheet).toHaveAttribute("role", "region");
      expect(sheet).not.toHaveAttribute("aria-modal");
    });
  });

  it("keeps peeked mobile settings inert until the sheet is opened", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: new Blob(["processed"], { type: "image/png" }),
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: 9 },
    });
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:original"
      );
    });

    const sheet = view.container.querySelector('[aria-label="Image controls"]') as HTMLDivElement;
    const settings = sheet.querySelector(".overflow-y-auto") as HTMLDivElement;
    expect(sheet).toHaveAttribute("aria-hidden", "false");
    expect(sheet.inert).toBe(false);
    expect(settings).toHaveAttribute("aria-hidden", "true");
    expect(settings.inert).toBe(true);
    expect(view.container.querySelector("#unit-select")).toHaveAccessibleName("Unit: px");
    expect(view.container.querySelector("#mobile-unit-select")).toHaveAccessibleName("Unit: px");

    const openButton = sheet.querySelector(
      'button[aria-label="Open controls"]'
    ) as HTMLButtonElement;
    triggerDelegatedClick(openButton);

    expect(sheet).toHaveAttribute("role", "dialog");
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(view.container.querySelector("[data-app-shell]")).toHaveAttribute("inert", "");
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(sheet);
    });
    expect(document.activeElement).not.toBe(view.container.querySelector("#mobile-width-input"));

    fireEvent.keyDown(sheet, { key: "Tab", shiftKey: true });
    const sheetFocusable = Array.from(
      sheet.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), a[href], [role="button"][tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (element) => !element.closest("[inert]") && element.getAttribute("aria-hidden") !== "true"
    );
    expect(document.activeElement).toBe(sheetFocusable[sheetFocusable.length - 1]);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    await vi.waitFor(() => {
      expect(sheet).toHaveAttribute("role", "region");
      expect(sheet).not.toHaveAttribute("aria-modal");
      expect(openButton).toHaveAttribute("aria-expanded", "false");
      expect(view.container.querySelector("[data-app-shell]")).not.toHaveAttribute("inert");
      expect(document.activeElement).toBe(openButton);
    });

    triggerDelegatedClick(openButton);

    expect(settings).toHaveAttribute("aria-hidden", "false");
    expect(settings.inert).toBe(false);

    triggerDelegatedClick(view.container.querySelector("#mobile-unit-select") as HTMLButtonElement);
    const inchOption = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="option"]')
    ).find((option) => option.textContent?.trim() === "in");
    expect(inchOption).toBeDefined();
    triggerDelegatedMouseDown(inchOption as HTMLElement);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#dpi-select")).toHaveAccessibleName(
        "Resolution: 96 DPI"
      );
      expect(view.container.querySelector("#mobile-dpi-select")).toHaveAccessibleName(
        "Resolution: 96 DPI"
      );
    });
  });

  it("shows an invalid first upload error in the empty state", async () => {
    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector(
      'input[type="file"][aria-hidden="true"]'
    ) as HTMLInputElement;
    const openFilePicker = vi.spyOn(fileInput, "click");
    triggerDelegatedClick(
      view.container.querySelector("#sbs-empty-state button") as HTMLButtonElement
    );
    expect(openFilePicker).toHaveBeenCalledOnce();

    const invalidFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    Object.defineProperty(fileInput, "files", { configurable: true, value: [invalidFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#sbs-empty-state [role='status']")).toHaveTextContent(
        "File must be an image"
      );
    });
  });

  it("discards a processing result when a new image is uploaded mid-flight", async () => {
    const fileA = new File(["a"], "a.png", { type: "image/png" });
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    const blobA = new Blob(["processed-a"], { type: "image/png" });
    const blobB = new Blob(["processed-b"], { type: "image/png" });

    mockGetImageMetadata
      .mockResolvedValueOnce({
        width: 100,
        height: 100,
        format: "image/png",
        fileSize: fileA.size,
        fileName: fileA.name,
      })
      .mockResolvedValueOnce({
        width: 200,
        height: 200,
        format: "image/png",
        fileSize: fileB.size,
        fileName: fileB.name,
      });

    let resolveA!: (result: ProcessResult) => void;
    mockProcessImage
      .mockImplementationOnce(
        () =>
          new Promise<ProcessResult>((resolve) => {
            resolveA = resolve;
          })
      )
      .mockResolvedValueOnce({
        blob: blobB,
        requestedFormat: "image/png",
        metadata: { width: 200, height: 200, format: "image/png", fileSize: blobB.size },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:a-original")
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;

    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileA] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    // Upload B while A's processing run is still in flight
    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileB] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-original"
      );
    });

    // Let B's debounce expire while A is still running. The completion of A
    // must still hand the queued work back to B instead of leaving the app
    // stuck in its processing state.
    await new Promise((resolve) => setTimeout(resolve, 500));

    // A's stale completion must not stamp its result onto B's session
    resolveA({
      blob: blobA,
      requestedFormat: "image/png",
      metadata: { width: 100, height: 100, format: "image/png", fileSize: blobA.size },
    });

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(mockProcessImage.mock.calls[1]?.[0]).toBe(fileB);
    });

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });

    // The stale blob never received an object URL: a-original, b-original, b-processed
    expect(URL.createObjectURL).toHaveBeenCalledTimes(3);
  });

  it("ignores progress callbacks from a run that belongs to an older upload", async () => {
    const fileA = new File(["a"], "a.png", { type: "image/png" });
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });

    mockGetImageMetadata.mockImplementation((file) =>
      Promise.resolve({
        width: file === fileA ? 100 : 200,
        height: file === fileA ? 100 : 200,
        format: "image/png",
        fileSize: file.size,
        fileName: file.name,
      })
    );

    let resolveBackgroundRemoval!: (result: ProcessResult) => void;
    let reportBackgroundRemovalProgress!: (progress: number) => void;
    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstBlob,
        requestedFormat: "image/png",
        metadata: { width: 100, height: 100, format: "image/png", fileSize: firstBlob.size },
      })
      .mockImplementationOnce((_file, _options, onProgress) => {
        reportBackgroundRemovalProgress = onProgress as (progress: number) => void;
        return new Promise<ProcessResult>((resolve) => {
          resolveBackgroundRemoval = resolve;
        });
      })
      .mockResolvedValueOnce({
        blob: secondBlob,
        requestedFormat: "image/png",
        metadata: { width: 200, height: 200, format: "image/png", fileSize: secondBlob.size },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:a-original")
      .mockReturnValueOnce("blob:a-processed")
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileA] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:a-processed"
      );
    });

    const backgroundCheckbox = view.container.querySelector(
      "#remove-background-checkbox"
    ) as HTMLInputElement;
    fireEvent.click(backgroundCheckbox);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(reportBackgroundRemovalProgress).toBeDefined();
    });

    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileB] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-original"
      );
    });

    reportBackgroundRemovalProgress(0.6);
    expect(view.container).not.toHaveTextContent("Removing background 60%\u2026");

    // The new session should start without waiting for the old background
    // removal promise to settle.
    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(3);
      expect(mockProcessImage.mock.calls[2]?.[0]).toBe(fileB);
    });

    // Completing the stale run must not overwrite the newer session.
    resolveBackgroundRemoval({
      blob: new Blob(["stale"], { type: "image/png" }),
      requestedFormat: "image/png",
      metadata: { width: 100, height: 100, format: "image/png", fileSize: 5 },
    });

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });
  });

  it("keeps an active processing run alive after an invalid upload attempt", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });

    let resolveProcessing!: (result: ProcessResult) => void;
    mockProcessImage.mockImplementationOnce(
      () =>
        new Promise<ProcessResult>((resolve) => {
          resolveProcessing = resolve;
        })
    );
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    const invalidFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    Object.defineProperty(fileInput, "files", { configurable: true, value: [invalidFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container).toHaveTextContent("File must be an image");
    });

    resolveProcessing({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: processedBlob.size },
    });

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:processed"
      );
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
  });

  it("does not let a stale upload failure overwrite a newer upload", async () => {
    const fileA = new File(["a"], "a.png", { type: "image/png" });
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    const blobB = new Blob(["processed-b"], { type: "image/png" });

    let rejectPreparationA!: (error: Error) => void;
    mockPrepareImageFile.mockImplementation((file) => {
      if (file === fileA) {
        return new Promise((_, reject) => {
          rejectPreparationA = reject;
        });
      }
      return Promise.resolve({ file, format: file.type });
    });
    mockGetImageMetadata.mockImplementation((file) =>
      Promise.resolve({
        width: 200,
        height: 200,
        format: "image/png",
        fileSize: file.size,
        fileName: file.name,
      })
    );
    mockProcessImage.mockResolvedValue({
      blob: blobB,
      requestedFormat: "image/png",
      metadata: { width: 200, height: 200, format: "image/png", fileSize: blobB.size },
    });
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileA] });
    fireEvent.change(fileInput);
    await vi.waitFor(() => {
      expect(mockPrepareImageFile).toHaveBeenCalledWith(fileA);
    });

    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileB] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });

    rejectPreparationA(new Error("stale upload failed"));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(view.container.querySelector("#error-text")).toBeNull();
    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:b-processed"
    );
  });

  it("does not continue upload work after unmounting during preparation", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    let resolvePreparation!: (result: { file: File; format: string }) => void;
    mockPrepareImageFile.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePreparation = resolve;
        })
    );

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockPrepareImageFile).toHaveBeenCalledWith(sourceFile);
    });

    view.unmount();
    dispose = undefined;
    resolvePreparation({ file: sourceFile, format: sourceFile.type });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockGetImageMetadata).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("does not let slower metadata from an older upload replace a newer file", async () => {
    const fileA = new File(["a"], "a.png", { type: "image/png" });
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    const blobB = new Blob(["processed-b"], { type: "image/png" });

    let resolveMetadataA!: (metadata: {
      width: number;
      height: number;
      format: string;
      fileSize: number;
      fileName: string;
    }) => void;
    mockGetImageMetadata.mockImplementation((file) => {
      if (file === fileA) {
        return new Promise((resolve) => {
          resolveMetadataA = resolve;
        });
      }

      return Promise.resolve({
        width: 200,
        height: 200,
        format: "image/png",
        fileSize: fileB.size,
        fileName: fileB.name,
      });
    });
    mockProcessImage.mockResolvedValue({
      blob: blobB,
      requestedFormat: "image/png",
      metadata: { width: 200, height: 200, format: "image/png", fileSize: blobB.size },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileA] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(fileA);
    });

    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileB] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });

    resolveMetadataA({
      width: 100,
      height: 100,
      format: "image/png",
      fileSize: fileA.size,
      fileName: fileA.name,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:b-processed"
    );
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    expect(mockProcessImage.mock.calls[0]?.[0]).toBe(fileB);
  });

  it("re-processes inputs that changed while a run was in flight", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });

    let resolveFirst!: (result: ProcessResult) => void;
    mockProcessImage
      .mockImplementationOnce(
        () =>
          new Promise<ProcessResult>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValueOnce({
        blob: secondBlob,
        requestedFormat: "image/png",
        metadata: { width: 400, height: 300, format: "image/png", fileSize: secondBlob.size },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    // Change the width while the first run is still in flight, then give the
    // debounced auto-process time to hit the in-flight guard
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });
    await new Promise((resolve) => setTimeout(resolve, 500));

    resolveFirst({
      blob: firstBlob,
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: firstBlob.size },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(view.container.querySelector("#preview-image")).toHaveAttribute("src", "blob:original");
    expect(view.container.querySelector("#download-button")).toBeDisabled();

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      // 1200×800 with linked aspect ratio: width 400 → height 267
      expect(mockProcessImage.mock.calls[1]?.[1]).toMatchObject({
        resize: { width: 400, height: 267, maintainAspectRatio: true },
      });
    });

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
    });
  });

  it("names downloads after the actual encoded format, not the requested one", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });

    // Simulate a browser that cannot encode AVIF: AVIF requested, PNG produced
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/avif",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: processedBlob.size },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    // Request AVIF through the custom Select (trigger + portal listbox)
    const formatTrigger = view.container.querySelector("#format-select") as HTMLButtonElement;
    triggerDelegatedClick(formatTrigger);

    const avifOption = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="option"]')
    ).find((el) => el.textContent?.includes("AVIF"));
    expect(avifOption).toBeDefined();
    triggerDelegatedMouseDown(avifOption as HTMLElement);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
      expect(view.container.querySelector("#format-fallback-warning")).toHaveTextContent(
        "could not export AVIF"
      );
    });

    const downloadBtn = view.container.querySelector("#download-button") as HTMLButtonElement;
    triggerDelegatedClick(downloadBtn);

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
  });

  it("preloads background removal in idle time and only once", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: false, effectiveType: "4g" },
    });
    const idleCallbacks: Array<() => void> = [];
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: (callback: () => void) => {
        idleCallbacks.push(callback);
        return idleCallbacks.length;
      },
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      value: vi.fn(),
    });

    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: processedBlob.size },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { configurable: true, value: [sourceFile] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:processed"
      );
    });

    // The large model stays idle until the browser reaches an idle period.
    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();
    expect(idleCallbacks).toHaveLength(1);
    idleCallbacks[0]?.();

    await vi.waitFor(() => {
      expect(mockPreloadBackgroundRemoval).toHaveBeenCalledTimes(1);
    });

    const bgCheckbox = view.container.querySelector(
      "#remove-background-checkbox"
    ) as HTMLInputElement;
    fireEvent.click(bgCheckbox);

    // Toggling off and on again must reuse the idle preload.
    fireEvent.click(bgCheckbox);
    fireEvent.click(bgCheckbox);
    expect(mockPreloadBackgroundRemoval).toHaveBeenCalledTimes(1);
  });

  it("skips automatic model downloads when connection status is unavailable", () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: undefined,
    });
    const idleCallback = vi.fn();
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: idleCallback,
    });

    const view = render(() => ImageApp());
    dispose = view.unmount;

    expect(idleCallback).not.toHaveBeenCalled();
    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();
  });
});
