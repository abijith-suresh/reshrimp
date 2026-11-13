import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Checkbox from "@/components/ui/Checkbox";

interface InlineTogglesProps {
  idPrefix?: string;
  showAspectRatio?: boolean;
  showBackground?: boolean;
}

export default function InlineToggles(props: InlineTogglesProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";

  return (
    <div class="flex items-center gap-5">
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
        <div class="flex flex-col items-start gap-1.5">
          <Checkbox
            id={`${prefix}remove-background-checkbox`}
            label="Remove bg"
            checked={state.removeBackground()}
            onChange={actions.handleRemoveBackgroundChange}
            disabled={!state.controlsActive()}
          />
          <Show when={state.removeBackground()}>
            <p class={state.modelDownloadNotice() ? "text-xs text-fg" : "text-xs text-fg-muted"}>
              {state.modelDownloadNotice() ??
                "Exports PNG to keep transparency. The first run loads the model."}
            </p>
          </Show>
        </div>
      </Show>
    </div>
  );
}
