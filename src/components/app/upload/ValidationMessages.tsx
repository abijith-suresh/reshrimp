import { Show } from "solid-js";
import type { ValidationResult } from "@/types/image";

interface ValidationMessagesProps {
  validation: ValidationResult | null;
}

export default function ValidationMessages(props: ValidationMessagesProps) {
  return (
    <>
      <Show when={props.validation?.error}>
        {(msg) => <div class="mt-2 text-sm text-coral-500">{msg()}</div>}
      </Show>
      <Show when={!props.validation?.error && props.validation?.warning}>
        {(msg) => <div class="mt-2 text-sm text-[#d97706]">{msg()}</div>}
      </Show>
    </>
  );
}
