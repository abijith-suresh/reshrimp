import { useImageApp } from "@/components/app/state/ImageAppContext";
import Input from "@/components/ui/Input";

export default function DimensionInputs() {
  const { state, actions } = useImageApp();

  return (
    <div class="grid grid-cols-2 gap-3">
      <Input
        id="width-input"
        label="Width"
        value={state.widthValue()}
        onInput={actions.handleWidthInput}
        placeholder={state.widthPlaceholder()}
        disabled={!state.controlsActive()}
      />
      <Input
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
