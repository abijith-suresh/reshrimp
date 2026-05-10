import { Show } from "solid-js";

interface AppSliderProps {
  id?: string;
  label: string;
  value: number;
  onInput: (value: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  showValue?: boolean;
}

export default function AppSlider(props: AppSliderProps) {
  return (
    <div>
      <div class="flex justify-between items-center">
        <label
          for={props.id}
          class="text-[0.8rem] font-semibold text-sp-text m-0 uppercase tracking-wider"
        >
          {props.label}
        </label>
        <Show when={props.showValue}>
          <span
            id={props.id ? `${props.id}-value` : undefined}
            class="text-[0.8rem] font-medium text-sp-text-muted"
          >
            {props.value}%
          </span>
        </Show>
      </div>
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        class="sp-slider w-full mt-1"
        disabled={props.disabled}
        onInput={(e) => props.onInput(parseInt((e.target as HTMLInputElement).value, 10))}
      />
    </div>
  );
}
