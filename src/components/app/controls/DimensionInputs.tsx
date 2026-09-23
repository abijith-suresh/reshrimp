import { useImageApp } from "@/components/app/state/ImageAppContext";
import Input from "@/components/ui/Input";

interface DimensionInputsProps {
  idPrefix?: string;
}

export default function DimensionInputs(props: DimensionInputsProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";

  return (
    <div class="grid grid-cols-2 gap-3">
      <Input
        id={`${prefix}width-input`}
        label="Width"
        type="text"
        inputMode={state.resizeUnit() === "px" ? "numeric" : "decimal"}
        value={state.widthValue()}
        onInput={actions.handleWidthInput}
        placeholder={state.widthPlaceholder()}
        disabled={!state.controlsActive()}
      />
      <Input
        id={`${prefix}height-input`}
        label="Height"
        type="text"
        inputMode={state.resizeUnit() === "px" ? "numeric" : "decimal"}
        value={state.heightValue()}
        onInput={actions.handleHeightInput}
        placeholder={state.heightPlaceholder()}
        disabled={!state.controlsActive()}
      />
    </div>
  );
}
