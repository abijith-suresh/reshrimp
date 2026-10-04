import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getImageMetadata, prepareImageFile, processImage } from "@/services/imageService";
import { mockImageLoading, mockObjectUrls } from "@/test/mocks";
import { createDownloadLink } from "@/utils/imageUtils";
import ImageApp from "./ImageApp";

vi.mock("@/services/imageService", () => ({
  getImageMetadata: vi.fn(),
  prepareImageFile: vi.fn(),
  processImage: vi.fn(),
}));
vi.mock("@/services/backgroundRemovalService", () => ({
  preloadBackgroundRemoval: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/utils/imageUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/imageUtils")>()),
  createDownloadLink: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  mockObjectUrls();
  mockImageLoading();
  vi.mocked(prepareImageFile)
    .mockReset()
    .mockImplementation(async (file) => ({ file, format: file.type }));
  vi.mocked(getImageMetadata)
    .mockReset()
    .mockImplementation(async (file) => ({
      width: 500,
      height: 400,
      format: file.type,
      fileSize: file.size,
      fileName: file.name,
    }));
  vi.mocked(processImage)
    .mockReset()
    .mockImplementation(async (_file, options) => {
      const format = options.removeBackground ? "image/png" : (options.format ?? "image/png");
      const blob = new Blob(["processed"], { type: format });
      return {
        blob,
        requestedFormat: format,
        metadata: { width: 500, height: 400, format, fileSize: blob.size },
      };
    });
  vi.mocked(createDownloadLink).mockReset();
});

function renderApp() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const view = render(() => ImageApp());
  // Both responsive panels exist in jsdom, which does not apply our CSS.
  // Browser tests exercise their actual visibility and keyboard focus.
  const desktop = within(view.container.querySelector("[data-app-shell]") as HTMLElement);
  return { user, desktop };
}

describe("ImageApp wiring", () => {
  it("connects upload, dimension controls, and download to the active session", async () => {
    const { user, desktop } = renderApp();
    await user.upload(
      desktop.getByLabelText("Upload image", { exact: true }),
      new File(["source"], "photo.png", { type: "image/png" })
    );
    await vi.advanceTimersByTimeAsync(400);
    expect(screen.getByRole("img", { name: "Preview" })).toBeInTheDocument();
    const width = desktop.getByRole("textbox", { name: "Width" });
    await user.clear(width);
    await user.type(width, "400");
    expect(width).toHaveValue("400");
    expect(desktop.getByRole("textbox", { name: "Height" })).toHaveValue("320");
    await vi.advanceTimersByTimeAsync(400);
    await user.click(desktop.getByRole("button", { name: "Download" }));
    expect(createDownloadLink).toHaveBeenCalledWith(expect.any(Blob), "photo-processed.png");
  });

  it("disables lossy compression controls for PNG and background removal", async () => {
    const { user, desktop } = renderApp();
    await user.upload(
      desktop.getByLabelText("Upload image", { exact: true }),
      new File(["source"], "photo.png", { type: "image/png" })
    );
    expect(desktop.getByRole("slider", { name: "Output quality" })).toBeDisabled();
    expect(desktop.getByRole("button", { name: "Max file size" })).toBeDisabled();
    await vi.advanceTimersByTimeAsync(400);
    await user.click(desktop.getByRole("checkbox", { name: "Remove bg" }));
    expect(desktop.getByRole("button", { name: "Output format" })).toBeDisabled();
    expect(desktop.getByRole("slider", { name: "Output quality" })).toBeDisabled();
  });

  it("shows invalid file-size input and prevents downloading stale output", async () => {
    const { user, desktop } = renderApp();
    await user.upload(
      desktop.getByLabelText("Upload image", { exact: true }),
      new File(["source"], "photo.jpg", { type: "image/jpeg" })
    );
    await vi.advanceTimersByTimeAsync(400);
    await user.click(desktop.getByRole("button", { name: "Max file size" }));
    await user.type(desktop.getByRole("textbox", { name: "Maximum file size (KB)" }), "0");
    expect(desktop.getByRole("alert")).toHaveTextContent("Enter a size greater than 0 KB.");
    expect(desktop.getByRole("button", { name: "Download" })).toBeDisabled();
  });
});
