import { Show } from "solid-js";
import AppCheckbox from "@/components/app/ui/AppCheckbox";
import InfoTooltip from "@/components/app/ui/InfoTooltip";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function InlineToggles() {
  const { state, actions } = useImageApp();

  return (
    <div class="flex items-center gap-5 pt-1">
      <AppCheckbox
        id="maintain-aspect-ratio"
        label="Lock ratio"
        checked={state.maintainAspectRatio()}
        onChange={actions.handleAspectRatioChange}
        disabled={!state.controlsActive()}
      />
      <div class="flex items-center gap-1.5">
        <AppCheckbox
          id="remove-background-checkbox"
          label="Remove bg"
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
                Format is fixed to PNG to preserve transparency. First run may take a moment while
                the model loads.
              </>
            }
            open={state.tooltipOpen()}
            onToggle={actions.setTooltipOpen}
          />
        </Show>
      </div>
    </div>
  );
}
