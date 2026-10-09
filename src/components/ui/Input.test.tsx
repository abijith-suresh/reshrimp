import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import Input from "./Input";

describe("Input", () => {
  it("updates a controlled numeric value as the user types", async () => {
    const user = userEvent.setup();
    const [value, setValue] = createSignal("100");
    render(() => <Input label="Width" value={value()} onInput={setValue} />);
    const input = screen.getByRole("spinbutton", { name: "Width" });
    await user.clear(input);
    await user.type(input, "200");
    expect(input).toHaveValue(200);
    expect(value()).toBe("200");
  });

  it("does not accept typing when disabled", async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();
    render(() => <Input label="Width" value="100" onInput={onInput} disabled />);
    const input = screen.getByRole("spinbutton", { name: "Width" });
    await user.type(input, "200");
    expect(input).toHaveValue(100);
    expect(onInput).not.toHaveBeenCalled();
  });

  it("keeps decimal commas in text inputs for physical dimensions", async () => {
    const user = userEvent.setup();
    const [value, setValue] = createSignal("1");
    render(() => (
      <Input label="Width" type="text" inputMode="decimal" value={value()} onInput={setValue} />
    ));
    const input = screen.getByRole("textbox", { name: "Width" });
    await user.clear(input);
    await user.type(input, "1,5");
    expect(input).toHaveValue("1,5");
    expect(value()).toBe("1,5");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });
});
