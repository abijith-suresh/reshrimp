import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
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

  it("does not close when a click follows focus opening", () => {
    const [open, setOpen] = createSignal(false);
    const { getByLabelText } = render(() => (
      <InfoTooltip
        ariaLabel="DPI info"
        content={<span>DPI tooltip content</span>}
        open={open()}
        onToggle={setOpen}
      />
    ));
    const btn = getByLabelText("DPI info");

    fireEvent.focus(btn);
    expect(open()).toBe(true);

    fireEvent.click(btn);
    expect(open()).toBe(true);
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

  it("keeps a modal tooltip inside its dialog and describes its trigger", () => {
    const [open, setOpen] = createSignal(false);
    const view = render(() => (
      <section role="dialog" aria-modal="true">
        <InfoTooltip
          id="modal-dpi-info"
          ariaLabel="DPI info"
          content={<span>DPI tooltip content</span>}
          open={open()}
          onToggle={setOpen}
        />
      </section>
    ));

    const dialog = view.container.querySelector('[role="dialog"]') as HTMLElement;
    const trigger = view.container.querySelector("#modal-dpi-info-icon") as HTMLButtonElement;
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
      x: 20,
      y: 400,
      top: 400,
      right: 420,
      bottom: 780,
      left: 20,
      width: 400,
      height: 380,
      toJSON: () => ({}),
    });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 600,
      top: 600,
      right: 120,
      bottom: 620,
      left: 100,
      width: 20,
      height: 20,
      toJSON: () => ({}),
    });

    fireEvent.focus(trigger);

    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(dialog.contains(tooltip)).toBe(true);
    expect(trigger).toHaveAttribute("aria-describedby", "modal-dpi-info-tooltip");
    expect(tooltip).toHaveStyle({ bottom: "188px", left: "118px", width: "220px" });
  });

  it("closes an open tooltip on Escape before the dialog receives it", () => {
    const [open, setOpen] = createSignal(false);
    const onDialogKeyDown = vi.fn();
    const view = render(() => (
      <section role="dialog" onKeyDown={onDialogKeyDown}>
        <InfoTooltip
          ariaLabel="DPI info"
          content={<span>DPI tooltip content</span>}
          open={open()}
          onToggle={setOpen}
        />
      </section>
    ));

    const trigger = view.getByLabelText("DPI info");
    fireEvent.focus(trigger);
    expect(open()).toBe(true);

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(open()).toBe(false);
    expect(onDialogKeyDown).not.toHaveBeenCalled();
  });

  it("keeps the tooltip inside narrow viewport edges", () => {
    const innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, "innerWidth");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });

    try {
      const [open, setOpen] = createSignal(false);
      const view = render(() => (
        <InfoTooltip
          ariaLabel="DPI info"
          content={<span>DPI tooltip content</span>}
          open={open()}
          onToggle={setOpen}
        />
      ));
      const trigger = view.getByLabelText("DPI info");
      vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
        x: 288,
        y: 200,
        top: 200,
        right: 308,
        bottom: 220,
        left: 288,
        width: 20,
        height: 20,
        toJSON: () => ({}),
      });

      fireEvent.focus(trigger);

      const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
      expect(tooltip).toHaveStyle({ left: "202px", width: "220px" });
      expect(tooltip.style.getPropertyValue("--tooltip-arrow-left")).toBe("206px");
      expect(Number.parseFloat(tooltip.style.left) - 110).toBeGreaterThanOrEqual(8);
      expect(Number.parseFloat(tooltip.style.left) + 110).toBeLessThanOrEqual(312);
    } finally {
      if (innerWidthDescriptor) {
        Object.defineProperty(window, "innerWidth", innerWidthDescriptor);
      } else {
        Reflect.deleteProperty(window, "innerWidth");
      }
    }
  });

  it("flips the tooltip below its trigger when the safe top edge is near", () => {
    const root = document.documentElement;
    const previousSafeTop = root.style.getPropertyValue("--safe-area-inset-top");
    root.style.setProperty("--safe-area-inset-top", "150px");

    try {
      const [open, setOpen] = createSignal(false);
      const view = render(() => (
        <section role="dialog" aria-modal="true">
          <InfoTooltip
            ariaLabel="DPI info"
            content={<span>DPI tooltip content</span>}
            open={open()}
            onToggle={setOpen}
          />
        </section>
      ));
      const dialog = view.container.querySelector('[role="dialog"]') as HTMLElement;
      const trigger = view.getByLabelText("DPI info");
      vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 100,
        top: 100,
        right: 400,
        bottom: 700,
        left: 0,
        width: 400,
        height: 600,
        toJSON: () => ({}),
      });
      vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
        x: 100,
        y: 200,
        top: 200,
        right: 120,
        bottom: 220,
        left: 100,
        width: 20,
        height: 20,
        toJSON: () => ({}),
      });
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
        this: HTMLElement
      ) {
        if (this.getAttribute("role") === "tooltip") {
          return {
            x: 0,
            y: 0,
            top: 0,
            right: 220,
            bottom: 60,
            left: 0,
            width: 220,
            height: 60,
            toJSON: () => ({}),
          };
        }
        return {
          x: 0,
          y: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: 0,
          height: 0,
          toJSON: () => ({}),
        };
      });

      fireEvent.focus(trigger);

      const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
      expect(tooltip).toHaveClass("info-tooltip-below");
      expect(tooltip).toHaveStyle({ top: "128px" });
    } finally {
      if (previousSafeTop) root.style.setProperty("--safe-area-inset-top", previousSafeTop);
      else root.style.removeProperty("--safe-area-inset-top");
    }
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
