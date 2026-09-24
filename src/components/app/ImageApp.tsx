import { ChevronUp, SlidersHorizontal } from "lucide-solid";
import { createEffect, createSignal, on, onCleanup, onMount, Show } from "solid-js";
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
//   peek    → image loaded; the handle, info, and download header stays visible
//   open    → 80dvh panel; tap handle or backdrop to return to peek
//
// Toggling is a single boolean tap with no pointer-event math or flick thresholds.
// CSS spring handles the animation, while the header observer keeps the peek state honest.

type SheetState = "hidden" | "peek" | "open";

const SPRING = "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)";
const EDITOR_BREAKPOINT_QUERY = "(min-width: 56rem)";

function translateForState(s: SheetState): string {
  switch (s) {
    case "hidden":
      return "translateY(100%)";
    case "peek":
      // The shared token keeps the visible download action aligned with the sheet header.
      return "translateY(calc(100% - var(--app-sheet-peek-height)))";
    case "open":
      return "translateY(0%)";
  }
}

function MobileSheet() {
  const { state } = useImageApp();
  const [sheetState, setSheetState] = createSignal<SheetState>("hidden");
  let sheetRef: HTMLElement | undefined;
  let sheetHeaderRef: HTMLDivElement | undefined;
  let controlsToggleRef: HTMLButtonElement | undefined;
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
    queueMicrotask(() => {
      if (!disposed && controlsToggleRef?.isConnected) controlsToggleRef.focus();
    });
  }

  function toggleSheet() {
    if (sheetState() === "open") {
      collapseSheet();
      return;
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

  function findSelectListbox(element: HTMLElement | null): HTMLElement | null {
    if (!element) return null;
    const nestedListbox = element.closest<HTMLElement>('[role="listbox"]');
    if (nestedListbox) return nestedListbox;
    const controlledId = element.getAttribute("aria-controls");
    return controlledId ? document.getElementById(controlledId) : null;
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
      const focusedListbox = findSelectListbox(focusOrigin);
      const listboxTriggerId = focusedListbox?.getAttribute("aria-labelledby");
      const listboxTrigger = listboxTriggerId
        ? document.getElementById(listboxTriggerId)
        : focusOrigin?.matches('button[aria-haspopup="listbox"]')
          ? focusOrigin
          : null;
      const appShell = document.querySelector<HTMLElement>("[data-app-shell]");
      if (event.matches) {
        const hadSheetFocus = !!focusOrigin && !!sheetRef?.contains(focusOrigin);
        const hadMobileBackFocus = !!focusOrigin?.closest("[data-mobile-back-button]");
        const hadMobileUploadFocus = !!focusOrigin?.closest("[data-mobile-empty-state-upload]");
        lastFocusedElement = null;
        focusedListbox?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
        );
        setSheetState("hidden");
        if (hadSheetFocus) {
          queueMicrotask(() => {
            if (disposed) return;
            document.querySelector<HTMLElement>("#width-input:not([disabled])")?.focus();
          });
        } else if (hadMobileBackFocus) {
          queueMicrotask(() => {
            if (disposed) return;
            document
              .querySelector<HTMLElement>(
                '[aria-label="App navigation"] a[aria-label="Back to home"]'
              )
              ?.focus();
          });
        } else if (hadMobileUploadFocus) {
          queueMicrotask(() => {
            if (disposed) return;
            document
              .querySelector<HTMLElement>(
                '.app-control-panel [aria-label="Upload image or drag and drop"]'
              )
              ?.focus();
          });
        }
      } else if (state.currentImage()) {
        const hadAppFocus =
          (!!focusOrigin && !!appShell?.contains(focusOrigin)) ||
          (!!listboxTrigger && !!appShell?.contains(listboxTrigger));
        lastFocusedElement = null;
        focusedListbox?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
        );
        setSheetState("peek");
        if (hadAppFocus) queueMicrotask(() => !disposed && controlsToggleRef?.focus());
      } else if (
        (!!focusOrigin && !!appShell?.contains(focusOrigin)) ||
        (!!listboxTrigger && !!appShell?.contains(listboxTrigger))
      ) {
        lastFocusedElement = null;
        focusedListbox?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
        );
        queueMicrotask(() => {
          if (disposed) return;
          document.querySelector<HTMLElement>("#sbs-empty-state button:not([disabled])")?.focus();
        });
      }
    };
    editorBreakpoint?.addEventListener("change", handleBreakpointChange);

    const updatePeekHeight = () => {
      const height = sheetHeaderRef?.getBoundingClientRect().height;
      if (height && sheetRef) {
        sheetRef.style.setProperty("--app-sheet-peek-height", `${height}px`);
      }
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
    })
  );

  onCleanup(() => {
    disposed = true;
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
          class="editor:hidden fixed inset-0 z-50 bg-black/20 cursor-pointer"
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
        aria-label="Image controls"
        aria-hidden={sheetState() === "hidden" ? "true" : "false"}
        inert={sheetState() === "hidden"}
        class="editor:hidden fixed inset-x-0 bottom-0 z-60 flex flex-col bg-card rounded-t-[22px] mobile-sheet"
        onKeyDown={handleSheetKeyDown}
        style={{
          transform: translateForState(sheetState()),
          transition: SPRING,
        }}
      >
        {/* ── Sticky header — always visible in peek ── */}
        <div
          ref={(element) => {
            sheetHeaderRef = element;
          }}
          class="shrink-0"
        >
          {/* Drag affordance */}
          <div class="flex justify-center pt-3" aria-hidden="true">
            <div
              class="rounded-full transition-[width,background] duration-300 mobile-sheet-handle"
              style={{
                width: sheetState() === "open" ? "28px" : "40px",
                background: sheetState() === "open" ? "var(--lavender-500)" : "var(--border)",
              }}
            />
          </div>

          {/* A visible action makes the collapsed sheet's purpose clear. */}
          <button
            ref={(element) => {
              controlsToggleRef = element;
            }}
            type="button"
            class="mx-4 mt-2 mb-2 flex min-h-11 items-center justify-between rounded-xl border border-lavender-200 bg-lavender-50 px-4 text-sm font-semibold text-lavender-700 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-lavender-100 active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-lavender-500/40"
            style={{ "touch-action": "manipulation" }}
            onClick={toggleSheet}
            aria-controls="mobile-controls-content"
            aria-expanded={sheetState() === "open"}
          >
            <span class="flex items-center gap-2">
              <SlidersHorizontal size={17} aria-hidden="true" />
              <span>{sheetState() === "open" ? "Done" : "Edit image"}</span>
            </span>
            <ChevronUp
              size={18}
              aria-hidden="true"
              class={`transition-transform duration-300 ${sheetState() === "open" ? "rotate-180" : ""}`}
            />
          </button>

          {/* File info row */}
          <Show when={img()}>
            {(currentImg) => (
              <div class="px-4 pb-1.5">
                <ImageInfoBar
                  idPrefix="mobile-"
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
            <DownloadSection idPrefix="mobile-" />
          </div>
        </div>

        {/* Hairline divider between header and content */}
        <div class="mx-4 h-px bg-border-light shrink-0" />

        {/* Scrollable settings content */}
        <div
          id="mobile-controls-content"
          data-sheet-content
          class="mobile-sheet-content flex-1 overflow-y-auto min-h-0"
          aria-hidden={sheetState() === "open" ? "false" : "true"}
          inert={sheetState() !== "open"}
        >
          <ProcessPanel sourceAtBottom idPrefix="mobile-" showDownload={false} />
        </div>
      </section>
    </>
  );
}

// ── Root app shell ──────────────────────────────────────────────────────────
export default function ImageApp() {
  return (
    <ImageAppProvider>
      <div data-app-shell class="app-safe-area h-dvh overflow-hidden flex flex-row bg-background">
        {/* Desktop icon dock */}
        <AppSidebar />

        {/* Control panel — desktop only */}
        <div class="hidden editor:flex app-control-panel flex-col border-r border-border bg-card overflow-hidden shrink-0">
          <div class="flex flex-col flex-1 overflow-hidden min-h-0">
            <ProcessPanel />
          </div>
        </div>

        {/* Preview — fills remaining space on all screen sizes */}
        <div class="flex-1 overflow-hidden flex flex-col">
          <PreviewPanel />
        </div>

        <FloatingBackButton />
      </div>

      {/* Mobile overlays */}
      <MobileSheet />
    </ImageAppProvider>
  );
}
