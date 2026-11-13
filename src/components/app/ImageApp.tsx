import { ChevronUp, SlidersHorizontal } from "lucide-solid";
import { createEffect, createSignal, on, onCleanup, onMount, Show } from "solid-js";
import AppTopBar from "@/components/app/AppTopBar";
import PreviewPanel from "@/components/app/PreviewPanel";
import ProcessPanel from "@/components/app/panels/ProcessPanel";
import DownloadSection from "@/components/app/preview/DownloadSection";
import ErrorDisplay from "@/components/app/preview/ErrorDisplay";
import ImageInfoBar from "@/components/app/preview/ImageInfoBar";
import { ImageAppProvider, useImageApp } from "@/components/app/state/ImageAppContext";
import { buttonVariants } from "@/components/ui/button";

// ── Mobile bottom sheet ─────────────────────────────────────────────────────
// Two visible states, zero drag logic:
//   hidden  → no image loaded; sheet is fully off-screen below the viewport
//   peek    → image loaded; the Settings handle, info, and Download stay visible
//   open    → 80dvh panel; tap Done or backdrop to return to peek
//
// Toggling is a single boolean tap with no pointer-event math or flick thresholds.
// CSS spring handles the animation, while the header observer keeps the peek state honest.

type SheetState = "hidden" | "peek" | "open";

const EDITOR_BREAKPOINT_QUERY = "(min-width: 56rem)";

