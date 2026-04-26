/**
 * Social media dimension presets for the resize panel.
 * All dimensions are in pixels.
 */

export interface SocialMediaPreset {
  label: string;
  width: number;
  height: number;
}

export const SOCIAL_MEDIA_PRESETS: SocialMediaPreset[] = [
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Twitter / X Post", width: 1200, height: 675 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "LinkedIn Post", width: 1200, height: 627 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "OG Image", width: 1200, height: 630 },
];
