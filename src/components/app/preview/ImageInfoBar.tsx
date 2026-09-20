import { Show } from "solid-js";
import type { SizeDiff } from "@/components/app/state/imageAppTypes";
import { formatFileSize } from "@/utils/imageUtils";

interface ImageInfoBarProps {
  fileName: string;
  width: number;
  height: number;
  fileSize: number;
  sizeDiff?: SizeDiff | null;
  isPending?: boolean;
}

export default function ImageInfoBar(props: ImageInfoBarProps) {
  return (
    <div
      data-testid="info-strip"
      class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground bg-lavender-50 border-t border-border-light rounded-md px-3.5 py-2 shrink-0"
    >
      <span class="font-semibold text-foreground max-w-[180px] truncate">{props.fileName}</span>
      <Show when={props.isPending}>
        <span class="text-coral-600">Last applied</span>
      </Show>
      <span class="text-border" aria-hidden="true">
        ·
      </span>
      <span>
        {props.width} &times; {props.height}px
      </span>
      <span class="text-border" aria-hidden="true">
        ·
      </span>
      <span>{formatFileSize(props.fileSize)}</span>
      <Show when={props.sizeDiff}>
        {(diff) => (
          <>
            <span class="text-border" aria-hidden="true">
              ·
            </span>
            <span class={diff().className}>{diff().text}</span>
          </>
        )}
      </Show>
    </div>
  );
}