function MobileSheet() {
  const { state } = useImageApp();
  const [sheetState, setSheetState] = createSignal<SheetState>("hidden");
  const [headerTransitions, setHeaderTransitions] = createSignal(false);
  let sheetRef: HTMLElement | undefined;
  let sheetHeaderRef: HTMLDivElement | undefined;
  let controlsToggleRef: HTMLButtonElement | undefined;
  let headerTransitionFallback: number | undefined;
  let disposed = false;
  let lastFocusedElement: HTMLElement | null = null;

  // Auto-transition only when an image is newly-loaded (null → image) or
  // cleared (image → null).  A processing completion replaces the currentImage
  // object (fresh processed URL), so the image → image transition must stay a
  // no-op — otherwise the sheet would slam back to "peek" while the user is
  // trying to interact with the controls.
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

  function collapseSheet() {
    setSheetState("peek");
    headerTransitionStarted();
    queueMicrotask(() => {
      if (!disposed && controlsToggleRef?.isConnected) controlsToggleRef.focus();
    });
  }

  // Freeze the peek height from the settled peek layout before the open
  // transition starts.  Measuring later races the collapse animation and
  // would briefly point the slide at a wrong offset.
  // Set on the root so the preview's bottom margin follows the same height.
  function capturePeekHeight() {
    const height = sheetHeaderRef?.getBoundingClientRect().height;
    if (height)
      document.documentElement.style.setProperty("--spacing-app-sheet-peek", `${height}px`);
  }

  // While the header is collapsing or re-expanding, the peek height is in flux;
  // the ResizeObserver must not chase it frame by frame or the slide would
  // constantly retarget.  The fallback covers reduced layouts without events.
  function headerTransitionStarted() {
    setHeaderTransitions(true);
    window.clearTimeout(headerTransitionFallback);
    headerTransitionFallback = window.setTimeout(() => setHeaderTransitions(false), 700);
  }

  function headerTransitionSettled() {
    window.clearTimeout(headerTransitionFallback);
    setHeaderTransitions(false);
  }

  // The collapsed peek affordances re-expand through a transition; once it
  // settles, the peek offset must match the (possibly changed) header size.
  function handleAffordanceTransition(event: TransitionEvent) {
    if (event.propertyName !== "max-height") return;
    headerTransitionSettled();
    if (sheetState() === "peek") capturePeekHeight();
  }

  function toggleSheet() {
    if (sheetState() === "open") {
      collapseSheet();
      return;
    }

    if (sheetState() === "peek") {
      capturePeekHeight();
      headerTransitionStarted();
    }
    setSheetState("open");
  }

  const focusableSelector =
    'button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), a[href], [role="button"][tabindex]:not([tabindex="-1"])';

  function getFocusableElements(): HTMLElement[] {
    return Array.from(sheetRef?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(
      (element) => !element.closest("[inert]") && element.getAttribute("aria-hidden") !== "true"
    );
  }

  function focusSheet() {
    queueMicrotask(() => {
      if (!disposed && sheetState() === "open" && sheetRef?.isConnected) sheetRef.focus();
    });
  }

  function isHidden(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      const styles = window.getComputedStyle(current);
      if (styles.display === "none" || styles.visibility === "hidden") return true;
      current = current.parentElement;
    }
    return false;
  }

  function handleSheetKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && !event.defaultPrevented && sheetState() === "open") {
      event.preventDefault();
      event.stopPropagation();
      collapseSheet();
      return;
    }

    if (event.key !== "Tab" || sheetState() !== "open") return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === sheetRef)
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || document.activeElement === sheetRef)
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  onMount(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target !== document.body) {
        lastFocusedElement = event.target;
      }
    };
    const clearFocusedElement = () => {
      lastFocusedElement = null;
    };
    document.addEventListener("focusin", handleFocusIn, true);
    window.addEventListener("blur", clearFocusedElement);

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && sheetState() === "open") {
        event.preventDefault();
        collapseSheet();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    const editorBreakpoint =
      typeof window.matchMedia === "function" ? window.matchMedia(EDITOR_BREAKPOINT_QUERY) : null;
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      const activeElement = document.activeElement;
      const activeHtmlElement = activeElement instanceof HTMLElement ? activeElement : null;
      const focusOrigin =
        activeHtmlElement && activeHtmlElement !== document.body
          ? activeHtmlElement
          : lastFocusedElement && isHidden(lastFocusedElement)
            ? lastFocusedElement
            : activeHtmlElement;
      // The top bar and the empty state stay on screen at every size, so only
      // focus inside controls that disappear needs a new home.
      const hadDesktopOnlyFocus = !!focusOrigin?.closest("[data-desktop-only]");
      if (event.matches) {
        const hadSheetFocus = !!focusOrigin && !!sheetRef?.contains(focusOrigin);
        lastFocusedElement = null;
        setSheetState("hidden");
        if (hadSheetFocus) {
          queueMicrotask(() => {
            if (disposed) return;
            document.querySelector<HTMLElement>("#width-input:not([disabled])")?.focus();
          });
        }
      } else if (state.currentImage()) {
        lastFocusedElement = null;
        setSheetState("peek");
        if (hadDesktopOnlyFocus) queueMicrotask(() => !disposed && controlsToggleRef?.focus());
      } else if (hadDesktopOnlyFocus) {
        lastFocusedElement = null;
        queueMicrotask(() => {
          if (disposed) return;
          document.querySelector<HTMLElement>("#sbs-empty-state button:not([disabled])")?.focus();
        });
      }
    };
    editorBreakpoint?.addEventListener("change", handleBreakpointChange);

    const updatePeekHeight = () => {
      if (sheetState() === "peek" && !headerTransitions()) capturePeekHeight();
    };
    const resizeObserver =
      typeof ResizeObserver === "function" && sheetHeaderRef
        ? new ResizeObserver(updatePeekHeight)
        : null;
    if (resizeObserver && sheetHeaderRef) resizeObserver.observe(sheetHeaderRef);
    updatePeekHeight();

    onCleanup(() => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.removeEventListener("focusin", handleFocusIn, true);
      window.removeEventListener("blur", clearFocusedElement);
      editorBreakpoint?.removeEventListener("change", handleBreakpointChange);
      resizeObserver?.disconnect();
    });
  });

  createEffect(
    on(sheetState, (nextState) => {
      const appShell = document.querySelector<HTMLElement>("[data-app-shell]");
      const skipLink = document.querySelector<HTMLElement>("[data-global-skip-link]");
      if (sheetRef) {
        if (nextState === "open") {
          sheetRef.setAttribute("role", "dialog");
          sheetRef.setAttribute("aria-modal", "true");
        } else {
          sheetRef.setAttribute("role", "region");
          sheetRef.removeAttribute("aria-modal");
        }
      }
      if (nextState === "open") {
        appShell?.setAttribute("inert", "");
        skipLink?.setAttribute("inert", "");
        focusSheet();
      } else {
        appShell?.removeAttribute("inert");
        skipLink?.removeAttribute("inert");
      }
      // Let the preview make room for the sheet so the live image is never
      // buried underneath it.  Desktop has a static layout, so desktop keeps
      // the shell attribute off.
      const onMobile =
        typeof window.matchMedia !== "function" ||
        !window.matchMedia(EDITOR_BREAKPOINT_QUERY).matches;
      if (nextState !== "hidden" && onMobile) {
        appShell?.setAttribute("data-sheet-state", nextState);
      } else {
        appShell?.removeAttribute("data-sheet-state");
      }
    })
  );

  onCleanup(() => {
    disposed = true;
    window.clearTimeout(headerTransitionFallback);
    document.documentElement.style.removeProperty("--spacing-app-sheet-peek");
    document.querySelector<HTMLElement>("[data-app-shell]")?.removeAttribute("inert");
    document.querySelector<HTMLElement>("[data-global-skip-link]")?.removeAttribute("inert");
  });

  // Derived values for the info bar
  const img = () => state.currentImage();
  const displayWidth = () =>
    state.lastCompletedResult()?.metadata.width ?? img()?.metadata.width ?? 0;
  const displayHeight = () =>
    state.lastCompletedResult()?.metadata.height ?? img()?.metadata.height ?? 0;
  const displayFileSize = () =>
    state.lastCompletedResult()?.metadata.fileSize ?? img()?.metadata.fileSize ?? 0;

  return (
    <>
      {/* Backdrop — tap to collapse when fully open */}
      <Show when={sheetState() === "open"}>
        <div
          class="animate-sheet-backdrop-in editor:hidden fixed inset-0 z-50 cursor-pointer bg-fg/20"
          onClick={collapseSheet}
          aria-hidden="true"
        />
      </Show>

      {/* Sheet */}
      <section
        ref={(element) => {
          sheetRef = element;
        }}
        tabIndex={-1}
        aria-label="Settings"
        aria-hidden={sheetState() === "hidden" ? "true" : "false"}
        inert={sheetState() === "hidden"}
        class="editor:hidden fixed inset-x-0 bottom-0 z-60 flex h-app-sheet translate-y-full flex-col rounded-t-lg border-t border-line bg-surface pr-(--safe-area-inset-right) pl-(--safe-area-inset-left) shadow-mobile-sheet will-change-transform overscroll-contain transition-transform duration-150 ease-sheet data-[sheet-state=open]:translate-y-0 data-[sheet-state=peek]:translate-y-[calc(100%-var(--spacing-app-sheet-peek))]"
        onKeyDown={handleSheetKeyDown}
        data-sheet-state={sheetState()}
      >
        {/* ── Sticky header: transitions between collapsed peek controls and a standard modal header ── */}
        <div
          ref={(element) => {
            sheetHeaderRef = element;
          }}
          class="shrink-0"
        >
          <span aria-hidden="true" class="mx-auto mt-2 block h-1 w-9 rounded-full bg-line-strong" />
          {/* Peek: a quiet handle that opens the controls. Open: a title bar with Done. */}
          <div
            class={
              sheetState() === "open"
                ? "flex min-h-12 items-center justify-between gap-3 border-b border-line px-4 pt-1 pb-2"
                : "px-4 pt-2 pb-2"
            }
          >
            <Show when={sheetState() === "open"}>
              <div class="flex min-w-0 flex-col">
                <h2 class="text-sm font-semibold text-fg">Settings</h2>
                <Show when={img()}>
                  {(currentImg) => (
                    <p class="truncate text-xs text-fg-muted">
                      {currentImg().metadata.fileName} · {displayWidth()} × {displayHeight()} px
                    </p>
                  )}
                </Show>
              </div>
            </Show>

            <button
              ref={(element) => {
                controlsToggleRef = element;
              }}
              type="button"
              class={
                sheetState() === "open"
                  ? buttonVariants({ variant: "secondary", size: "sm" })
                  : `${buttonVariants({ variant: "secondary", fullWidth: true })} justify-between`
              }
              onClick={toggleSheet}
              aria-controls="mobile-controls-content"
              aria-expanded={sheetState() === "open"}
            >
              <Show
                when={sheetState() === "open"}
                fallback={
                  <>
                    <span class="flex items-center gap-2">
                      <SlidersHorizontal size={16} class="text-fg-muted" aria-hidden="true" />
                      <span>Settings</span>
                    </span>
                    <ChevronUp size={18} class="text-fg-muted" aria-hidden="true" />
                  </>
                }
              >
                <span>Done</span>
              </Show>
            </button>
          </div>

          {/* Peek-only affordances stay mounted and collapse smoothly mid-slide
              instead of unmounting, so the header morphs instead of snapping */}
          <div
            id="mobile-peek-affordances"
            class="max-h-66 overflow-hidden opacity-100 transition-[max-height,opacity] duration-300 ease-sheet aria-hidden:max-h-0 aria-hidden:opacity-0"
            onTransitionEnd={handleAffordanceTransition}
            aria-hidden={sheetState() === "open" ? "true" : "false"}
            inert={sheetState() === "open"}
          >
            <Show when={img()}>
              {(currentImg) => (
                <div class="px-4 pb-1">
                  <ImageInfoBar
                    idPrefix="mobile-"
                    fileName={currentImg().metadata.fileName}
                    width={displayWidth()}
                    height={displayHeight()}
                    originalFileSize={currentImg().metadata.fileSize}
                    fileSize={displayFileSize()}
                  />
                </div>
              )}
            </Show>

            {/* Download: the sheet's single primary action, reachable straight from peek */}
            <div class="flex flex-col gap-2 px-4 pt-2 pb-[max(0.75rem,var(--safe-area-inset-bottom))]">
              <Show when={sheetState() === "peek" && state.error()}>
                {(msg) => <ErrorDisplay message={msg()} />}
              </Show>
              <DownloadSection idPrefix="mobile-" />
            </div>
          </div>
        </div>

        {/* Scrollable settings content */}
        <div
          id="mobile-controls-content"
          data-sheet-content
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-canvas pb-[max(1rem,var(--safe-area-inset-bottom))]"
          aria-hidden={sheetState() === "open" ? "false" : "true"}
          inert={sheetState() !== "open"}
        >
          <ProcessPanel sourceAtBottom idPrefix="mobile-" showFormatNotice={false} />
          {/* When open, Download waits at the end of the controls */}
          <div class="flex flex-col gap-2 px-3 pb-2">
            <Show when={sheetState() === "open" && state.error()}>
              {(msg) => <ErrorDisplay message={msg()} />}
            </Show>
            <DownloadSection idPrefix="mobile-modal-" />
          </div>
        </div>
      </section>
    </>
  );
}

