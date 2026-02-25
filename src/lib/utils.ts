/**
 * URL utility functions
 * Centralized to avoid duplication across components
 */

const baseUrl = import.meta.env.BASE_URL;

/**
 * Create a properly formatted href path
 * Handles base URL and removes duplicate slashes
 */
export function makeHref(path: string): string {
  return `${baseUrl}${path}`.replace(/\/+/g, "/");
}
