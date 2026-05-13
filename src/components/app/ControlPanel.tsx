import { Match, Switch } from "solid-js";
import { getAppMode, type AppMode } from "@/components/app/appModes";
import ProcessPanel from "@/components/app/panels/ProcessPanel";
import ComingSoonPanel from "@/components/app/panels/ComingSoonPanel";

interface ControlPanelProps {
  mode: AppMode;
}

export default function ControlPanel(props: ControlPanelProps) {
  const activeMode = () => getAppMode(props.mode);

  return (
    <div class="flex flex-col flex-1 overflow-hidden min-h-0">
      <Switch>
        <Match when={props.mode === "image"}>
          <ProcessPanel />
        </Match>
        <Match when={props.mode !== "image"}>
          <ComingSoonPanel
            Icon={activeMode().Icon}
            title={activeMode().panelTitle ?? activeMode().label}
            description={activeMode().panelDescription ?? activeMode().comingSoonNote}
          />
        </Match>
      </Switch>
    </div>
  );
}
