import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  decodeImage,
  downloadImage,
  expect,
  imagePath,
  openImageControls,
  test,
  uploadImage,
} from "./helpers";

for (const format of [
  { label: "PNG", extension: "png", signature: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) },
  { label: "JPEG", extension: "jpg", signature: Buffer.from([255, 216, 255]) },
  { label: "WebP", extension: "webp", signature: Buffer.from("RIFF") },
]) {
  test(`resizes and downloads ${format.label} without source EXIF or GPS metadata`, async ({
    page,
  }) => {
    const source = await readFile(imagePath);
    // Guard the fixture so metadata removal cannot pass with a metadata-free input.
    expect(source.includes(Buffer.from("Exif"))).toBe(true);
    expect(source.includes(Buffer.from("reshrimp-private-test-metadata"))).toBe(true);
    await page.goto("/app");
    await uploadImage(page);
    await expect(page.getByAltText("Preview")).toHaveAttribute("width", "512");
    await openImageControls(page);
    await page.getByRole("textbox", { name: "Width", exact: true }).fill("256");
    await expect(page.getByRole("textbox", { name: "Height", exact: true })).toHaveValue("192");
    await page.getByRole("button", { name: "Output format", exact: true }).click();
    await page.getByRole("option", { name: format.label, exact: true }).click();
    await expect(page.getByAltText("Preview")).toHaveAttribute("width", "256");

    const output = await downloadImage(page);
    expect(output.name).toBe(`metadata-processed.${format.extension}`);
    expect(output.bytes.subarray(0, format.signature.length)).toEqual(format.signature);
    for (const marker of ["Exif", "EXIF", "eXIf", "reshrimp-private-test-metadata"]) {
      expect(output.bytes.includes(Buffer.from(marker))).toBe(false);
    }
    expect(await decodeImage(page, output.bytes)).toMatchObject({ width: 256, height: 192 });
  });
}

test("targets a reachable size and reports an impossible limit without changing dimensions", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  await page.getByRole("button", { name: "Max file size", exact: true }).click();
  const limit = page.getByRole("textbox", { name: "Maximum file size (KB)", exact: true });
  await limit.fill("40");
  await expect(
    page.getByRole("status").filter({ hasText: "Output fits within 40.0 KB." })
  ).toBeVisible();
  const fitting = await downloadImage(page);
  expect(fitting.bytes.length).toBeLessThanOrEqual(40 * 1024);
  expect(await decodeImage(page, fitting.bytes)).toMatchObject({ width: 512, height: 384 });

  await limit.fill("0.001");
  await expect(page.getByRole("status").filter({ hasText: "Could not meet" })).toBeVisible();
  const smallest = await downloadImage(page);
  expect(smallest.bytes.length).toBeGreaterThan(1);
  expect(smallest.bytes.length).toBeLessThan(fitting.bytes.length);
  expect(await decodeImage(page, smallest.bytes)).toMatchObject({ width: 512, height: 384 });
});

test("blocks an invalid size, then recovers when it is corrected", async ({ page }) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  await page.getByRole("button", { name: "Max file size", exact: true }).click();
  const limit = page.getByRole("textbox", { name: "Maximum file size (KB)", exact: true });
  await limit.fill("0");
  await expect(limit).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toHaveText("Enter a size greater than 0 KB.");
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeDisabled();
  await limit.fill("40");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeEnabled();
});

test("shows a corrupt upload error and can load a valid image afterwards", async ({ page }) => {
  await page.goto("/app");
  const chooser = page.waitForEvent("filechooser");
  const mobileUpload = page.getByRole("button", { name: "Upload image", exact: true });
  if (await mobileUpload.isVisible()) await mobileUpload.click();
  else await page.getByRole("button", { name: "Upload image or drag and drop" }).click();
  await (await chooser).setFiles({
    name: "corrupt.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(
    page
      .getByText("Failed to load image. Please try another file.", { exact: true })
      .filter({ visible: true })
  ).toBeVisible();
  await uploadImage(page);
  await openImageControls(page);
  const output = await downloadImage(page);
  expect(await decodeImage(page, output.bytes)).toMatchObject({ width: 512, height: 384 });
});

test("preserves the caret while editing the middle of a linked dimension", async ({ page }) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  const width = page.getByRole("textbox", { name: "Width", exact: true });
  await width.fill("500");
  await width.press("ArrowLeft");
  await width.press("Backspace");
  await expect(width).toHaveValue("50");
  expect(await width.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(1);
  await width.press("2");
  await expect(width).toHaveValue("520");
  await expect(page.getByRole("textbox", { name: "Height", exact: true })).toHaveValue("390");
  expect(await width.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
  await expect(page.getByAltText("Preview")).toHaveAttribute("width", "520");
  expect(await decodeImage(page, (await downloadImage(page)).bytes)).toMatchObject({
    width: 520,
    height: 390,
  });
});

test("replaces the active image and preserves PNG transparency in its download", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  await downloadImage(page);
  const transparentPath = fileURLToPath(new URL("./fixtures/transparent.png", import.meta.url));
  await uploadImage(page, transparentPath);
  await openImageControls(page);
  const output = await downloadImage(page);
  expect(output.name).toBe("transparent-processed.png");
  expect(await decodeImage(page, output.bytes)).toEqual({
    width: 128,
    height: 96,
    transparentPixels: 6144,
  });
});

test("allows independent dimensions when the ratio is unlocked", async ({ page }) => {
  await page.goto("/app");
  await uploadImage(page);
  await openImageControls(page);
  const lock = page.getByRole("checkbox", { name: "Lock ratio", exact: true });
  await expect(lock).toBeChecked();
  await lock.focus();
  await lock.press("Space");
  await expect(lock).not.toBeChecked();
  await page.getByRole("textbox", { name: "Width", exact: true }).fill("256");
  await expect(page.getByRole("textbox", { name: "Height", exact: true })).toHaveValue("384");
  await page.getByRole("textbox", { name: "Height", exact: true }).fill("100");
  await expect(page.getByAltText("Preview")).toHaveAttribute("height", "100");
  const output = await downloadImage(page);
  expect(await decodeImage(page, output.bytes)).toMatchObject({ width: 256, height: 100 });
});
