import { Show } from "solid-js";
import { formatFileSize } from "@/utils/imageUtils";

interface ImageInfoBarProps {
  idPrefix?: string;
  fileName: string;
  width: number;
  height: number;
  originalFileSize: number;
  /** Size of the latest output, or the original size before the first result. */
  fileSize: number;
  class?: string;
}

// A meaningful saving reads as success; any other change is plain information.
const MEANINGFUL_REDUCTION_PERCENT = -1;

export default function ImageInfoBar(props: ImageInfoBarProps) {
  const prefix = props.idPrefix ?? "";
  const changed = () => props.fileSize !== props.originalFileSize;
  const percent = () => ((props.fileSize - props.originalFileSize) / props.originalFileSize) * 100;
  const percentText = () => {
    const value = percent();
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}${Math.abs(value).toFixed(1)}%`;
  };

  return (
    <p
      data-testid="info-strip"
      class={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted tabular-nums ${props.class ?? ""}`}
    >
      <span class="min-w-0 max-w-full truncate font-semibold text-fg">{props.fileName}</span>
      <span class="shrink-0 text-fg-soft" aria-hidden="true">
        ·
      </span>
      <span class="shrink-0 whitespace-nowrap">
        {props.width} &times; {props.height}px
      </span>
      <span class="shrink-0 text-fg-soft" aria-hidden="true">
        ·
      </span>
      <span class="shrink-0 whitespace-nowrap">
        <Show when={changed()} fallback={formatFileSize(props.fileSize)}>
          <span class="sr-only">Original </span>
          {formatFileSize(props.originalFileSize)}
          <span aria-hidden="true"> → </span>
          <span class="sr-only">, output </span>
          <span class="text-fg">{formatFileSize(props.fileSize)}</span>
        </Show>
      </span>
      <Show when={changed()}>
        <span
          id={`${prefix}size-difference`}
          class="shrink-0 whitespace-nowrap font-medium"
          classList={{
            "text-success": percent() <= MEANINGFUL_REDUCTION_PERCENT,
            "text-fg-muted": percent() > MEANINGFUL_REDUCTION_PERCENT,
          }}
        >
          ({percentText()})
        </span>
      </Show>
    </p>
  );
}
