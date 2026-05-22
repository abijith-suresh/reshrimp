import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateAspectRatio,
  createDownloadLink,
  formatFileSize,
  calculateHeightFromWidth,
  calculateWidthFromHeight,
  convertToPx,
  convertFromPx,
} from "./imageUtils";
import { setupBrowserMocks, restoreMocks } from "../test/mocks";

describe("calculateAspectRatio", () => {
  it("returns width/height ratio", () => {
    expect(calculateAspectRatio(200, 100)).toBe(2);
    expect(calculateAspectRatio(100, 200)).toBe(0.5);
    expect(calculateAspectRatio(300, 300)).toBe(1);
  });

  it("throws when height is 0", () => {
    expect(() => calculateAspectRatio(100, 0)).toThrow("Height cannot be zero");
  });

  it("returns 0 when width is 0", () => {
    expect(calculateAspectRatio(0, 100)).toBe(0);
  });

  it("handles negative values by dividing", () => {
    expect(calculateAspectRatio(-200, 100)).toBe(-2);
    expect(calculateAspectRatio(200, -100)).toBe(-2);
  });
});

describe("createDownloadLink", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupBrowserMocks();
  });

  afterEach(() => {
    restoreMocks();
    vi.useRealTimers();
  });

  it("creates an anchor with correct href and download attributes", () => {
    const blob = new Blob(["data"], { type: "image/png" });
    createDownloadLink(blob, "output.png");

    expect(document.body.appendChild).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();

    const link = (document.body.appendChild as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as HTMLAnchorElement;
    expect(link.href).toBe("blob:mock-url");
    expect(link.download).toBe("output.png");
  });

  it("removes the temporary link and revokes the object URL after cleanup", () => {
    const blob = new Blob([]);
    createDownloadLink(blob, "file.png");

    expect(document.body.appendChild).toHaveBeenCalledOnce();
    expect(document.body.removeChild).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();

    const link = (document.body.appendChild as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as HTMLAnchorElement;
    expect(document.body.removeChild).toHaveBeenCalledWith(link);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});

describe("formatFileSize", () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatFileSize(512)).toBe("512.0 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  it("formats at exactly 1 KB boundary", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("formats at exactly 1 MB boundary", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
});

describe("calculateHeightFromWidth", () => {
  it("preserves aspect ratio", () => {
    // 200x100 image → aspect 2:1 → target width 400 → height 200
    expect(calculateHeightFromWidth(200, 100, 400)).toBe(200);
  });

  it("rounds non-integer results", () => {
    // 3:2 aspect → width 10 → height = 10 / 1.5 = 6.666... → rounds to 7
    expect(calculateHeightFromWidth(3, 2, 10)).toBe(7);
  });
});

describe("calculateWidthFromHeight", () => {
  it("preserves aspect ratio", () => {
    // 200x100 image → aspect 2:1 → target height 50 → width 100
    expect(calculateWidthFromHeight(200, 100, 50)).toBe(100);
  });

  it("rounds non-integer results", () => {
    // 3:2 aspect → height 10 → width = 10 * 1.5 = 15
    expect(calculateWidthFromHeight(3, 2, 10)).toBe(15);
  });
});

describe("convertToPx", () => {
  const originalPx = 1920;
  const dpi = 96;

  it("px: returns the value rounded", () => {
    expect(convertToPx(1080, "px", originalPx, dpi)).toBe(1080);
    expect(convertToPx(1080.6, "px", originalPx, dpi)).toBe(1081);
  });

  it("%: converts percentage of original dimension", () => {
    expect(convertToPx(50, "%", 1920, dpi)).toBe(960);
    expect(convertToPx(100, "%", 1920, dpi)).toBe(1920);
    expect(convertToPx(25, "%", 1000, dpi)).toBe(250);
  });

  it("%: ignores dpi", () => {
    expect(convertToPx(50, "%", 1920, 72)).toBe(convertToPx(50, "%", 1920, 300));
  });

  it("in: converts inches to pixels using dpi", () => {
    expect(convertToPx(10, "in", originalPx, 96)).toBe(960);
    expect(convertToPx(1, "in", originalPx, 300)).toBe(300);
  });

  it("cm: converts centimetres to pixels using dpi", () => {
    expect(convertToPx(2.54, "cm", originalPx, 96)).toBe(96);
    expect(convertToPx(25.4, "cm", originalPx, 96)).toBe(960);
  });
});

describe("convertFromPx", () => {
  const originalPx = 1920;
  const dpi = 96;

  it("px: returns the value unchanged", () => {
    expect(convertFromPx(1080, "px", originalPx, dpi)).toBe(1080);
  });

  it("%: converts px back to percentage of original", () => {
    expect(convertFromPx(960, "%", 1920, dpi)).toBe(50);
    expect(convertFromPx(1920, "%", 1920, dpi)).toBe(100);
  });

  it("%: returns 0 when originalPx is 0", () => {
    expect(convertFromPx(100, "%", 0, dpi)).toBe(0);
  });

  it("in: converts px back to inches", () => {
    expect(convertFromPx(960, "in", originalPx, 96)).toBeCloseTo(10);
    expect(convertFromPx(300, "in", originalPx, 300)).toBeCloseTo(1);
  });

  it("cm: converts px back to centimetres", () => {
    expect(convertFromPx(96, "cm", originalPx, 96)).toBeCloseTo(2.54);
    expect(convertFromPx(960, "cm", originalPx, 96)).toBeCloseTo(25.4);
  });

  it("in: returns 0 when dpi is 0", () => {
    expect(convertFromPx(100, "in", originalPx, 0)).toBe(0);
  });

  it("round-trip px → unit → px stays within 1px", () => {
    const px = 1280;
    for (const unit of ["px", "%", "in", "cm"] as const) {
      const display = convertFromPx(px, unit, originalPx, dpi);
      const backToPx = convertToPx(display, unit, originalPx, dpi);
      expect(Math.abs(backToPx - px)).toBeLessThanOrEqual(1);
    }
  });
});
