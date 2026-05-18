import { describe, expect, it } from "vitest";
import { extractImageFromPaste } from "./clipboardUpload";

function createMockClipboardEvent(items: DataTransferItem[] | null): ClipboardEvent {
  return {
    clipboardData: items ? ({ items } as unknown as DataTransfer) : null,
  } as unknown as ClipboardEvent;
}

describe("extractImageFromPaste", () => {
  it("returns the image file from a paste event with png data", () => {
    const file = new File(["test"], "pasted-image.png", { type: "image/png" });
    const items: DataTransferItem[] = [
      {
        kind: "file",
        type: "image/png",
        getAsFile: () => file,
      },
    ] as unknown as DataTransferItem[];

    const event = createMockClipboardEvent(items);
    const result = extractImageFromPaste(event);
    expect(result).toBe(file);
  });

  it("returns null when clipboard has no files", () => {
    const event = createMockClipboardEvent([]);
    const result = extractImageFromPaste(event);
    expect(result).toBeNull();
  });

  it("returns null when clipboardData is null", () => {
    const event = createMockClipboardEvent(null);
    const result = extractImageFromPaste(event);
    expect(result).toBeNull();
  });

  it("skips non-image files in clipboard", () => {
    const file = new File(["test"], "doc.txt", { type: "text/plain" });
    const items: DataTransferItem[] = [
      {
        kind: "file",
        type: "text/plain",
        getAsFile: () => file,
      },
    ] as unknown as DataTransferItem[];

    const event = createMockClipboardEvent(items);
    const result = extractImageFromPaste(event);
    expect(result).toBeNull();
  });
});
