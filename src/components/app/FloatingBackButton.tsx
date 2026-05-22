import { ArrowLeft } from "lucide-solid";
import { ROUTES } from "@/config/constants";
import { makeHref } from "@/lib/utils";

export default function FloatingBackButton() {
  return (
    <a
      href={makeHref(ROUTES.HOME)}
      class="md:hidden fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 bg-sp-coral text-white text-[0.75rem] font-semibold rounded-sp-full shadow-[0_4px_14px_rgba(255,107,107,0.35)] hover:bg-sp-coral-dark active:scale-95 transition-all duration-200"
      aria-label="Back to home"
    >
      <ArrowLeft class="w-3.5 h-3.5" aria-hidden="true" />
      <span>Back</span>
    </a>
  );
}
