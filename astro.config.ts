import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import { defineConfig } from "astro/config";
import { visualizer } from "rollup-plugin-visualizer";

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
        globPatterns: ["**/*.{css,html,ico,js,png,svg,ttf,webmanifest,woff2}"],
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
      alias: {
        "@": "/src",
      },
    },
  },
});
