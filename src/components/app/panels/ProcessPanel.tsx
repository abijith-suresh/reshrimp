import { Show } from "solid-js";
import DimensionInputs from "@/components/app/controls/DimensionInputs";
import FormatSelect from "@/components/app/controls/FormatSelect";
import InlineToggles from "@/components/app/controls/InlineToggles";
import QualitySection from "@/components/app/controls/QualitySection";
import UnitSelector from "@/components/app/controls/UnitSelector";
import DownloadSection from "@/components/app/preview/DownloadSection";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import UploadArea from "@/components/app/UploadArea";
import Button from "@/components/ui/Button";
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
  const { state, actions } = useImageApp();

  const sourceSection = (
    <div class="flex flex-col gap-2 border-b border-border-light px-5 py-3 pt-5 pb-3">
      <SectionHeader>Source</SectionHeader>
      <div class="mt-2">
        <UploadArea idPrefix={props.idPrefix} />
      </div>
    </div>
  );

  const geometrySection = (
    <div class="flex flex-col gap-2 border-b border-border-light px-5 py-3">
      <SectionHeader>Geometry</SectionHeader>
      <DimensionInputs idPrefix={props.idPrefix} />
      <UnitSelector idPrefix={props.idPrefix} />
      <InlineToggles idPrefix={props.idPrefix} />
    </div>
  );

  const applySection = (
    <div class="border-b border-border-light px-5 py-3">
      <Button
        id={`${props.idPrefix ?? ""}apply-changes-button`}
        variant="secondary"
        tone="coral"
        fullWidth={true}
        disabled={
          !state.hasPendingChanges() || state.isProcessing() || state.resizeError() !== null
        }
        onClick={() => actions.applyChanges()}
      >
        {state.isProcessing() ? "Processing…" : "Apply all changes"}
      </Button>
    </div>
  );

  const formatSection = (
    <div class="flex flex-col gap-2 border-b border-border-light px-5 py-3">
      <SectionHeader>Format</SectionHeader>
      <FormatSelect idPrefix={props.idPrefix} />
    </div>
  );

  const qualitySection = (
    <div class="flex flex-col gap-3 border-b border-border-light px-5 py-3">
      <QualitySection idPrefix={props.idPrefix} />
    </div>
  );

  return (
    <div class="flex flex-col flex-1 overflow-y-auto min-h-0">
      {props.sourceAtBottom ? (
        <>
          {geometrySection}
          {formatSection}
          {qualitySection}
          {applySection}
          {sourceSection}
        </>
      ) : (
        <>
          {sourceSection}
          {geometrySection}
          {formatSection}
          {qualitySection}
          {applySection}
        </>
      )}

      {/* Desktop only — on mobile the Download button lives in the snap-sheet mini header */}
      <Show when={props.showDownload !== false}>
        <div class="mt-auto px-5 py-4 hidden md:block">
          <DownloadSection idPrefix={props.idPrefix} />
        </div>
      </Show>
    </div>
  );
}
