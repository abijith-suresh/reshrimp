import { ArrowLeft } from "lucide-solid";
import { ROUTES } from "@/config/constants";
import { makeHref } from "@/lib/utils";

export default function FloatingBackButton() {
  return (
    <a
      href={makeHref(ROUTES.HOME)}
      class="md:hidden fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 bg-coral-500 text-white text-xs font-semibold rounded-full shadow-[0_4px_14px_rgba(242,90,90,0.35)] hover:bg-coral-600 active:scale-95 transition-[background-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-lavender-500 focus-visible:ring-offset-2"
      aria-label="Back to home"
    >
      <ArrowLeft class="w-3.5 h-3.5" aria-hidden="true" />
      <span>Back</span>
    </a>
  );
}
