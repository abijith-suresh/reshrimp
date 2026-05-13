import { useImageApp } from "@/components/app/state/ImageAppContext";
import { Download } from "lucide-solid";

export default function DownloadSection() {
  const { state, actions } = useImageApp();

  return (
    <div id="download-section" class="flex flex-col items-center gap-2 pt-3">
      <button
        id="download-button"
        type="button"
        class="download-btn"
        disabled={!state.downloadActive()}
        onClick={() => actions.handleDownload()}
      >
        <Download class="w-4 h-4" aria-hidden="true" />
        <span>Download</span>
      </button>
    </div>
  );
}
