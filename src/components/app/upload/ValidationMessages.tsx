import { Show } from "solid-js";
import type { ValidationResult } from "@/types/image";

interface ValidationMessagesProps {
  validation: ValidationResult | null;
}

export default function ValidationMessages(props: ValidationMessagesProps) {
  return (
    <>
      <Show when={props.validation?.error}>
        {(msg) => <div class="sp-validation-error mt-2">{msg()}</div>}
      </Show>
      <Show when={!props.validation?.error && props.validation?.warning}>
        {(msg) => <div class="sp-validation-warning mt-2">{msg()}</div>}
      </Show>
    </>
  );
}
