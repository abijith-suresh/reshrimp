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

describe("ImageApp", () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    setupBrowserMocks();
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

    // Wait for upload to complete and confirm the source dimensions seed the fields.
    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(sourceFile);
      expect((view.container.querySelector("#width-input") as HTMLInputElement).value).toBe("1200");
      expect((view.container.querySelector("#height-input") as HTMLInputElement).value).toBe("800");
    });

    expect(view.container.querySelector("#width-input")).toHaveAttribute("min", "1");
    expect(view.container.querySelector("#width-input")).toHaveAttribute("step", "1");
    expect(view.container.querySelector("#height-input")).toHaveAttribute("min", "1");
    expect(view.container.querySelector("#height-input")).toHaveAttribute("step", "1");

    // Info strip should show filename and original metadata
    expect(view.container.querySelector("[data-testid='info-strip']")).toHaveTextContent(
      "photo.png"
    );
    expect(view.container.querySelector("[data-testid='info-strip']")).toHaveTextContent(
      "1200 × 800px"
    );

    // Uploads still process once automatically.
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
      expect(view.container).toHaveTextContent("Image ready. Ready to download.");
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
    // currentImage object, which must not re-trigger processing.
    await new Promise((resolve) => setTimeout(resolve, 500));
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
    // control unsupported), so drive the pending change with a real dimension
    // input. 1200×800 with linked aspect ratio: width 400 → height 267.
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });

    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:first-processed"
    );
    expect(view.container.querySelector("#download-button")).toBeDisabled();
    expect(view.container).toHaveTextContent("Apply changes before downloading");

    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

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
      expect(view.container).toHaveTextContent("PNG stays lossless");
    });

    // Quality is ignored for PNG. Changing it while temporarily selecting a
    // quality-controlled format must not leave an otherwise unchanged PNG
    // result marked as pending.
    const formatTrigger = view.container.querySelector("#format-select") as HTMLButtonElement;
    triggerDelegatedClick(formatTrigger);
    const avifOption = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="option"]')
    ).find((option) => option.textContent?.includes("AVIF"));
    expect(avifOption).toBeDefined();
    triggerDelegatedMouseDown(avifOption as HTMLElement);

    const qualitySlider = view.container.querySelector("#quality-slider") as HTMLInputElement;
    fireEvent.input(qualitySlider, { target: { value: "70" } });

    triggerDelegatedClick(formatTrigger);
    const pngOption = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="option"]')
    ).find((option) => option.textContent?.includes("PNG"));
    expect(pngOption).toBeDefined();
    triggerDelegatedMouseDown(pngOption as HTMLElement);

    expect(view.container.querySelector("#apply-changes-button")).toBeDisabled();
    expect(view.container.querySelector("#download-button")).toBeEnabled();
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
  });

  it("shows a user-facing error and allows an initial processing retry", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const retryBlob = new Blob(["retry"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockRejectedValueOnce(new Error("Processing exploded")).mockResolvedValueOnce({
      blob: retryBlob,
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: retryBlob.size },
    });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:retry-processed");

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
      expect(view.container.querySelector("#apply-changes-button")).toBeEnabled();
      expect(view.container).toHaveTextContent("Processing failed. Retry processing.");
      expect(view.container.querySelector("[data-testid='info-strip']")).not.toHaveTextContent(
        "Last applied"
      );
    });

    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:retry-processed"
      );
      expect(view.container.querySelector("#download-button")).toBeEnabled();
      expect(view.container.querySelector("#error-message")).toBeNull();
      expect(view.container).not.toHaveTextContent("Processing failed. Retry processing.");
      expect(view.container).toHaveTextContent("Changes applied. Ready to download.");
    });
  });

  it("blocks Apply before processing invalid dimensions and associates the error with the fields", async () => {
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
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    fireEvent.input(view.container.querySelector("#width-input") as HTMLInputElement, {
      target: { value: "0" },
    });
    expect(view.container.querySelector("#apply-changes-button")).toBeEnabled();

    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
      expect(view.container.querySelector("#error-text")).toBeNull();
      expect(view.container.querySelector("#dimension-error")).toHaveTextContent(
        "Width must be at least 1px"
      );
      expect(view.container).toHaveTextContent("Fix the highlighted dimensions before applying.");
      expect(view.container.querySelector("#width-input")).toHaveAttribute("aria-invalid", "true");
      expect(view.container.querySelector("#height-input")).not.toHaveAttribute(
        "aria-invalid",
        "true"
      );
      expect(document.activeElement).toBe(view.container.querySelector("#width-input"));
      expect(view.container.querySelector("#download-button")).toBeDisabled();
    });
  });

  it("clears the previous output and allows retry after a reprocess fails", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const retryBlob = new Blob(["retry"], { type: "image/png" });

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
      .mockRejectedValueOnce(new Error("Second run failed"))
      .mockResolvedValueOnce({
        blob: retryBlob,
        requestedFormat: "image/png",
        metadata: { width: 400, height: 267, format: "image/png", fileSize: retryBlob.size },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:retry-processed");

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

    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:first-processed"
    );
    expect(view.container.querySelector("#download-button")).toBeDisabled();
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(mockProcessImage).toHaveBeenCalledTimes(1);

    fireEvent.input(widthInput, { target: { value: "1200" } });
    expect(view.container.querySelector("#apply-changes-button")).toBeDisabled();
    expect(view.container.querySelector("#download-button")).toBeEnabled();
    expect(mockProcessImage).toHaveBeenCalledTimes(1);

    fireEvent.input(widthInput, { target: { value: "400" } });

    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#error-text")).toHaveTextContent("Second run failed");
      expect(view.container.querySelector("#download-button")).toBeDisabled();
      expect(view.container.querySelector("#apply-changes-button")).toBeEnabled();
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:original"
      );
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-processed");

    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(3);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:retry-processed"
      );
      expect(view.container.querySelector("#download-button")).toBeEnabled();
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

  it("keeps peeked mobile settings inert until the sheet is opened", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });
    const thirdBlob = new Blob(["third"], { type: "image/png" });

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
      .mockResolvedValueOnce({
        blob: secondBlob,
        requestedFormat: "image/png",
        metadata: { width: 600, height: 400, format: "image/png", fileSize: secondBlob.size },
      })
      .mockResolvedValueOnce({
        blob: thirdBlob,
        requestedFormat: "image/png",
        metadata: { width: 480, height: 320, format: "image/png", fileSize: thirdBlob.size },
      });
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-processed")
      .mockReturnValueOnce("blob:third-processed");

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

    const sheet = view.container.querySelector('[aria-label="Image controls"]') as HTMLDivElement;
    const settings = sheet.querySelector(".overflow-y-auto") as HTMLDivElement;
    expect(sheet).toHaveAttribute("aria-hidden", "false");
    expect(sheet.inert).toBe(false);
    expect(settings).toHaveAttribute("aria-hidden", "true");
    expect(settings.inert).toBe(true);
    expect(view.container.querySelector("#unit-select")).toHaveAccessibleName("Unit: pixels");
    expect(view.container.querySelector("#mobile-unit-select")).toHaveAccessibleName(
      "Unit: pixels"
    );

    const openButton = sheet.querySelector(
      'button[aria-label="Open controls"]'
    ) as HTMLButtonElement;
    triggerDelegatedClick(openButton);

    expect(settings).toHaveAttribute("aria-hidden", "false");
    expect(settings.inert).toBe(false);

    triggerDelegatedClick(view.container.querySelector("#mobile-unit-select") as HTMLButtonElement);
    const activeUnitOptions = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="option"]')
    );
    const pixelsOption = activeUnitOptions.find(
      (option) => option.textContent?.trim() === "Pixels"
    );
    expect(pixelsOption).toBeDefined();
    triggerDelegatedMouseDown(pixelsOption as HTMLElement);
    expect(view.container.querySelector("#mobile-apply-changes-button")).toBeDisabled();
    expect(view.container.querySelector("#mobile-download-button")).toBeEnabled();
    expect(mockProcessImage).toHaveBeenCalledTimes(1);

    fireEvent.input(view.container.querySelector("#mobile-width-input") as HTMLInputElement, {
      target: { value: "600" },
    });
    expect(view.container.querySelector("#mobile-download-button")).toBeEnabled();
    expect(view.container.querySelector("#mobile-download-button")).toHaveTextContent(
      "Apply changes"
    );
    expect(view.container.querySelector("#download-button")).toBeDisabled();

    triggerDelegatedClick(
      view.container.querySelector("#mobile-download-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(mockProcessImage.mock.calls[1]?.[1]).toMatchObject({
        resize: { width: 600, height: 400, maintainAspectRatio: true },
      });
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
    });

    triggerDelegatedClick(view.container.querySelector("#mobile-unit-select") as HTMLButtonElement);
    const options = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options.map((option) => option.textContent?.trim())).toEqual(["Pixels", "Percent"]);
    expect(view.container.querySelector("#dpi-select")).toBeNull();
    expect(view.container.querySelector("#mobile-dpi-select")).toBeNull();
    const percentOption = options.find((option) => option.textContent?.trim() === "Percent");
    expect(percentOption).toBeDefined();
    triggerDelegatedMouseDown(percentOption as HTMLElement);
    expect(view.container.querySelector("#width-input")).toHaveAttribute("step", "any");
    expect(view.container.querySelector("#width-input")).toHaveAttribute("min", "0.001");
    expect(view.container.querySelector("#height-input")).toHaveAttribute("step", "any");
    expect(view.container.querySelector("#height-input")).toHaveAttribute("min", "0.001");
    expect(view.container.querySelector("#unit-select")).toHaveAccessibleName("Unit: percent");
    expect(view.container.querySelector("#mobile-apply-changes-button")).toBeDisabled();
    expect(view.container.querySelector("#mobile-download-button")).toBeEnabled();

    fireEvent.input(view.container.querySelector("#mobile-width-input") as HTMLInputElement, {
      target: { value: "40" },
    });
    expect(view.container.querySelector("#mobile-download-button")).toBeEnabled();

    triggerDelegatedClick(
      view.container.querySelector("#mobile-download-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(3);
      expect(mockProcessImage.mock.calls[2]?.[1]).toMatchObject({
        resize: { width: 480, height: 320, maintainAspectRatio: true },
      });
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:third-processed"
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

    let rejectA!: (error: Error) => void;
    let resolveB!: (result: ProcessResult) => void;
    mockProcessImage
      .mockImplementationOnce(
        () =>
          new Promise<ProcessResult>((_resolve, reject) => {
            rejectA = reject;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<ProcessResult>((resolve) => {
            resolveB = resolve;
          })
      );

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

    // B starts its own automatic first pass immediately. Keep it pending so
    // A's stale completion must not clear B's processing state.
    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-original"
      );
    });

    // A's stale failure must not overwrite B's session with an error.
    rejectA(new Error("stale processing failure"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:b-original"
    );
    expect(view.container.querySelector("#download-button")).toBeDisabled();
    expect(view.container.querySelector("#width-input")).toBeDisabled();
    expect(view.container.querySelector("#error-message")).toBeNull();

    resolveB({
      blob: blobB,
      requestedFormat: "image/png",
      metadata: { width: 200, height: 200, format: "image/png", fileSize: blobB.size },
    });

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
      expect(view.container.querySelector("#download-button")).toBeEnabled();
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

    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(reportBackgroundRemovalProgress).toBeDefined();
      expect(mockProcessImage.mock.calls[1]?.[1]).toMatchObject({
        format: "image/png",
        removeBackground: true,
      });
    });

    Object.defineProperty(fileInput, "files", { configurable: true, value: [fileB] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:b-processed"
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

    expect(URL.createObjectURL).toHaveBeenCalledTimes(4);
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

  it("waits for Apply before processing settled input edits", async () => {
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

    // Controls stay read-only while the first run is in flight. The draft
    // cannot invalidate the active run or strand the session.
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    expect(widthInput).toBeDisabled();
    expect(view.container.querySelector("#height-input")).toBeDisabled();
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector("#apply-changes-button")).toBeDisabled();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(mockProcessImage).toHaveBeenCalledTimes(1);

    resolveFirst({
      blob: firstBlob,
      requestedFormat: "image/png",
      metadata: { width: 1200, height: 800, format: "image/png", fileSize: firstBlob.size },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(view.container.querySelector("#preview-image")).toHaveAttribute(
      "src",
      "blob:first-processed"
    );
    expect(widthInput).toBeEnabled();
    expect(view.container.querySelector("#download-button")).toBeEnabled();

    fireEvent.input(widthInput, { target: { value: "400" } });
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    expect(view.container).toHaveTextContent("Apply changes before downloading");
    expect(view.container.querySelector("#apply-changes-button")).toBeEnabled();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(mockProcessImage).toHaveBeenCalledTimes(1);

    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

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
      expect(view.container).toHaveTextContent("Changes applied. Ready to download.");
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

    const qualitySlider = view.container.querySelector("#quality-slider") as HTMLInputElement;
    expect(qualitySlider).not.toBeDisabled();
    fireEvent.input(qualitySlider, { target: { value: "70" } });

    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector("#download-button")).toBeDisabled();
    triggerDelegatedClick(
      view.container.querySelector("#apply-changes-button") as HTMLButtonElement
    );

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(mockProcessImage.mock.calls[1]?.[1]).toMatchObject({
        format: "image/avif",
        quality: 0.7,
      });
      expect(view.container.querySelector("#preview-image")).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
      expect(view.container.querySelector("#format-fallback-warning")).toHaveTextContent(
        "could not export AVIF"
      );
      expect(qualitySlider).toBeDisabled();
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
