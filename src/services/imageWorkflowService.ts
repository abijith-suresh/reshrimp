import { isConvertibleOutputFormat } from "../config/imageFormats";
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
  targetFileSizeBytes?: number;
  resizeUnit: ResizeUnit;
  dpi: number;
}

export function parseTargetFileSizeKilobytes(value: string): number | null {
  // "1,500" is a thousands separator; "1,5" is a decimal comma.
  const normalized = value
    .trim()
    .replace(/,(?=\d{3}(?!\d))/g, "")
    .replace(",", ".");
  if (!normalized || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    return null;
  }

  // Portals count a kilobyte as 1,000 bytes.
  const targetBytes = Math.round(Number(normalized) * 1000);
  if (!Number.isSafeInteger(targetBytes) || targetBytes < 1) {
    return null;
  }

  return targetBytes;
}

export function formatResizeValue(value: number, unit: ResizeUnit): string {
  if (unit === "px") {
    return String(Math.round(value));
  }

  // Three decimals keep every pixel at the offered DPIs.
  const rounded = Number(value.toFixed(3));
  if (value > 0 && rounded === 0) {
    return value.toPrecision(2);
  }

  return String(rounded);
}

function parseDimensionInput(value: string, unit?: ResizeUnit): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  // Pixels are whole numbers, so a comma groups thousands ("1,920").
  if (unit === "px") return Number(trimmedValue.replaceAll(",", ""));

  // Accept decimal commas. Reject numeric values followed by text.
  return Number(trimmedValue.replace(",", "."));
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

  const numericValue = parseDimensionInput(input.value, input.oldUnit);
  if (numericValue === undefined || !Number.isFinite(numericValue)) {
    return "";
  }

  const px = convertToPx(numericValue, input.oldUnit, input.originalPx, input.dpi);
  const rebasedValue = convertFromPx(px, input.newUnit, input.originalPx, input.dpi);
  return formatResizeValue(rebasedValue, input.newUnit);
}

export function buildProcessOptions(input: BuildProcessOptionsInput): ProcessOptions {
  const widthNumber = parseDimensionInput(input.widthValue, input.resizeUnit);
  const heightNumber = parseDimensionInput(input.heightValue, input.resizeUnit);
  const width =
    widthNumber === undefined
      ? undefined
      : convertToPx(widthNumber, input.resizeUnit, input.originalWidth, input.dpi);
  const height =
    heightNumber === undefined
      ? undefined
      : convertToPx(heightNumber, input.resizeUnit, input.originalHeight, input.dpi);

  return {
    // Keep zero values so the processing guard can reject them.
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
    ...(input.targetFileSizeBytes !== undefined
      ? { targetFileSizeBytes: input.targetFileSizeBytes }
      : {}),
  };
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

  const numericValue = parseDimensionInput(input.value, input.resizeUnit);
  if (numericValue === undefined || !Number.isFinite(numericValue)) {
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
