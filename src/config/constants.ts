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

// File size limits (in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const RECOMMENDED_MAX_SIZE = 10 * 1024 * 1024;
