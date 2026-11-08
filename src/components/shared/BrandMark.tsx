import { cn } from "@/lib/utils";

// The favicon's r tile, drawn inline so it follows the theme tokens. The
// surrounding link supplies the accessible name.
export default function BrandMark(props: { class?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" class={cn("size-5.5 shrink-0", props.class)}>
      <rect width="32" height="32" rx="8" class="fill-primary" />
      <path
        d="M13 24v-6a7 7 0 0 1 7-7"
        fill="none"
        stroke-width="6"
        stroke-linecap="round"
        class="stroke-primary-fg"
      />
      <circle cx="24" cy="11" r="3" class="fill-yellow" />
    </svg>
  );
}
