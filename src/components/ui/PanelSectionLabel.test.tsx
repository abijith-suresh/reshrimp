import { describe, expect, it } from "vitest";
import { render } from "@solidjs/testing-library";
import PanelSectionLabel from "./PanelSectionLabel";

describe("PanelSectionLabel", () => {
  it("renders children", () => {
    const { getByText } = render(() => <PanelSectionLabel>Resize</PanelSectionLabel>);
    expect(getByText("Resize")).toBeInTheDocument();
  });
});
