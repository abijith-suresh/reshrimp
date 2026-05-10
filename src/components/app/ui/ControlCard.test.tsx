import { describe, expect, it } from "vitest";
import { render } from "@solidjs/testing-library";
import ControlCard from "./ControlCard";

describe("ControlCard", () => {
  it("renders children", () => {
    const { getByText } = render(() => <ControlCard>Content</ControlCard>);
    expect(getByText("Content")).toBeInTheDocument();
  });

  it("applies inactive class when inactive is true", () => {
    const { container } = render(() => <ControlCard inactive>Content</ControlCard>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.classList.contains("controls-inactive")).toBe(true);
  });
});
