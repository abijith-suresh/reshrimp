import { Download } from "lucide-solid";
import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Button from "@/components/ui/Button";

interface DownloadSectionProps {
  idPrefix?: string;
  /** Top-bar form: a compact button; the format notice lives in the Output card. */
  compact?: boolean;
}

export default function DownloadSection(props: DownloadSectionProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";

  return (
    <div
      id={`${prefix}download-section`}
      class={props.compact ? "flex" : "flex flex-col items-center gap-2"}
    >
      <Show when={!props.compact && state.formatNotice()}>
        {(message) => <FormatNotice id={`${prefix}format-fallback-warning`} message={message()} />}
      </Show>
      <Button
        id={`${prefix}download-button`}
        variant="primary"
        size={props.compact ? "sm" : "md"}
        fullWidth={!props.compact}
        disabled={!state.downloadActive()}
        onClick={() => actions.handleDownload()}
      >
        <Download class="size-4" aria-hidden="true" />
        <span>Download</span>
      </Button>
    </div>
  );
}

export function FormatNotice(props: { id: string; message: string }) {
  return (
    <p id={props.id} class="w-full text-xs font-medium text-warning" role="status">
      {props.message}
    </p>
  );
}
