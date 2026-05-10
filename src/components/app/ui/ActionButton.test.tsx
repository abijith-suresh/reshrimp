import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import ActionButton from "./ActionButton";

describe("ActionButton", () => {
  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    const { getByRole } = render(() => (
      <ActionButton variant="primary" onClick={onClick}>
        Process Image
      </ActionButton>
    ));
    const btn = getByRole("button");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it("shows spinner when loading", () => {
    const { container } = render(() => (
      <ActionButton variant="primary" loading onClick={() => {}}>
        Processing...
      </ActionButton>
    ));
    const spinner = container.querySelector(".sp-btn-spinner");
    expect(spinner).toBeInTheDocument();
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <ActionButton variant="primary" disabled onClick={() => {}}>
        Process Image
      </ActionButton>
    ));
    expect(getByRole("button")).toBeDisabled();
  });
});
