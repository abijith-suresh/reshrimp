import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import Input from "./Input";

describe("Input", () => {
  it("forwards input value", () => {
    const onInput = vi.fn();
    const { getByRole } = render(() => <Input label="Width" value="100" onInput={onInput} />);
    const input = getByRole("spinbutton");
    fireEvent.input(input, { target: { value: "200" } });
    expect(onInput).toHaveBeenCalledWith("200");
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <Input label="Width" value="100" onInput={() => {}} disabled />
    ));
    expect(getByRole("spinbutton")).toBeDisabled();
  });

  it("renders the label", () => {
    const { getByText } = render(() => <Input label="Height" value="200" onInput={() => {}} />);
    expect(getByText("Height")).toBeInTheDocument();
  });
});
