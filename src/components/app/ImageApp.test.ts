import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@solidjs/testing-library";
import { setupBrowserMocks, restoreMocks } from "../../test/mocks";

vi.mock("@/services/imageService", () => ({
  getImageMetadata: vi.fn(),
  processImage: vi.fn(),
}));

vi.mock("@/services/imageSessionService", async () => {
  const actual = await vi.importActual<typeof import("@/services/imageSessionService")>(
    "@/services/imageSessionService"
  );

  return {
    ...actual,
    downloadProcessedBlob: vi.fn(),
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

import ImageApp from "./ImageApp";
import { getImageMetadata, processImage } from "@/services/imageService";
import { downloadProcessedBlob } from "@/services/imageSessionService";

const mockGetImageMetadata = vi.mocked(getImageMetadata);
const mockProcessImage = vi.mocked(processImage);
const mockDownloadProcessedBlob = vi.mocked(downloadProcessedBlob);

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
    mockDownloadProcessedBlob.mockReset();
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
    expect(view.container.querySelector(".info-strip")).toHaveTextContent("photo.png");
    expect(view.container.querySelector(".info-strip")).toHaveTextContent("1200 × 800px");

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

    expect(mockDownloadProcessedBlob).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
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

  it("toggles the mobile controls drawer without any extra app modes", () => {
    const view = render(() => ImageApp());
    dispose = view.unmount;

    expect(view.container).not.toHaveTextContent("Adjust");
    expect(view.container).not.toHaveTextContent("Batch");

    const drawer = view.container.querySelector("#app-controls-drawer") as HTMLDivElement;
    const toggleButton = view.getByRole("button", { name: "Show controls" }) as HTMLButtonElement;

    expect(drawer).toHaveAttribute("aria-hidden", "true");
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    triggerDelegatedClick(toggleButton);

    expect(drawer).toHaveAttribute("aria-hidden", "false");
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });
});
