import type { JSX } from "solid-js";

interface SectionHeaderProps {
  children: JSX.Element;
}

export default function SectionHeader(props: SectionHeaderProps) {
  return (
    <h4 class="text-[0.8rem] font-semibold text-sp-text m-0 uppercase tracking-wider">
      {props.children}
    </h4>
  );
}
