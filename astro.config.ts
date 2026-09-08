import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
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
  integrations: [
    solid(),
    sitemap(),
    AstroPWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{css,html,ico,js,png,svg,webmanifest,woff2}"],
      },
      includeAssets: ["favicon.ico", "favicon.svg", "robots.txt"],
      manifest: {
        id: "/app",
        name: "Reshrimp",
        short_name: "Reshrimp",
        description: "Privacy-first image processing in your browser",
        theme_color: "#f8f7ff",
        background_color: "#f8f7ff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/app",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
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
