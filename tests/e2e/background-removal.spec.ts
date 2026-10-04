import {
  decodeImage,
  downloadImage,
  expect,
  openImageControls,
  test,
  uploadImage,
} from "./helpers";

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
  await uploadImage(page);
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
  expect(output.name).toBe("metadata-processed.png");
  expect(output.bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const decoded = await decodeImage(page, output.bytes);
  expect(decoded).toMatchObject({ width: 512, height: 384 });
  expect(decoded.transparentPixels).toBeGreaterThan(0);
  expect(assetRequests.length).toBeGreaterThan(0);
  expect(
    assetRequests.every((url) => new URL(url).origin === new URL(baseURL as string).origin)
  ).toBe(true);
});
