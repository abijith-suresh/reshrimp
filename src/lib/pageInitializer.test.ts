import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPageInitializer } from "./pageInitializer";

describe("registerPageInitializer", () => {
  let removePageListeners: () => void;
  beforeEach(() => {
    delete window.__reshrimpPageInitializers;
    const registrations = vi.spyOn(document, "addEventListener");
    removePageListeners = () => {
      for (const [event, listener, options] of registrations.mock.calls) {
        if (event === "astro:page-load") document.removeEventListener(event, listener, options);
      }
    };
  });

  afterEach(() => {
    removePageListeners();
    delete window.__reshrimpPageInitializers;
  });

  it("runs the initializer immediately and on every astro:page-load", () => {
    const init = vi.fn();

    registerPageInitializer("layout", init);
    document.dispatchEvent(new Event("astro:page-load"));

    expect(init).toHaveBeenNthCalledWith(1, false);
    expect(init).toHaveBeenNthCalledWith(2, true);
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
    const events: string[] = [];
    const init = () => {
      events.push("init");
      return () => events.push("cleanup");
    };

    registerPageInitializer("header", init);
    document.dispatchEvent(new Event("astro:page-load"));

    expect(events).toEqual(["init", "cleanup", "init"]);
  });
});
