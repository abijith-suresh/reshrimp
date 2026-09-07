import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcessResult } from "@/types/processing";
import { restoreMocks, setupBrowserMocks } from "../../test/mocks";

vi.mock("@/services/imageService", () => ({
  getImageMetadata: vi.fn(),
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
import { getImageMetadata, processImage } from "@/services/imageService";
import { createDownloadLink } from "@/utils/imageUtils";
import ImageApp from "./ImageApp";

const mockGetImageMetadata = vi.mocked(getImageMetadata);
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

describe("ImageApp", () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    setupBrowserMocks();
    mockGetImageMetadata.mockReset();
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

    // Download should work
    const downloadBtn = view.container.querySelector("#download-button") as HTMLButtonElement;
    triggerDelegatedClick(downloadBtn);

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
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

  it("revokes the previous processed URL before replacing it on reprocess", async () => {
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
        metadata: {
          width: 1200,
          height: 800,
          format: "image/png",
          fileSize: firstBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondBlob,
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
        metadata: {
          width: 1200,
          height: 800,
          format: "image/png",
          fileSize: firstProcessedBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondProcessedBlob,
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

    // A's stale completion must not stamp its result onto B's session
    resolveA({
      blob: blobA,
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
        metadata: { width: 400, height: 300, format: "image/png", fileSize: secondBlob.size },
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
    });

    // Change the width while the first run is still in flight, then give the
    // debounced auto-process time to hit the in-flight guard
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });
    await new Promise((resolve) => setTimeout(resolve, 500));

    resolveFirst({
      blob: firstBlob,
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: firstBlob.size },
    });

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
    });

    const downloadBtn = view.container.querySelector("#download-button") as HTMLButtonElement;
    triggerDelegatedClick(downloadBtn);

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
  });

  it("preloads the background-removal model on first toggle instead of on mount", async () => {
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

    // Uploading and processing must not download the ~100 MB model
    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();

    const bgCheckbox = view.container.querySelector(
      "#remove-background-checkbox"
    ) as HTMLInputElement;
    fireEvent.click(bgCheckbox);

    await vi.waitFor(() => {
      expect(mockPreloadBackgroundRemoval).toHaveBeenCalledTimes(1);
    });

    // Toggling off and on again must not re-request the preload
    fireEvent.click(bgCheckbox);
    fireEvent.click(bgCheckbox);
    expect(mockPreloadBackgroundRemoval).toHaveBeenCalledTimes(1);
  });
});
