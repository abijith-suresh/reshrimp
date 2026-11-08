import { ArrowLeft } from "lucide-solid";
import { Show } from "solid-js";
import DownloadSection from "@/components/app/preview/DownloadSection";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import { useImageApp } from "@/components/app/state/ImageAppContext";
import BrandMark from "@/components/shared/BrandMark";
import { ROUTES, SITE_NAME } from "@/config/constants";
import { makeHref } from "@/lib/utils";

// One slim bar on every screen size. On desktop it also carries the image
// summary and the Download button; on phones those live in the bottom sheet.
export default function AppTopBar() {
  const { state } = useImageApp();

  return (
    <header class="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-2 editor:px-4">
      <nav aria-label="App navigation" class="flex min-w-0 shrink-0 items-center">
        <a
          href={makeHref(ROUTES.HOME)}
          aria-label={`Back to ${SITE_NAME.toLowerCase()} home`}
          class="group/logo inline-flex h-11 items-center gap-2 rounded-md pr-3 pl-2 text-fg no-underline transition-colors duration-150 hover:bg-hover"
        >
          <ArrowLeft class="size-4 text-fg-muted" aria-hidden="true" />
          <BrandMark class="transition-transform duration-300 ease-pop group-hover/logo:-rotate-8" />
          <span class="font-display text-title-sm" translate="no">
            {SITE_NAME.toLowerCase()}
          </span>
        </a>
      </nav>

      <div data-desktop-only class="hidden min-w-0 flex-1 justify-center editor:flex">
        <Show when={state.currentImage()}>
          {(img) => (
            <ImageInfoBar
              idPrefix="desktop-"
              class="flex-nowrap"
              fileName={img().metadata.fileName}
              width={state.lastCompletedResult()?.metadata.width ?? img().metadata.width}
              height={state.lastCompletedResult()?.metadata.height ?? img().metadata.height}
              originalFileSize={img().metadata.fileSize}
              fileSize={state.lastCompletedResult()?.metadata.fileSize ?? img().metadata.fileSize}
            />
          )}
        </Show>
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-1 editor:ml-0">
        <div data-desktop-only class="hidden editor:block">
          <DownloadSection compact />
        </div>
      </div>
    </header>
  );
}
