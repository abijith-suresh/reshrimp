import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import Checkbox from "./Checkbox";

describe("Checkbox", () => {
  it("fires onChange with checked state", () => {
    const onChange = vi.fn();
    const { getByRole } = render(() => (
      <Checkbox label="Lock aspect ratio" checked={false} onChange={onChange} />
    ));
    const checkbox = getByRole("checkbox", { name: "Lock aspect ratio" }) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <Checkbox label="Lock aspect ratio" checked={false} onChange={() => {}} disabled />
    ));
    expect(getByRole("checkbox")).toBeDisabled();
  });
});
