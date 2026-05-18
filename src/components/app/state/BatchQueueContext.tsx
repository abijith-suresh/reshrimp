import { createContext, createSignal, useContext, type Accessor, type JSX } from "solid-js";
import type { BatchQueueItem } from "@/types/batch";
import type { ProcessedImage } from "@/types/image";
import { createBatchQueueItem } from "@/services/batchQueueService";

interface BatchQueueActions {
  addToQueue(image: ProcessedImage): void;
  selectItem(itemId: string): void;
  removeItem(itemId: string): void;
  updateItem(itemId: string, updates: Partial<BatchQueueItem>): void;
}

const BatchQueueContext = createContext<{
  items: Accessor<BatchQueueItem[]>;
  selectedItemId: Accessor<string | null>;
  actions: BatchQueueActions;
}>();

export function BatchQueueProvider(props: { children: JSX.Element }) {
  const [items, setItems] = createSignal<BatchQueueItem[]>([]);
  const [selectedItemId, setSelectedItemId] = createSignal<string | null>(null);

  const actions: BatchQueueActions = {
    addToQueue(image: ProcessedImage) {
      const item = createBatchQueueItem(image);
      setItems((prev) => {
        const next = [...prev, item];
        if (!selectedItemId()) {
          setSelectedItemId(item.id);
        }
        return next;
      });
    },
    selectItem(itemId: string) {
      setSelectedItemId(itemId);
    },
    removeItem(itemId: string) {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== itemId);
        if (selectedItemId() === itemId) {
          setSelectedItemId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    updateItem(itemId: string, updates: Partial<BatchQueueItem>) {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
    },
  };

  return (
    <BatchQueueContext.Provider value={{ items, selectedItemId, actions }}>
      {props.children}
    </BatchQueueContext.Provider>
  );
}

export function useBatchQueue() {
  const ctx = useContext(BatchQueueContext);
  if (!ctx) throw new Error("useBatchQueue must be used within BatchQueueProvider");
  return ctx;
}
