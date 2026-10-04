import {
  decodeImage,
  downloadImage,
  expect,
  openImageControls,
  test,
  uploadImage,
} from "./helpers";

test("keeps focus in mobile controls and closes the Select before the dialog", async ({ page }) => {
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

  const unit = dialog.getByRole("button", { name: "Unit: px", exact: true });
  await unit.press("ArrowDown");
  const listbox = dialog.getByRole("listbox", { name: "Unit: px", exact: true });
  await expect(listbox).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(listbox).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(unit).toBeFocused();
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
  await dialog.getByRole("button", { name: "Unit: px", exact: true }).click();
  await dialog.getByRole("option", { name: "in", exact: true }).click();
  const dpi = dialog.getByRole("button", { name: "Resolution: 96 DPI", exact: true });
  await dpi.click();
  await dialog.getByRole("option", { name: "300 DPI", exact: true }).click();
  await dialog.getByRole("button", { name: "DPI info", exact: true }).focus();
  const tooltip = dialog.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "DPI info", exact: true })
  ).toHaveAccessibleDescription(/DPI.*pixels/);
  const bounds = await tooltip.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0
  );
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox", { name: "Width", exact: true }).fill("1");
  await expect(page.getByAltText("Preview")).toHaveAttribute("width", "300");
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  const output = await downloadImage(page);
  expect(await decodeImage(page, output.bytes)).toMatchObject({ width: 300, height: 225 });
});

test("moves focus to visible desktop controls when the viewport grows", async ({ page }) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  const dialog = page.getByRole("dialog", { name: "Image controls" });
  const unit = dialog.getByRole("button", { name: "Unit: px", exact: true });
  await unit.press("ArrowDown");
  await expect(dialog.getByRole("listbox")).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Width", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 393, height: 851 });
  await expect(page.getByRole("button", { name: "Edit image", exact: true })).toBeFocused();
});
