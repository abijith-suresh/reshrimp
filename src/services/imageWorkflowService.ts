import type { ImageFormat } from "../types/image";
import type { ProcessOptions, ResizeUnit } from "../types/processing";
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
  dpi: number;
}

export function formatResizeValue(value: number, unit: ResizeUnit): string {
  if (unit === "px") {
    return String(Math.round(value));
  }

  return parseFloat(value.toFixed(2)).toString();
}

function rebaseDimensionValue(input: {
  value: string;
  oldUnit: ResizeUnit;
  newUnit: ResizeUnit;
  originalPx: number;
  dpi: number;
}): string {
  if (!input.value) {
    return "";
  }

  const numericValue = parseFloat(input.value);
  if (Number.isNaN(numericValue)) {
    return "";
  }

  const px = convertToPx(numericValue, input.oldUnit, input.originalPx, input.dpi);
  const rebasedValue = convertFromPx(px, input.newUnit, input.originalPx, input.dpi);
  return formatResizeValue(rebasedValue, input.newUnit);
}

export function buildProcessOptions(input: BuildProcessOptionsInput): ProcessOptions {
  const widthNumber = input.widthValue ? parseFloat(input.widthValue) : NaN;
  const heightNumber = input.heightValue ? parseFloat(input.heightValue) : NaN;
  const width = Number.isNaN(widthNumber)
    ? undefined
    : convertToPx(widthNumber, input.resizeUnit, input.originalWidth, input.dpi);
  const height = Number.isNaN(heightNumber)
    ? undefined
    : convertToPx(heightNumber, input.resizeUnit, input.originalHeight, input.dpi);

  return {
    ...(width || height
      ? {
          resize: {
            width,
            height,
            maintainAspectRatio: input.maintainAspectRatio,
          },
        }
      : {}),
    ...(input.formatValue ? { format: input.formatValue as ImageFormat } : {}),
    quality: input.qualityValue / 100,
    removeBackground: input.removeBackground,
  };
}

function updateDimensionForDpi(
  value: string,
  unit: ResizeUnit,
  originalPx: number,
  previousDpi: number,
  nextDpi: number
): string {
  if (!value) {
    return "";
  }

  const numericValue = parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return "";
  }

  const px = convertToPx(numericValue, unit, originalPx, previousDpi);
  return formatResizeValue(convertFromPx(px, unit, originalPx, nextDpi), unit);
}

export function getLinkedDimensionValues(input: {
  changedDimension: "width" | "height";
  value: string;
  resizeUnit: ResizeUnit;
  dpi: number;
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
    const widthPx = convertToPx(numericValue, input.resizeUnit, input.originalWidth, input.dpi);
    const heightPx = calculateHeightFromWidth(input.originalWidth, input.originalHeight, widthPx);

    return {
      widthValue: input.value,
      heightValue: formatResizeValue(
        convertFromPx(heightPx, input.resizeUnit, input.originalHeight, input.dpi),
        input.resizeUnit
      ),
    };
  }

  const heightPx = convertToPx(numericValue, input.resizeUnit, input.originalHeight, input.dpi);
  const widthPx = calculateWidthFromHeight(input.originalWidth, input.originalHeight, heightPx);

  return {
    widthValue: formatResizeValue(
      convertFromPx(widthPx, input.resizeUnit, input.originalWidth, input.dpi),
      input.resizeUnit
    ),
    heightValue: input.value,
  };
}

export function getDimensionValuesForDpiChange(input: {
  widthValue: string;
  heightValue: string;
  resizeUnit: ResizeUnit;
  originalWidth: number;
  originalHeight: number;
  previousDpi: number;
  nextDpi: number;
}): {
  widthValue: string;
  heightValue: string;
} {
  if (input.resizeUnit === "px" || input.resizeUnit === "%") {
    return {
      widthValue: input.widthValue,
      heightValue: input.heightValue,
    };
  }

  return {
    widthValue: updateDimensionForDpi(
      input.widthValue,
      input.resizeUnit,
      input.originalWidth,
      input.previousDpi,
      input.nextDpi
    ),
    heightValue: updateDimensionForDpi(
      input.heightValue,
      input.resizeUnit,
      input.originalHeight,
      input.previousDpi,
      input.nextDpi
    ),
  };
}

export function rebaseDimensionValues(input: {
  widthValue: string;
  heightValue: string;
  oldUnit: ResizeUnit;
  newUnit: ResizeUnit;
  originalWidth: number;
  originalHeight: number;
  dpi: number;
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
      dpi: input.dpi,
    }),
    heightValue: rebaseDimensionValue({
      value: input.heightValue,
      oldUnit: input.oldUnit,
      newUnit: input.newUnit,
      originalPx: input.originalHeight,
      dpi: input.dpi,
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
