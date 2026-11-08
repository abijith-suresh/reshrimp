import { Show } from "solid-js";
import DimensionInputs from "@/components/app/controls/DimensionInputs";
import DpiSelector from "@/components/app/controls/DpiSelector";
import FormatSelect from "@/components/app/controls/FormatSelect";
import InlineToggles from "@/components/app/controls/InlineToggles";
import QualitySection from "@/components/app/controls/QualitySection";
import UnitSelector from "@/components/app/controls/UnitSelector";
import { FormatNotice } from "@/components/app/preview/DownloadSection";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import UploadArea from "@/components/app/UploadArea";
import { FIELD_LABEL_CLASSES } from "@/components/ui/control";
import PanelCard from "@/components/ui/PanelCard";

interface ProcessPanelProps {
  /**
   * When true, the Source card renders last instead of first.
   * Used inside the mobile sheet, where replacing the image is a secondary action.
   */
  sourceAtBottom?: boolean;
  idPrefix?: string;
  /** The mobile sheet shows the format notice beside its Download buttons instead. */
  showFormatNotice?: boolean;
}

export default function ProcessPanel(props: ProcessPanelProps) {
  const { state } = useImageApp();
  const showDpi = () => state.resizeUnit() === "in" || state.resizeUnit() === "cm";

  // The first image comes in through the preview's empty state, so Source
  // only appears once there is an image to replace.
  const SourceSection = () => (
    <Show when={state.currentImage()}>
      <PanelCard title="Source">
        <UploadArea idPrefix={props.idPrefix} />
      </PanelCard>
    </Show>
  );

  return (
    <div class="flex flex-col gap-3 p-3 editor:p-4">
      <Show when={!props.sourceAtBottom}>
        <SourceSection />
      </Show>

      <PanelCard title="Resize">
        <DimensionInputs idPrefix={props.idPrefix} />
        <div class="flex gap-3">
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
      </PanelCard>

      <PanelCard title="Output">
        <div class="flex flex-col gap-1.5">
          <span class={FIELD_LABEL_CLASSES}>Format</span>
          <FormatSelect idPrefix={props.idPrefix} />
          <Show when={props.showFormatNotice !== false && state.formatNotice()}>
            {(message) => (
              <FormatNotice
                id={`${props.idPrefix ?? ""}format-fallback-warning`}
                message={message()}
              />
            )}
          </Show>
        </div>
        <QualitySection idPrefix={props.idPrefix} />
      </PanelCard>

      <PanelCard title="Background">
        <InlineToggles idPrefix={props.idPrefix} showAspectRatio={false} showBackground />
      </PanelCard>

      <Show when={props.sourceAtBottom}>
        <SourceSection />
      </Show>
    </div>
  );
}
