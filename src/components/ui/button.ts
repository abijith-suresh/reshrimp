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
  "relative inline-flex shrink-0 touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-md border-none font-body font-semibold no-underline transition-[transform,background-color,border-color,box-shadow,color] duration-150 ease-out outline-hidden active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "min-h-10 px-5 py-2.5 text-base leading-6",
  lg: "min-h-11 px-6 py-3 text-lg leading-6",
  icon: "h-10 w-10 rounded-md",
};

const PRIMARY_TONE_CLASSES: Record<ButtonTone, string> = {
  coral:
    "bg-coral-500 text-white shadow-sm hover:bg-coral-600 hover:shadow-md active:bg-coral-700 active:shadow-2xs",
  mint: "bg-mint-500 text-white shadow-sm hover:bg-mint-600 hover:shadow-md active:bg-mint-700 active:shadow-2xs",
  neutral:
    "bg-foreground text-white shadow-sm hover:bg-foreground/90 hover:shadow-md active:bg-foreground active:shadow-2xs",
};

const SECONDARY_TONE_CLASSES: Record<ButtonTone, string> = {
  coral:
    "border border-coral-200 bg-coral-50 text-coral-600 hover:bg-coral-100 hover:text-coral-700 hover:border-coral-300 hover:shadow-sm active:bg-coral-200 active:shadow-2xs",
  mint: "border border-mint-200 bg-mint-50 text-mint-600 hover:bg-mint-100 hover:text-mint-700 hover:border-mint-300 hover:shadow-sm active:bg-mint-200 active:shadow-2xs",
  neutral:
    "border border-border bg-card text-foreground hover:bg-lavender-50 hover:border-lavender-300 hover:shadow-sm active:bg-lavender-100 active:shadow-2xs",
};

const SHADOW_CLASSES =
  "border border-border bg-background text-foreground shadow-sm hover:border-lavender-500 hover:bg-lavender-50 hover:shadow-md active:bg-lavender-100 active:shadow-2xs";

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
