import { describe, expect, it } from "vitest";
import { createFaqId } from "./faqUtils";

describe("createFaqId", () => {
  it("slugifies a simple question into a lowercase, hyphenated id", () => {
    expect(createFaqId("What is Reshrimp")).toBe("what-is-reshrimp");
  });

  it("strips non-alphanumeric characters except hyphens", () => {
    expect(createFaqId("Is it free? Yes!")).toBe("is-it-free-yes");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(createFaqId("How   does  it work")).toBe("how-does-it-work");
  });

  it("trims leading/trailing whitespace", () => {
    expect(createFaqId("  Where is my data stored?  ")).toBe("where-is-my-data-stored");
  });

  it("handles very short input", () => {
    expect(createFaqId("Hi")).toBe("hi");
  });
});
