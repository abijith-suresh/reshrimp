import type { JSX } from "solid-js";
import { Image } from "lucide-solid";

interface EmptyStateProps {
  icon?: JSX.Element;
  title: string;
  subtitle: string;
}

export default function EmptyState(props: EmptyStateProps) {
  return (
    <div
      id="sbs-empty-state"
      class="flex-1 flex flex-col items-center justify-center text-center p-8 transition-opacity duration-300"
    >
      {props.icon ?? <Image class="w-16 h-16 text-sp-lavender opacity-40 mb-4 animate-float" />}
      <p class="font-display text-[1.1rem] font-semibold text-sp-text-soft m-0 mb-1">
        {props.title}
      </p>
      <p class="text-[0.85rem] text-sp-text-soft opacity-70 m-0">{props.subtitle}</p>
    </div>
  );
}
