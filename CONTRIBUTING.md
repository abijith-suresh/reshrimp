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

## Styling

Use Tailwind utility classes for component styling, layout, responsive rules, and interaction states in both Astro and SolidJS. Shared values belong in the single `@theme` block in `src/styles/global.css`. Use the existing spacing scale and theme utilities before adding arbitrary values. Keep complete class names in source, including explicit maps for color variants, so Tailwind can detect them.

Do not add scoped component styles, `@apply` component classes, or a parallel set of CSS variables. Shared UI components own repeated markup and utility classes. Use `aria-*` or `data-*` state variants for open, selected, and hidden states. Inline styles are for values calculated at runtime, such as portal coordinates and measured sheet heights.

Handwritten CSS is limited to font loading, shared keyframes, global defaults and reduced-motion overrides, and browser-specific selectors. Range-input thumbs and safe-area values read by positioning code live in `src/styles/browser-primitives.css`. Component rules must not be added to that file. Hover feedback uses the shared precise-pointer `hover` variant. Shared marketing variants preserve the existing inclusive breakpoints; retain visible keyboard focus and touch behavior.

## Tests

Select the test layer that can detect the defect.

| Test layer | Purpose | Location |
| --- | --- | --- |
| Service | Validation, dimensions, encoding rules, codec failures, model configuration | Beside each module in `src/` |
| Context | Session state, concurrent work, debounce delays, URL cleanup | `src/components/app/state/` |
| Component | Accessible controls and pointer or keyboard input | Beside each component in `src/` |
| Browser | Image output, metadata removal, network requests, mobile focus | `tests/e2e/` |
| Asset sync | Model files, manifests, missing or corrupt assets | `scripts/sync-background-removal-assets.test.mjs` |

Use role and accessible name queries for controls. Use `userEvent.setup()` and await each interaction.
Use fake timers for debounce tests. If user-event uses fake timers, supply its `advanceTimers` option.
Test context actions with `renderHook`.

Mock only browser features that jsdom does not provide. The helpers in `src/test/mocks.ts` are separate.
Global cleanup restores spies, globals, and timers. Do not duplicate a browser test with a mocked image pipeline.

Install the browsers, then run the browser tests:

```bash
bunx playwright install chromium firefox
bun run test:e2e
```

If Linux libraries are missing, use `bunx playwright install --with-deps chromium firefox`.

The command builds the app and starts a preview on port 4322.
The tests use desktop Chromium, Firefox, and mobile Chromium emulation.
Sharp checks downloaded pixels and metadata outside the browser.
HEIC conversion and background removal use the actual libraries.
Each test checks browser and worker requests against the local build files.
WebKit and physical devices are outside this test suite.

Geometry tests use 500 generated inputs per property with a fixed seed.
Keep explicit boundary cases. Coverage includes all source TypeScript modules.
Do not lower thresholds to remove a test.

Use temporary faults to confirm that a test detects its target defect.
Restore the code before the full checks.
See [Testing Library](https://testing-library.com/docs/guiding-principles/) and [Playwright](https://playwright.dev/docs/best-practices/) for test guidance.

Browser failures save traces and screenshots in `test-results/`.
Open a trace with `bunx playwright show-trace <trace.zip>`.
See `tests/e2e/fixtures/README.md` for image sources.

## Documentation

Documentation is part of the product.

- Update `README.md` only with user-facing current behavior.
- Update the Product Truth section of `AGENTS.md` before changing product promises or scope.
- Update this file when development workflow changes.
- Update `AGENTS.md` when agent behavior or document ownership changes.
