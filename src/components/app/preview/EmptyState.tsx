import { Image, Upload } from "lucide-solid";
import type { JSX } from "solid-js";
import { Show } from "solid-js";

interface EmptyStateProps {
  icon?: JSX.Element;
  title: string;
  subtitle: string;
  validationError?: string;
  validationWarning?: string;
  /** When provided, renders a mobile-only "Upload image" CTA button. */
  onUploadClick?: () => void;
}

export default function EmptyState(props: EmptyStateProps) {
  return (
    <div
      id="sbs-empty-state"
      class="flex-1 flex flex-col items-center justify-center text-center p-8 transition-opacity duration-300"
    >
      {props.icon ?? <Image class="w-12 h-12 text-fg-soft opacity-30 mb-3" />}
      <p class="font-body text-sm font-medium text-fg-muted m-0 mb-1">{props.title}</p>
      <p class="text-xs text-fg-soft m-0">{props.subtitle}</p>

      <Show when={props.validationError}>
        {(message) => (
          <p class="mt-3 text-sm text-danger editor:hidden" role="status">
            {message()}
          </p>
        )}
      </Show>

      <Show when={props.validationWarning}>
        {(message) => (
          <p class="mt-3 text-sm text-warning editor:hidden" role="status">
            {message()}
          </p>
        )}
      </Show>

      <Show when={props.onUploadClick}>
        {/* Mobile-only upload CTA — on desktop the sidebar UploadArea is always visible */}
        <button
          data-mobile-empty-state-upload
          type="button"
          class="mt-6 editor:hidden inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-fg text-sm font-semibold rounded-full shadow-primary hover:bg-primary-hover active:scale-95 transition-[background-color,transform] duration-200"
          onClick={() => props.onUploadClick?.()}
        >
          <Upload class="w-4 h-4" aria-hidden="true" />
          Upload image
        </button>
      </Show>
    </div>
  );
}
