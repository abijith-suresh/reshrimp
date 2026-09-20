import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Input from "@/components/ui/Input";
import { MAX_PIXEL_DIMENSION } from "@/config/constants";

interface DimensionInputsProps {
  idPrefix?: string;
}

export default function DimensionInputs(props: DimensionInputsProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";
  const errorId = `${prefix}dimension-error`;
  const isFieldInvalid = (field: "width" | "height") => {
    const message = state.resizeError();
    if (!message) return false;
    if (message.startsWith("Width")) return field === "width";
    if (message.startsWith("Height")) return field === "height";
    return true;
  };

  return (
    <div>
      <div class="grid grid-cols-2 gap-3">
        <Input
          id={`${prefix}width-input`}
          name={`${prefix}width`}
          label="Width"
          value={state.widthValue()}
          onInput={actions.handleWidthInput}
          min={state.resizeUnit() === "px" ? 1 : 0.001}
          max={state.resizeUnit() === "px" ? MAX_PIXEL_DIMENSION : undefined}
          step={state.resizeUnit() === "px" ? 1 : "any"}
          invalid={isFieldInvalid("width")}
          ariaDescribedBy={isFieldInvalid("width") ? errorId : undefined}
          disabled={!state.controlsActive()}
        />
        <Input
          id={`${prefix}height-input`}
          name={`${prefix}height`}
          label="Height"
          value={state.heightValue()}
          onInput={actions.handleHeightInput}
          min={state.resizeUnit() === "px" ? 1 : 0.001}
          max={state.resizeUnit() === "px" ? MAX_PIXEL_DIMENSION : undefined}
          step={state.resizeUnit() === "px" ? 1 : "any"}
          invalid={isFieldInvalid("height")}
          ariaDescribedBy={isFieldInvalid("height") ? errorId : undefined}
          disabled={!state.controlsActive()}
        />
      </div>
      <Show when={state.resizeError()}>
        {(message) => (
          <p id={errorId} class="mt-2 text-xs leading-relaxed text-coral-600" role="alert">
            {message()}
          </p>
        )}
      </Show>
    </div>
  );
}
