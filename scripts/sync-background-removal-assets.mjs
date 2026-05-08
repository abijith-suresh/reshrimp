import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKGROUND_REMOVAL_DATA_VERSION = "1.7.0";
const BACKGROUND_REMOVAL_MODEL = "isnet_fp16";
const BACKGROUND_REMOVAL_CDN_ORIGIN = "https://staticimgly.com";
const BACKGROUND_REMOVAL_CDN_PATH_PREFIX = `/@imgly/background-removal-data/${BACKGROUND_REMOVAL_DATA_VERSION}/dist/`;
const BACKGROUND_REMOVAL_ASSET_KEYS = [
  "/onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "/onnxruntime-web/ort-wasm-simd-threaded.mjs",
  `/models/${BACKGROUND_REMOVAL_MODEL}`,
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const targetDir = path.join(
  projectRoot,
  "public",
  "background-removal",
  BACKGROUND_REMOVAL_DATA_VERSION,
  "dist"
);
const resourceMapPath = path.join(targetDir, "resources.json");
const sourceBaseUrl = new URL(BACKGROUND_REMOVAL_CDN_PATH_PREFIX, BACKGROUND_REMOVAL_CDN_ORIGIN);

function getChunkSize(chunk) {
  return chunk.offsets[1] - chunk.offsets[0];
}

function hasRequiredAssetMetadata(resourceMap) {
  return BACKGROUND_REMOVAL_ASSET_KEYS.every((assetKey) => resourceMap?.[assetKey]);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function readLocalJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function getResourceMap() {
  const localResourceMap = await readLocalJson(resourceMapPath);
  if (hasRequiredAssetMetadata(localResourceMap)) {
    return localResourceMap;
  }

  return fetchJson(new URL("resources.json", sourceBaseUrl));
}

async function hasExpectedSize(filePath, expectedSize) {
  try {
    const fileStat = await stat(filePath);
    return fileStat.size === expectedSize;
  } catch {
    return false;
  }
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destinationPath, buffer);
}

async function main() {
  await mkdir(targetDir, { recursive: true });

  const resourceMap = await getResourceMap();
  const filteredResourceMap = {};
  const chunks = [];

  for (const assetKey of BACKGROUND_REMOVAL_ASSET_KEYS) {
    const entry = resourceMap[assetKey];
    if (!entry) {
      throw new Error(`Missing background-removal asset metadata for ${assetKey}`);
    }

    filteredResourceMap[assetKey] = entry;
    chunks.push(...entry.chunks);
  }

  let downloadedCount = 0;

  for (const chunk of chunks) {
    const destinationPath = path.join(targetDir, chunk.name);
    const expectedSize = getChunkSize(chunk);

    if (await hasExpectedSize(destinationPath, expectedSize)) {
      continue;
    }

    await downloadFile(new URL(chunk.name, sourceBaseUrl), destinationPath);
    downloadedCount += 1;
  }

  await writeFile(resourceMapPath, `${JSON.stringify(filteredResourceMap, null, 2)}\n`);

  console.log(
    downloadedCount === 0
      ? "background-removal assets already up to date"
      : `downloaded ${downloadedCount} background-removal asset chunk(s)`
  );
}

await main();
