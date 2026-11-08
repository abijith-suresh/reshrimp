import { Show } from "solid-js";
import type { SizeDiff } from "@/components/app/state/imageAppTypes";
import { formatFileSize } from "@/utils/imageUtils";

interface ImageInfoBarProps {
  idPrefix?: string;
  fileName: string;
  width: number;
  height: number;
  fileSize: number;
  sizeDiff?: SizeDiff | null;
}

export default function ImageInfoBar(props: ImageInfoBarProps) {
  const prefix = props.idPrefix ?? "";

  return (
    <div
      data-testid="info-strip"
      class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted bg-lavender-subtle border border-line rounded-md px-3.5 py-2 shrink-0"
    >
      <span class="font-semibold text-fg max-w-45 truncate">{props.fileName}</span>
      <span class="text-line-strong" aria-hidden="true">
        ·
      </span>
      <span>
        {props.width} &times; {props.height}px
      </span>
      <span class="text-line-strong" aria-hidden="true">
        ·
      </span>
      <span>{formatFileSize(props.fileSize)}</span>
      <Show when={props.sizeDiff}>
        {(diff) => (
          <>
            <span class="text-line-strong" aria-hidden="true">
              ·
            </span>
            <span id={`${prefix}size-difference`} class={diff().className}>
              {diff().text}
            </span>
          </>
        )}
      </Show>
    </div>
  );
}
