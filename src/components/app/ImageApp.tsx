import { createSignal, Show, createEffect, on } from "solid-js";
import AppSidebar from "@/components/app/AppSidebar";
import ProcessPanel from "@/components/app/panels/ProcessPanel";
import PreviewPanel from "@/components/app/PreviewPanel";
import { ImageAppProvider, useImageApp } from "@/components/app/state/ImageAppContext";
import FloatingBackButton from "@/components/app/FloatingBackButton";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import DownloadSection from "@/components/app/preview/DownloadSection";

// ── Snap-point sheet (mobile only) ─────────────────────────────────────────
// Three states mirror the Squoosh pattern:
//   hidden  → no image loaded; sheet is fully below the viewport
//   mini    → image loaded; 140px peek showing info strip + download button
//   full    → 80dvh panel; all controls scrollable

type SnapState = "hidden" | "mini" | "full";

/** px visible above the bottom edge in "mini" state */
const MINI_HEIGHT = 140;

function MobileSheet() {
  const { state } = useImageApp();
  const [snapState, setSnapState] = createSignal<SnapState>("hidden");

  let sheetRef: HTMLDivElement | undefined;
  let dragging = false;
  let startY = 0;
  let startTranslateY = 0;

  // Auto-snap: image loaded → mini, image cleared → hidden
  createEffect(
    on(state.currentImage, (img) => {
      setSnapState(img ? "mini" : "hidden");
    })
  );

  function snapTo(next: SnapState) {
    setSnapState(next);
  }

  function computeTranslateY(snap: SnapState, sheetHeight: number): number {
    switch (snap) {
      case "hidden":
        return sheetHeight;
      case "mini":
        return sheetHeight - MINI_HEIGHT;
      case "full":
        return 0;
    }
  }

  function translateYString(snap: SnapState): string {
    switch (snap) {
      case "hidden":
        return "100%";
      case "mini":
        // Subtract safe-area-inset-bottom so the mini peek clears the home indicator
        return `calc(100% - ${MINI_HEIGHT}px - env(safe-area-inset-bottom, 0px))`;
      case "full":
        return "0%";
    }
  }

  function handleHandleTap() {
    if (snapState() === "mini") snapTo("full");
    else if (snapState() === "full") snapTo("mini");
  }

  // ── Pointer-event drag ──────────────────────────────────────────────────
  function onPointerDown(e: PointerEvent) {
    dragging = true;
    startY = e.clientY;
    startTranslateY = computeTranslateY(snapState(), sheetRef?.offsetHeight ?? 0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Disable CSS transition while dragging for immediate response
    if (sheetRef) sheetRef.style.transition = "none";
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const delta = e.clientY - startY;
    const y = Math.max(0, startTranslateY + delta);
    if (sheetRef) sheetRef.style.transform = `translateY(${y}px)`;
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;

    const delta = e.clientY - startY;
    const height = sheetRef?.offsetHeight ?? 0;
    const y = startTranslateY + delta;

    // Restore CSS spring transition before snapping
    if (sheetRef) sheetRef.style.transition = "";
    if (sheetRef) sheetRef.style.transform = "";

    // Velocity-aware snap thresholds
    if (y < height * 0.25) {
      snapTo("full");
    } else if (y > height * 0.7) {
      snapTo(state.currentImage() ? "mini" : "hidden");
    } else {
      // Middle zone: direction decides
      snapTo(delta < 0 ? "full" : "mini");
    }
  }

  // ── Derived display values from context ────────────────────────────────
  const img = () => state.currentImage();
  const displayWidth = () => state.processResult()?.metadata.width ?? img()?.metadata.width ?? 0;
  const displayHeight = () => state.processResult()?.metadata.height ?? img()?.metadata.height ?? 0;
  const displayFileSize = () =>
    state.processResult()?.metadata.fileSize ?? img()?.metadata.fileSize ?? 0;

  return (
    <>
      {/* Backdrop — tap to minimise when fully expanded */}
      <Show when={snapState() === "full"}>
        <div
          class="md:hidden fixed inset-0 z-30 bg-black/20"
          onClick={() => snapTo("mini")}
          aria-hidden="true"
        />
      </Show>

      {/* Sheet */}
      <div
        ref={(el) => {
          sheetRef = el;
        }}
        class="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-sp-bg-card rounded-t-[20px] shadow-[0_-4px_24px_rgba(30,27,75,0.12)] flex flex-col"
        style={{
          height: "80dvh",
          transform: translateYString(snapState()),
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          "will-change": "transform",
        }}
        aria-label="Image controls"
        aria-hidden={snapState() === "hidden" ? "true" : "false"}
      >
        {/* ── Drag-handle zone (pointer capture target) ── */}
        <div
          class="shrink-0 touch-none cursor-grab active:cursor-grabbing select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <button
            type="button"
            class="flex justify-center pt-3 pb-2 w-full"
            aria-label={snapState() === "full" ? "Minimise controls" : "Expand controls"}
            onClick={handleHandleTap}
          >
            <div class="w-10 h-1 bg-sp-border rounded-full pointer-events-none" />
          </button>
        </div>

        {/* ── Mini-peek header: always visible in mini + full ── */}
        <div
          class="shrink-0 px-4 flex flex-col"
          style={{ "padding-bottom": "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <Show when={img()}>
            {(currentImg) => (
              <ImageInfoBar
                fileName={currentImg().metadata.fileName}
                width={displayWidth()}
                height={displayHeight()}
                fileSize={displayFileSize()}
                sizeDiff={state.sizeDifference()}
              />
            )}
          </Show>
          <DownloadSection />
        </div>

        {/* ── Scrollable full content ── */}
        <div
          class="overflow-y-auto flex-1 min-h-0"
          onFocusIn={(e) => {
            const el = e.target as HTMLElement;
            // Snap to full when user focuses an input so keyboard doesn't cover it
            if ((el.tagName === "INPUT" || el.tagName === "SELECT") && snapState() !== "full") {
              snapTo("full");
            }
          }}
        >
          <ProcessPanel />
        </div>
      </div>
    </>
  );
}

// ── Root app shell ──────────────────────────────────────────────────────────
export default function ImageApp() {
  return (
    <ImageAppProvider>
      <div class="h-dvh overflow-hidden flex flex-row bg-sp-bg">
        {/* Desktop icon dock */}
        <AppSidebar />

        {/* Control panel — desktop only */}
        <div class="hidden md:flex flex-col w-[320px] border-r border-sp-border bg-sp-bg-card overflow-hidden shrink-0">
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
