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
      {props.icon ?? <Image class="w-12 h-12 text-sp-text-soft opacity-30 mb-3" />}
      <p class="font-body text-[0.9rem] font-medium text-sp-text-muted m-0 mb-1">{props.title}</p>
      <p class="text-[0.8rem] text-sp-text-soft m-0">{props.subtitle}</p>
    </div>
  );
}
