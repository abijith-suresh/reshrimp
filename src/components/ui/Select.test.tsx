import { fireEvent, render } from "@solidjs/testing-library";
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
});
