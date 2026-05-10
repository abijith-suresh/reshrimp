import ActionButton from "@/components/app/ui/ActionButton";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function ProcessButton() {
  const { state, actions } = useImageApp();

  return (
    <ActionButton
      id="process-button"
      variant="primary"
      loading={state.isProcessing()}
      disabled={!state.controlsActive()}
      onClick={actions.handleProcess}
    >
      {state.processBtnLabel()}
    </ActionButton>
  );
}
