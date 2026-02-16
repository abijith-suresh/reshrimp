/**
 * OG image metadata for each page route
 * Used by the dynamic OG image generation endpoint
 */

export interface OgPageData {
  title: string;
  description: string;
  label?: string;
}

export const ogPageData: Record<string, OgPageData> = {
  index: {
    title: 'Reshrimp',
    description:
      'Privacy-first image processing in your browser. Nothing uploaded. Nothing tracked.',
    label: 'Image Tool',
  },
  app: {
    title: 'Image Processor',
    description: 'Resize, convert, and compress images right in your browser.',
    label: 'App',
  },
  features: {
    title: 'Features',
    description: 'Resize, convert, compress, and remove backgrounds — all client-side.',
    label: 'Overview',
  },
  about: {
    title: 'About Reshrimp',
    description: 'Built for privacy. No servers, no tracking, no uploads.',
    label: 'About',
  },
  faq: {
    title: 'FAQ',
    description: 'Common questions about Reshrimp and client-side image processing.',
    label: 'Help',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Your images never leave your device. Here is exactly how we handle data.',
    label: 'Privacy',
  },
  blog: {
    title: 'Blog',
    description: 'Guides and articles on image formats, compression, and web performance.',
    label: 'Blog',
  },
};
