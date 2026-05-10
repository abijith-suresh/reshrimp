import { describe, expect, it } from "vitest";
import { render } from "@solidjs/testing-library";
import SectionHeader from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders children", () => {
    const { getByText } = render(() => <SectionHeader>Resize</SectionHeader>);
    expect(getByText("Resize")).toBeInTheDocument();
  });
});
