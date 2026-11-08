import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import InfoTooltip from "./InfoTooltip";

it("toggles help with keyboard activation and exposes its expanded state", async () => {
  const user = userEvent.setup();
  render(() => <InfoTooltip ariaLabel="DPI info" content="DPI controls pixels per inch." />);
  const button = screen.getByRole("button", { name: "DPI info" });
  const help = screen.getByText("DPI controls pixels per inch.");
  expect(button).toHaveAttribute("aria-controls", help.id);
  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(help).not.toBeVisible();
  await user.tab();
  await user.keyboard("{Enter}");
  expect(button).toHaveAttribute("aria-expanded", "true");
  expect(help).toBeVisible();
  await user.click(button);
  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(help).not.toBeVisible();
});
