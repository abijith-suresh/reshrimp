import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { Image, Upload } from "lucide-solid";

interface EmptyStateProps {
  icon?: JSX.Element;
  title: string;
  subtitle: string;
  /** When provided, renders a mobile-only "Upload image" CTA button. */
  onUploadClick?: () => void;
}

export default function EmptyState(props: EmptyStateProps) {
  return (
    <div
      id="sbs-empty-state"
      class="flex-1 flex flex-col items-center justify-center text-center p-8 transition-opacity duration-300"
    >
      {props.icon ?? <Image class="w-12 h-12 text-sp-text-soft opacity-30 mb-3" />}
      <p class="font-body text-[0.9rem] font-medium text-sp-text-muted m-0 mb-1">{props.title}</p>
      <p class="text-[0.8rem] text-sp-text-soft m-0">{props.subtitle}</p>

      <Show when={props.onUploadClick}>
        {/* Mobile-only upload CTA — on desktop the sidebar UploadArea is always visible */}
        <button
          type="button"
          class="mt-6 md:hidden inline-flex items-center gap-2 px-5 py-2.5 bg-sp-coral text-white text-[0.85rem] font-semibold rounded-sp-full shadow-[0_4px_14px_rgba(255,107,107,0.3)] hover:bg-sp-coral-dark active:scale-95 transition-[background-color,transform] duration-200"
          onClick={() => props.onUploadClick?.()}
        >
          <Upload class="w-4 h-4" aria-hidden="true" />
          Upload image
        </button>
      </Show>
    </div>
  );
}
