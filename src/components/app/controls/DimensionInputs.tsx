import AppInput from "@/components/app/ui/AppInput";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function DimensionInputs() {
  const { state, actions } = useImageApp();

  return (
    <div class="grid grid-cols-2 gap-3">
      <AppInput
        id="width-input"
        label="Width"
        value={state.widthValue()}
        onInput={actions.handleWidthInput}
        placeholder={state.widthPlaceholder()}
        disabled={!state.controlsActive()}
      />
      <AppInput
        id="height-input"
        label="Height"
        value={state.heightValue()}
        onInput={actions.handleHeightInput}
        placeholder={state.heightPlaceholder()}
        disabled={!state.controlsActive()}
      />
    </div>
  );
}
