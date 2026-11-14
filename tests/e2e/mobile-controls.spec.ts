import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  decodeImage,
  downloadImage,
  expect,
  openImageControls,
  test,
  uploadImage,
} from "./helpers";

const landmarksPath = fileURLToPath(new URL("./fixtures/landmarks.png", import.meta.url));

test("keeps focus in mobile controls and returns focus after closing the dialog", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadImage(page);
  const edit = page.getByRole("button", { name: "Edit image", exact: true });
  await expect(edit).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Width", exact: true })).toHaveCount(0);
  await edit.click();
  const dialog = page.getByRole("dialog", { name: "Image controls" });
  const done = dialog.getByRole("button", { name: "Done", exact: true });
  await expect(dialog).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Download", exact: true })).toBeEnabled();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Download", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(done).toBeFocused();

  const unit = dialog.getByRole("combobox", { name: "Unit: px", exact: true });
  await unit.focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("checkbox", { name: "Lock ratio", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(edit).toBeFocused();
});

test("converts physical dimensions, keeps DPI help in the dialog, and downloads from peek", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  const dialog = page.getByRole("dialog", { name: "Image controls" });
  await dialog.getByRole("combobox", { name: "Unit: px", exact: true }).selectOption("in");
  await dialog
    .getByRole("combobox", { name: "Resolution: 96 DPI", exact: true })
    .selectOption("300");
  await expect(dialog.getByText("96 for screens, 300 for print.")).toBeVisible();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox", { name: "Width", exact: true }).fill("1");
  await expect(page.getByAltText("Preview")).toHaveAttribute("width", "300");
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  const output = await downloadImage(page);
  expect(await decodeImage(output.bytes)).toMatchObject({ width: 300, height: 225 });
});

test("moves focus to visible desktop controls when the viewport grows", async ({ page }) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  const dialog = page.getByRole("dialog", { name: "Image controls" });
  const unit = dialog.getByRole("combobox", { name: "Unit: px", exact: true });
  await unit.focus();
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Width", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 393, height: 851 });
  await expect(page.getByRole("button", { name: "Edit image", exact: true })).toBeFocused();
});

test("shows processing errors in the sheet beside Download and keeps the preview above it", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  const dialog = page.getByRole("dialog", { name: "Image controls" });
  // The preview frame, not the image, so the check holds for any aspect ratio.
  const previewFrame = page.getByAltText("Preview").locator("xpath=../..");
  const bottom = async (locator: typeof dialog) => {
    const box = await locator.boundingBox();
    return box ? box.y + box.height : Number.POSITIVE_INFINITY;
  };
  const top = async (locator: typeof dialog) => (await locator.boundingBox())?.y ?? 0;
  await expect(async () => {
    expect(await bottom(previewFrame)).toBeLessThanOrEqual(await top(dialog));
  }).toPass();

  await dialog.getByRole("textbox", { name: "Width", exact: true }).fill("0");
  const openError = dialog.getByRole("alert");
  await expect(openError).toBeAttached();
  await expect(dialog.getByRole("button", { name: "Download", exact: true })).toBeDisabled();
  await openError.scrollIntoViewIfNeeded();
  await expect(openError).toBeInViewport();

  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  const sheet = page.getByRole("region", { name: "Image controls" });
  const peekError = sheet.getByRole("alert");
  await expect(peekError).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("alert").filter({ visible: true })).toHaveCount(1);
  await expect(async () => {
    expect(await bottom(previewFrame)).toBeLessThanOrEqual(await top(sheet));
  }).toPass();
});

test("loads an image dropped on the preview instead of leaving the app", async ({ page }) => {
  await page.goto("/app");
  await uploadImage(page);
  const preview = page.getByAltText("Preview");
  await expect(preview).toHaveAttribute("width", "512");
  const bytes = (await readFile(landmarksPath)).toString("base64");
  const dataTransfer = await page.evaluateHandle((data) => {
    const transfer = new DataTransfer();
    const file = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    transfer.items.add(new File([file], "landmarks.png", { type: "image/png" }));
    return transfer;
  }, bytes);
  await preview.dispatchEvent("dragover", { dataTransfer });
  await preview.dispatchEvent("drop", { dataTransfer });
  await expect(preview).toHaveAttribute("width", "160");
  await expect(page).toHaveURL(/\/app$/);
});
