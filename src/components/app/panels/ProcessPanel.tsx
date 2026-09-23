import { Show } from "solid-js";
import DimensionInputs from "@/components/app/controls/DimensionInputs";
import DpiSelector from "@/components/app/controls/DpiSelector";
import FormatSelect from "@/components/app/controls/FormatSelect";
import InlineToggles from "@/components/app/controls/InlineToggles";
import QualitySection from "@/components/app/controls/QualitySection";
import UnitSelector from "@/components/app/controls/UnitSelector";
import DownloadSection from "@/components/app/preview/DownloadSection";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import UploadArea from "@/components/app/UploadArea";
import SectionHeader from "@/components/ui/SectionHeader";

interface ProcessPanelProps {
  /**
   * When true, the Source (Upload) section renders last instead of first.
   * Used inside the mobile sheet where an image is already loaded and
   * uploading a new image is a secondary action.
   */
  sourceAtBottom?: boolean;
  idPrefix?: string;
  showDownload?: boolean;
}

export default function ProcessPanel(props: ProcessPanelProps) {
  const { state } = useImageApp();
  const showDpi = () => state.resizeUnit() === "in" || state.resizeUnit() === "cm";

  const sourceSection = (
    <div class="flex flex-col gap-2 border-b border-border-light px-5 py-3 pt-5 pb-3">
      <SectionHeader>Source</SectionHeader>
      <div class="mt-2">
        <UploadArea idPrefix={props.idPrefix} />
      </div>
    </div>
  );

  const resizeSection = (
    <div class="flex flex-col gap-2 border-b border-border-light px-5 py-3">
      <SectionHeader>Resize</SectionHeader>
      <DimensionInputs idPrefix={props.idPrefix} />
      <div class="flex gap-2">
        <div class="flex-1">
          <UnitSelector idPrefix={props.idPrefix} />
        </div>
        <Show when={showDpi()}>
          <div class="flex-1">
            <DpiSelector idPrefix={props.idPrefix} />
          </div>
        </Show>
      </div>
      <InlineToggles idPrefix={props.idPrefix} showAspectRatio showBackground={false} />
    </div>
  );

  const outputSection = (
    <div class="flex flex-col gap-3 border-b border-border-light px-5 py-3">
      <SectionHeader>Output</SectionHeader>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-muted-foreground">Format</span>
        <FormatSelect idPrefix={props.idPrefix} />
      </div>
      <QualitySection idPrefix={props.idPrefix} />
    </div>
  );

  const backgroundSection = (
    <div class="flex flex-col gap-2 border-b border-border-light px-5 py-3">
      <SectionHeader>Background</SectionHeader>
      <InlineToggles idPrefix={props.idPrefix} showAspectRatio={false} showBackground />
    </div>
  );

  return (
    <div class="flex flex-col flex-1 overflow-y-auto min-h-0">
      {props.sourceAtBottom ? (
        <>
          {resizeSection}
          {outputSection}
          {backgroundSection}
          {sourceSection}
        </>
      ) : (
        <>
          {sourceSection}
          {resizeSection}
          {outputSection}
          {backgroundSection}
        </>
      )}

      {/* Desktop only — on mobile the Download button lives in the snap-sheet mini header */}
      <Show when={props.showDownload !== false}>
        <div class="mt-auto px-5 py-4 hidden editor:block">
          <DownloadSection idPrefix={props.idPrefix} />
        </div>
      </Show>
    </div>
  );
}
