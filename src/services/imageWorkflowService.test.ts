import { describe, expect, it } from "vitest";
import {
  buildProcessOptions,
  getDimensionValuesForDpiChange,
  getFormatStateForBackgroundRemoval,
  getLinkedDimensionValues,
  rebaseDimensionValues,
} from "./imageWorkflowService";

describe("buildProcessOptions", () => {
  it("converts display values into processing options", () => {
    const options = buildProcessOptions({
      originalWidth: 1200,
      originalHeight: 800,
      widthValue: "50",
      heightValue: "",
      maintainAspectRatio: true,
      removeBackground: false,
      formatValue: "image/webp",
      qualityValue: 75,
      resizeUnit: "%",
      dpi: 96,
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
