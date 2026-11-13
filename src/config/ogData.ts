import { SITE_DESCRIPTION } from "./constants";

export interface OgPageData {
  title: string;
  description: string;
  label?: string;
}

export const ogPageData: Record<string, OgPageData> = {
  index: {
    title: "Fit your photo to the form.",
    description: SITE_DESCRIPTION,
    label: "Image tool",
  },
  app: {
    title: "Resize and compress.",
    description:
      "Set the pixel size, format, and max file size. Your image never leaves your device.",
    label: "App",
  },
  faq: {
    title: "FAQ",
    description: "Formats, limits, max file size, and what happens to your image.",
    label: "Help",
  },
  privacy: {
    title: "Privacy",
    description:
      "Your image never leaves your device. What Reshrimp does, and what the host can see.",
    label: "Privacy",
  },
};

// Bump when the image design changes: a new filename makes crawlers fetch the
// redesign instead of their cached copy. Unversioned URLs keep working.
export const OG_IMAGE_VERSION = "v5";
