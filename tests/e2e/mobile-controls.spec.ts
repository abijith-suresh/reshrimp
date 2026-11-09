import {
  decodeImage,
  downloadImage,
  expect,
  openImageControls,
  test,
  uploadImage,
} from "./helpers";

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
