import { Show } from "solid-js";
import AppCheckbox from "@/components/app/ui/AppCheckbox";
import InfoTooltip from "@/components/app/ui/InfoTooltip";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function BackgroundRemovalToggle() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex items-center gap-2">
      <AppCheckbox
        id="remove-background-checkbox"
        label="Remove background"
        checked={state.removeBackground()}
        onChange={actions.handleRemoveBackgroundChange}
        disabled={!state.controlsActive()}
      />
      <Show when={state.removeBackground()}>
        <InfoTooltip
          id="bg-removal-info-tip"
          ariaLabel="Background removal info"
          content={
            <>
              Format is fixed to PNG to preserve transparency. First run may take a moment while the
              model loads.
            </>
          }
          open={state.tooltipOpen()}
          onToggle={actions.setTooltipOpen}
        />
      </Show>
    </div>
  );
}
