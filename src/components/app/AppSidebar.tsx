import { Info, Wand2 } from "lucide-solid";
import { ROUTES } from "@/config/constants";
import { makeHref } from "@/lib/utils";

interface AppSidebarProps {
  drawerOpen?: boolean;
  onToggleDrawer?: () => void;
}

export default function AppSidebar(props: AppSidebarProps) {
  return (
    <>
      <nav
        class="hidden md:flex flex-col items-center w-12 bg-sp-bg-card border-r border-sp-border py-4 gap-1 shrink-0"
        aria-label="App navigation"
      >
        <a
          href={makeHref(ROUTES.HOME)}
          class="flex items-center justify-center w-8 h-8 rounded-sp transition-all duration-200 hover:bg-sp-coral-light group mb-2"
          aria-label="Back to home"
        >
          <span class="w-3 h-3 rounded-full bg-sp-coral transition-transform duration-300 group-hover:scale-125 flex-shrink-0" />
        </a>

        <div class="w-6 h-px bg-sp-border-light" />

        <div class="flex-1" />

        <a
          href={makeHref(ROUTES.ABOUT)}
          class="flex items-center justify-center w-8 h-8 rounded-sp text-sp-text-soft hover:text-sp-text-muted hover:bg-sp-bg transition-all duration-200"
          aria-label="About Reshrimp"
          title="About"
        >
          <Info class="w-4 h-4" aria-hidden="true" />
        </a>
      </nav>

      <nav
        class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sp-bg-card border-t border-sp-border flex items-center justify-around px-4"
        style={{ "padding-bottom": "max(8px, env(safe-area-inset-bottom))", height: "56px" }}
        aria-label="App navigation"
      >
        <a
          href={makeHref(ROUTES.HOME)}
          class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-sp text-sp-text-soft hover:text-sp-text-muted transition-all duration-200"
          aria-label="Back to home"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-sp-coral" aria-hidden="true" />
          <span class="text-[0.6rem] font-semibold tracking-wide uppercase">Home</span>
        </a>

        <button
          type="button"
          class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-sp text-sp-coral hover:bg-sp-coral-light transition-all duration-200"
          classList={{
            "bg-sp-coral-light": props.drawerOpen,
          }}
          onClick={() => props.onToggleDrawer?.()}
          aria-controls="app-controls-drawer"
          aria-expanded={props.drawerOpen ? "true" : "false"}
          aria-label={props.drawerOpen ? "Hide controls" : "Show controls"}
        >
          <Wand2 class="w-5 h-5" aria-hidden="true" />
          <span class="text-[0.6rem] font-semibold tracking-wide uppercase">Controls</span>
        </button>

        <a
          href={makeHref(ROUTES.ABOUT)}
          class="flex flex-col items-center gap-0.5 py-1 px-4 rounded-sp text-sp-text-soft hover:text-sp-text-muted transition-all duration-200"
          aria-label="About Reshrimp"
        >
          <Info class="w-5 h-5" aria-hidden="true" />
          <span class="text-[0.6rem] font-semibold tracking-wide uppercase">About</span>
        </a>
      </nav>
    </>
  );
}
