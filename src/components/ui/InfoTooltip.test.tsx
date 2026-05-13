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
    const { baseElement, getByLabelText } = render(() => (
      <InfoTooltip
        ariaLabel="DPI info"
        content={<span>DPI tooltip content</span>}
        open={true}
        onToggle={() => {}}
      />
    ));
    expect(baseElement.querySelector("[role='tooltip']")).toHaveTextContent("DPI tooltip content");
    expect(getByLabelText("DPI info")).toBeInTheDocument();
  });

  it("closes on click outside when open", () => {
    const onToggle = vi.fn();
    const { container } = render(() => (
      <InfoTooltip
        ariaLabel="DPI info"
        content={<span>DPI tooltip content</span>}
        open={true}
        onToggle={onToggle}
      />
    ));
    // Click outside the tooltip container
    fireEvent.click(container);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("does not double-close on click inside when open", () => {
    const onToggle = vi.fn();
    const { getByLabelText } = render(() => (
      <InfoTooltip
        ariaLabel="DPI info"
        content={<span>DPI tooltip content</span>}
        open={true}
        onToggle={onToggle}
      />
    ));
    // Click the icon button inside the tooltip — this toggles it closed
    const btn = getByLabelText("DPI info");
    fireEvent.click(btn);
    // Should be called exactly once (from the toggle, not from outside click)
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
