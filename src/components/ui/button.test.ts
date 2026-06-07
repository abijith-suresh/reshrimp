import { describe, expect, it } from "vitest";
import { buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("builds a coral primary button by default", () => {
    const classes = buttonVariants();

    expect(classes).toContain("bg-coral-500");
    expect(classes).toContain("text-white");
    expect(classes).toContain("rounded-full");
  });

  it("supports secondary buttons with a coral tone by default", () => {
    const classes = buttonVariants({ variant: "secondary", size: "lg" });

    expect(classes).toContain("border-coral-200");
    expect(classes).toContain("bg-coral-50");
    expect(classes).toContain("px-8");
  });

  it("supports mint-toned primary buttons for success actions", () => {
    const classes = buttonVariants({ tone: "mint", fullWidth: true });

    expect(classes).toContain("bg-mint-500");
    expect(classes).toContain("w-full");
  });
});
