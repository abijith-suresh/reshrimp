/**
 * Application-wide constants
 * Centralized configuration for easy updates
 */

// GitHub repository URL
export const GITHUB_URL = "https://github.com/abijith-suresh/reshrimp";

// Site metadata
export const SITE_NAME = "Reshrimp";
export const SITE_DESCRIPTION =
  "Resize, convert, and compress images right in your browser. Nothing gets uploaded. Nothing gets tracked.";

// Navigation paths (relative to base URL)
export const ROUTES = {
  HOME: "/",
  APP: "/app",
  FEATURES: "/features",
  PRIVACY: "/privacy",
  ABOUT: "/about",
  FAQ: "/faq",
} as const;

// Resize unit DPI options (used when unit is 'in' or 'cm')
export const DPI_OPTIONS = [72, 96, 150, 300] as const;
export const DEFAULT_DPI = 96;

// File size limits (in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const RECOMMENDED_MAX_SIZE = 10 * 1024 * 1024;

// Maximum pixel dimension for canvas operations (browser-safe upper bound)
export const MAX_PIXEL_DIMENSION = 16384;
