import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ogPageData } from "../../config/ogData";
import type { OgPageData } from "../../config/ogData";

const WIDTH = 1200;
const HEIGHT = 630;

async function loadFont(filename: string): Promise<ArrayBuffer> {
  const path = resolve(process.cwd(), "src/assets/fonts", filename);
  const buffer = await readFile(path);
  return buffer.buffer as ArrayBuffer;
}

function buildOgImage(data: OgPageData): Record<string, unknown> {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        backgroundColor: "#f8f7ff",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Decorative blob — top right (coral)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-60px",
              right: "-40px",
              width: "320px",
              height: "320px",
              borderRadius: "62% 38% 46% 54% / 60% 44% 56% 40%",
              background: "rgba(255, 107, 107, 0.15)",
            },
          },
        },
        // Decorative blob — bottom left (lavender)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "-80px",
              left: "-60px",
              width: "400px",
              height: "400px",
              borderRadius: "44% 56% 38% 62% / 52% 60% 40% 48%",
              background: "rgba(167, 139, 250, 0.12)",
            },
          },
        },
        // Small decorative blob — center right (coral, subtle)
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "280px",
              right: "180px",
              width: "140px",
              height: "140px",
              borderRadius: "50% 50% 38% 62% / 60% 40% 60% 40%",
              background: "rgba(255, 107, 107, 0.08)",
            },
          },
        },
        // Label chip
        ...(data.label
          ? [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    marginBottom: "24px",
                  },
                  children: {
                    type: "div",
                    props: {
                      style: {
                        padding: "8px 20px",
                        borderRadius: "100px",
                        backgroundColor: "rgba(255, 107, 107, 0.12)",
                        color: "#ff6b6b",
                        fontSize: "20px",
                        fontFamily: "Plus Jakarta Sans SemiBold",
                        letterSpacing: "0.02em",
                      },
                      children: data.label,
                    },
                  },
                },
              },
            ]
          : []),
        // Title
        {
          type: "div",
          props: {
            style: {
              fontSize: "56px",
              fontFamily: "Bricolage Grotesque",
              fontWeight: 700,
              color: "#1a1a2e",
              lineHeight: 1.15,
              marginBottom: "20px",
              maxWidth: "900px",
            },
            children: data.title,
          },
        },
        // Description
        {
          type: "div",
          props: {
            style: {
              fontSize: "24px",
              fontFamily: "Plus Jakarta Sans",
              color: "#64748b",
              lineHeight: 1.5,
              maxWidth: "800px",
            },
            children: data.description,
          },
        },
        // Bottom branding
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              position: "absolute",
              bottom: "50px",
              left: "80px",
            },
            children: [
              // Coral dot
              {
                type: "div",
                props: {
                  style: {
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#ff6b6b",
                    marginRight: "12px",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "22px",
                    fontFamily: "Plus Jakarta Sans SemiBold",
                    color: "#1a1a2e",
                    letterSpacing: "-0.01em",
                  },
                  children: "reshrimp",
                },
              },
            ],
          },
        },
      ],
    },
  };
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
  const blogPosts = await getCollection("blog");

  const staticPages = Object.keys(ogPageData).map((key) => ({
    params: { route: key },
  }));

  const blogPages = blogPosts.map((post) => ({
    params: { route: `blog/${post.id}` },
  }));

  return [...staticPages, ...blogPages];
};

export const GET: APIRoute = async ({ params }) => {
  const route = params.route as string;

  let data: OgPageData;

  if (route.startsWith("blog/")) {
    const slug = route.replace("blog/", "");
    const blogPosts = await getCollection("blog");
    const post = blogPosts.find((p) => p.id === slug);

    if (!post) {
      return new Response("Not found", { status: 404 });
    }

    data = {
      title: post.data.title,
      description: post.data.description,
      label: "Blog",
    };
  } else {
    data = ogPageData[route];

    if (!data) {
      return new Response("Not found", { status: 404 });
    }
  }

  const png = await renderOgImage(data);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
