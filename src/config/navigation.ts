/**
 * Navigation configuration
 * Centralized data structure for header and footer navigation
 */

import { ROUTES, GITHUB_URL } from "./constants";

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: NavLink[];
}

export const navigation = {
  header: {
    links: [
      { label: "Features", href: ROUTES.FEATURES },
      { label: "About", href: ROUTES.ABOUT },
    ],
    github: {
      href: GITHUB_URL,
      ariaLabel: "View on GitHub",
    },
  },
} as const;
