import { isConvertibleOutputFormat } from "../config/imageFormats";
import type { ImageFormat } from "../types/image";
import type { ProcessOptions, ResizeOptions, ResizeUnit } from "../types/processing";
import {
  calculateHeightFromWidth,
  calculateWidthFromHeight,
  convertFromPx,
  convertToPx,
} from "../utils/imageUtils";

interface BuildProcessOptionsInput {
  originalWidth: number;
  originalHeight: number;
  widthValue: string;
  heightValue: string;
  maintainAspectRatio: boolean;
  removeBackground: boolean;
  formatValue: string;
  qualityValue: number;
  resizeUnit: ResizeUnit;
}

export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ResizeOptions
): { width: number; height: number } {
  if (!options.maintainAspectRatio) {
    return {
      width: options.width ?? originalWidth,
      height: options.height ?? originalHeight,
    };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (options.width && !options.height) {
    return {
      width: options.width,
      height: Math.max(1, Math.round(options.width / aspectRatio)),
    };
  }

  if (options.height && !options.width) {
    return {
      width: Math.max(1, Math.round(options.height * aspectRatio)),
      height: options.height,
    };
  }

  if (options.width && options.height) {
    const widthScale = options.width / originalWidth;
    const heightScale = options.height / originalHeight;
    const scale = Math.min(widthScale, heightScale);

    return {
      width: Math.max(1, Math.round(originalWidth * scale)),
      height: Math.max(1, Math.round(originalHeight * scale)),
    };
  }

  return { width: originalWidth, height: originalHeight };
}

export function formatResizeValue(value: number, unit: ResizeUnit): string {
  if (unit === "px") {
    return String(Math.round(value));
  }

  const rounded = Number(value.toFixed(2));
  if (value > 0 && rounded === 0) {
    return value.toPrecision(2);
  }

  return String(rounded);
}

function rebaseDimensionValue(input: {
  value: string;
  oldUnit: ResizeUnit;
  newUnit: ResizeUnit;
  originalPx: number;
}): string {
  if (!input.value) {
    return "";
  }

  const numericValue = parseFloat(input.value);
  if (Number.isNaN(numericValue)) {
    return "";
  }

  const px = convertToPx(numericValue, input.oldUnit, input.originalPx);
  const rebasedValue = convertFromPx(px, input.newUnit, input.originalPx);
  return formatResizeValue(rebasedValue, input.newUnit);
}

export function buildProcessOptions(input: BuildProcessOptionsInput): ProcessOptions {
  const widthNumber = input.widthValue ? parseFloat(input.widthValue) : NaN;
  const heightNumber = input.heightValue ? parseFloat(input.heightValue) : NaN;
  const width = Number.isNaN(widthNumber)
    ? undefined
    : convertToPx(widthNumber, input.resizeUnit, input.originalWidth);
  const height = Number.isNaN(heightNumber)
    ? undefined
    : convertToPx(heightNumber, input.resizeUnit, input.originalHeight);

  return {
    // Explicit undefined checks instead of truthiness so that a "0" target
    // reaches the processing guard and surfaces an error instead of being
    // silently treated as "no resize requested".
    ...(width !== undefined || height !== undefined
      ? {
          resize: {
            width,
            height,
            maintainAspectRatio: input.maintainAspectRatio,
          },
        }
      : {}),
    ...(input.formatValue && isConvertibleOutputFormat(input.formatValue as ImageFormat)
      ? { format: input.formatValue as ImageFormat }
      : {}),
    quality: input.qualityValue / 100,
    removeBackground: input.removeBackground,
  };
}

export function getLinkedDimensionValues(input: {
  changedDimension: "width" | "height";
  value: string;
  resizeUnit: ResizeUnit;
  originalWidth: number;
  originalHeight: number;
}): {
  widthValue: string;
  heightValue: string;
} | null {
  if (!input.value) {
    return null;
  }

  const numericValue = parseFloat(input.value);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  if (input.changedDimension === "width") {
    const widthPx = convertToPx(numericValue, input.resizeUnit, input.originalWidth);
    const heightPx = calculateHeightFromWidth(input.originalWidth, input.originalHeight, widthPx);

    return {
      widthValue: input.value,
      heightValue: formatResizeValue(
        convertFromPx(heightPx, input.resizeUnit, input.originalHeight),
        input.resizeUnit
      ),
    };
  }

  const heightPx = convertToPx(numericValue, input.resizeUnit, input.originalHeight);
  const widthPx = calculateWidthFromHeight(input.originalWidth, input.originalHeight, heightPx);

  return {
    widthValue: formatResizeValue(
      convertFromPx(widthPx, input.resizeUnit, input.originalWidth),
      input.resizeUnit
    ),
    heightValue: input.value,
  };
}

export function rebaseDimensionValues(input: {
  widthValue: string;
  heightValue: string;
  oldUnit: ResizeUnit;
  newUnit: ResizeUnit;
  originalWidth: number;
  originalHeight: number;
}): {
  widthValue: string;
  heightValue: string;
} {
  return {
    widthValue: rebaseDimensionValue({
      value: input.widthValue,
      oldUnit: input.oldUnit,
      newUnit: input.newUnit,
      originalPx: input.originalWidth,
    }),
    heightValue: rebaseDimensionValue({
      value: input.heightValue,
      oldUnit: input.oldUnit,
      newUnit: input.newUnit,
      originalPx: input.originalHeight,
    }),
  };
}

export function getFormatStateForBackgroundRemoval(input: {
  checked: boolean;
  formatValue: string;
  previousFormatValue: string;
}): {
  formatValue: string;
  previousFormatValue: string;
} {
  if (input.checked) {
    return {
      formatValue: "image/png",
      previousFormatValue: input.formatValue,
    };
  }

  return {
    formatValue: input.previousFormatValue,
    previousFormatValue: input.previousFormatValue,
  };
}
