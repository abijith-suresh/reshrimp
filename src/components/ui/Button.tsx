import { splitProps, type JSX } from "solid-js";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button";

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
