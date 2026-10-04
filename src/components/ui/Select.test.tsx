import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
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
    const user = userEvent.setup();
    renderFormatSelect();
    const trigger = screen.getByRole("button", { name: "Output format" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Output format" })).toHaveFocus();
  });

  it("keeps its portaled listbox inside an open modal dialog", async () => {
    const user = userEvent.setup();
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

    screen.getByRole("button", { name: "Output format" }).focus();
    await user.keyboard("{ArrowDown}");

    const listbox = within(screen.getByRole("dialog")).getByRole("listbox", {
      name: "Output format",
    });
    expect(listbox).toHaveFocus();
  });

  it("closes on escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderFormatSelect();
    const trigger = screen.getByRole("button", { name: "Output format" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus to the adjacent control when tabbing out of the listbox", async () => {
    const user = userEvent.setup();
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

    screen.getByRole("button", { name: "Output format" }).focus();
    await user.keyboard("{ArrowDown}");
    await user.tab();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("exposes the keyboard-highlighted option to assistive technology", async () => {
    const user = userEvent.setup();
    renderFormatSelect();
    screen.getByRole("button", { name: "Output format" }).focus();
    await user.keyboard("{ArrowDown}");
    const listbox = screen.getByRole("listbox");
    await user.keyboard("{ArrowDown}");

    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "WebP" }).id
    );
  });

  it("selects an option with the mouse and returns focus to the trigger", async () => {
    const [value, setValue] = createSignal("image/png");
    const user = userEvent.setup();
    render(() => (
      <Select
        ariaLabel="Output format"
        options={formatOptions}
        value={value()}
        onChange={setValue}
      />
    ));
    const trigger = screen.getByRole("button", { name: "Output format" });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "WebP" }));

    expect(value()).toBe("image/webp");
    expect(trigger).toHaveTextContent("WebP");
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
