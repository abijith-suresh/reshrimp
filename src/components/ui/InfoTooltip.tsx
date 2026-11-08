import { Info } from "lucide-solid";
import { createSignal, createUniqueId, type JSX } from "solid-js";

interface InfoTooltipProps {
  id?: string;
  ariaLabel: string;
  content: JSX.Element;
}

export default function InfoTooltip(props: InfoTooltipProps) {
  const [open, setOpen] = createSignal(false);
  const id = props.id ?? createUniqueId();

  return (
    <div id={id} class="mt-1.5">
      <button
        id={`${id}-icon`}
        type="button"
        class="inline-flex items-center justify-center w-5 h-5 p-0 text-fg-muted bg-transparent border-none rounded-full cursor-pointer transition-colors duration-200 hover:text-fg"
        aria-label={props.ariaLabel}
        aria-expanded={open()}
        aria-controls={`${id}-help`}
        onClick={() => setOpen(!open())}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      <p id={`${id}-help`} hidden={!open()} class="mt-1 text-xs leading-snug text-fg-muted">
        {props.content}
      </p>
    </div>
  );
}
