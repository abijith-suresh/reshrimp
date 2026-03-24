import { Resvg } from "@resvg/resvg-js";

export function createPwaIconResponse(size: number): Response {
  const outerRadius = Math.round(size * 0.2);
  const circleRadius = Math.round(size * 0.27);
  const shadowRadius = Math.round(size * 0.29);
  const center = size / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${outerRadius}" fill="#f8f7ff" />
    <circle cx="${center}" cy="${center}" r="${shadowRadius}" fill="#fff0f0" />
    <circle cx="${center}" cy="${center}" r="${circleRadius}" fill="#ff6b6b" />
  </svg>`;

  const png = Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: "width", value: size },
    })
      .render()
      .asPng()
  );

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
