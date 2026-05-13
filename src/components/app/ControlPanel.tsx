import { Match, Switch, type Component } from "solid-js";
import { SlidersHorizontal, Layers } from "lucide-solid";
import type { AppMode } from "@/components/app/AppSidebar";
import ProcessPanel from "@/components/app/panels/ProcessPanel";
import ComingSoonPanel from "@/components/app/panels/ComingSoonPanel";

type IconComp = Component<{ class?: string; "aria-hidden"?: string }>;

interface ControlPanelProps {
  mode: AppMode;
}

export default function ControlPanel(props: ControlPanelProps) {
  return (
    <div class="flex flex-col flex-1 overflow-hidden min-h-0">
      <Switch>
        <Match when={props.mode === "image"}>
          <ProcessPanel />
        </Match>
        <Match when={props.mode === "adjustments"}>
          <ComingSoonPanel
            Icon={SlidersHorizontal as unknown as IconComp}
            title="Adjustments"
            description="Brightness, contrast, and saturation controls are coming in the next update."
          />
        </Match>
        <Match when={props.mode === "batch"}>
          <ComingSoonPanel
            Icon={Layers as unknown as IconComp}
            title="Batch Processing"
            description="Process multiple images at once with ZIP download — coming soon."
          />
        </Match>
      </Switch>
    </div>
  );
}
