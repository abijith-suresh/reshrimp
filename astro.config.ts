import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Background removal always runs imgly with `device: "cpu"`, so only the wasm
 * execution provider is needed:
 *
 * - `onnxruntime-web/webgpu` is stubbed out entirely — it is only imported by
 *   imgly when `device: "gpu"`, and pulling it in ships the ~24 MB jsep wasm.
 * - The bare `onnxruntime-web` entry is redirected to `onnxruntime-web/wasm`.
 *   The default entry still carries the jsep runtime and emits its wasm into
 *   the build output even though it is never fetched.
 *
 * If background removal ever moves to GPU, remove these aliases and mirror
 * the jsep runtime assets in scripts/sync-background-removal-assets.mjs.
 */
const onnxruntimeWasmEntry = fileURLToPath(import.meta.resolve("onnxruntime-web/wasm"));
const onnxruntimeWebGpuStub = fileURLToPath(
  new URL("./src/config/onnxruntimeWebGpuStub.ts", import.meta.url)
);

// https://astro.build/config
export default defineConfig({
  site: "https://reshrimp.vercel.app",
  integrations: [solid(), sitemap()],
  vite: {
    build: {
      chunkSizeWarningLimit: 800,
    },
    plugins: [
      tailwindcss(),
      process.env.ANALYZE === "true" &&
        visualizer({
          emitFile: true,
          filename: "stats.html",
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: "/src" },
        { find: /^onnxruntime-web$/, replacement: onnxruntimeWasmEntry },
        { find: /^onnxruntime-web\/webgpu$/, replacement: onnxruntimeWebGpuStub },
      ],
    },
  },
});
