import { For, Show } from "solid-js";
import { useBatchQueue } from "@/components/app/state/BatchQueueContext";

export default function BatchQueuePanel() {
  const batchQueue = useBatchQueue();

  return (
    <Show when={batchQueue.items().length > 1}>
      <div class="mt-3 border-t border-sp-border pt-3">
        <h4 class="text-[0.7rem] font-semibold text-sp-text-muted m-0 uppercase tracking-[0.12em] mb-2">
          Queue
        </h4>
        <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
          <For each={batchQueue.items()}>
            {(item) => (
              <div
                class={`flex items-center gap-2 px-2 py-1.5 rounded-sp text-[0.75rem] cursor-pointer transition-colors ${
                  batchQueue.selectedItemId() === item.id
                    ? "bg-sp-coral-light text-sp-coral-dark"
                    : "hover:bg-sp-bg-warm"
                }`}
                role="button"
                tabIndex={0}
                onClick={() => batchQueue.actions.selectItem(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    batchQueue.actions.selectItem(item.id);
                  }
                }}
              >
                <span
                  class={`shrink-0 w-2 h-2 rounded-full ${
                    item.status === "processing"
                      ? "bg-sp-yellow animate-pulse"
                      : item.status === "succeeded"
                        ? "bg-sp-mint"
                        : item.status === "failed"
                          ? "bg-sp-coral"
                          : "bg-sp-border"
                  }`}
                />
                <span class="truncate flex-1">{item.file.name}</span>
                <Show when={item.status === "succeeded" || item.status === "failed"}>
                  <button
                    type="button"
                    class="text-[0.6rem] text-sp-text-soft hover:text-sp-coral shrink-0 ml-1"
                    onClick={() => batchQueue.actions.removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    Remove
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
