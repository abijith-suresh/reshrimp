import { describe, expect, it } from "vitest";
import type { ResizeUnit } from "../types/processing";
import {
  buildProcessOptions,
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

  it("preserves oversized targets so processing can reject them", () => {
    const options = buildProcessOptions({ ...baseInput, widthValue: "99999", heightValue: "" });
    expect(options.resize?.width).toBe(99999);
  });

  it("preserves percentage targets that convert past the maximum pixel dimension", () => {
    const options = buildProcessOptions({
      ...baseInput,
      widthValue: "1400",
      heightValue: "",
      resizeUnit: "%",
    });
    expect(options.resize?.width).toBe(16800);
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
      })
    ).toEqual({
      widthValue: "50",
      heightValue: "50",
    });
  });

  it("converts percentage values back to pixels for both dimensions", () => {
    expect(
      rebaseDimensionValues({
        widthValue: "50",
        heightValue: "25",
        oldUnit: "%",
        newUnit: "px",
        originalWidth: 1200,
        originalHeight: 800,
      })
    ).toEqual({
      widthValue: "600",
      heightValue: "200",
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
        originalWidth: 800,
        originalHeight: 600,
      })
    ).toEqual({
      widthValue: "400",
      heightValue: "300",
    });
  });

  it("derives the paired width when height changes in pixels", () => {
    expect(
      getLinkedDimensionValues({
        changedDimension: "height",
        value: "300",
        resizeUnit: "px",
        originalWidth: 800,
        originalHeight: 600,
      })
    ).toEqual({
      widthValue: "400",
      heightValue: "300",
    });
  });

  it("clamps a derived height to one pixel for very wide images", () => {
    expect(
      getLinkedDimensionValues({
        changedDimension: "width",
        value: "1",
        resizeUnit: "px",
        originalWidth: 16384,
        originalHeight: 1,
      })
    ).toEqual({
      widthValue: "1",
      heightValue: "1",
    });
  });

  it("clamps a derived width to one pixel for very tall images", () => {
    expect(
      getLinkedDimensionValues({
        changedDimension: "height",
        value: "1",
        resizeUnit: "px",
        originalWidth: 1,
        originalHeight: 16384,
      })
    ).toEqual({
      widthValue: "1",
      heightValue: "1",
    });
  });

  it("keeps linked percentage values below one percent valid", () => {
    expect(
      getLinkedDimensionValues({
        changedDimension: "width",
        value: "0.083",
        resizeUnit: "%",
        originalWidth: 1200,
        originalHeight: 800,
      })
    ).toEqual({
      widthValue: "0.083",
      heightValue: "0.13",
    });
  });

  it("derives fractional percentage width when height changes", () => {
    expect(
      getLinkedDimensionValues({
        changedDimension: "height",
        value: "0.125",
        resizeUnit: "%",
        originalWidth: 1200,
        originalHeight: 800,
      })
    ).toEqual({
      widthValue: "0.17",
      heightValue: "0.125",
    });
  });
});
