import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test as base, expect, type Page } from "@playwright/test";

const distPath = fileURLToPath(new URL("../../dist/", import.meta.url));
// The app has no API. Allow requests only for build assets and pages.
const staticPaths = readdir(distPath, { recursive: true }).then((files) => {
  const paths = new Set(files.map((file) => `/${file}`));
  for (const file of files) {
    if (file.endsWith("index.html")) {
      const route = `/${file.slice(0, -"index.html".length)}`;
      paths.add(route);
      paths.add(route === "/" ? route : route.slice(0, -1));
    }
  }
  return paths;
});

export const imagePath = fileURLToPath(new URL("./fixtures/metadata.jpg", import.meta.url));

// Observe worker requests too. Report leaks without blocking them.
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
      const assets = await staticPaths;
      context.on("page", (page) => {
        page.on("websocket", () => violations.push("WebSocket connection"));
      });
      context.on("request", (request) => {
        const url = new URL(request.url());
        if (url.protocol !== "http:" && url.protocol !== "https:") return;
        if (
          url.origin !== origin ||
          request.method() !== "GET" ||
          request.postDataBuffer() ||
          url.search ||
          !assets.has(url.pathname)
        ) {
          violations.push(`${request.method()} ${url.origin}${url.pathname}`);
        }
      });
      await use(undefined);
      expect(
        violations,
        "Image workflows must only fetch known static assets without transmitting data"
      ).toEqual([]);
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

export { decodeImage } from "./imageAssertions";
