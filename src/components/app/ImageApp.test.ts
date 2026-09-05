import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

import { getImageMetadata, processImage } from "@/services/imageService";
import { createDownloadLink } from "@/utils/imageUtils";
import ImageApp from "./ImageApp";

const mockGetImageMetadata = vi.mocked(getImageMetadata);
const mockProcessImage = vi.mocked(processImage);
const mockCreateDownloadLink = vi.mocked(createDownloadLink);

// Solid stores delegated click handlers on the element in jsdom tests.
function triggerDelegatedClick(element: HTMLButtonElement): void {
  const delegatedElement = element as HTMLButtonElement & {
    $$click?: (event: MouseEvent) => void;
  };

  delegatedElement.$$click?.(new MouseEvent("click", { bubbles: true }));
}

describe("ImageApp", () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    setupBrowserMocks();
    mockGetImageMetadata.mockReset();
    mockProcessImage.mockReset();
    mockCreateDownloadLink.mockReset();
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
      format: sourceFile.type,
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      metadata: {
        width: 1200,
        height: 800,
        format: sourceFile.type,
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

  it("revokes the previous processed URL before replacing it on reprocess", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: sourceFile.type,
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstBlob,
        metadata: {
          width: 1200,
          height: 800,
          format: sourceFile.type,
          fileSize: firstBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondBlob,
        metadata: {
          width: 600,
          height: 400,
          format: sourceFile.type,
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

    const qualitySlider = view.container.querySelector("#quality-slider") as HTMLInputElement;
    fireEvent.input(qualitySlider, { target: { value: "80" } });

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
        format: firstFile.type,
        fileSize: firstFile.size,
        fileName: firstFile.name,
      })
      .mockResolvedValueOnce({
        width: 800,
        height: 600,
        format: secondFile.type,
        fileSize: secondFile.size,
        fileName: secondFile.name,
      });

    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstProcessedBlob,
        metadata: {
          width: 1200,
          height: 800,
          format: firstFile.type,
          fileSize: firstProcessedBlob.size,
        },
      })
      .mockResolvedValueOnce({
        blob: secondProcessedBlob,
        metadata: {
          width: 800,
          height: 600,
          format: secondFile.type,
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
      format: sourceFile.type,
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      metadata: {
        width: 1200,
        height: 800,
        format: sourceFile.type,
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
      format: sourceFile.type,
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    });
    mockProcessImage.mockResolvedValue({
      blob: processedBlob,
      metadata: {
        width: 1200,
        height: 800,
        format: sourceFile.type,
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
      format: sourceFile.type,
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
});
