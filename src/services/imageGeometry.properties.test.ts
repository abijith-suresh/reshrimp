import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DPI_OPTIONS } from "../config/constants";
import {
  calculateHeightFromWidth,
  calculateWidthFromHeight,
  convertFromPx,
  convertToPx,
} from "../utils/imageUtils";
import { calculateDimensions } from "./imageService";
import {
  buildProcessOptions,
  formatResizeValue,
  getLinkedDimensionValues,
} from "./imageWorkflowService";

const dimension = fc.integer({ min: 1, max: 16_384 });
const options = { numRuns: 500, seed: 20261004 };
const unit = fc.constantFrom("px" as const, "%" as const, "in" as const, "cm" as const);
const dpi = fc.constantFrom(...DPI_OPTIONS);

// Type one dimension with the ratio locked, then process the pair the UI submits.
function resizeThroughUi(input: {
  originalWidth: number;
  originalHeight: number;
  changedDimension: "width" | "height";
  value: string;
  resizeUnit: "px" | "%" | "in" | "cm";
  dpi: number;
}) {
  const linked = getLinkedDimensionValues(input);
  if (!linked) throw new Error("Expected linked dimension values");
  const { resize } = buildProcessOptions({
    ...input,
    ...linked,
    maintainAspectRatio: true,
    removeBackground: false,
    formatValue: "",
    qualityValue: 92,
  });
  if (!resize) throw new Error("Expected resize options");
  return calculateDimensions(input.originalWidth, input.originalHeight, resize);
}

describe("image geometry properties", () => {
  it("fits every requested box with positive integer dimensions and a filled axis", () => {
    fc.assert(
      fc.property(
        dimension,
        dimension,
        dimension,
        dimension,
        (originalWidth, originalHeight, boxWidth, boxHeight) => {
          const result = calculateDimensions(originalWidth, originalHeight, {
            width: boxWidth,
            height: boxHeight,
            maintainAspectRatio: true,
          });
          expect(Number.isInteger(result.width)).toBe(true);
          expect(Number.isInteger(result.height)).toBe(true);
          expect(result.width).toBeGreaterThanOrEqual(1);
          expect(result.height).toBeGreaterThanOrEqual(1);
          expect(result.width).toBeLessThanOrEqual(boxWidth);
          expect(result.height).toBeLessThanOrEqual(boxHeight);
          expect(result.width === boxWidth || result.height === boxHeight).toBe(true);
          // Allow one pixel of rounding per axis.
          const scaleDifference = Math.abs(
            result.width / originalWidth - result.height / originalHeight
          );
          expect(scaleDifference).toBeLessThanOrEqual(1 / originalWidth + 1 / originalHeight);
        }
      ),
      options
    );
  });

  it("returns exactly the independent dimensions when the ratio is unlocked", () => {
    fc.assert(
      fc.property(
        dimension,
        dimension,
        dimension,
        dimension,
        (originalWidth, originalHeight, width, height) => {
          expect(
            calculateDimensions(originalWidth, originalHeight, {
              width,
              height,
              maintainAspectRatio: false,
            })
          ).toEqual({ width, height });
        }
      ),
      options
    );
  });

  it("round-trips integer pixels through every displayed unit and offered DPI", () => {
    fc.assert(
      fc.property(dimension, dimension, dpi, unit, (pixels, original, dpi, unit) => {
        const displayed = formatResizeValue(convertFromPx(pixels, unit, original, dpi), unit);
        expect(convertToPx(Number(displayed), unit, original, dpi)).toBe(pixels);
      }),
      options
    );
  });

  it("outputs exactly the typed dimension when the ratio is locked", () => {
    fc.assert(
      fc.property(
        dimension,
        dimension,
        dimension,
        fc.constantFrom("width" as const, "height" as const),
        unit,
        dpi,
        (originalWidth, originalHeight, pixels, changedDimension, resizeUnit, dpi) => {
          const originalPx = changedDimension === "width" ? originalWidth : originalHeight;
          const value = formatResizeValue(
            convertFromPx(pixels, resizeUnit, originalPx, dpi),
            resizeUnit
          );
          const result = resizeThroughUi({
            originalWidth,
            originalHeight,
            changedDimension,
            value,
            resizeUnit,
            dpi,
          });
          expect(result).toEqual(
            changedDimension === "width"
              ? {
                  width: pixels,
                  height: calculateHeightFromWidth(originalWidth, originalHeight, pixels),
                }
              : {
                  width: calculateWidthFromHeight(originalWidth, originalHeight, pixels),
                  height: pixels,
                }
          );
        }
      ),
      options
    );
  });

  it.each([
    { size: [3000, 1000], value: "1000", unit: "px", dpi: 96, expected: [1000, 333] },
    { size: [3000, 2000], value: "3.5", unit: "in", dpi: 300, expected: [1050, 700] },
    { size: [3000, 2000], value: "8.89", unit: "cm", dpi: 300, expected: [1050, 700] },
  ] as const)("resizes $size.0 × $size.1 to $value $unit wide at $dpi DPI", (example) => {
    const result = resizeThroughUi({
      originalWidth: example.size[0],
      originalHeight: example.size[1],
      changedDimension: "width",
      value: example.value,
      resizeUnit: example.unit,
      dpi: example.dpi,
    });
    expect(result).toEqual({ width: example.expected[0], height: example.expected[1] });
  });
});
