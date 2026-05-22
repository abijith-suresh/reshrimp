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
  /** true once pointerdown has fired; cleared on pointerup/cancel */
  let pointerActive = false;
  /** true once the pointer has moved past the drag threshold */
  let isDragging = false;
  let startY = 0;
  /** translateY in px at the moment the pointer went down, from getBoundingClientRect */
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

  const SPRING = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
  /** Min pointer travel (px) before we treat the gesture as a drag */
  const DRAG_THRESHOLD = 8;
  /** Min travel (px) to treat as a directional flick regardless of final position */
  const FLICK_THRESHOLD = 50;

  function translateYString(snap: SnapState): string {
    switch (snap) {
      case "hidden":
        return "100%";
      case "mini":
        // env(safe-area-inset-bottom) keeps the peek above the home indicator on iOS
        return `calc(100% - ${MINI_HEIGHT}px - env(safe-area-inset-bottom, 0px))`;
      case "full":
        return "0%";
    }
  }

  /** Read the element's actual current translateY in px from the DOM. */
  function readTranslateY(): number {
    if (!sheetRef) return 0;
    const rect = sheetRef.getBoundingClientRect();
    // fixed bottom-0: natural (un-transformed) top = innerHeight - offsetHeight
    return rect.top - (window.innerHeight - sheetRef.offsetHeight);
  }

  /** Apply spring snap directly on the element then sync the signal. */
  function springSnapTo(target: SnapState) {
    // The sheet is currently at the dragged pixel position (set in onPointerMove).
    // Re-enabling the spring here causes it to animate FROM that position TO the
    // target — no flashing or double-snap.
    if (sheetRef) {
      sheetRef.style.transition = SPRING;
      sheetRef.style.transform = translateYString(target);
    }
    // Keep the signal in sync; SolidJS will re-apply the same transform/transition
    // values (no-op visually) so there is no conflict.
    snapTo(target);
  }

  function handleHandleTap() {
    if (snapState() === "mini") springSnapTo("full");
    else if (snapState() === "full") springSnapTo("mini");
  }

  // ── Pointer-event drag ──────────────────────────────────────────────────
  function onPointerDown(e: PointerEvent) {
    pointerActive = true;
    isDragging = false;
    startY = e.clientY;
    // Use actual DOM position so safe-area offset is accounted for
    startTranslateY = readTranslateY();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Don't disable transition yet — wait until we're sure it's a drag
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointerActive) return;
    const delta = e.clientY - startY;

    if (!isDragging) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return; // below threshold — not a drag yet
      isDragging = true;
      // Now we're sure it's a drag: kill the transition so the sheet follows instantly
      if (sheetRef) sheetRef.style.transition = "none";
    }

    const y = Math.max(0, startTranslateY + delta);
    if (sheetRef) sheetRef.style.transform = `translateY(${y}px)`;
  }

  function onPointerUp(e: PointerEvent) {
    if (!pointerActive) return;
    pointerActive = false;

    if (!isDragging) {
      // No significant movement — it was a tap, let onClick handle the toggle
      return;
    }
    isDragging = false;

    const delta = e.clientY - startY;
    const height = sheetRef?.offsetHeight ?? 0;
    const y = Math.max(0, startTranslateY + delta);

    // ── Snap decision ───────────────────────────────────────────────────
    // Fast flick (>FLICK_THRESHOLD px) → honour direction unconditionally.
    // Slow deliberate drag  → use final position vs 40 % of sheet height.
    let target: SnapState;
    if (delta < -FLICK_THRESHOLD) {
      target = "full"; // fast flick up
    } else if (delta > FLICK_THRESHOLD) {
      target = state.currentImage() ? "mini" : "hidden"; // fast flick down
    } else if (y < height * 0.4) {
      target = "full"; // dragged into upper 40 %
    } else {
      target = state.currentImage() ? "mini" : "hidden"; // dragged into lower 60 %
    }

    // ── Critical: do NOT clear style.transform here. ─────────────────────
    // The element is still at the dragged pixel position set in onPointerMove.
    // springSnapTo() re-enables the transition and sets the target transform,
    // which causes the browser to animate FROM the drag position TO the target.
    // Clearing transform first (old behaviour) made the element flash back to
    // the SolidJS-reactive position before transitioning — causing the
    // apparent "snaps up before going down" bug.
    springSnapTo(target);
  }

  function onPointerCancel() {
    if (!pointerActive) return;
    pointerActive = false;
    isDragging = false;
    // Cancelled mid-drag: snap back to whichever state the signal holds
    if (sheetRef) {
      sheetRef.style.transition = SPRING;
      sheetRef.style.transform = translateYString(snapState());
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
        {/* ── Drag zone: handle pill + info strip ── */}
        {/* Extends to the info strip so the full mini-peek is swipeable;
            Download button is kept OUTSIDE so taps on it always register. */}
        <div
          class="shrink-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {/* Tap to toggle mini ↔ full */}
          <button
            type="button"
            class="flex justify-center pt-3 pb-2 w-full cursor-grab active:cursor-grabbing"
            aria-label={snapState() === "full" ? "Minimise controls" : "Expand controls"}
            onClick={handleHandleTap}
          >
            <div class="w-10 h-1 bg-sp-border rounded-full pointer-events-none" />
          </button>

          <Show when={img()}>
            {(currentImg) => (
              <div class="px-4 pb-2">
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
        </div>

        {/* ── Download button — outside drag zone so taps are never swallowed ── */}
        <div
          class="shrink-0 px-4"
          style={{ "padding-bottom": "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
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
