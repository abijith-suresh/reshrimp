import AppCheckbox from "@/components/app/ui/AppCheckbox";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function AspectRatioLock() {
  const { state, actions } = useImageApp();

  return (
    <AppCheckbox
      id="maintain-aspect-ratio"
      label="Lock aspect ratio"
      checked={state.maintainAspectRatio()}
      onChange={actions.handleAspectRatioChange}
      disabled={!state.controlsActive()}
    />
  );
}
