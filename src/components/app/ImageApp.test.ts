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

  it("covers upload, process, and download readiness in the app flow", async () => {
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
      expect(mockGetImageMetadata).toHaveBeenCalledWith(sourceFile);
      expect(view.container.querySelector("#file-info")).toHaveTextContent("Selected: photo.png");
      expect(view.container.querySelector("#original-preview")).toHaveAttribute(
        "src",
        "blob:original"
      );
      expect(view.container.querySelector("#process-button")).toBeEnabled();
    });

    triggerDelegatedClick(view.container.querySelector("#process-button") as HTMLButtonElement);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalled();
      expect(view.container.querySelector("#processed-preview")).toHaveAttribute(
        "src",
        "blob:processed"
      );
      expect(view.container.querySelector("#processed-tab")).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    expect(mockProcessImage.mock.calls[0]?.[0]).toBe(sourceFile);
    expect(mockProcessImage.mock.calls[0]?.[1]).toEqual(expect.any(Object));

    triggerDelegatedClick(view.container.querySelector("#download-button") as HTMLButtonElement);

    expect(mockDownloadProcessedBlob).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
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

    await vi.waitFor(() => {
      expect(view.container.querySelector("#process-button")).toBeEnabled();
    });

    triggerDelegatedClick(view.container.querySelector("#process-button") as HTMLButtonElement);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#error-text")).toHaveTextContent("Processing exploded");
      expect(view.container.querySelector("#download-button")).toBeDisabled();
    });
  });
});
