import type { JSX } from "solid-js";
import { Show } from "solid-js";

interface ImagePreviewProps {
  id?: string;
  src: string | undefined;
  alt: string;
  placeholder?: JSX.Element;
}

export default function ImagePreview(props: ImagePreviewProps) {
  return (
    <Show when={props.src} fallback={props.placeholder ?? null}>
      <div class="preview-frame">
        <img
          id={props.id}
          src={props.src}
          alt={props.alt}
          class="max-w-full max-h-full object-contain"
        />
      </div>
    </Show>
  );
}
