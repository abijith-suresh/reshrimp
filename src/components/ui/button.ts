// The one source of button styles for Astro (ButtonLink) and Solid (Button).
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE_BUTTON_CLASSES =
  "relative inline-flex shrink-0 touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-md font-body font-semibold no-underline transition-[background-color,box-shadow,color,scale] duration-150 ease-out active:scale-98 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

// Small buttons grow to a 44px target on touch screens.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm pointer-coarse:h-11",
  md: "min-h-11 px-5 py-2 text-base",
  lg: "min-h-12 px-6 py-2.5 text-base",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg shadow-primary hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-surface text-fg shadow-button hover:bg-surface-muted active:bg-canvas",
  ghost:
    "text-fg-muted hover:bg-hover hover:text-fg aria-[current=page]:bg-selected aria-[current=page]:text-fg",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonVariantProps = {}): string {
  return [
    BASE_BUTTON_CLASSES,
    SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    VARIANT_CLASSES[variant],
  ]
    .filter(Boolean)
    .join(" ");
}