// ── Root app shell ──────────────────────────────────────────────────────────
function AppShell() {
  const { actions } = useImageApp();

  // A file dropped outside the drop targets would otherwise open in the tab
  // and end the session. Drops the targets already handled are skipped.
  function handleDragOver(event: DragEvent) {
    if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
  }

  function handleDrop(event: DragEvent) {
    if (event.defaultPrevented || !event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void actions.handleFileUpload(file);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a page-wide drop target; the upload buttons are the keyboard and pointer controls
    <div class="contents" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div
        data-app-shell
        class="group/app flex h-dvh flex-col overflow-hidden bg-canvas pt-(--safe-area-inset-top) pr-(--safe-area-inset-right) pl-(--safe-area-inset-left)"
      >
        <h1 class="sr-only">Reshrimp</h1>
        <AppTopBar />

        <div class="flex min-h-0 flex-1">
          {/* Controls panel: Cards on the canvas, desktop only */}
          <aside
            data-desktop-only
            aria-label="Settings"
            class="hidden w-app-panel shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-line editor:flex"
          >
            <ProcessPanel />
          </aside>

          {/* Preview fills the remaining space on every screen size */}
          <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <PreviewPanel />
          </div>
        </div>
      </div>

      {/* Mobile overlays */}
      <MobileSheet />
    </div>
  );
}

export default function ImageApp() {
  return (
    <ImageAppProvider>
      <AppShell />
    </ImageAppProvider>
  );
}
