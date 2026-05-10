import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import AppCheckbox from "./AppCheckbox";

describe("AppCheckbox", () => {
  it("fires onChange with checked state", () => {
    const onChange = vi.fn();
    const { getByRole } = render(() => (
      <AppCheckbox label="Lock aspect ratio" checked={false} onChange={onChange} />
    ));
    const checkbox = getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <AppCheckbox label="Lock aspect ratio" checked={false} onChange={() => {}} disabled />
    ));
    expect(getByRole("checkbox")).toBeDisabled();
  });

  it("renders the label text", () => {
    const { getByText } = render(() => (
      <AppCheckbox label="Lock aspect ratio" checked={true} onChange={() => {}} />
    ));
    expect(getByText("Lock aspect ratio")).toBeInTheDocument();
  });
});
