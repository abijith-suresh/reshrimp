import type { ImageAdjustments } from "../types/processing";

/** The neutral / no-op adjustment values. */
export const DEFAULT_ADJUSTMENTS: Required<ImageAdjustments> = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
};

/**
 * Check whether an adjustments object represents a no-op
 * (all values are at their defaults or undefined).
 */
export function isNoOpAdjustments(adj: ImageAdjustments | undefined): boolean {
  if (!adj) return true;
  return (adj.brightness ?? 1) === 1 && (adj.contrast ?? 1) === 1 && (adj.saturation ?? 1) === 1;
}

/**
 * Build a CSS filter string from the given adjustments.
 *
 * Returns an empty string for no-op adjustments.
 */
export function buildFilterString(adj: ImageAdjustments): string {
  if (isNoOpAdjustments(adj)) return "";

  const parts: string[] = [];

  const brightness = adj.brightness ?? 1;
  if (brightness !== 1) parts.push(`brightness(${brightness})`);

  const contrast = adj.contrast ?? 1;
  if (contrast !== 1) parts.push(`contrast(${contrast})`);

  const saturation = adj.saturation ?? 1;
  if (saturation !== 1) parts.push(`saturate(${saturation})`);

  return parts.join(" ");
}
