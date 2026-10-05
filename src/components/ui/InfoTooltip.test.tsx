import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import InfoTooltip from "./InfoTooltip";

function renderTooltip(inDialog = false) {
  const user = userEvent.setup();
  const onDialogKeyDown = vi.fn();
  const view = render(() => {
    const [open, setOpen] = createSignal(false);
    const content = (
      <>
        <InfoTooltip
          id="dpi-help"
          ariaLabel="DPI info"
          content={<span>DPI controls pixels per inch.</span>}
          open={open()}
          onToggle={setOpen}
        />
        <button type="button">Next control</button>
      </>
    );
    return inDialog ? (
      <section role="dialog" aria-label="Controls" onKeyDown={onDialogKeyDown}>
        {content}
      </section>
    ) : (
      content
    );
  });
  return {
    ...view,
    user,
    onDialogKeyDown,
    trigger: view.getByRole("button", { name: "DPI info" }),
  };
}

describe("InfoTooltip", () => {
  it("opens on keyboard focus, survives activation, and closes on blur", async () => {
    const view = renderTooltip();
    await view.user.tab();
    expect(view.trigger).toHaveFocus();
    expect(view.trigger).toHaveAccessibleDescription("DPI controls pixels per inch.");
    await view.user.keyboard("{Enter}");
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await view.user.tab();
    expect(view.getByRole("button", { name: "Next control" })).toHaveFocus();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(view.trigger).not.toHaveAttribute("aria-describedby");
  });

  it("opens on hover and closes when the pointer leaves", async () => {
    const view = renderTooltip();
    await view.user.hover(view.trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await view.user.unhover(view.trigger);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("keeps help open through the full pointer click sequence", async () => {
    const view = renderTooltip();
    await view.user.click(view.trigger);
    expect(screen.getByRole("tooltip")).toHaveTextContent("DPI controls pixels per inch.");
    await view.user.click(view.getByRole("button", { name: "Next control" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders modal help inside its dialog and consumes Escape before the dialog", async () => {
    const view = renderTooltip(true);
    await view.user.tab();
    const dialog = view.getByRole("dialog", { name: "Controls" });
    expect(within(dialog).getByRole("tooltip")).toBeInTheDocument();
    expect(view.trigger).toHaveAccessibleDescription("DPI controls pixels per inch.");
    await view.user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(view.trigger).toHaveFocus();
    expect(view.onDialogKeyDown).not.toHaveBeenCalled();
    await view.user.keyboard("{Escape}");
    expect(view.onDialogKeyDown).toHaveBeenCalledOnce();
  });
});
