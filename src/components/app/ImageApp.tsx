import { createEffect, createSignal, on, Show } from "solid-js";
import AppSidebar from "@/components/app/AppSidebar";
import FloatingBackButton from "@/components/app/FloatingBackButton";
import PreviewPanel from "@/components/app/PreviewPanel";
import ProcessPanel from "@/components/app/panels/ProcessPanel";
import DownloadSection from "@/components/app/preview/DownloadSection";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import { ImageAppProvider, useImageApp } from "@/components/app/state/ImageAppContext";

// ── Mobile bottom sheet ─────────────────────────────────────────────────────
// Two visible states, zero drag logic:
//   hidden  → no image loaded; sheet is fully off-screen below the viewport
//   peek    → image loaded; PEEK_HEIGHT px visible (handle + info + download)
//   open    → 80dvh panel; tap handle or backdrop to return to peek
//
// Toggling is a single boolean tap — no pointer-event math, no getBoundingClientRect,
// no flick thresholds. CSS spring handles the animation entirely.

type SheetState = "hidden" | "peek" | "open";

/** Total px of the sticky header visible in peek state.
 *  handle-bar (31) + info-row (28) + download-btn section (~89) = 148.
 *  Generous to ensure the download button is fully visible even with
 *  font scaling or padding variation across devices. */
const PEEK_HEIGHT = 148;

const SPRING = "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)";

function translateForState(s: SheetState): string {
  switch (s) {
    case "hidden":
      return "translateY(100%)";
    case "peek":
      // env(safe-area-inset-bottom) lifts the peek above the iOS home indicator
      return `translateY(calc(100% - ${PEEK_HEIGHT}px - env(safe-area-inset-bottom, 0px)))`;
    case "open":
      return "translateY(0%)";
  }
}

function MobileSheet() {
  const { state } = useImageApp();
  const [sheetState, setSheetState] = createSignal<SheetState>("hidden");

  // Auto-transition only when an image is newly-loaded (null → image) or
  // cleared (image → null).  Processing updates (null → null or image → image
  // with a different ref) must NOT change the sheet state — the auto-process
  // effect in ImageAppContext creates a referentially-new currentImage every
  // ~400ms, which would otherwise slam the sheet back to "peek" while the user
  // is trying to interact with the controls.
  createEffect(
    on(state.currentImage, (img, prevImg) => {
      if (img && !prevImg) {
        setSheetState("peek");
      } else if (!img && prevImg) {
        setSheetState("hidden");
      }
      // image → image (processing update): no-op
    })
  );

  function toggleSheet() {
    setSheetState((s) => (s === "open" ? "peek" : "open"));
  }

  // Derived values for the info bar
  const img = () => state.currentImage();
  const displayWidth = () => state.processResult()?.metadata.width ?? img()?.metadata.width ?? 0;
  const displayHeight = () => state.processResult()?.metadata.height ?? img()?.metadata.height ?? 0;
  const displayFileSize = () =>
    state.processResult()?.metadata.fileSize ?? img()?.metadata.fileSize ?? 0;

  return (
    <>
      {/* Backdrop — tap to collapse when fully open */}
      <Show when={sheetState() === "open"}>
        <button
          type="button"
          class="md:hidden fixed inset-0 z-30 bg-black/20 border-none cursor-pointer focus-visible:ring-2 focus-visible:ring-lavender-500/40 focus-visible:ring-offset-2"
          onClick={() => setSheetState("peek")}
          aria-label="Close controls"
          onKeyDown={(e) => {
            if (e.key === "Escape") setSheetState("peek");
          }}
        />
      </Show>

      {/* Sheet */}
      <section
        aria-label="Image controls"
        aria-hidden={sheetState() === "hidden" ? "true" : "false"}
        class="md:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col bg-card rounded-t-[22px] mobile-sheet"
        style={{
          transform: translateForState(sheetState()),
          transition: SPRING,
        }}
      >
        {/* ── Sticky header — always visible in peek ── */}
        <div class="shrink-0">
          {/* Handle pill — tap to toggle between peek and open */}
          <button
            type="button"
            class="w-full pt-3 pb-2 flex flex-col items-center cursor-pointer active:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-lavender-500/40 rounded-t-[22px] transition-opacity duration-150"
            style={{ "touch-action": "manipulation" }}
            onClick={toggleSheet}
            aria-label={sheetState() === "open" ? "Minimise controls" : "Open controls"}
          >
            {/* Pill — widens and turns lavender when open as a state hint */}
            <div
              class="rounded-full transition-[width,background] duration-300 mobile-sheet-handle"
              style={{
                width: sheetState() === "open" ? "28px" : "40px",
                background: sheetState() === "open" ? "var(--lavender-500)" : "var(--border)",
              }}
            />
          </button>

          {/* File info row */}
          <Show when={img()}>
            {(currentImg) => (
              <div class="px-4 pb-1.5">
                <ImageInfoBar
                  fileName={currentImg().metadata.fileName}
                  width={displayWidth()}
                  height={displayHeight()}
                  fileSize={displayFileSize()}
                  sizeDiff={state.sizeDifference()}
                />
              </div>
            )}
          </Show>

          {/* Download button — primary CTA always reachable without opening */}
          <div class="px-4 pt-1 mobile-sheet-footer">
            <DownloadSection />
          </div>
        </div>

        {/* Hairline divider between header and content */}
        <div class="mx-4 h-px bg-border-light shrink-0" />

        {/* Scrollable settings content */}
        <div
          class="flex-1 overflow-y-auto min-h-0"
          onFocusIn={(e) => {
            // Auto-open when user focuses a form input so the keyboard doesn't cover it
            const el = e.target as HTMLElement;
            if ((el.tagName === "INPUT" || el.tagName === "SELECT") && sheetState() !== "open") {
              setSheetState("open");
            }
          }}
        >
          <ProcessPanel sourceAtBottom />
        </div>
      </section>
    </>
  );
}

// ── Root app shell ──────────────────────────────────────────────────────────
export default function ImageApp() {
  return (
    <ImageAppProvider>
      <div class="h-dvh overflow-hidden flex flex-row bg-background">
        {/* Desktop icon dock */}
        <AppSidebar />

        {/* Control panel — desktop only */}
        <div class="hidden md:flex flex-col w-[320px] border-r border-border bg-card overflow-hidden shrink-0">
          <div class="flex flex-col flex-1 overflow-hidden min-h-0">
            <ProcessPanel />
          </div>
        </div>

        {/* Preview — fills remaining space on all screen sizes */}
        <div class="flex-1 overflow-hidden flex flex-col">
          <PreviewPanel />
        </div>
      </div>

      {/* Mobile overlays */}
      <FloatingBackButton />
      <MobileSheet />
    </ImageAppProvider>
  );
}
