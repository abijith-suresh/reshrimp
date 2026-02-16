// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { visualizer } from 'rollup-plugin-visualizer';

// https://astro.build/config
export default defineConfig({
  site: 'https://abijith-suresh.github.io',
  base: '/reshrimp',
  integrations: [sitemap()],
  vite: {
    plugins: [
      tailwindcss(),
      process.env.ANALYZE === 'true' &&
        visualizer({
          emitFile: true,
          filename: 'stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ],
  },
});
