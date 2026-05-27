export type ButtonVariant = "primary" | "secondary" | "shadow";
export type ButtonTone = "coral" | "mint" | "neutral";
export type ButtonSize = "default" | "lg" | "icon";

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE_BUTTON_CLASSES =
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-sp-full border-none font-body font-semibold no-underline transition-[transform,box-shadow,background-color] duration-300 outline-hidden focus-visible:ring-2 focus-visible:ring-sp-lavender/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "px-6 py-3 text-[1.17rem]",
  lg: "px-8 py-[0.9rem] text-[1.33rem]",
  icon: "h-10 w-10 rounded-sp",
};

const PRIMARY_TONE_CLASSES: Record<ButtonTone, string> = {
  coral:
    "bg-sp-coral text-white shadow-[0_4px_16px_rgba(242,90,90,0.3)] hover:bg-sp-coral-dark hover:shadow-[0_6px_24px_rgba(242,90,90,0.4)] hover:-translate-y-[2px]",
  mint: "bg-sp-mint text-white shadow-[0_4px_16px_rgba(26,165,147,0.3)] hover:bg-sp-mint-dark hover:shadow-[0_6px_24px_rgba(26,165,147,0.4)] hover:-translate-y-[2px]",
  neutral:
    "bg-sp-text text-white shadow-[0_4px_16px_rgba(30,27,75,0.18)] hover:shadow-[0_6px_24px_rgba(30,27,75,0.24)] hover:-translate-y-[2px]",
};

const SECONDARY_CLASSES =
  "border border-sp-border bg-sp-bg-card text-sp-text shadow-sp hover:border-sp-lavender hover:shadow-sp-hover hover:-translate-y-[2px]";

const SHADOW_CLASSES =
  "border border-sp-border bg-sp-bg text-sp-text shadow-sp-hover hover:border-sp-lavender hover:-translate-y-[2px]";

export function buttonVariants({
  variant = "primary",
  tone = "coral",
  size = "default",
  fullWidth = false,
}: ButtonVariantProps = {}): string {
  const variantClasses =
    variant === "primary"
      ? PRIMARY_TONE_CLASSES[tone]
      : variant === "secondary"
        ? SECONDARY_CLASSES
        : SHADOW_CLASSES;

  return [BASE_BUTTON_CLASSES, SIZE_CLASSES[size], fullWidth ? "w-full" : "", variantClasses]
    .filter(Boolean)
    .join(" ");
}
