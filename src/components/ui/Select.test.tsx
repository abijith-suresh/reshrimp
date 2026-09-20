import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Select from "./Select";

describe("Select", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("opens from the trigger and moves keyboard focus into the listbox", async () => {
    const view = render(() => (
      <Select
        id="format-select"
        ariaLabel="Output format"
        options={[
          { value: "image/png", label: "PNG" },
          { value: "image/webp", label: "WebP" },
        ]}
        value="image/png"
        onChange={() => {}}
      />
    ));

    const trigger = view.container.querySelector("#format-select") as HTMLButtonElement;
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    await Promise.resolve();

    const listbox = document.querySelector('[role="listbox"]') as HTMLUListElement;

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAccessibleName("Output format");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(listbox);
  });

  it("closes on escape and returns focus to the trigger", async () => {
    const view = render(() => (
      <Select
        id="quality-select"
        options={[
          { value: "low", label: "Low" },
          { value: "high", label: "High" },
        ]}
        value="low"
        onChange={() => {}}
      />
    ));

    const trigger = view.container.querySelector("#quality-select") as HTMLButtonElement;
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    await Promise.resolve();

    const listbox = document.querySelector('[role="listbox"]') as HTMLUListElement;
    fireEvent.keyDown(listbox, { key: "Escape" });

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes an open list and ignores changes when disabled", async () => {
    const onChange = vi.fn();
    const [disabled, setDisabled] = createSignal(false);
    const view = render(() => (
      <Select
        id="unit-select"
        options={[
          { value: "px", label: "Pixels" },
          { value: "%", label: "Percent" },
        ]}
        value="px"
        disabled={disabled()}
        onChange={onChange}
      />
    ));

    const trigger = view.container.querySelector("#unit-select") as HTMLButtonElement;
    fireEvent.click(trigger);
    await Promise.resolve();
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
    const option = document.querySelector('[role="option"]') as HTMLElement;

    setDisabled(true);
    await Promise.resolve();
    fireEvent.mouseDown(option);

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(trigger).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
