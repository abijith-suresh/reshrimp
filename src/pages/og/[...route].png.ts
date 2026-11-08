import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import type { OgPageData } from "../../config/ogData";
import { ogPageData } from "../../config/ogData";

const WIDTH = 1200;
const HEIGHT = 630;

async function loadFont(filename: string): Promise<ArrayBuffer> {
  const path = resolve(process.cwd(), "src/assets/fonts", filename);
  const buffer = await readFile(path);
  return buffer.buffer as ArrayBuffer;
}

// Satori cannot read CSS variables, so these mirror the theme tokens in
// src/styles/global.css as sRGB hex.
const COLORS = {
  canvas: "#f8f6f4",
  surface: "#ffffff",
  line: "#e9e6e2",
  fg: "#1c1c2c",
  fgMuted: "#595969",
  primary: "#d03d37",
  coral: "#f3625d",
  coralSubtle: "#ffeae7",
  coralInk: "#ba312c",
  mint: "#66d5ba",
  lavender: "#b39ef2",
  lavenderSubtle: "#f1edff",
  yellow: "#f9d460",
};

type Node = { type: string; props: Record<string, unknown> };

function box(style: Record<string, unknown>, children?: Node | Node[] | string): Node {
  return { type: "div", props: { style: { display: "flex", ...style }, children } };
}

// The hero illustration's photo: sky, sun, two hills, and the coral subject,
// framed in white with the resize handles.
function photo(): Node {
  const handle = (position: Record<string, string>) =>
    box({
      position: "absolute",
      width: "18px",
      height: "18px",
      borderRadius: "4px",
      border: `4px solid ${COLORS.primary}`,
      backgroundColor: COLORS.surface,
      ...position,
    });

  return box(
    {
      position: "absolute",
      top: "128px",
      right: "84px",
      width: "340px",
      height: "268px",
      transform: "rotate(-3deg)",
    },
    [
      box(
        {
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: "18px",
          border: `8px solid ${COLORS.surface}`,
          backgroundImage: `linear-gradient(180deg, ${COLORS.coralSubtle}, ${COLORS.lavenderSubtle})`,
          boxShadow: "0 12px 32px rgba(28, 28, 44, 0.14)",
        },
        [
          box({
            position: "absolute",
            top: "30px",
            right: "50px",
            width: "64px",
            height: "64px",
            borderRadius: "999px",
            backgroundColor: COLORS.yellow,
          }),
          box({
            position: "absolute",
            right: "-80px",
            bottom: "-90px",
            width: "280px",
            height: "180px",
            borderRadius: "140px 140px 0 0",
            backgroundColor: COLORS.lavender,
          }),
          box({
            position: "absolute",
            left: "-80px",
            bottom: "-90px",
            width: "340px",
            height: "180px",
            borderRadius: "170px 170px 0 0",
            backgroundColor: COLORS.mint,
          }),
          box({
            position: "absolute",
            left: "82px",
            bottom: "30px",
            width: "64px",
            height: "100px",
            borderRadius: "32px 32px 12px 12px",
            backgroundColor: COLORS.coral,
          }),
        ]
      ),
      handle({ top: "-9px", left: "-9px" }),
      handle({ top: "-9px", right: "-9px" }),
      handle({ bottom: "-9px", left: "-9px" }),
      handle({ bottom: "-9px", right: "-9px" }),
    ]
  );
}

function buildOgImage(data: OgPageData): Node {
  return box(
    {
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.canvas,
    },
    box(
      {
        position: "relative",
        // Satori sizes boxes content-box: subtract the padding and border.
        width: `${WIDTH - 96 - 128 - 4}px`,
        height: `${HEIGHT - 96 - 112 - 4}px`,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        borderRadius: "32px",
        border: `2px solid ${COLORS.line}`,
        backgroundColor: COLORS.surface,
        boxShadow: "0 2px 8px rgba(28, 28, 44, 0.05)",
      },
      [
        box({ alignItems: "center", gap: "14px" }, [
          box({
            width: "18px",
            height: "18px",
            borderRadius: "999px",
            backgroundColor: COLORS.coral,
          }),
          box(
            {
              fontSize: "34px",
              fontFamily: "Bricolage Grotesque",
              color: COLORS.fg,
              letterSpacing: "-0.02em",
            },
            "reshrimp"
          ),
          ...(data.label
            ? [
                box(
                  {
                    marginLeft: "12px",
                    padding: "6px 16px",
                    borderRadius: "999px",
                    backgroundColor: COLORS.coralSubtle,
                    color: COLORS.coralInk,
                    fontSize: "20px",
                    fontFamily: "Plus Jakarta Sans SemiBold",
                  },
                  data.label
                ),
              ]
            : []),
        ]),
        box({ flexDirection: "column", maxWidth: "560px" }, [
          box(
            {
              fontSize: "64px",
              fontFamily: "Bricolage Grotesque",
              color: COLORS.fg,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
            },
            data.title
          ),
          box(
            {
              marginTop: "20px",
              fontSize: "26px",
              fontFamily: "Plus Jakarta Sans",
              color: COLORS.fgMuted,
              lineHeight: 1.45,
            },
            data.description
          ),
        ]),
        photo(),
      ]
    )
  );
}

async function renderOgImage(data: OgPageData): Promise<Buffer> {
  const [bricolageBold, jakartaRegular, jakartaSemiBold] = await Promise.all([
    loadFont("BricolageGrotesque-Bold.ttf"),
    loadFont("PlusJakartaSans-Regular.ttf"),
    loadFont("PlusJakartaSans-SemiBold.ttf"),
  ]);

  const svg = await satori(buildOgImage(data) as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Bricolage Grotesque", data: bricolageBold, weight: 700, style: "normal" },
      { name: "Plus Jakarta Sans", data: jakartaRegular, weight: 400, style: "normal" },
      { name: "Plus Jakarta Sans SemiBold", data: jakartaSemiBold, weight: 600, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });

  return Buffer.from(resvg.render().asPng());
}

export const getStaticPaths: GetStaticPaths = async () => {
  return Object.keys(ogPageData).map((key) => ({
    params: { route: key },
  }));
};

export const GET: APIRoute = async ({ params }) => {
  const route = params.route as string;

  const data: OgPageData = ogPageData[route];

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const png = await renderOgImage(data);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
