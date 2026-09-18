import { Download } from "lucide-solid";
import { Show } from "solid-js";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Button from "@/components/ui/Button";

interface DownloadSectionProps {
  idPrefix?: string;
}

export default function DownloadSection(props: DownloadSectionProps) {
  const { state, actions } = useImageApp();
  const prefix = props.idPrefix ?? "";

  return (
    <div id={`${prefix}download-section`} class="flex flex-col items-center gap-2 pt-3">
      <Show when={state.formatNotice()}>
        {(message) => (
          <p
            id={`${prefix}format-fallback-warning`}
            class="w-full text-xs leading-relaxed text-yellow-700"
            role="status"
          >
            {message()}
          </p>
        )}
      </Show>
      <Button
        id={`${prefix}download-button`}
        variant="primary"
        tone="mint"
        fullWidth={true}
        disabled={!state.downloadActive()}
        onClick={() => actions.handleDownload()}
      >
        <Download class="w-4 h-4" aria-hidden="true" />
        <span>Download</span>
      </Button>
    </div>
  );
}
