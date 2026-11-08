import { ArrowLeft } from "lucide-solid";
import { ROUTES } from "@/config/constants";
import { makeHref } from "@/lib/utils";

export default function FloatingBackButton() {
  return (
    <a
      href={makeHref(ROUTES.HOME)}
      data-mobile-back-button
      class="editor:hidden fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] left-[calc(env(safe-area-inset-left,0px)+1rem)] z-50 flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-fg text-xs font-semibold rounded-full shadow-primary hover:bg-primary-hover active:scale-95 transition-[background-color,transform] duration-200"
      aria-label="Back to home"
    >
      <ArrowLeft class="w-3.5 h-3.5" aria-hidden="true" />
      <span>Back</span>
    </a>
  );
}
