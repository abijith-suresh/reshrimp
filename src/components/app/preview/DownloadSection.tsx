import { Download } from "lucide-solid";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import Button from "@/components/ui/Button";

export default function DownloadSection() {
  const { state, actions } = useImageApp();

  return (
    <div id="download-section" class="flex flex-col items-center gap-2 pt-3">
      <Button
        id="download-button"
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
