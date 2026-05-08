import type { ProcessedImage } from "../types/image";
import type { ProcessResult } from "../types/processing";
import type { BatchQueueItem, BatchQueueState, BatchQueueTransitionResult } from "../types/batch";

function updateBatchQueueItem(
  state: BatchQueueState,
  itemId: string,
  updater: (item: BatchQueueItem) => BatchQueueItem
): BatchQueueState {
  return {
    ...state,
    items: state.items.map((item) => (item.id === itemId ? updater(item) : item)),
  };
}

function getNeighborSelection(items: BatchQueueItem[], removedIndex: number): string | null {
  return items[removedIndex]?.id ?? items[removedIndex - 1]?.id ?? null;
}

export function collectBatchQueueItemCleanupUrls(item: BatchQueueItem): string[] {
  return item.processedUrl ? [item.originalUrl, item.processedUrl] : [item.originalUrl];
}

export function createBatchQueueItem(image: ProcessedImage): BatchQueueItem {
  return {
    ...image,
    status: "idle",
    processResult: null,
  };
}

export function createBatchQueueState(items: BatchQueueItem[]): BatchQueueState {
  return {
    items,
    selectedItemId: items[0]?.id ?? null,
  };
}

export function appendBatchQueueItems(
  state: BatchQueueState,
  items: BatchQueueItem[]
): BatchQueueState {
  return {
    items: [...state.items, ...items],
    selectedItemId: state.selectedItemId ?? items[0]?.id ?? null,
  };
}

export function getSelectedBatchQueueItem(state: BatchQueueState): BatchQueueItem | null {
  return state.items.find((item) => item.id === state.selectedItemId) ?? null;
}

export function markBatchQueueItemProcessing(
  state: BatchQueueState,
  itemId: string
): BatchQueueState {
  return updateBatchQueueItem(state, itemId, (item) => ({
    ...item,
    status: "processing",
    processing: true,
    error: null,
  }));
}

export function markBatchQueueItemSucceeded(
  state: BatchQueueState,
  itemId: string,
  processedUrl: string,
  processResult: ProcessResult
): BatchQueueTransitionResult {
  let cleanupUrls: string[] = [];

  const nextState = updateBatchQueueItem(state, itemId, (item) => {
    cleanupUrls =
      item.processedUrl && item.processedUrl !== processedUrl ? [item.processedUrl] : cleanupUrls;

    return {
      ...item,
      processedUrl,
      metadata: {
        ...item.metadata,
        ...processResult.metadata,
      },
      processing: false,
      error: null,
      status: "succeeded",
      processResult,
    };
  });

  return {
    state: nextState,
    cleanupUrls,
  };
}

export function markBatchQueueItemFailed(
  state: BatchQueueState,
  itemId: string,
  error: string
): BatchQueueState {
  return updateBatchQueueItem(state, itemId, (item) => ({
    ...item,
    processing: false,
    error,
    status: "failed",
  }));
}

export function removeBatchQueueItem(
  state: BatchQueueState,
  itemId: string
): BatchQueueTransitionResult {
  const removedIndex = state.items.findIndex((item) => item.id === itemId);
  if (removedIndex === -1) {
    return { state, cleanupUrls: [] };
  }

  const removedItem = state.items[removedIndex]!;
  const items = state.items.filter((item) => item.id !== itemId);

  return {
    state: {
      items,
      selectedItemId:
        state.selectedItemId === itemId
          ? getNeighborSelection(items, removedIndex)
          : state.selectedItemId,
    },
    cleanupUrls: collectBatchQueueItemCleanupUrls(removedItem),
  };
}

export function clearBatchQueueState(state: BatchQueueState): BatchQueueTransitionResult {
  return {
    state: {
      items: [],
      selectedItemId: null,
    },
    cleanupUrls: state.items.flatMap((item) => collectBatchQueueItemCleanupUrls(item)),
  };
}
