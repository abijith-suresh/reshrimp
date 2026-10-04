import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageFormat, ImageMetadata } from "@/types/image";
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

function imageMetadata(
  file: File,
  width: number,
  height: number,
  format = file.type
): ImageMetadata {
  return { width, height, format, fileSize: file.size, fileName: file.name };
}

function processResult(blob: Blob, width: number, height: number): ProcessResult {
  const format = blob.type as ImageFormat;
  return {
    blob,
    requestedFormat: format,
    metadata: { width, height, format, fileSize: blob.size },
  };
}

function upload(fileInput: HTMLInputElement, file: File): void {
  fireEvent.change(fileInput, { target: { files: [file] } });
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
  let scrollIntoViewDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
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
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView"
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    vi.useRealTimers();
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
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoViewDescriptor);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
    if (connectionDescriptor) {
      Object.defineProperty(navigator, "connection", connectionDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "connection");
    }
  });

  it("auto-processes after upload and allows download", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage.mockResolvedValue(processResult(processedBlob, 1200, 800));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(sourceFile);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:original");
      expect((view.container.querySelector("#width-input") as HTMLInputElement).value).toBe("1200");
      expect((view.container.querySelector("#height-input") as HTMLInputElement).value).toBe("800");
    });

    expect(
      within(view.container.querySelector("[data-app-shell]") as HTMLElement).getByTestId(
        "info-strip"
      )
    ).toHaveTextContent("photo.png");
    expect(
      within(view.container.querySelector("[data-app-shell]") as HTMLElement).getByTestId(
        "info-strip"
      )
    ).toHaveTextContent("1200 × 800px");

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalled();
    });

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:processed");
      expect(screen.getAllByRole("img", { name: "Preview" })).toHaveLength(1);
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    const renderedIds = Array.from(
      view.container.querySelectorAll<HTMLElement>("[id]"),
      (element) => element.id
    );
    expect(new Set(renderedIds).size).toBe(renderedIds.length);

    const downloadBtn = view.container.querySelector("#download-button") as HTMLButtonElement;
    fireEvent.click(downloadBtn);

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
  });

  it("preserves the width caret while aspect-ratio lock updates height", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 500, 400));
    mockProcessImage.mockResolvedValue(processResult(processedBlob, 500, 400));
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

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

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage.mockResolvedValue(processResult(processedBlob, 1200, 800));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:processed");
    });

    // Advance past another debounce window to catch a completion-triggered loop.
    await vi.advanceTimersByTimeAsync(900);
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
  });

  it("uses the decoded HEIC preview while preserving source metadata", async () => {
    const sourceFile = new File(["original heic"], "photo.heic", { type: "image/heic" });
    const decodedFile = new File(["decoded png with more bytes"], "photo.png", {
      type: "image/png",
    });

    mockPrepareImageFile.mockResolvedValueOnce({ file: decodedFile, format: "image/heic" });
    mockGetImageMetadata.mockResolvedValueOnce(imageMetadata(decodedFile, 1200, 800, "image/heic"));
    mockProcessImage.mockImplementationOnce(() => new Promise<ProcessResult>(() => {}));
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:decoded-preview");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(decodedFile, "image/heic");
      expect(URL.createObjectURL).toHaveBeenCalledWith(decodedFile);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:decoded-preview"
      );
    });

    const info = within(
      view.container.querySelector("[data-app-shell]") as HTMLElement
    ).getByTestId("info-strip");
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

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage
      .mockResolvedValueOnce(processResult(firstBlob, 1200, 800))
      .mockResolvedValueOnce(processResult(secondBlob, 600, 400));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
      expect(decodeResolvers).toHaveLength(1);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:original");
    });

    decodeResolvers.shift()?.();

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "600" } });

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(decodeResolvers).toHaveLength(1);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
      expect(
        within(view.container.querySelector("[data-app-shell]") as HTMLElement).getByTestId(
          "info-strip"
        )
      ).toHaveTextContent("1200 × 800px");
    });

    decodeResolvers.shift()?.();

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
      expect(
        within(view.container.querySelector("[data-app-shell]") as HTMLElement).getByTestId(
          "info-strip"
        )
      ).toHaveTextContent("600 × 400px");
    });
  });

  it("keeps the previous processed URL until replacement is ready", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage
      .mockResolvedValueOnce(processResult(firstBlob, 1200, 800))
      .mockResolvedValueOnce(processResult(secondBlob, 600, 400));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    // PNG reprocessing is triggered by dimensions; it has no quality control.
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });

    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      "blob:first-processed"
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:first-processed");
    expect(view.container.querySelector("#download-button")).toBeDisabled();

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
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
      .mockResolvedValueOnce(imageMetadata(firstFile, 1200, 800))
      .mockResolvedValueOnce(imageMetadata(secondFile, 800, 600));

    mockProcessImage
      .mockResolvedValueOnce(processResult(firstProcessedBlob, 1200, 800))
      .mockResolvedValueOnce(processResult(secondProcessedBlob, 800, 600));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:first-original")
      .mockReturnValueOnce("blob:first-processed")
      .mockReturnValueOnce("blob:second-original")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, firstFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    upload(fileInput, secondFile);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(secondFile);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
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

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage.mockResolvedValue(processResult(processedBlob, 1200, 800));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:processed");
    });

    view.unmount();
    dispose = undefined;

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:processed");
  });

  it("disables the quality slider for png output", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage.mockResolvedValue(processResult(processedBlob, 1200, 800));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#quality-slider")).toBeDisabled();
      expect(view.container.querySelector("#compression-mode-quality")).toBeDisabled();
      expect(view.container.querySelector("#compression-mode-size")).toBeDisabled();
      expect(view.container.querySelector("#target-file-size")).toBeDisabled();
      expect(view.container.querySelector("#target-file-size")).not.toBeVisible();
    });
  });

  it("switches between quality and best-effort size modes", async () => {
    const sourceFile = new File(["source"], "photo.jpg", { type: "image/jpeg" });
    const firstBlob = new Blob(["first"], { type: "image/jpeg" });
    const targetedBlob = new Blob(["targeted"], { type: "image/jpeg" });
    const qualityBlob = new Blob(["quality"], { type: "image/jpeg" });
    const metadata = {
      width: 1200,
      height: 800,
      format: "image/jpeg" as const,
      fileSize: sourceFile.size,
      fileName: sourceFile.name,
    };

    mockGetImageMetadata.mockResolvedValue(metadata);
    mockProcessImage
      .mockResolvedValueOnce({
        blob: firstBlob,
        requestedFormat: "image/jpeg",
        metadata: { ...metadata, fileSize: firstBlob.size },
      })
      .mockResolvedValueOnce({
        blob: targetedBlob,
        requestedFormat: "image/jpeg",
        metadata: {
          ...metadata,
          fileSize: targetedBlob.size,
          targetFileSizeBytes: 500 * 1024,
          targetFileSizeStatus: "met",
        },
      })
      .mockResolvedValueOnce({
        blob: qualityBlob,
        requestedFormat: "image/jpeg",
        metadata: { ...metadata, fileSize: qualityBlob.size },
      })
      .mockResolvedValue({
        blob: targetedBlob,
        requestedFormat: "image/jpeg",
        metadata: {
          ...metadata,
          fileSize: targetedBlob.size,
          targetFileSizeBytes: 500 * 1024,
          targetFileSizeStatus: "met",
        },
      });

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:targeted")
      .mockReturnValueOnce("blob:quality");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    const sizeModeButton = view.container.querySelector(
      "#compression-mode-size"
    ) as HTMLButtonElement;
    fireEvent.click(sizeModeButton);

    const targetInput = view.container.querySelector("#target-file-size") as HTMLInputElement;
    expect(targetInput).toBeInTheDocument();
    expect(targetInput).toHaveAttribute("inputmode", "decimal");
    expect(targetInput).toBeVisible();
    expect(view.container.querySelector("#quality-slider")).toBeDisabled();
    expect(view.container.querySelector("#quality-slider")).not.toBeVisible();
    expect(sizeModeButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.input(targetInput, { target: { value: "500" } });

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(mockProcessImage.mock.calls[1]?.[1]).toMatchObject({
        targetFileSizeBytes: 500 * 1024,
      });
      expect(view.container.querySelector("#quality-slider")).not.toBeVisible();
      expect(view.container).toHaveTextContent("Output fits within 500.0 KB.");
    });

    const qualityModeButton = view.container.querySelector(
      "#compression-mode-quality"
    ) as HTMLButtonElement;
    fireEvent.click(qualityModeButton);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(3);
      expect(mockProcessImage.mock.calls[2]?.[1]).toMatchObject({ quality: 0.92 });
      expect(mockProcessImage.mock.calls[2]?.[1]).not.toHaveProperty("targetFileSizeBytes");
      expect(qualityModeButton).toHaveAttribute("aria-pressed", "true");
      expect(sizeModeButton).toHaveAttribute("aria-pressed", "false");
      expect(view.container.querySelector("#quality-slider")).toHaveValue("92");
      expect(view.container.querySelector("#quality-slider")).toBeVisible();
      expect(targetInput).toBeDisabled();
      expect(targetInput).not.toBeVisible();
      expect(view.container).toHaveTextContent("92%");
    });
  });

  it("shows a user-facing error when processing fails", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage.mockRejectedValue(new Error("Processing exploded"));

    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:original");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

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

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage
      .mockResolvedValueOnce(processResult(firstBlob, 1200, 800))
      .mockRejectedValueOnce(new Error("Second run failed"));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:first-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#download-button")).toBeEnabled();
    });

    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(view.container.querySelector("#error-text")).toHaveTextContent("Second run failed");
      expect(view.container.querySelector("#download-button")).toBeDisabled();
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });
  });

  it("does not create a processed URL after unmounting during processing", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));

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
    upload(fileInput, sourceFile);

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

    await vi.advanceTimersByTimeAsync(0);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
  });

  it("hides mobile image controls until an image is uploaded", () => {
    const view = render(() => ImageApp());
    dispose = view.unmount;

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

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
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
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#mobile-width-input")).toBeEnabled();
    });

    const desktopUnitSelect = view.container.querySelector("#unit-select") as HTMLButtonElement;
    fireEvent.click(desktopUnitSelect);

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
        view.container.querySelector('button[aria-controls="mobile-controls-content"]')
      );
    });
    expect(desktopUnitSelect).toHaveAttribute("aria-expanded", "false");
  });

  it("lets Escape close a mobile Select before collapsing its sheet", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
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
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(view.container.querySelector("#mobile-width-input")).toBeEnabled();
    });

    const sheet = view.container.querySelector('[aria-label="Image controls"]') as HTMLElement;
    const openButton = sheet.querySelector(
      'button[aria-controls="mobile-controls-content"]'
    ) as HTMLButtonElement;
    expect(view.container.querySelector("[data-app-shell]")).toHaveAttribute(
      "data-sheet-state",
      "peek"
    );
    fireEvent.click(openButton);
    await vi.waitFor(() => expect(sheet).toHaveAttribute("role", "dialog"));

    const mobileUnitSelect = view.container.querySelector(
      "#mobile-unit-select"
    ) as HTMLButtonElement;
    fireEvent.click(mobileUnitSelect);

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

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
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
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:original");
    });

    const sheet = view.container.querySelector('[aria-label="Image controls"]') as HTMLDivElement;
    const settings = sheet.querySelector("#mobile-controls-content") as HTMLDivElement;
    expect(sheet).toHaveAttribute("aria-hidden", "false");
    expect(sheet.inert).toBe(false);
    expect(settings).toHaveAttribute("aria-hidden", "true");
    expect(settings.inert).toBe(true);
    expect(view.container.querySelector("#unit-select")).toHaveAccessibleName("Unit: px");
    expect(view.container.querySelector("#mobile-unit-select")).toHaveAccessibleName("Unit: px");

    const openButton = sheet.querySelector(
      'button[aria-controls="mobile-controls-content"]'
    ) as HTMLButtonElement;
    expect(openButton).toHaveAccessibleName("Edit image");
    expect(openButton).toHaveAttribute("aria-expanded", "false");
    expect(sheet.querySelector("h2")).toBeNull();
    const peekAffordances = sheet.querySelector("#mobile-peek-affordances") as HTMLDivElement;
    expect(peekAffordances).not.toHaveClass("is-open");
    expect(peekAffordances.inert).toBe(false);
    fireEvent.click(openButton);

    expect(sheet).toHaveAttribute("role", "dialog");
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(openButton).toHaveAttribute("aria-expanded", "true");
    expect(view.container.querySelector("[data-app-shell]")).toHaveAttribute("inert", "");
    expect(openButton).toHaveAccessibleName("Done");
    expect(sheet.querySelector("h2")).toHaveTextContent("Edit image");
    expect(sheet.querySelector("#mobile-modal-download-button")).not.toBeNull();
    expect(view.container.querySelector("[data-app-shell]")).toHaveAttribute(
      "data-sheet-state",
      "open"
    );
    expect(peekAffordances).toHaveClass("is-open");
    expect(peekAffordances.inert).toBe(true);
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
      expect(openButton).toHaveAccessibleName("Edit image");
      expect(sheet.querySelector("h2")).toBeNull();
      expect(peekAffordances).not.toHaveClass("is-open");
      expect(peekAffordances.inert).toBe(false);
      expect(view.container.querySelector("[data-app-shell]")).toHaveAttribute(
        "data-sheet-state",
        "peek"
      );
      expect(view.container.querySelector("[data-app-shell]")).not.toHaveAttribute("inert");
      expect(document.activeElement).toBe(openButton);
    });

    fireEvent.click(openButton);

    expect(settings).toHaveAttribute("aria-hidden", "false");
    expect(settings.inert).toBe(false);

    fireEvent.click(view.container.querySelector("#mobile-unit-select") as HTMLButtonElement);
    fireEvent.mouseDown(screen.getByRole("option", { name: "in" }));

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
    fireEvent.click(view.container.querySelector("#sbs-empty-state button") as HTMLButtonElement);
    expect(openFilePicker).toHaveBeenCalledOnce();

    const invalidFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    upload(fileInput, invalidFile);

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
      .mockResolvedValueOnce(imageMetadata(fileA, 100, 100))
      .mockResolvedValueOnce(imageMetadata(fileB, 200, 200));

    let resolveA!: (result: ProcessResult) => void;
    mockProcessImage
      .mockImplementationOnce(
        () =>
          new Promise<ProcessResult>((resolve) => {
            resolveA = resolve;
          })
      )
      .mockResolvedValueOnce(processResult(blobB, 200, 200));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:a-original")
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;

    upload(fileInput, fileA);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    upload(fileInput, fileB);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:b-original"
      );
    });

    // Let B's debounce expire while A is still running. The completion of A
    // must still hand the queued work back to B instead of leaving the app
    // stuck in its processing state.
    await vi.advanceTimersByTimeAsync(500);

    resolveA(processResult(blobA, 100, 100));

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(mockProcessImage.mock.calls[1]?.[0]).toBe(fileB);
    });

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
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
      .mockResolvedValueOnce(processResult(firstBlob, 100, 100))
      .mockImplementationOnce((_file, _options, onProgress) => {
        reportBackgroundRemovalProgress = onProgress as (progress: number) => void;
        return new Promise<ProcessResult>((resolve) => {
          resolveBackgroundRemoval = resolve;
        });
      })
      .mockResolvedValueOnce(processResult(secondBlob, 200, 200));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:a-original")
      .mockReturnValueOnce("blob:a-processed")
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, fileA);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
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

    upload(fileInput, fileB);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
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
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });
  });

  it("keeps an active processing run alive after an invalid upload attempt", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));

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
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    const invalidFile = new File(["not an image"], "notes.txt", { type: "text/plain" });
    upload(fileInput, invalidFile);

    await vi.waitFor(() => {
      expect(view.container).toHaveTextContent("File must be an image");
    });

    resolveProcessing(processResult(processedBlob, 1200, 800));

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:processed");
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
      Promise.resolve(imageMetadata(file, 200, 200))
    );
    mockProcessImage.mockResolvedValue(processResult(blobB, 200, 200));
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, fileA);
    await vi.waitFor(() => {
      expect(mockPrepareImageFile).toHaveBeenCalledWith(fileA);
    });

    upload(fileInput, fileB);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });

    rejectPreparationA(new Error("stale upload failed"));
    await vi.advanceTimersByTimeAsync(0);

    expect(view.container.querySelector("#error-text")).toBeNull();
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:b-processed");
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
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockPrepareImageFile).toHaveBeenCalledWith(sourceFile);
    });

    view.unmount();
    dispose = undefined;
    resolvePreparation({ file: sourceFile, format: sourceFile.type });
    await vi.advanceTimersByTimeAsync(0);

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

      return Promise.resolve(imageMetadata(fileB, 200, 200));
    });
    mockProcessImage.mockResolvedValue(processResult(blobB, 200, 200));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:b-original")
      .mockReturnValueOnce("blob:b-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, fileA);

    await vi.waitFor(() => {
      expect(mockGetImageMetadata).toHaveBeenCalledWith(fileA);
    });

    upload(fileInput, fileB);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:b-processed"
      );
    });

    resolveMetadataA(imageMetadata(fileA, 100, 100));

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:b-processed");
    expect(mockProcessImage).toHaveBeenCalledTimes(1);
    expect(mockProcessImage.mock.calls[0]?.[0]).toBe(fileB);
  });

  it("re-processes inputs that changed while a run was in flight", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const firstBlob = new Blob(["first"], { type: "image/png" });
    const secondBlob = new Blob(["second"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));

    let resolveFirst!: (result: ProcessResult) => void;
    mockProcessImage
      .mockImplementationOnce(
        () =>
          new Promise<ProcessResult>((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValueOnce(processResult(secondBlob, 400, 267));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:second-processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(1);
    });

    // Change the width while the first run is still in flight, then give the
    // debounced auto-process time to hit the in-flight guard
    const widthInput = view.container.querySelector("#width-input") as HTMLInputElement;
    fireEvent.input(widthInput, { target: { value: "400" } });
    await vi.advanceTimersByTimeAsync(500);

    resolveFirst(processResult(firstBlob, 1200, 800));

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:original");
    expect(view.container.querySelector("#download-button")).toBeDisabled();

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      // 1200×800 with linked aspect ratio: width 400 → height 267
      expect(mockProcessImage.mock.calls[1]?.[1]).toMatchObject({
        resize: { width: 400, height: 267, maintainAspectRatio: true },
      });
    });

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
    });
  });

  it("names downloads after the actual encoded format, not the requested one", async () => {
    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));

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
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:first-processed"
      );
    });

    const formatTrigger = view.container.querySelector("#format-select") as HTMLButtonElement;
    fireEvent.click(formatTrigger);

    fireEvent.mouseDown(screen.getByRole("option", { name: "AVIF" }));

    await vi.waitFor(() => {
      expect(mockProcessImage).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
        "src",
        "blob:second-processed"
      );
      expect(view.container.querySelector("#format-fallback-warning")).toHaveTextContent(
        "could not export AVIF"
      );
    });

    const downloadBtn = view.container.querySelector("#download-button") as HTMLButtonElement;
    fireEvent.click(downloadBtn);

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(processedBlob, "photo-processed.png");
  });

  it("preloads background removal in idle time and only once", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: false, effectiveType: "4g", downlink: 9 },
    });
    const idleCallbacks: Array<{ callback: () => void; timeout?: number }> = [];
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: (callback: () => void, options?: { timeout: number }) => {
        idleCallbacks.push({ callback, timeout: options?.timeout });
        return idleCallbacks.length;
      },
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      value: vi.fn(),
    });

    const sourceFile = new File(["source"], "photo.png", { type: "image/png" });
    const processedBlob = new Blob(["processed"], { type: "image/png" });

    mockGetImageMetadata.mockResolvedValue(imageMetadata(sourceFile, 1200, 800));
    mockProcessImage.mockResolvedValue(processResult(processedBlob, 1200, 800));

    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:original")
      .mockReturnValueOnce("blob:processed");

    const view = render(() => ImageApp());
    dispose = view.unmount;

    const fileInput = view.container.querySelector("#file-input") as HTMLInputElement;
    upload(fileInput, sourceFile);

    await vi.waitFor(() => {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:processed");
    });

    // The large model stays idle until the browser reaches an idle period.
    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();
    expect(idleCallbacks).toHaveLength(1);
    expect(idleCallbacks[0]?.timeout).toBe(2000);
    idleCallbacks[0]?.callback();

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

  it("warms the model when connection status is unavailable", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: undefined,
    });
    const idleCallbacks: Array<() => void> = [];
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: (callback: () => void) => {
        idleCallbacks.push(callback);
        return idleCallbacks.length;
      },
    });

    const view = render(() => ImageApp());
    dispose = view.unmount;

    expect(idleCallbacks).toHaveLength(1);
    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();

    idleCallbacks[0]?.();
    await vi.waitFor(() => {
      expect(mockPreloadBackgroundRemoval).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    { saveData: false, effectiveType: "4g", downlink: 3 },
    { saveData: true, effectiveType: "4g", downlink: 10 },
  ])("skips automatic model downloads with connection %j", async (connection) => {
    Object.defineProperty(window, "requestIdleCallback", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "connection", { configurable: true, value: connection });

    const view = render(() => ImageApp());
    dispose = view.unmount;

    await vi.advanceTimersByTimeAsync(5000);
    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();
  });

  it("falls back to a delay when idle callbacks are unavailable", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: false, effectiveType: "4g", downlink: 9 },
    });
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: undefined,
    });

    const view = render(() => ImageApp());
    dispose = view.unmount;

    expect(mockPreloadBackgroundRemoval).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    await vi.waitFor(() => {
      expect(mockPreloadBackgroundRemoval).toHaveBeenCalledTimes(1);
    });
  });
});
