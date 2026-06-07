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
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full border-none font-body font-semibold no-underline transition-[transform,box-shadow,background-color] duration-300 outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "px-6 py-3 text-[1.17rem]",
  lg: "px-8 py-[0.9rem] text-[1.33rem]",
  icon: "h-10 w-10 rounded-md",
};

const PRIMARY_TONE_CLASSES: Record<ButtonTone, string> = {
  coral:
    "bg-coral-500 text-white shadow-coral hover:bg-coral-600 hover:shadow-[0_6px_24px_rgba(242,90,90,0.4)] hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-sm active:bg-coral-600 active:duration-75",
  mint: "bg-mint-500 text-white shadow-[0_4px_16px_rgba(26,165,147,0.3)] hover:bg-mint-600 hover:shadow-[0_6px_24px_rgba(26,165,147,0.4)] hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-sm active:bg-mint-600 active:duration-75",
  neutral:
    "bg-foreground text-white shadow-[0_4px_16px_rgba(30,27,75,0.18)] hover:shadow-[0_6px_24px_rgba(30,27,75,0.24)] hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-sm active:bg-foreground/90 active:duration-75",
};

const SECONDARY_TONE_CLASSES: Record<ButtonTone, string> = {
  coral:
    "border-coral-200 bg-coral-50 text-coral-600 hover:bg-coral-500 hover:text-white hover:border-coral-500 hover:shadow-md hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-none active:border-border active:duration-75",
  mint: "border-mint-200 bg-mint-50 text-mint-600 hover:bg-mint-500 hover:text-white hover:border-mint-500 hover:shadow-md hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-none active:border-border active:duration-75",
  neutral:
    "border-border bg-card text-foreground hover:bg-foreground hover:text-white hover:border-foreground hover:shadow-md hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-none active:border-border active:duration-75",
};

const SHADOW_CLASSES =
  "border border-border bg-background text-foreground shadow-md hover:border-lavender-500 hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-none active:duration-75";

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
        ? SECONDARY_TONE_CLASSES[tone]
        : SHADOW_CLASSES;

  return [BASE_BUTTON_CLASSES, SIZE_CLASSES[size], fullWidth ? "w-full" : "", variantClasses]
    .filter(Boolean)
    .join(" ");
}
