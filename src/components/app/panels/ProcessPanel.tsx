import { Show } from "solid-js";
import SectionHeader from "@/components/ui/SectionHeader";
import UploadArea from "@/components/app/UploadArea";
import DimensionInputs from "@/components/app/controls/DimensionInputs";
import UnitSelector from "@/components/app/controls/UnitSelector";
import DpiSelector from "@/components/app/controls/DpiSelector";
import InlineToggles from "@/components/app/controls/InlineToggles";
import FormatSelect from "@/components/app/controls/FormatSelect";
import QualitySection from "@/components/app/controls/QualitySection";
import DownloadSection from "@/components/app/preview/DownloadSection";
import { useImageApp } from "@/components/app/state/ImageAppContext";

interface ProcessPanelProps {
  /**
   * When true, the Source (Upload) section renders last instead of first.
   * Used inside the mobile sheet where an image is already loaded and
   * uploading a new image is a secondary action.
   */
  sourceAtBottom?: boolean;
}

export default function ProcessPanel(props: ProcessPanelProps) {
  const { state } = useImageApp();
  const showDpi = () => state.resizeUnit() === "in" || state.resizeUnit() === "cm";

  const sourceSection = (
    <div class="app-panel-section app-panel-section-source">
      <SectionHeader>Source</SectionHeader>
      <div class="mt-2">
        <UploadArea />
      </div>
    </div>
  );

  const geometrySection = (
    <div class="app-panel-section">
      <SectionHeader>Geometry</SectionHeader>
      <DimensionInputs />
      <div class="flex gap-2">
        <div class="flex-1">
          <UnitSelector />
        </div>
        <Show when={showDpi()}>
          <div class="flex-1">
            <DpiSelector />
          </div>
        </Show>
      </div>
      <InlineToggles />
    </div>
  );

  const formatSection = (
    <div class="app-panel-section">
      <SectionHeader>Format</SectionHeader>
      <FormatSelect />
    </div>
  );

  const qualitySection = (
    <div class="app-panel-section gap-3">
      <QualitySection />
    </div>
  );

  return (
    <div class="flex flex-col flex-1 overflow-y-auto min-h-0">
      {props.sourceAtBottom ? (
        <>
          {geometrySection}
          {formatSection}
          {qualitySection}
          {sourceSection}
        </>
      ) : (
        <>
          {sourceSection}
          {geometrySection}
          {formatSection}
          {qualitySection}
        </>
      )}

      {/* Desktop only — on mobile the Download button lives in the snap-sheet mini header */}
      <div class="app-panel-section-footer hidden md:block">
        <DownloadSection />
      </div>
    </div>
  );
}
