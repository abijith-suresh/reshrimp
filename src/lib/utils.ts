/**
 * URL utility functions
 * Centralized to avoid duplication across components
 */

const baseUrl = import.meta.env.BASE_URL;

type ClassValue = string | false | null | undefined;

/**
 * Create a properly formatted href path
 * Handles base URL and removes duplicate slashes
 */
export function makeHref(path: string): string {
  return `${baseUrl}${path}`.replace(/\/+/g, "/");
}

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
