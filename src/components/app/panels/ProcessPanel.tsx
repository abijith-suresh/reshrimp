import { Show } from "solid-js";
import SectionHeader from "@/components/ui/SectionHeader";
import UploadArea from "@/components/app/UploadArea";
import PresetSelector from "@/components/app/controls/PresetSelector";
import DimensionInputs from "@/components/app/controls/DimensionInputs";
import UnitSelector from "@/components/app/controls/UnitSelector";
import DpiSelector from "@/components/app/controls/DpiSelector";
import InlineToggles from "@/components/app/controls/InlineToggles";
import FormatSelect from "@/components/app/controls/FormatSelect";
import QualitySection from "@/components/app/controls/QualitySection";
import DownloadSection from "@/components/app/preview/DownloadSection";
import { useImageApp } from "@/components/app/state/ImageAppContext";

export default function ProcessPanel() {
  const { state } = useImageApp();
  const showDpi = () => state.resizeUnit() === "in" || state.resizeUnit() === "cm";

  return (
    <div class="flex flex-col flex-1 overflow-y-auto min-h-0">
      <div class="app-panel-section app-panel-section-source">
        <SectionHeader>Source</SectionHeader>
        <div class="mt-2">
          <UploadArea />
        </div>
      </div>

      <div class="app-panel-section">
        <SectionHeader>Geometry</SectionHeader>
        <PresetSelector />
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

      <div class="app-panel-section">
        <SectionHeader>Format</SectionHeader>
        <FormatSelect />
      </div>

      <div class="app-panel-section gap-3">
        <QualitySection />
      </div>

      <div class="app-panel-section-footer">
        <DownloadSection />
      </div>
    </div>
  );
}
