import type { JSX } from "solid-js";

interface SectionHeaderProps {
  children: JSX.Element;
}

export default function SectionHeader(props: SectionHeaderProps) {
  return (
    <h4 class="text-xs font-semibold text-fg-muted m-0 uppercase tracking-widest">
      {props.children}
    </h4>
  );
}
