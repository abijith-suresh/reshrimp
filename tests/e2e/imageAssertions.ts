import sharp from "sharp";

// Decode outside the browser, independently of the app's canvas/Image APIs.
export async function decodePixels(bytes: Buffer) {
  return sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

export async function decodeImage(bytes: Buffer) {
  const { data, info } = await decodePixels(bytes);
  let transparentPixels = 0;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) transparentPixels += 1;
  }
  return { width: info.width, height: info.height, transparentPixels };
}

export function pixelAt(image: Awaited<ReturnType<typeof decodePixels>>, x: number, y: number) {
  const offset = (y * image.info.width + x) * 4;
  return [...image.data.subarray(offset, offset + 4)];
}

export async function readMetadata(bytes: Buffer) {
  return sharp(bytes).metadata();
}
