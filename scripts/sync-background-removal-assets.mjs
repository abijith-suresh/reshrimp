import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const trustedResourceMapPath = path.join(scriptDir, "background-removal-resources.json");
const sourceBaseUrl = new URL(BACKGROUND_REMOVAL_CDN_PATH_PREFIX, BACKGROUND_REMOVAL_CDN_ORIGIN);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getChunkOffsets(chunk) {
  if (
    !isRecord(chunk) ||
    !Array.isArray(chunk.offsets) ||
    chunk.offsets.length !== 2 ||
    !chunk.offsets.every((offset) => Number.isSafeInteger(offset)) ||
    chunk.offsets[0] < 0 ||
    chunk.offsets[1] <= chunk.offsets[0]
  ) {
    throw new Error("Invalid background-removal chunk offsets");
  }

  return chunk.offsets;
}

function getExpectedHash(chunk) {
  if (!isRecord(chunk) || typeof chunk.hash !== "string" || !/^[a-f0-9]{64}$/.test(chunk.hash)) {
    throw new Error("Invalid background-removal chunk hash");
  }

  return chunk.hash;
}

function getChunkName(chunk) {
  const expectedHash = getExpectedHash(chunk);

  if (chunk.name !== expectedHash) {
    throw new Error("Background-removal chunk names must match their SHA-256 hashes");
  }

  return chunk.name;
}

function getChunkSize(chunk) {
  const offsets = getChunkOffsets(chunk);
  return offsets[1] - offsets[0];
}

function normalizeResourceMap(resourceMap) {
  if (!isRecord(resourceMap)) {
    throw new Error("Invalid background-removal resource map");
  }

  const normalizedResourceMap = {};

  for (const assetKey of BACKGROUND_REMOVAL_ASSET_KEYS) {
    const entry = resourceMap[assetKey];
    if (
      !isRecord(entry) ||
      !Array.isArray(entry.chunks) ||
      entry.chunks.length === 0 ||
      !Number.isSafeInteger(entry.size) ||
      entry.size <= 0 ||
      typeof entry.mime !== "string" ||
      entry.mime.length === 0
    ) {
      throw new Error(`Invalid background-removal asset metadata for ${assetKey}`);
    }

    const chunks = [];
    const names = new Set();
    let nextOffset = 0;

    for (const chunk of entry.chunks) {
      const hash = getExpectedHash(chunk);
      const name = getChunkName(chunk);
      const offsets = getChunkOffsets(chunk);

      if (names.has(name) || offsets[0] !== nextOffset) {
        throw new Error(`Invalid background-removal chunk sequence for ${assetKey}`);
      }

      names.add(name);
      chunks.push({ hash, name, offsets: [...offsets] });
      nextOffset = offsets[1];
    }

    if (nextOffset !== entry.size) {
      throw new Error(`Background-removal asset size does not match its chunks for ${assetKey}`);
    }

    normalizedResourceMap[assetKey] = {
      chunks,
      size: entry.size,
      mime: entry.mime,
    };
  }

  return normalizedResourceMap;
}

function getSha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function getResourceMapFingerprint(resourceMap) {
  const normalizedResourceMap = normalizeResourceMap(resourceMap);
  return getSha256(Buffer.from(`${JSON.stringify(normalizedResourceMap, null, 2)}\n`));
}

function assertTrustedResourceMap(resourceMap, trustedResourceMap) {
  const normalizedResourceMap = normalizeResourceMap(resourceMap);

  if (
    getResourceMapFingerprint(normalizedResourceMap) !==
    getResourceMapFingerprint(trustedResourceMap)
  ) {
    throw new Error("Background-removal resource map does not match the trusted manifest");
  }

  return normalizedResourceMap;
}

function getChunkUrl(chunk) {
  const name = getChunkName(chunk);
  const url = new URL(name, sourceBaseUrl);
  const expectedPath = `${sourceBaseUrl.pathname}${name}`;

  if (
    url.origin !== sourceBaseUrl.origin ||
    url.pathname !== expectedPath ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid background-removal chunk URL");
  }

  return url;
}

function getChunkDestinationPath(chunk) {
  const name = getChunkName(chunk);
  const destinationPath = path.join(targetDir, name);

  if (path.relative(targetDir, destinationPath) !== name) {
    throw new Error("Invalid background-removal chunk destination");
  }

  return destinationPath;
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
  const trustedResourceMap = await readLocalJson(trustedResourceMapPath);
  if (!trustedResourceMap) {
    throw new Error(`Missing trusted background-removal manifest: ${trustedResourceMapPath}`);
  }

  const normalizedTrustedResourceMap = normalizeResourceMap(trustedResourceMap);
  const localResourceMap = await readLocalJson(resourceMapPath);

  if (localResourceMap) {
    try {
      return assertTrustedResourceMap(localResourceMap, normalizedTrustedResourceMap);
    } catch {
      // Re-fetch the upstream manifest when the generated local copy is stale or corrupt.
    }
  }

  const remoteResourceMap = await fetchJson(new URL("resources.json", sourceBaseUrl));
  return assertTrustedResourceMap(remoteResourceMap, normalizedTrustedResourceMap);
}

async function hasExpectedChunk(filePath, chunk) {
  try {
    const buffer = await readFile(filePath);
    return (
      buffer.byteLength === getChunkSize(chunk) && getSha256(buffer) === getExpectedHash(chunk)
    );
  } catch {
    return false;
  }
}

async function downloadFile(destinationPath, chunk) {
  const url = getChunkUrl(chunk);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength !== getChunkSize(chunk) || getSha256(buffer) !== getExpectedHash(chunk)) {
    throw new Error(`Downloaded background-removal chunk failed integrity check: ${chunk.name}`);
  }

  await writeFile(destinationPath, buffer);
}

async function main() {
  await mkdir(targetDir, { recursive: true });

  const resourceMap = await getResourceMap();
  const chunks = BACKGROUND_REMOVAL_ASSET_KEYS.flatMap((assetKey) => resourceMap[assetKey].chunks);
  let downloadedCount = 0;

  for (const chunk of chunks) {
    const destinationPath = getChunkDestinationPath(chunk);

    if (await hasExpectedChunk(destinationPath, chunk)) {
      continue;
    }

    await downloadFile(destinationPath, chunk);
    downloadedCount += 1;
  }

  await writeFile(resourceMapPath, `${JSON.stringify(resourceMap, null, 2)}\n`);

  console.log(
    downloadedCount === 0
      ? "background-removal assets already up to date"
      : `downloaded ${downloadedCount} background-removal asset chunk(s)`
  );
}

export {
  assertTrustedResourceMap,
  getChunkDestinationPath,
  getChunkName,
  getChunkSize,
  getChunkUrl,
  getResourceMapFingerprint,
  normalizeResourceMap,
};

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  await main();
}
