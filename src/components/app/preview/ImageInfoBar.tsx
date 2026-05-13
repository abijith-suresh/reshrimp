import { Show } from "solid-js";
import { formatFileSize } from "@/utils/imageUtils";
import type { SizeDiff } from "@/components/app/state/ImageAppContext";

interface ImageInfoBarProps {
  fileName: string;
  width: number;
  height: number;
  fileSize: number;
  sizeDiff?: SizeDiff | null;
}

export default function ImageInfoBar(props: ImageInfoBarProps) {
  return (
    <div class="info-strip">
      <span class="info-strip-filename">{props.fileName}</span>
      <span class="info-strip-dot" aria-hidden="true">
        ·
      </span>
      <span>
        {props.width} &times; {props.height}px
      </span>
      <span class="info-strip-dot" aria-hidden="true">
        ·
      </span>
      <span>{formatFileSize(props.fileSize)}</span>
      <Show when={props.sizeDiff}>
        {(diff) => (
          <>
            <span class="info-strip-dot" aria-hidden="true">
              ·
            </span>
            <span id="size-difference" class={diff().className}>
              {diff().text}
            </span>
          </>
        )}
      </Show>
    </div>
  );
}
