import { fireEvent, render } from "@solidjs/testing-library";
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

  it("uses whole positive increments by default", () => {
    const { getByRole } = render(() => <Input label="Width" value="1200" onInput={() => {}} />);
    const input = getByRole("spinbutton");

    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("step", "1");
    expect(input).toHaveAttribute("autocomplete", "off");
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <Input label="Width" value="100" onInput={() => {}} disabled />
    ));
    expect(getByRole("spinbutton")).toBeDisabled();
  });

  it("associates invalid state with a descriptive error", () => {
    const { getByRole } = render(() => (
      <Input
        label="Width"
        value="0"
        invalid={true}
        ariaDescribedBy="width-error"
        onInput={() => {}}
      />
    ));
    const input = getByRole("spinbutton");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "width-error");
  });
});
