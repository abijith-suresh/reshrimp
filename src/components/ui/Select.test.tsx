import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import Select from "./Select";

it("reports the selected value and preserves disabled options", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(() => (
    <Select
      ariaLabel="Output format"
      options={[
        { value: "image/png", label: "PNG" },
        { value: "image/webp", label: "WebP" },
        { value: "image/avif", label: "AVIF", disabled: true },
      ]}
      value="image/png"
      onChange={onChange}
    />
  ));
  await user.selectOptions(screen.getByRole("combobox", { name: "Output format" }), "image/webp");
  expect(onChange).toHaveBeenCalledWith("image/webp");
  expect(screen.getByRole("option", { name: "AVIF" })).toBeDisabled();
});
