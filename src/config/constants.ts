/**
 * Application-wide constants
 * Centralized configuration for easy updates
 */

// GitHub repository URL
export const GITHUB_URL = 'https://github.com/abijith-suresh/reshrimp';

// Site metadata
export const SITE_NAME = 'Reshrimp';
export const SITE_TAGLINE = 'Privacy-first image processing in your browser';

// Navigation paths (relative to base URL)
export const ROUTES = {
  HOME: '/',
  APP: '/app',
  FEATURES: '/features',
  PRIVACY: '/privacy',
  BLOG: '/blog',
  ABOUT: '/about',
  FAQ: '/faq',
} as const;

// Header navigation links
export const NAV_LINKS = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'Features', path: ROUTES.FEATURES },
  { label: 'Blog', path: ROUTES.BLOG },
  { label: 'About', path: ROUTES.ABOUT },
] as const;
