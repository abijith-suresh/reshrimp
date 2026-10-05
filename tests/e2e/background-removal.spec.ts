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
import { decodePixels, pixelAt } from "./imageAssertions";

test("runs background removal with same-origin assets and exports a transparent PNG", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const assetRequests: string[] = [];
  context.on("request", (request) => {
    if (request.url().includes("/background-removal/")) assetRequests.push(request.url());
  });
  await page.goto("/app");
  const subjectPath = fileURLToPath(new URL("./fixtures/astronaut.jpg", import.meta.url));
  await uploadImage(page, subjectPath);
  await openImageControls(page);
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeEnabled();
  const removeBackground = page.getByRole("checkbox", { name: "Remove bg", exact: true });
  await removeBackground.focus();
  await removeBackground.press("Space");
  await expect(removeBackground).toBeChecked();
  await expect(page.getByRole("button", { name: "Output format", exact: true })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Output quality", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeEnabled({
    timeout: 60_000,
  });
  const output = await downloadImage(page);
  expect(output.name).toBe("astronaut-processed.png");
  expect(output.bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const decoded = await decodeImage(output.bytes);
  expect(decoded).toMatchObject({ width: 256, height: 256 });
  const source = await decodePixels(await readFile(subjectPath));
  const outputPixels = await decodePixels(output.bytes);
  let clear = 0;
  let opaque = 0;
  for (let i = 3; i < outputPixels.data.length; i += 4) {
    if (outputPixels.data[i] < 15) clear += 1;
    if (outputPixels.data[i] > 240) opaque += 1;
  }
  expect(clear).toBeGreaterThan(256 * 256 * 0.2);
  expect(opaque).toBeGreaterThan(256 * 256 * 0.2);
  // A point on the face must survive, and a point in the upper-right wall must disappear.
  const face = pixelAt(outputPixels, 110, 55);
  expect(face[3]).toBeGreaterThan(240);
  const originalFace = pixelAt(source, 110, 55);
  for (let channel = 0; channel < 3; channel += 1) {
    expect(Math.abs(face[channel] - originalFace[channel])).toBeLessThanOrEqual(2);
  }
  expect(pixelAt(outputPixels, 245, 15)[3]).toBeLessThan(15);
  expect(assetRequests.length).toBeGreaterThan(0);
  expect(
    assetRequests.every((url) => new URL(url).origin === new URL(baseURL as string).origin)
  ).toBe(true);
});
