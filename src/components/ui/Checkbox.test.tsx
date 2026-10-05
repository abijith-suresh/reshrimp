import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import Checkbox from "./Checkbox";

describe("Checkbox", () => {
  it("checks and unchecks through its label and the keyboard", async () => {
    const user = userEvent.setup();
    const [checked, setChecked] = createSignal(false);
    render(() => <Checkbox label="Lock aspect ratio" checked={checked()} onChange={setChecked} />);
    const checkbox = screen.getByRole("checkbox", { name: "Lock aspect ratio" });
    await user.click(screen.getByText("Lock aspect ratio"));
    expect(checkbox).toBeChecked();
    await user.keyboard(" ");
    expect(checkbox).not.toBeChecked();
  });

  it("cannot change when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(() => (
      <Checkbox label="Lock aspect ratio" checked={false} onChange={onChange} disabled />
    ));
    await user.click(screen.getByText("Lock aspect ratio"));
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
