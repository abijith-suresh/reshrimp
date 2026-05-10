import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@solidjs/testing-library";
import AppSlider from "./AppSlider";

describe("AppSlider", () => {
  it("fires onInput with the new value", () => {
    const onInput = vi.fn();
    const { getByRole } = render(() => (
      <AppSlider label="Quality" value={50} onInput={onInput} min={0} max={100} />
    ));
    const slider = getByRole("slider") as HTMLInputElement;
    fireEvent.input(slider, { target: { value: "75" } });
    expect(onInput).toHaveBeenCalledWith(75);
  });

  it("respects disabled state", () => {
    const { getByRole } = render(() => (
      <AppSlider label="Quality" value={50} onInput={() => {}} min={0} max={100} disabled />
    ));
    expect(getByRole("slider")).toBeDisabled();
  });

  it("shows the value when showValue is true", () => {
    const { getByText } = render(() => (
      <AppSlider label="Quality" value={75} onInput={() => {}} min={0} max={100} showValue />
    ));
    expect(getByText("75%")).toBeInTheDocument();
  });
});
