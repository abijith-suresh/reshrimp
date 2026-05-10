/**
 * Export recipes — predefined processing configurations for common outcomes.
 *
 * Each recipe maps directly to existing ProcessOptions fields with no hidden
 * behaviour.  Users can inspect and tweak the resulting settings after
 * applying a recipe.
 */
import type { ProcessOptions } from "../types/processing";

export interface ExportRecipe {
  id: string;
  label: string;
  description: string;
  /** Partial ProcessOptions to merge into the current settings */
  options: Partial<ProcessOptions>;
}

/**
 * Built-in recipes.  IDs are stable so they can be referenced from URL
 * params or keyboard shortcuts later.
 */
export const EXPORT_RECIPES: readonly ExportRecipe[] = [
  {
    id: "email-under-500k",
    label: "Email-ready",
    description: "JPEG under 500 KB for email attachments",
    options: {
      format: "image/jpeg",
      quality: 0.8,
      targetFileSize: 512_000,
      resize: { width: 1600, maintainAspectRatio: true },
    },
  },
  {
    id: "social-post",
    label: "Social post",
    description: "1200 px wide JPEG, good quality",
    options: {
      format: "image/jpeg",
      quality: 0.85,
      resize: { width: 1200, maintainAspectRatio: true },
    },
  },
  {
    id: "web-optimized",
    label: "Web optimized",
    description: "WebP, 1000 px wide, compressed for fast loading",
    options: {
      format: "image/webp",
      quality: 0.75,
      resize: { width: 1000, maintainAspectRatio: true },
    },
  },
  {
    id: "thumbnail",
    label: "Thumbnail",
    description: "300 px wide JPEG, small file",
    options: {
      format: "image/jpeg",
      quality: 0.7,
      resize: { width: 300, maintainAspectRatio: true },
    },
  },
  {
    id: "transparent-png",
    label: "Transparent PNG",
    description: "Background removed, PNG with transparency",
    options: {
      format: "image/png",
      removeBackground: true,
    },
  },
  {
    id: "original-quality",
    label: "Original quality",
    description: "Minimal processing, preserve original dimensions",
    options: {
      quality: 0.95,
    },
  },
];

/**
 * Look up a recipe by stable ID.
 */
export function getRecipeById(id: string): ExportRecipe | undefined {
  return EXPORT_RECIPES.find((r) => r.id === id);
}

/**
 * Apply a recipe's options on top of existing settings.
 *
 * Recipe values take precedence, but undefined fields in the recipe
 * preserve the user's existing choices.
 */
export function applyRecipe(current: ProcessOptions, recipe: ExportRecipe): ProcessOptions {
  return {
    ...current,
    ...recipe.options,
    // Deep-merge resize so partial resize overrides don't lose existing fields
    resize: recipe.options.resize
      ? { ...current.resize, ...recipe.options.resize }
      : current.resize,
  };
}
