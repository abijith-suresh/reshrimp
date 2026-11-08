import { Show } from "solid-js";
import type { ValidationResult } from "@/types/image";

interface ValidationMessagesProps {
  validation: ValidationResult | null;
}

export default function ValidationMessages(props: ValidationMessagesProps) {
  return (
    <>
      <Show when={props.validation?.error}>
        {(msg) => (
          <div class="mt-2 text-xs font-medium text-danger" role="status">
            {msg()}
          </div>
        )}
      </Show>
      <Show when={!props.validation?.error && props.validation?.warning}>
        {(msg) => (
          <div class="mt-2 text-xs font-medium text-warning" role="status">
            {msg()}
          </div>
        )}
      </Show>
    </>
  );
}
