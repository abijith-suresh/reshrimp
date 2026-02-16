import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';

const SIZE = 180;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="36" fill="#f8f7ff" />
  <circle cx="90" cy="90" r="48" fill="#ff6b6b" />
</svg>`;

export const GET: APIRoute = () => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: SIZE },
  });

  const png = Buffer.from(resvg.render().asPng());

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
