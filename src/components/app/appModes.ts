import { Layers, SlidersHorizontal, Wand2, type LucideIcon } from "lucide-solid";

export type AppMode = "image" | "adjustments" | "batch";

export interface AppModeDefinition {
  mode: AppMode;
  Icon: LucideIcon;
  label: string;
  available: boolean;
  comingSoonNote: string;
  panelTitle?: string;
  panelDescription?: string;
}

export const APP_MODES: readonly AppModeDefinition[] = [
  {
    mode: "image",
    Icon: Wand2,
    label: "Process",
    available: true,
    comingSoonNote: "",
  },
  {
    mode: "adjustments",
    Icon: SlidersHorizontal,
    label: "Adjust",
    available: false,
    comingSoonNote: "Brightness & contrast — coming soon",
    panelTitle: "Adjustments",
    panelDescription:
      "Brightness, contrast, and saturation controls are coming in the next update.",
  },
  {
    mode: "batch",
    Icon: Layers,
    label: "Batch",
    available: false,
    comingSoonNote: "Bulk processing — coming soon",
    panelTitle: "Batch Processing",
    panelDescription: "Process multiple images at once with ZIP download — coming soon.",
  },
];

export function getAppMode(mode: AppMode): AppModeDefinition {
  return APP_MODES.find((item) => item.mode === mode) ?? APP_MODES[0]!;
}
