import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertTrustedResourceMap,
  getChunkDestinationPath,
  getChunkUrl,
  getResourceMapFingerprint,
  normalizeResourceMap,
} from "./sync-background-removal-assets.mjs";

const trustedResourceMap = JSON.parse(
  await readFile(new URL("./background-removal-resources.json", import.meta.url), "utf8")
);
const assetKey = "/onnxruntime-web/ort-wasm-simd-threaded.wasm";

function cloneResourceMap() {
  return structuredClone(trustedResourceMap);
}

test("the checked-in manifest is valid and content-addressed", () => {
  const normalizedResourceMap = normalizeResourceMap(trustedResourceMap);
  const chunkCount = Object.values(normalizedResourceMap).reduce(
    (total, entry) => total + entry.chunks.length,
    0
  );

  assert.deepEqual(normalizedResourceMap, trustedResourceMap);
  assert.equal(chunkCount, 26);
  assert.equal(
    getResourceMapFingerprint(trustedResourceMap),
    "365f54a52994efd52b3d3d3ba2318af68d280df19f214f2f1f1cc87368f7adfa"
  );
});

test("rejects path-like or remote chunk names", () => {
  for (const name of [
    "../escape",
    "/tmp/escape",
    "https://evil.example/payload",
    "//evil.example",
  ]) {
    const resourceMap = cloneResourceMap();
    resourceMap[assetKey].chunks[0].name = name;

    assert.throws(() => normalizeResourceMap(resourceMap), /chunk names|chunk hash/);
  }
});

test("rejects a manifest whose chunk hash and name are changed together", () => {
  const resourceMap = cloneResourceMap();
  const chunk = resourceMap[assetKey].chunks[0];
  chunk.hash = "0".repeat(64);
  chunk.name = chunk.hash;

  assert.throws(
    () => assertTrustedResourceMap(resourceMap, trustedResourceMap),
    /trusted manifest/
  );
});

test("resolves validated chunks only to the configured CDN and asset directory", () => {
  const chunk = trustedResourceMap[assetKey].chunks[0];
  const url = getChunkUrl(chunk);

  assert.equal(url.origin, "https://staticimgly.com");
  assert.equal(url.pathname, `/@imgly/background-removal-data/1.7.0/dist/${chunk.name}`);
  assert.match(getChunkDestinationPath(chunk), new RegExp(`${chunk.name}$`));
});
