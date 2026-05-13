import { Show } from "solid-js";
import SectionHeader from "@/components/app/ui/SectionHeader";
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
      {/* SOURCE */}
      <div class="px-5 pt-5 pb-3 border-b border-sp-border-light">
        <SectionHeader>Source</SectionHeader>
        <div class="mt-2">
          <UploadArea />
        </div>
      </div>

      {/* GEOMETRY */}
      <div class="px-5 py-3 border-b border-sp-border-light flex flex-col gap-2">
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

      {/* FORMAT */}
      <div class="px-5 py-3 border-b border-sp-border-light flex flex-col gap-2">
        <SectionHeader>Format</SectionHeader>
        <FormatSelect />
      </div>

      {/* QUALITY */}
      <div class="px-5 py-3 border-b border-sp-border-light">
        <QualitySection />
      </div>

      {/* DOWNLOAD */}
      <div class="px-5 py-4 mt-auto">
        <DownloadSection />
      </div>
    </div>
  );
}
