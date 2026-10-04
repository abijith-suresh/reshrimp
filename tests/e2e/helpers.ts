import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test as base, expect, type Page } from "@playwright/test";

export const imagePath = fileURLToPath(new URL("./fixtures/metadata.jpg", import.meta.url));

// Observe the whole context, including background-removal workers. Fail on
// outbound HTTP traffic or request bodies instead of blocking a leak silently.
export const test = base.extend<{ privacy: undefined; browserErrors: undefined }>({
  browserErrors: [
    async ({ context }, use) => {
      const errors: string[] = [];
      context.on("weberror", (error) => errors.push(error.error().message));
      await use(undefined);
      expect(errors, "Image workflows must not throw unhandled browser errors").toEqual([]);
    },
    { auto: true },
  ],
  privacy: [
    async ({ context, baseURL }, use) => {
      const violations: string[] = [];
      const origin = new URL(baseURL as string).origin;
      context.on("request", (request) => {
        const url = new URL(request.url());
        if (url.protocol !== "http:" && url.protocol !== "https:") return;
        if (url.origin !== origin || request.method() !== "GET" || request.postDataBuffer()) {
          violations.push(`${request.method()} ${url.origin}${url.pathname}`);
        }
      });
      await use(undefined);
      expect(violations, "Image workflows must only fetch assets from the app origin").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function openImageControls(page: Page) {
  await expect(page.getByAltText("Preview")).toBeVisible();
  const edit = page.getByRole("button", { name: "Edit image", exact: true });
  if (await edit.isVisible()) await edit.click();
}

export async function uploadImage(page: Page, file = imagePath) {
  const emptyStateUpload = page.getByRole("button", { name: "Upload image", exact: true });
  const sourceUpload = page.getByRole("button", { name: "Upload image or drag and drop" });
  const edit = page.getByRole("button", { name: "Edit image", exact: true });
  await expect(emptyStateUpload.or(sourceUpload).or(edit)).toBeVisible();
  if (await edit.isVisible()) await openImageControls(page);
  const fileChooser = page.waitForEvent("filechooser");
  if (await emptyStateUpload.isVisible()) await emptyStateUpload.click();
  else await sourceUpload.click();
  await (await fileChooser).setFiles(file);
}

export async function downloadImage(page: Page) {
  const button = page.getByRole("button", { name: "Download", exact: true });
  await expect(button).toBeEnabled();
  const pending = page.waitForEvent("download");
  await button.click();
  const download = await pending;
  const path = await download.path();
  if (!path) throw new Error("Download did not produce a file");
  return { name: download.suggestedFilename(), bytes: await readFile(path) };
}

export async function decodeImage(page: Page, bytes: Buffer) {
  return page.evaluate(async (base64) => {
    const data = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([data]));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable");
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let transparentPixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 255) transparentPixels += 1;
    }
    const dimensions = { width: bitmap.width, height: bitmap.height, transparentPixels };
    bitmap.close();
    return dimensions;
  }, bytes.toString("base64"));
}
