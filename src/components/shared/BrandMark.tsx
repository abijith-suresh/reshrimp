import { BRAND_MARK_PATH } from "@/config/brandMark";
import { cn } from "@/lib/utils";

// The shrinking-curl shrimp, drawn inline so it follows the coral token. The
// surrounding link supplies the accessible name.
export default function BrandMark(props: { class?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" class={cn("size-7 shrink-0", props.class)}>
      <path
        d={BRAND_MARK_PATH}
        fill-rule="evenodd"
        stroke-width="1"
        stroke-linejoin="round"
        class="fill-coral stroke-coral"
      />
    </svg>
  );
}
