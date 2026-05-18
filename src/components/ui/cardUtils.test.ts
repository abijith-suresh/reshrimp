import { describe, expect, it } from "vitest";
import { cardPaddingClass } from "./cardUtils";

describe("cardPaddingClass", () => {
  it('returns p-8 for "md" (default)', () => {
    expect(cardPaddingClass("md")).toBe("p-8");
  });

  it('returns p-12 for "lg"', () => {
    expect(cardPaddingClass("lg")).toBe("p-12");
  });
});
