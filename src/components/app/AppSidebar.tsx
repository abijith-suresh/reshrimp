import { Info } from "lucide-solid";
import { ROUTES } from "@/config/constants";
import { makeHref } from "@/lib/utils";

export default function AppSidebar() {
  return (
    <nav
      class="hidden md:flex flex-col items-center w-12 bg-card border-r border-border py-4 gap-1 shrink-0"
      aria-label="App navigation"
    >
      <a
        href={makeHref(ROUTES.HOME)}
        class="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 hover:bg-coral-50 group mb-2 focus-visible:ring-2 focus-visible:ring-lavender-500/40"
        aria-label="Back to home"
      >
        <span class="w-3 h-3 rounded-full bg-coral-500 transition-transform duration-300 group-hover:scale-125 shrink-0" />
      </a>

      <div class="w-6 h-px bg-border-light" />

      <div class="flex-1" />

      <a
        href={makeHref(ROUTES.ABOUT)}
        class="flex items-center justify-center w-8 h-8 rounded-md text-soft-foreground hover:text-muted-foreground hover:bg-background transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-lavender-500/40"
        aria-label="About Reshrimp"
        title="About"
      >
        <Info class="w-4 h-4" aria-hidden="true" />
      </a>
    </nav>
  );
}
