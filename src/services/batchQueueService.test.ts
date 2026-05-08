import { describe, expect, it } from "vitest";
import type { ProcessedImage } from "../types/image";
import type { ProcessResult } from "../types/processing";
import {
  appendBatchQueueItems,
  clearBatchQueueState,
  createBatchQueueItem,
  createBatchQueueState,
  getSelectedBatchQueueItem,
  markBatchQueueItemFailed,
  markBatchQueueItemProcessing,
  markBatchQueueItemSucceeded,
  removeBatchQueueItem,
} from "./batchQueueService";

function makeProcessedImage(id: string): ProcessedImage {
  return {
    id,
    file: new File([id], `${id}.png`, { type: "image/png" }),
    originalUrl: `blob:${id}:original`,
    processedUrl: null,
    metadata: {
      width: 1200,
      height: 800,
      format: "image/png",
      fileSize: 1234,
      fileName: `${id}.png`,
    },
    processing: false,
    error: null,
  };
}

function makeProcessResult(): ProcessResult {
  return {
    blob: new Blob(["processed"], { type: "image/png" }),
    metadata: {
      width: 600,
      height: 400,
      format: "image/png",
      fileSize: 456,
    },
  };
}

describe("batchQueueService", () => {
  it("treats a single queued image as a selected-item subset of the batch model", () => {
    const state = createBatchQueueState([createBatchQueueItem(makeProcessedImage("one"))]);

    expect(state.selectedItemId).toBe("one");
    expect(getSelectedBatchQueueItem(state)?.id).toBe("one");
  });

  it("appends new items in stable order without disturbing the current selection", () => {
    const first = createBatchQueueItem(makeProcessedImage("one"));
    const second = createBatchQueueItem(makeProcessedImage("two"));
    const state = appendBatchQueueItems(createBatchQueueState([first]), [second]);

    expect(state.items.map((item) => item.id)).toEqual(["one", "two"]);
    expect(state.selectedItemId).toBe("one");
  });

  it("marks processing and success while returning superseded processed URLs for cleanup", () => {
    const item = createBatchQueueItem({
      ...makeProcessedImage("one"),
      processedUrl: "blob:one:previous",
    });
    const processingState = markBatchQueueItemProcessing(createBatchQueueState([item]), "one");
    const result = markBatchQueueItemSucceeded(
      processingState,
      "one",
      "blob:one:next",
      makeProcessResult()
    );

    expect(getSelectedBatchQueueItem(processingState)?.status).toBe("processing");
    expect(result.cleanupUrls).toEqual(["blob:one:previous"]);
    expect(getSelectedBatchQueueItem(result.state)).toMatchObject({
      status: "succeeded",
      processedUrl: "blob:one:next",
      processing: false,
      error: null,
    });
  });

  it("records explicit failed state without dropping queue selection", () => {
    const state = markBatchQueueItemFailed(
      createBatchQueueState([createBatchQueueItem(makeProcessedImage("one"))]),
      "one",
      "Processing failed"
    );

    expect(getSelectedBatchQueueItem(state)).toMatchObject({
      status: "failed",
      error: "Processing failed",
      processing: false,
    });
    expect(state.selectedItemId).toBe("one");
  });

  it("removes a queue item, revokes its URLs, and selects a sensible neighbor", () => {
    const state = createBatchQueueState([
      createBatchQueueItem(makeProcessedImage("one")),
      createBatchQueueItem({
        ...makeProcessedImage("two"),
        processedUrl: "blob:two:processed",
      }),
      createBatchQueueItem(makeProcessedImage("three")),
    ]);
    const result = removeBatchQueueItem({ ...state, selectedItemId: "two" }, "two");

    expect(result.cleanupUrls).toEqual(["blob:two:original", "blob:two:processed"]);
    expect(result.state.items.map((item) => item.id)).toEqual(["one", "three"]);
    expect(result.state.selectedItemId).toBe("three");
  });

  it("clears the queue and returns every object URL for cleanup", () => {
    const state = createBatchQueueState([
      createBatchQueueItem(makeProcessedImage("one")),
      createBatchQueueItem({
        ...makeProcessedImage("two"),
        processedUrl: "blob:two:processed",
      }),
    ]);
    const result = clearBatchQueueState(state);

    expect(result.state).toEqual({ items: [], selectedItemId: null });
    expect(result.cleanupUrls).toEqual([
      "blob:one:original",
      "blob:two:original",
      "blob:two:processed",
    ]);
  });
});
