# Contributing

This document describes the development workflow for Reshrimp.

## Before You Start

Read these documents first:

- `AGENTS.md` for product truth, hard rules, and agent behavior

Do not expand product scope unless the Product Truth section of `AGENTS.md` is updated first.

## Setup

Use Bun from the repository root.

```bash
bun install
```

## Commands

```bash
bun run dev
bun run type-check
bun run lint
bun run format:check
bun run test
bun run build
bun run verify
bun run test:e2e
```

`bun run verify` runs type checking, lint, formatting, unit coverage, asset-sync tests, and the production build. Run it before pushing. Run `bun run test:e2e` for browser validation as well.

Pull request CI uses the pinned central Bun quality workflow, runs dependency review and the browser suite, and reports all three through the required `quality` check. Pull request titles use the pinned central Conventional Commit workflow and retain the required local `pr-title` check.

Background-removal assets are mirrored before `dev` and `build` through the configured package scripts. If assets are missing locally, that step needs network access.

## Workflow

1. Start from the latest `main`.
2. Create a focused branch.
3. Make the smallest correct change.
4. Keep public copy, product truth, and implementation aligned.
5. Run `bun run verify` and `bun run test:e2e` before push.
6. Open one focused pull request.
7. Stop and wait for review or merge feedback before starting unrelated work.

## Branches

Use kebab-case branch names with a conventional prefix.

Examples:

- `feat/target-file-size-export`
- `fix/background-removal-progress`
- `docs/refresh-product-copy`
- `refactor/simplify-image-workflow`
- `chore/prune-stale-branches`

## Commits And Pull Requests

Use Conventional Commits for commits and PR titles.

Allowed types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `chore`
- `test`
- `ci`
- `build`

Examples:

- `feat: add target file size export`
- `fix: preserve png transparency after background removal`
- `docs: clarify privacy copy`

## Product Guardrails

Current contributions should preserve these constraints:

- one image at a time
- browser-local processing
- no server-side image processing
- no accounts or authentication
- no ads, tracking, or analytics
- no batch UI unless the Product Truth section of `AGENTS.md` changes first
- no editor/workspace expansion unless the Product Truth section of `AGENTS.md` changes first
- no public copy for unimplemented features

Target file-size export is implemented for JPEG, WebP, and AVIF. Its limit is best-effort; PNG and background-removal output are lossless and do not support a size target.

## Versioning And Releases

Releases are automated by release-please from Conventional Commits. Versioning restarted at `0.0.1` for a fresh development phase.

- While the project is in private development, versions stay in the `0.0.x` range: before 1.0, both `feat:` and `fix:` commits bump the patch version (`bump-patch-for-minor-pre-major` in the release-please config).
- The first real release (`0.1.0`) is cut deliberately by the maintainer, via a `Release-As: 0.1.0` footer on the release PR or a breaking change; `1.0.0` is earned later.
- Release PRs and tags are created automatically after conventional commits land on `main`.

## Code Style

- Follow the established Astro, SolidJS, TypeScript, and Tailwind patterns.
- Keep image-processing logic in `src/services/` or shared helpers.
- Keep UI components focused on state display and user interaction.
- Prefer clear explicit modules over generic registries or workflow engines.
- Avoid speculative abstractions for future features.
- Use existing design tokens and spacing patterns before adding one-off values.
- Add comments only when they explain non-obvious behavior.

## Tests

Use the cheapest test that can detect the regression, but run browser tests for behavior that depends on a real browser. A mocked canvas cannot prove that a downloaded image has the right pixels or that metadata was removed.

| Test layer | What it checks | Where to put it |
| --- | --- | --- |
| Service and helper tests | Validation, dimension math, quality search, format fallback, codec errors, model configuration | Beside the module in `src/` |
| Context tests | Debouncing, concurrent uploads, stale progress/results, URL ownership, unmount cleanup, model preloading | `src/components/app/state/ImageAppContext.test.tsx` |
| Component tests | Accessible controls, complete pointer/keyboard interactions, wiring controls to context actions | Beside the component in `src/` |
| Browser tests | Actual upload/encode/download, decoded dimensions, signatures, metadata removal, size limits, background inference, mobile layout and focus | `tests/e2e/` |
| Asset-sync tests | Mirrored runtime files and manifests, reused assets, missing/corrupt assets | `scripts/sync-background-removal-assets.test.mjs` |

Component tests use Solid Testing Library and `userEvent.setup()`. Query by role and accessible name. Use `await user.click`, `user.type`, and `user.keyboard` so focus, input, and click events occur together. Keep `fireEvent` for browser events that user-event cannot produce. Use real timers for control tests. Context tests use fake timers with explicit debounce boundaries and controlled promises for races; component tests that need fake timers pass `advanceTimers` to user-event.

Mock only the unavailable boundary needed by the test. `src/test/mocks.ts` provides separate object URL, image loading, and canvas helpers because jsdom does not implement image decoding or canvas encoding. Global cleanup disposes Solid roots, restores spies and globals, and resets timers. Do not install all browser mocks for every suite, or mock a whole pipeline and assert that its own fake output is correct.

The context tests call public actions through `renderHook` and inspect public state. They do not render the app to test every race. The small `ImageApp` suite checks control wiring; the browser suite owns responsive layout, caret behavior, and focus across breakpoints.

Install Chromium once, then run the browser suite against the production build:

```bash
bunx playwright install chromium
# On Linux machines missing browser libraries:
bunx playwright install --with-deps chromium
bun run test:e2e
```

`test:e2e` builds the app and starts an isolated preview server on port 4322. It runs desktop Chromium and mobile Chromium emulation. Processing services and model inference are real. Each test observes requests from the browser context, including workers, and fails on HTTP requests outside the app origin, non-GET requests, or request bodies. This checks the exercised workflows; it does not replace reviewing the privacy rules in `AGENTS.md`.

Download tests read the saved bytes and decode them to verify output dimensions. Their synthetic JPEG includes EXIF and GPS markers so metadata-removal assertions cannot pass with a metadata-free source. PNG transparency and background removal are checked in decoded pixels. Browser failures retain screenshots and traces in `test-results/`; CI uploads that directory. Open a trace with `bunx playwright show-trace <trace.zip>`.

Coverage includes every TypeScript module in `src/`, with the existing thresholds unchanged. Treat it as a way to find omissions. Add a test when it protects a specific behavior, not merely to execute another line. Avoid class-list assertions, snapshots of large trees, and tests of trivial child passthrough. Browser coverage is separate from the jsdom report. Chromium emulation does not establish Firefox, WebKit, real-device, or every codec compatibility.

These choices follow [Testing Library's guiding principles](https://testing-library.com/docs/guiding-principles/), [user-event's interaction guidance](https://testing-library.com/docs/user-event/intro/), [Solid's testing guidance](https://github.com/solidjs/solid-testing-library), and [Playwright's best practices](https://playwright.dev/docs/best-practices).

## Documentation

Documentation is part of the product.

- Update `README.md` only with user-facing current behavior.
- Update the Product Truth section of `AGENTS.md` before changing product promises or scope.
- Update this file when development workflow changes.
- Update `AGENTS.md` when agent behavior or document ownership changes.
