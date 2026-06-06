const BACKGROUND_REMOVAL_DATA_VERSION = "1.7.0";
export const BACKGROUND_REMOVAL_MODEL = "isnet_fp16";

/**
 * Runtime assets are served from the app origin after a build-time mirror step.
 * This keeps background removal under repository control without shipping the
 * full upstream asset package.
 */
export const BACKGROUND_REMOVAL_ASSET_PATH_PREFIX = `/background-removal/${BACKGROUND_REMOVAL_DATA_VERSION}/dist/`;

export const BACKGROUND_REMOVAL_SELF_HOSTED_CACHE_NAME = "imgly-background-removal-self-hosted";
export const BACKGROUND_REMOVAL_RUNTIME_CACHE_NAME = "imgly-background-removal-runtime";
export const BACKGROUND_REMOVAL_RUNTIME_ASSET_PATTERN = /\/ort(?:[.-]|$)/;

export function getBackgroundRemovalPublicPath(origin: string): string {
  return new URL(BACKGROUND_REMOVAL_ASSET_PATH_PREFIX, origin).toString();
}
