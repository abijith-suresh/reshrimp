/**
 * Application-wide constants
 * Centralized configuration for easy updates
 */

// GitHub repository URL
export const GITHUB_URL = "https://github.com/abijith-suresh/reshrimp";

// Site metadata
export const SITE_NAME = "Reshrimp";
export const SITE_TAGLINE = "Privacy-first image processing in your browser";
export const SITE_DESCRIPTION =
  "Resize, convert, and compress images right in your browser. Nothing gets uploaded. Nothing gets tracked. It just works.";

// Navigation paths (relative to base URL)
export const ROUTES = {
  HOME: "/",
  APP: "/app",
  FEATURES: "/features",
  PRIVACY: "/privacy",
  BLOG: "/blog",
  ABOUT: "/about",
  FAQ: "/faq",
  CHANGELOG: "/changelog",
} as const;
