import { Show } from "solid-js";
import SectionHeader from "@/components/app/ui/SectionHeader";
import PresetSelector from "./PresetSelector";
import DimensionInputs from "./DimensionInputs";
import UnitSelector from "./UnitSelector";
import DpiSelector from "./DpiSelector";
import AspectRatioLock from "./AspectRatioLock";
import { useImageApp } from "../state/ImageAppContext";

export default function ResizeSection() {
  const { state } = useImageApp();
  const showDpi = () => state.resizeUnit() === "in" || state.resizeUnit() === "cm";

  return (
    <div class="flex flex-col gap-3">
      <SectionHeader>Geometry</SectionHeader>
      <PresetSelector />
      <DimensionInputs />
      <UnitSelector />
      <Show when={showDpi()}>
        <DpiSelector />
      </Show>
      <AspectRatioLock />
    </div>
  );
}
