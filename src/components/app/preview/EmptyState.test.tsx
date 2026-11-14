import { render, screen } from "@solidjs/testing-library";
import { expect, it } from "vitest";
import EmptyState from "./EmptyState";

it("lists every format the app can open", () => {
  render(() => <EmptyState onChoose={() => {}} onDrop={() => {}} />);

  expect(screen.getByRole("button", { name: /^Choose an image/ })).toHaveAccessibleDescription(
    /^JPEG, PNG, WebP, AVIF, HEIC · up to /
  );
});
