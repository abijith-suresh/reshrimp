import { type JSX, splitProps } from "solid-js";
import { type ButtonVariantProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariantProps;

export default function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "variant",
    "tone",
    "size",
    "fullWidth",
  ]);

  return (
    <button
      data-ui-button
      class={cn(
        buttonVariants({
          variant: local.variant,
          tone: local.tone,
          size: local.size,
          fullWidth: local.fullWidth,
        }),
        local.class
      )}
      {...rest}
    >
      {local.children}
    </button>
  );
}
