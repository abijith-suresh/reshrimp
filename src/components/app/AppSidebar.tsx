import { For, Show, type Component } from "solid-js";
import { Wand2, SlidersHorizontal, Layers } from "lucide-solid";
import { makeHref } from "@/lib/utils";
import { ROUTES } from "@/config/constants";

export type AppMode = "image" | "adjustments" | "batch";

type IconComp = Component<{ class?: string; "aria-hidden"?: string }>;

interface ModeItem {
  mode: AppMode;
  Icon: IconComp;
  label: string;
  available: boolean;
  comingSoonNote: string;
}

const MODES: ModeItem[] = [
  {
    mode: "image",
    Icon: Wand2 as unknown as IconComp,
    label: "Process",
    available: true,
    comingSoonNote: "",
  },
  {
    mode: "adjustments",
    Icon: SlidersHorizontal as unknown as IconComp,
    label: "Adjust",
    available: false,
    comingSoonNote: "Brightness & contrast — coming soon",
  },
  {
    mode: "batch",
    Icon: Layers as unknown as IconComp,
    label: "Batch",
    available: false,
    comingSoonNote: "Bulk processing — coming soon",
  },
];

interface AppSidebarProps {
  activeMode: AppMode;
  drawerOpen?: boolean;
  onModeChange: (mode: AppMode) => void;
  onToggleDrawer?: () => void;
}

export default function AppSidebar(props: AppSidebarProps) {
  function handleMobileTabClick(item: ModeItem) {
    if (!item.available) return;
    if (item.mode !== props.activeMode) {
      props.onModeChange(item.mode);
      if (!props.drawerOpen) props.onToggleDrawer?.();
    } else {
      props.onToggleDrawer?.();
    }
  }

  return (
    <>
      {/* ── Desktop left dock ────────────────────────────────── */}
      <nav
        class="hidden md:flex flex-col items-center w-12 bg-sp-bg-card border-r border-sp-border py-4 gap-1 shrink-0"
        aria-label="App navigation"
      >
        {/* Logo / home */}
        <a
          href={makeHref(ROUTES.HOME)}
          class="flex items-center justify-center w-8 h-8 rounded-sp transition-all duration-200 hover:bg-sp-coral-light group mb-2"
          aria-label="Back to home"
        >
          <span class="w-3 h-3 rounded-full bg-sp-coral transition-transform duration-300 group-hover:scale-125 flex-shrink-0" />
        </a>

        <div class="w-6 h-px bg-sp-border-light" />

        <For each={MODES}>
          {(item) => (
            <div class="relative group">
              <button
                type="button"
                class="flex items-center justify-center w-8 h-8 rounded-sp transition-all duration-200 mt-1"
                classList={{
                  "bg-sp-coral text-white shadow-[0_2px_8px_rgba(255,107,107,0.3)]":
                    props.activeMode === item.mode && item.available,
                  "text-sp-text-muted hover:bg-sp-lavender-light hover:text-sp-lavender-dark":
                    props.activeMode !== item.mode && item.available,
                  "text-sp-text-soft opacity-50 cursor-not-allowed": !item.available,
                }}
                disabled={!item.available}
                onClick={() => item.available && props.onModeChange(item.mode)}
                aria-label={item.label}
                aria-current={props.activeMode === item.mode ? "page" : undefined}
              >
                <item.Icon class="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Tooltip */}
              <div class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-sp-text text-white text-[0.7rem] rounded-sp whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <Show when={item.available} fallback={item.comingSoonNote}>
                  {item.label}
                </Show>
              </div>
            </div>
          )}
        </For>

        <div class="flex-1" />

        {/* Info link */}
        <a
          href={makeHref(ROUTES.ABOUT)}
          class="flex items-center justify-center w-8 h-8 rounded-sp text-sp-text-soft hover:text-sp-text-muted hover:bg-sp-bg transition-all duration-200"
          aria-label="About Reshrimp"
          title="About"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </a>
      </nav>

      {/* ── Mobile bottom bar ─────────────────────────────────── */}
      <nav
        class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sp-bg-card border-t border-sp-border flex items-center justify-around px-4"
        style={{ "padding-bottom": "max(8px, env(safe-area-inset-bottom))", height: "56px" }}
        aria-label="App navigation"
      >
        <For each={MODES}>
          {(item) => (
            <button
              type="button"
              class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-sp transition-all duration-200"
              classList={{
                "text-sp-coral": props.activeMode === item.mode && item.available,
                "text-sp-text-soft": props.activeMode !== item.mode || !item.available,
                "opacity-40 cursor-not-allowed": !item.available,
              }}
              disabled={!item.available}
              onClick={() => handleMobileTabClick(item)}
              aria-label={item.available ? item.label : `${item.label} — coming soon`}
            >
              <item.Icon class="w-5 h-5" aria-hidden="true" />
              <span class="text-[0.6rem] font-semibold tracking-wide uppercase">{item.label}</span>
            </button>
          )}
        </For>
      </nav>
    </>
  );
}
