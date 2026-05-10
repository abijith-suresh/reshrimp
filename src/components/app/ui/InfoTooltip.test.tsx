import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import InfoTooltip from "./InfoTooltip";

describe("InfoTooltip", () => {
  it("toggles open state on click", () => {
    const onToggle = vi.fn();
    const { getByLabelText } = render(() => (
      <InfoTooltip
        ariaLabel="DPI info"
        content={<span>DPI tooltip content</span>}
        open={false}
        onToggle={onToggle}
      />
    ));
    const btn = getByLabelText("DPI info");
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("renders content when open", () => {
    const { getByText, getByLabelText } = render(() => (
      <InfoTooltip
        ariaLabel="DPI info"
        content={<span>DPI tooltip content</span>}
        open={true}
        onToggle={() => {}}
      />
    ));
    expect(getByText("DPI tooltip content")).toBeInTheDocument();
    expect(getByLabelText("DPI info")).toBeInTheDocument();
  });
});
