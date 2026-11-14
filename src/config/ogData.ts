import { SITE_DESCRIPTION } from "./constants";

export interface OgPageData {
  title: string;
  description: string;
  label?: string;
}

export const ogPageData: Record<string, OgPageData> = {
  index: {
    title: "Resize images privately.",
    description: SITE_DESCRIPTION,
    label: "Image tool",
  },
  app: {
    title: "Resize and compress.",
    description:
      "Resize, compress, convert, or remove a background. Your image stays on your device.",
    label: "App",
  },
  faq: {
    title: "FAQ",
    description: "Short answers about sizes, limits, and privacy.",
    label: "Help",
  },
  privacy: {
    title: "Privacy",
    description:
      "Your image never leaves your device. What Reshrimp does, and what its host can see.",
    label: "Privacy",
  },
};

// Bump when the image design changes: a new filename makes crawlers fetch the
// redesign instead of their cached copy. Unversioned URLs keep working.
export const OG_IMAGE_VERSION = "v5";
