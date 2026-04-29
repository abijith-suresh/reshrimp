import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPageInitializer } from "./pageInitializer";

describe("registerPageInitializer", () => {
  beforeEach(() => {
    delete window.__reshrimpPageInitializers;
  });

  afterEach(() => {
    delete window.__reshrimpPageInitializers;
    vi.restoreAllMocks();
  });

  it("runs the initializer immediately and on every astro:page-load", () => {
    const init = vi.fn();

    registerPageInitializer("layout", init);
    document.dispatchEvent(new Event("astro:page-load"));

    expect(init).toHaveBeenCalledTimes(2);
  });

  it("registers a given key only once even if called repeatedly", () => {
    const firstInit = vi.fn();
    const secondInit = vi.fn();

    registerPageInitializer("faq", firstInit);
    registerPageInitializer("faq", secondInit);
    document.dispatchEvent(new Event("astro:page-load"));

    expect(firstInit).toHaveBeenCalledTimes(2);
    expect(secondInit).not.toHaveBeenCalled();
  });

  it("runs the previous cleanup before re-initializing", () => {
    const cleanup = vi.fn();
    const init = vi.fn(() => cleanup);

    registerPageInitializer("header", init);
    document.dispatchEvent(new Event("astro:page-load"));

    expect(init).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
