import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock heic2any — it requires Web Workers which are unavailable in jsdom.
// The mock must be registered before any module imports heic2any.
vi.mock("heic2any", () => ({
  default: vi.fn().mockResolvedValue(new Blob(["mock-png"], { type: "image/png" })),
}));
