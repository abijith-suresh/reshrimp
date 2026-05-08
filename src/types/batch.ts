import type { ProcessedImage } from "./image";
import type { ProcessResult } from "./processing";

/**
 * Queue item lifecycle for batch processing.
 * A single-image session is represented as a queue containing one idle item.
 */
export type BatchQueueItemStatus = "idle" | "processing" | "succeeded" | "failed";

export interface BatchQueueItem extends ProcessedImage {
  status: BatchQueueItemStatus;
  processResult: ProcessResult | null;
}

export interface BatchQueueState {
  items: BatchQueueItem[];
  selectedItemId: string | null;
}

export interface BatchQueueTransitionResult {
  state: BatchQueueState;
  cleanupUrls: string[];
}
