import type { LucideIcon } from "lucide-solid";
import Chip from "@/components/ui/Chip";

interface ComingSoonPanelProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

export default function ComingSoonPanel(props: ComingSoonPanelProps) {
  return (
    <div class="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
      <div class="w-12 h-12 rounded-sp-xl bg-sp-lavender-light flex items-center justify-center">
        <props.Icon class="w-6 h-6 text-sp-lavender-dark" aria-hidden="true" />
      </div>
      <div class="flex flex-col gap-1.5">
        <h3 class="font-semibold text-[0.9rem] text-sp-text m-0">{props.title}</h3>
        <p class="text-[0.8rem] text-sp-text-soft leading-relaxed m-0">{props.description}</p>
      </div>
      <Chip label="Coming in a future update" variant="lavender" size="sm" />
    </div>
  );
}
