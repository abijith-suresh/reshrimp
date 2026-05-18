import { describe, expect, it, vi } from "vitest";
import { createDebouncedTask } from "./asyncUtils";

describe("createDebouncedTask", () => {
  it("calls the function after the specified delay", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const task = createDebouncedTask(fn, 100);

    task.run();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("debounces: resets the timer on subsequent calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const task = createDebouncedTask(fn, 100);

    task.run();
    vi.advanceTimersByTime(50);
    task.run();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("cancel prevents the function from being called", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const task = createDebouncedTask(fn, 100);

    task.run();
    task.cancel();
    vi.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
