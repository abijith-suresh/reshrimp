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
      {props.icon ?? <Image class="w-12 h-12 text-soft-foreground opacity-30 mb-3" />}
      <p class="font-body text-[0.9rem] font-medium text-muted-foreground m-0 mb-1">
        {props.title}
      </p>
      <p class="text-[0.8rem] text-soft-foreground m-0">{props.subtitle}</p>

      <Show when={props.onUploadClick}>
        {/* Mobile-only upload CTA — on desktop the sidebar UploadArea is always visible */}
        <button
          type="button"
          class="mt-6 md:hidden inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 text-white text-[0.85rem] font-semibold rounded-full shadow-[0_4px_14px_rgba(242,90,90,0.3)] hover:bg-coral-600 active:scale-95 transition-[background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2"
          onClick={() => props.onUploadClick?.()}
        >
          <Upload class="w-4 h-4" aria-hidden="true" />
          Upload image
        </button>
      </Show>
    </div>
  );
}
