import ActionButton from "@/components/app/ui/ActionButton";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import { Download } from "lucide-solid";

export default function DownloadSection() {
  const { state, actions } = useImageApp();

  return (
    <div
      id="download-section"
      class="download-section border-t border-sp-border-light p-4 shrink-0"
      classList={{ "download-inactive": !state.downloadActive() }}
    >
      <ActionButton
        id="download-button"
        variant="success"
        disabled={!state.downloadActive()}
        onClick={actions.handleDownload}
        icon={<Download class="w-5 h-5" />}
      >
        Download
      </ActionButton>
    </div>
  );
}
