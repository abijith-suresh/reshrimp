interface ChipProps {
  label: string;
  variant: "coral" | "mint" | "lavender" | "yellow";
  size?: "sm" | "default";
}

export default function Chip(props: ChipProps) {
  return (
    <span class={`pop-chip pop-chip-${props.variant} ${props.size === "sm" ? "pop-chip-sm" : ""}`}>
      {props.label}
    </span>
  );
}
