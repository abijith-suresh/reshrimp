// The one shape for form controls (text inputs and the Select trigger; the
// segmented control matches it): Cards hairline, 40px tall (44px on touch screens), and
// the global coral focus outline. Inputs stay 16px on phones so iOS won't zoom.
const CONTROL_FRAME_CLASSES =
  "h-10 pointer-coarse:h-11 rounded-md border border-line-strong bg-surface transition-colors duration-150 hover:border-fg-soft disabled:cursor-not-allowed disabled:opacity-50";

export const CONTROL_CLASSES = `${CONTROL_FRAME_CLASSES} px-3 font-body text-base editor:text-sm text-fg placeholder:text-fg-soft`;

export const FIELD_LABEL_CLASSES = "text-xs font-medium text-fg-muted";
