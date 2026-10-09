import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { convertFromPx, convertToPx } from "../utils/imageUtils";
import { calculateDimensions } from "./imageService";

const dimension = fc.integer({ min: 1, max: 16_384 });
const options = { numRuns: 500, seed: 20261004 };

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

  it("round-trips integer pixels through every display unit and DPI", () => {
    fc.assert(
      fc.property(
        dimension,
        dimension,
        fc.integer({ min: 1, max: 1200 }),
        fc.constantFrom("px" as const, "%" as const, "in" as const, "cm" as const),
        (pixels, original, dpi, unit) => {
          const displayed = convertFromPx(pixels, unit, original, dpi);
          expect(convertToPx(displayed, unit, original, dpi)).toBe(pixels);
        }
      ),
      options
    );
  });
});
