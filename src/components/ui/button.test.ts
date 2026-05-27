import { describe, expect, it } from "vitest";
import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("builds a coral primary button by default", () => {
    const classes = buttonVariants();

    expect(classes).toContain("bg-sp-coral");
    expect(classes).toContain("text-white");
    expect(classes).toContain("rounded-sp-full");
  });

  it("supports secondary buttons without a filled tone", () => {
    const classes = buttonVariants({ variant: "secondary", size: "lg" });

    expect(classes).toContain("border-sp-border");
    expect(classes).toContain("bg-sp-bg-card");
    expect(classes).toContain("px-8");
  });

  it("supports mint-toned primary buttons for success actions", () => {
    const classes = buttonVariants({ tone: "mint", fullWidth: true });

    expect(classes).toContain("bg-sp-mint");
    expect(classes).toContain("w-full");
  });
});
