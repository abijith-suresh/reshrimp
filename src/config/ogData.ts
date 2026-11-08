export interface OgPageData {
  title: string;
  description: string;
  label?: string;
}

export const ogPageData: Record<string, OgPageData> = {
  index: {
    title: "Reshrimp",
    description:
      "Privacy-first image processing in your browser. Nothing uploaded. Nothing tracked.",
    label: "Image Tool",
  },
  app: {
    title: "Image Processor",
    description: "Resize, convert, and compress images right in your browser.",
    label: "App",
  },
  faq: {
    title: "FAQ",
    description: "Common questions about Reshrimp and client-side image processing.",
    label: "Help",
  },
  privacy: {
    title: "Privacy Policy",
    description: "Your images never leave your device. Here is exactly how we handle data.",
    label: "Privacy",
  },
};

// Bump when the image design changes: a new filename makes crawlers fetch the
// redesign instead of their cached copy. Unversioned URLs keep working.
export const OG_IMAGE_VERSION = "v2";
