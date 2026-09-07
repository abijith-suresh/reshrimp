import { describe, expect, it } from "vitest";
import { MAX_PIXEL_DIMENSION } from "../config/constants";
import type { ResizeUnit } from "../types/processing";
import {
  buildProcessOptions,
  getDimensionValuesForDpiChange,
  getFormatStateForBackgroundRemoval,
  getLinkedDimensionValues,
  rebaseDimensionValues,
} from "./imageWorkflowService";

const baseInput = {
  originalWidth: 1200,
  originalHeight: 800,
  maintainAspectRatio: true,
  removeBackground: false,
  formatValue: "",
  qualityValue: 92,
  resizeUnit: "px" as ResizeUnit,
  dpi: 96,
};

describe("buildProcessOptions", () => {
  it("converts display values into processing options", () => {
    const options = buildProcessOptions({
      ...baseInput,
      widthValue: "50",
      heightValue: "",
      resizeUnit: "%",
      formatValue: "image/webp",
      qualityValue: 75,
    });

    expect(options).toEqual({
      resize: {
        width: 600,
        maintainAspectRatio: true,
      },
      format: "image/webp",
      quality: 0.75,
      removeBackground: false,
    });
  });

  it("omits resize when no dimensions are provided", () => {
    const options = buildProcessOptions({ ...baseInput, widthValue: "", heightValue: "" });
    expect(options.resize).toBeUndefined();
  });

  it("omits resize when dimensions are not numeric", () => {
    const options = buildProcessOptions({ ...baseInput, widthValue: "abc", heightValue: "" });
    expect(options.resize).toBeUndefined();
  });

  it("keeps zero-width targets so processing can reject them", () => {
    const options = buildProcessOptions({ ...baseInput, widthValue: "0", heightValue: "" });
    expect(options.resize).toEqual({ width: 0, maintainAspectRatio: true });
  });

  it("keeps negative targets so processing can reject them", () => {
    const options = buildProcessOptions({ ...baseInput, widthValue: "-50", heightValue: "" });
    expect(options.resize).toEqual({ width: -50, maintainAspectRatio: true });
  });

  it("clamps oversized targets to the maximum pixel dimension", () => {
    const options = buildProcessOptions({ ...baseInput, widthValue: "99999", heightValue: "" });
    expect(options.resize?.width).toBe(MAX_PIXEL_DIMENSION);
  });

  it("clamps percentage targets that convert past the maximum pixel dimension", () => {
    const options = buildProcessOptions({
      ...baseInput,
      widthValue: "1400",
      heightValue: "",
      resizeUnit: "%",
    });
    expect(options.resize?.width).toBe(MAX_PIXEL_DIMENSION);
  });
});

describe("getFormatStateForBackgroundRemoval", () => {
  it("locks to PNG and restores the previous format selection", () => {
    const enabled = getFormatStateForBackgroundRemoval({
      checked: true,
      formatValue: "image/webp",
      previousFormatValue: "",
    });
    const disabled = getFormatStateForBackgroundRemoval({
      checked: false,
      formatValue: enabled.formatValue,
      previousFormatValue: enabled.previousFormatValue,
    });

    expect(enabled).toEqual({
      formatValue: "image/png",
      previousFormatValue: "image/webp",
    });
    expect(disabled).toEqual({
      formatValue: "image/webp",
      previousFormatValue: "image/webp",
    });
  });
});

describe("rebaseDimensionValues", () => {
  it("converts populated width and height values between display units", () => {
    expect(
      rebaseDimensionValues({
        widthValue: "960",
        heightValue: "540",
        oldUnit: "px",
        newUnit: "%",
        originalWidth: 1920,
        originalHeight: 1080,
        dpi: 96,
      })
    ).toEqual({
      widthValue: "50",
      heightValue: "50",
    });
  });
});

describe("getLinkedDimensionValues", () => {
  it("derives the paired dimension while preserving the aspect ratio", () => {
    expect(
      getLinkedDimensionValues({
        changedDimension: "width",
        value: "400",
        resizeUnit: "px",
        dpi: 96,
        originalWidth: 800,
        originalHeight: 600,
      })
    ).toEqual({
      widthValue: "400",
      heightValue: "300",
    });
  });
});

describe("getDimensionValuesForDpiChange", () => {
  it("recalculates physical-unit values against the new DPI", () => {
    expect(
      getDimensionValuesForDpiChange({
        widthValue: "10",
        heightValue: "5",
        resizeUnit: "in",
        originalWidth: 1200,
        originalHeight: 600,
        previousDpi: 96,
        nextDpi: 300,
      })
    ).toEqual({
      widthValue: "3.2",
      heightValue: "1.6",
    });
  });
});
