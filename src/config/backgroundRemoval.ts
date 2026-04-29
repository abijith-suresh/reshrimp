export const BACKGROUND_REMOVAL_CDN_ORIGIN = "https://staticimgly.com";
export const BACKGROUND_REMOVAL_DATA_VERSION = "1.7.0";
export const BACKGROUND_REMOVAL_CDN_PATH_PREFIX = `/@imgly/background-removal-data/${BACKGROUND_REMOVAL_DATA_VERSION}/dist/`;
export const BACKGROUND_REMOVAL_PUBLIC_PATH = `${BACKGROUND_REMOVAL_CDN_ORIGIN}${BACKGROUND_REMOVAL_CDN_PATH_PREFIX}`;
export const BACKGROUND_REMOVAL_MODEL = "isnet_fp16" as const;
export const BACKGROUND_REMOVAL_CDN_CACHE_NAME = "imgly-background-removal-cdn";
export const BACKGROUND_REMOVAL_RUNTIME_CACHE_NAME = "imgly-background-removal-runtime";
export const BACKGROUND_REMOVAL_RUNTIME_ASSET_PATTERN = /\/ort(?:[.-]|$)/;
