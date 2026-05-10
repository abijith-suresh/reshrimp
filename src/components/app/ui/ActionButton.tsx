import { Show, type JSX } from "solid-js";

interface ActionButtonProps {
  id?: string;
  variant: "primary" | "success";
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: JSX.Element;
  icon?: JSX.Element;
}

export default function ActionButton(props: ActionButtonProps) {
  const btnClass = () => (props.variant === "primary" ? "sp-process-btn" : "download-btn");

  return (
    <button
      id={props.id}
      type="button"
      class={btnClass()}
      classList={{
        "sp-process-btn-loading": props.loading && props.variant === "primary",
        "opacity-50 cursor-not-allowed": !!props.disabled,
      }}
      disabled={props.disabled}
      onClick={() => props.onClick()}
    >
      <Show when={props.loading}>
        <span class="sp-btn-spinner" aria-hidden="true" />
      </Show>
      <Show when={props.icon && !props.loading}>{props.icon}</Show>
      <span>{props.children}</span>
    </button>
  );
}
