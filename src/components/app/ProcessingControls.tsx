import ControlCard from "@/components/app/ui/ControlCard";
import ResizeSection from "@/components/app/controls/ResizeSection";
import BackgroundRemovalSection from "@/components/app/controls/BackgroundRemovalSection";
import FormatSection from "@/components/app/controls/FormatSection";
import QualitySection from "@/components/app/controls/QualitySection";
import ProcessButton from "@/components/app/controls/ProcessButton";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function ProcessingControls() {
  const { state } = useImageApp();

  return (
    <ControlCard id="processing-controls" inactive={!state.controlsActive()}>
      <ResizeSection />
      <BackgroundRemovalSection />
      <FormatSection />
      <QualitySection />
      <ProcessButton />
    </ControlCard>
  );
}
