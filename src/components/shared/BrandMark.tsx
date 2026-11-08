import { cn } from "@/lib/utils";

// The favicon's fishtail r, drawn inline so it follows the theme tokens. The
// surrounding link supplies the accessible name.
export default function BrandMark(props: { class?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" class={cn("size-5.5 shrink-0", props.class)}>
      <rect width="32" height="32" rx="7" class="fill-fg" />
      <path
        d="M10 21.2V5.27h4.93l.04 7.41h.78q.34-2.78 1.14-4.52.81-1.74 2.26-2.56 1.45-.83 3.6-.83.37 0 .81.02.43.02 1.01.14l-.25 6.34q-.62-.29-1.36-.42-.75-.12-1.33-.12-1.61 0-2.77.74-1.16.75-1.88 2.14-.73 1.38-.98 3.37v4.22Z"
        class="fill-white"
      />
      <path
        d="M10 20.6h6v1.2h-6Zm6 1q-2.05 2.22.99 4.35-1.25 2.77-3.99-.45-2.74 3.22-3.99.45 3.04-2.13.99-4.35Z"
        class="fill-coral"
      />
    </svg>
  );
}
