import { createSignal, Show } from "solid-js";
import AppSidebar from "@/components/app/AppSidebar";
import ProcessPanel from "@/components/app/panels/ProcessPanel";
import PreviewPanel from "@/components/app/PreviewPanel";
import { ImageAppProvider } from "@/components/app/state/ImageAppContext";

export default function ImageApp() {
  const [drawerOpen, setDrawerOpen] = createSignal(false);

  function handleToggleDrawer() {
    setDrawerOpen((prev) => !prev);
  }

  return (
    <ImageAppProvider>
      {/* ── Root: h-dvh keeps the whole shell locked to viewport ── */}
      <div class="h-dvh overflow-hidden flex flex-row bg-sp-bg">
        {/* Left nav dock — desktop only (hidden on mobile) */}
        <AppSidebar drawerOpen={drawerOpen()} onToggleDrawer={handleToggleDrawer} />

        {/* Control panel — desktop: second column, hidden on mobile */}
        <div class="hidden md:flex flex-col w-[320px] border-r border-sp-border bg-sp-bg-card overflow-hidden shrink-0">
          <div class="flex flex-col flex-1 overflow-hidden min-h-0">
            <ProcessPanel />
          </div>
        </div>

        {/* Preview area — fills remaining space on all screen sizes */}
        {/* pb-14 on mobile keeps content above the fixed bottom bar */}
        <div class="flex-1 overflow-hidden flex flex-col pb-14 md:pb-0">
          <PreviewPanel />
        </div>
      </div>

      {/* ── Mobile: bottom drawer ──────────────────────────────── */}
      {/* Backdrop */}
      <Show when={drawerOpen()}>
        <div
          class="md:hidden fixed inset-0 z-30 bg-black/25 transition-opacity duration-200"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      </Show>

      {/* Drawer panel */}
      <div
        id="app-controls-drawer"
        class="md:hidden fixed left-0 right-0 z-40 bg-sp-bg-card rounded-t-[20px] shadow-[0_-4px_24px_rgba(30,27,75,0.12)] overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        style={{
          bottom: "56px",
          "max-height": "72dvh",
          transform: drawerOpen() ? "translateY(0)" : "translateY(110%)",
        }}
        aria-label="Image controls"
        aria-hidden={!drawerOpen()}
      >
        {/* Drag handle — tap to close */}
        <button
          type="button"
          class="flex justify-center pt-3 pb-1 w-full shrink-0 cursor-pointer"
          aria-label="Close controls"
          onClick={() => setDrawerOpen(false)}
        >
          <div class="w-10 h-1 bg-sp-border rounded-full" />
        </button>
        <div class="overflow-y-auto flex-1 min-h-0">
          <div class="flex flex-col flex-1 overflow-hidden min-h-0">
            <ProcessPanel />
          </div>
        </div>
      </div>
    </ImageAppProvider>
  );
}

export type { SizeDiff } from "@/components/app/state/ImageAppContext";
