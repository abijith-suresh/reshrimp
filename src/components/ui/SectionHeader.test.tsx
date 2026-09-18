import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import SectionHeader from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders children", () => {
    const { getByRole } = render(() => <SectionHeader>Resize</SectionHeader>);
    expect(getByRole("heading", { level: 4, name: "Resize" })).toBeInTheDocument();
  });
});
