import type { JSX } from "solid-js";

interface SectionHeaderProps {
  children: JSX.Element;
}

export default function SectionHeader(props: SectionHeaderProps) {
  return (
    <h4 class="text-[0.7rem] font-semibold text-sp-text-muted m-0 uppercase tracking-[0.12em]">
      {props.children}
    </h4>
  );
}
