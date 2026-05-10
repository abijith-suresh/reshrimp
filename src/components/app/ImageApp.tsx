import { ImageAppProvider } from "@/components/app/state/ImageAppContext";
import UploadArea from "./UploadArea";
import ProcessingControls from "./ProcessingControls";
import PreviewPanel from "./PreviewPanel";

export default function ImageApp() {
  return (
    <ImageAppProvider>
      <div class="sticky top-[68px] flex flex-col gap-4 self-start max-md:static">
        <UploadArea />
        <ProcessingControls />
      </div>
      <PreviewPanel />
    </ImageAppProvider>
  );
}

// Re-export SizeDiff for backwards compatibility if any consumers import it
export type { SizeDiff } from "@/components/app/state/ImageAppContext";
