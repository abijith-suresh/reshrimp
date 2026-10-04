import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Select from "./Select";

const formatOptions = [
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
];

describe("Select", () => {
  let scrollIntoViewDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView"
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoViewDescriptor);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });

  function renderFormatSelect() {
    return render(() => (
      <Select
        ariaLabel="Output format"
        options={formatOptions}
        value="image/png"
        onChange={() => {}}
      />
    ));
  }

  it("opens from the trigger and moves keyboard focus into the listbox", async () => {
    renderFormatSelect();
    const trigger = screen.getByRole("button", { name: "Output format" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await Promise.resolve();

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Output format" })).toHaveFocus();
  });

  it("keeps its portaled listbox inside an open modal dialog", async () => {
    render(() => (
      <section role="dialog" aria-modal="true">
        <Select
          ariaLabel="Output format"
          options={formatOptions}
          value="image/png"
          onChange={() => {}}
        />
      </section>
    ));

    fireEvent.keyDown(screen.getByRole("button", { name: "Output format" }), { key: "ArrowDown" });
    await Promise.resolve();

    const listbox = within(screen.getByRole("dialog")).getByRole("listbox", {
      name: "Output format",
    });
    expect(listbox).toHaveFocus();
  });

  it("closes on escape and returns focus to the trigger", async () => {
    renderFormatSelect();
    const trigger = screen.getByRole("button", { name: "Output format" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await Promise.resolve();
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus to the adjacent control when tabbing out of the listbox", async () => {
    render(() => (
      <div>
        <button type="button">Before</button>
        <Select
          ariaLabel="Output format"
          options={formatOptions}
          value="image/png"
          onChange={() => {}}
        />
        <button type="button">After</button>
      </div>
    ));

    fireEvent.keyDown(screen.getByRole("button", { name: "Output format" }), { key: "ArrowDown" });
    await Promise.resolve();
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Tab" });
    await Promise.resolve();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("exposes the keyboard-highlighted option to assistive technology", async () => {
    renderFormatSelect();
    fireEvent.keyDown(screen.getByRole("button", { name: "Output format" }), { key: "ArrowDown" });
    await Promise.resolve();
    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: "ArrowDown" });

    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "WebP" }).id
    );
  });

  it("selects an option with the mouse and returns focus to the trigger", async () => {
    const [value, setValue] = createSignal("image/png");
    render(() => (
      <Select
        ariaLabel="Output format"
        options={formatOptions}
        value={value()}
        onChange={setValue}
      />
    ));
    const trigger = screen.getByRole("button", { name: "Output format" });
    fireEvent.click(trigger);
    await Promise.resolve();
    fireEvent.mouseDown(screen.getByRole("option", { name: "WebP" }));

    expect(value()).toBe("image/webp");
    expect(trigger).toHaveTextContent("WebP");
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
