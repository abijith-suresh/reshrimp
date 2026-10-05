import { render, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { mockCanvasCreation, mockImageLoading, mockObjectUrls } from "@/test/mocks";
import ImageApp from "./ImageApp";

it("applies linked dimensions and enables download after processing", async () => {
  vi.useFakeTimers();
  mockObjectUrls();
  mockImageLoading();
  mockCanvasCreation();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const view = render(() => ImageApp());
  // jsdom displays both panels. Select the desktop controls for this test.
  const controls = within(view.container.querySelector("[data-app-shell]") as HTMLElement);
  await user.upload(
    controls.getByLabelText("Upload image", { exact: true }),
    new File(["source"], "photo.png", { type: "image/png" })
  );
  await vi.advanceTimersByTimeAsync(400);
  const width = controls.getByRole("textbox", { name: "Width" });
  const height = controls.getByRole("textbox", { name: "Height" });
  const download = controls.getByRole("button", { name: "Download" });
  expect(width).toHaveValue("100");
  expect(height).toHaveValue("80");
  expect(controls.getByRole("slider", { name: "Output quality" })).toBeDisabled();
  expect(controls.getByRole("button", { name: "Max file size" })).toBeDisabled();

  await user.clear(width);
  await user.type(width, "50");
  expect(height).toHaveValue("40");
  expect(download).toBeDisabled();
  await vi.advanceTimersByTimeAsync(400);
  expect(download).toBeEnabled();
  await user.click(download);

  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  const link = view.container.ownerDocument.querySelector("a[download]");
  expect(link).toHaveAttribute("download", "photo-processed.png");
  await vi.advanceTimersByTimeAsync(100);
});
