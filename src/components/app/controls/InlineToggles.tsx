import { createSignal, Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Checkbox from "@/components/ui/Checkbox";
import InfoTooltip from "@/components/ui/InfoTooltip";

interface InlineTogglesProps {
  idPrefix?: string;
  showAspectRatio?: boolean;
  showBackground?: boolean;
}

export default function InlineToggles(props: InlineTogglesProps) {
  const { state, actions } = useImageApp();
  const [tooltipOpen, setTooltipOpen] = createSignal(false);
  const prefix = props.idPrefix ?? "";

  return (
    <div class="flex items-center gap-5 pt-1">
      <Show when={props.showAspectRatio ?? true}>
        <Checkbox
          id={`${prefix}maintain-aspect-ratio`}
          label="Lock ratio"
          checked={state.maintainAspectRatio()}
          onChange={actions.handleAspectRatioChange}
          disabled={!state.controlsActive()}
        />
      </Show>
      <Show when={props.showBackground ?? true}>
        <div class="flex items-center gap-1.5">
          <Checkbox
            id={`${prefix}remove-background-checkbox`}
            label="Remove bg"
            checked={state.removeBackground()}
            onChange={actions.handleRemoveBackgroundChange}
            disabled={!state.controlsActive()}
          />
          <Show when={state.removeBackground()}>
            <InfoTooltip
              id={`${prefix}bg-removal-info-tip`}
              ariaLabel="Background removal info"
              content={
                <>
                  Format is fixed to PNG to preserve transparency. First run may take a moment while
                  the model loads.
                </>
              }
              open={tooltipOpen()}
              onToggle={setTooltipOpen}
            />
          </Show>
        </div>
      </Show>
    </div>
  );
}
