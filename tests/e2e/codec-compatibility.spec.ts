import { fileURLToPath } from "node:url";
import {
  decodeImage,
  downloadImage,
  expect,
  openImageControls,
  test,
  uploadImage,
} from "./helpers";
import { decodePixels, pixelAt, readMetadata } from "./imageAssertions";

const landmarksPath = fileURLToPath(new URL("./fixtures/landmarks.png", import.meta.url));

test("exports AVIF when the encoder supports it, otherwise explains and names the PNG fallback", async ({
  page,
}) => {
  await page.goto("/app");
  await uploadImage(page, landmarksPath);
  await openImageControls(page);
  // Test the encoder separately from the app's format check.
  const canEncodeAvif = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        canvas.toBlob((blob) => resolve(blob?.type === "image/avif"), "image/avif");
      })
  );
  await page.getByRole("button", { name: "Output format", exact: true }).click();
  await page.getByRole("option", { name: "AVIF", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Output quality" })).toBeEnabled();
  const output = await downloadImage(page);
  const metadata = await readMetadata(output.bytes);
  expect(metadata).toMatchObject({
    width: 160,
    height: 120,
    format: canEncodeAvif ? "heif" : "png",
  });
  expect(output.name).toBe(`landmarks-processed.${canEncodeAvif ? "avif" : "png"}`);
  if (!canEncodeAvif) {
    await expect(
      page.getByRole("status").filter({ hasText: "could not export AVIF" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Max file size", exact: true }).click();
    await page.getByRole("textbox", { name: "Maximum file size (KB)" }).fill("40");
    await expect(
      page.getByRole("status").filter({ hasText: "could not apply a size target" })
    ).toBeVisible();
  }
});

test("loads the HEIC decoder on demand and converts a real HEIC image to a usable download", async ({
  page,
  context,
}) => {
  const decoderRequests: string[] = [];
  context.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("heic2any")) decoderRequests.push(request.url());
  });
  await page.goto("/app");
  await uploadImage(page, landmarksPath);
  await openImageControls(page);
  await downloadImage(page);
  expect(decoderRequests).toEqual([]);
  const heicPath = fileURLToPath(new URL("./fixtures/landmarks.heic", import.meta.url));
  await uploadImage(page, heicPath);
  await expect(page.getByRole("button", { name: "Output format", exact: true })).toHaveText(
    "JPEG",
    {
      timeout: 20_000,
    }
  );
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeEnabled({
    timeout: 20_000,
  });
  const output = await downloadImage(page);
  expect(output.name).toBe("landmarks-processed.jpg");
  expect(await decodeImage(output.bytes)).toMatchObject({ width: 160, height: 120 });
  expect((await readMetadata(output.bytes)).format).toBe("jpeg");
  const decoded = await decodePixels(output.bytes);
  const red = pixelAt(decoded, 40, 30);
  expect(red[0]).toBeGreaterThan(200);
  expect(red[1]).toBeLessThan(60);
  expect(red[2]).toBeLessThan(60);
  expect(decoderRequests).toHaveLength(1);
});
