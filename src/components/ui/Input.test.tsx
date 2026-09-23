import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import Input from "./Input";

describe("Input", () => {
  it("forwards input value", () => {
    const onInput = vi.fn();
    const { getByRole } = render(() => <Input label="Width" value="100" onInput={onInput} />);
    const input = getByRole("spinbutton", { name: "Width" });
    fireEvent.input(input, { target: { value: "200" } });
    expect(onInput).toHaveBeenCalledWith("200");
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <Input label="Width" value="100" onInput={() => {}} disabled />
    ));
    expect(getByRole("spinbutton")).toBeDisabled();
  });

  it("preserves the caret when a text-based dimension value updates", () => {
    const [value, setValue] = createSignal("500");
    const { getByRole } = render(() => (
      <Input label="Width" type="text" inputMode="numeric" value={value()} onInput={setValue} />
    ));
    const input = getByRole("textbox", { name: "Width" }) as HTMLInputElement;

    input.value = "50";
    input.setSelectionRange(1, 1);
    fireEvent.input(input);

    expect(value()).toBe("50");
    expect(input.selectionStart).toBe(1);
    expect(input).toHaveAttribute("inputmode", "numeric");
  });
});
