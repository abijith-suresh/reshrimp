import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupBrowserMocks, restoreMocks } from "../test/mocks";

vi.mock("../utils/imageUtils", () => ({
  createDownloadLink: vi.fn(),
}));

import { createDownloadLink } from "../utils/imageUtils";
import { downloadProcessedBlob, replaceObjectUrl, revokeImageUrls } from "./imageSessionService";

const mockCreateDownloadLink = vi.mocked(createDownloadLink);

beforeEach(() => {
  setupBrowserMocks();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  restoreMocks();
});

describe("replaceObjectUrl", () => {
  it("revokes the previous URL before creating the next one", () => {
    const blob = new Blob(["processed"], { type: "image/png" });

    const nextUrl = replaceObjectUrl("blob:previous", blob);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:previous");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(nextUrl).toBe("blob:mock-url");
  });
});

describe("downloadProcessedBlob", () => {
  it("downloads directly from the processed blob", () => {
    const blob = new Blob(["processed"], { type: "image/png" });

    downloadProcessedBlob(blob, "result.png");

    expect(mockCreateDownloadLink).toHaveBeenCalledWith(blob, "result.png");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("revokeImageUrls", () => {
  it("revokes both original and processed URLs for the current session", () => {
    revokeImageUrls({
      originalUrl: "blob:original",
      processedUrl: "blob:processed",
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:processed");
  });
});
