export const GITHUB_URL = "https://github.com/abijith-suresh/reshrimp";

export const SITE_NAME = "Reshrimp";
export const SITE_DESCRIPTION =
  "Resize, compress, convert, and remove backgrounds in your browser. Your images are never uploaded.";

export const ROUTES = {
  HOME: "/",
  APP: "/app",
  PRIVACY: "/privacy",
  FAQ: "/faq",
} as const;

export const DPI_OPTIONS = [72, 96, 150, 300] as const;
export const DEFAULT_DPI = 96;

export const MAX_FILE_SIZE = 50_000_000;
export const RECOMMENDED_MAX_SIZE = 10_000_000;

export const MAX_PIXEL_DIMENSION = 16384;

// Total pixels are bounded separately because a large square canvas can
// allocate hundreds of megabytes even when each side is within the limit.
export const MAX_TOTAL_PIXELS = 32_000_000;
