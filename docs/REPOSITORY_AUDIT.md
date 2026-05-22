# Repository Audit

Date: 2026-05-22

## Executive Summary

Reshrimp's shipped experience is still recognizably a privacy-first browser utility, but the repository has drifted beyond the active product boundary.

The main problems are not missing features. The main problems are dormant scope, future-facing abstractions, and review queue noise around work that pulls the app toward batch and editor behavior.

The next cleanup PR after this governance PR should remove dormant batch and coming-soon scaffolding before any more feature work is merged.

## Current Strengths

- `/app` is isolated as the main interactive surface in `src/pages/app.astro`.
- Core processing still happens locally in the browser through `src/services/`.
- Background removal assets are mirrored and served from the app origin.
- The project already has a useful `bun run verify` quality gate and a solid base of service-level tests.

## Highest-Priority Cleanup Targets

### 1. Shipped coming-soon UI

Evidence:

- `src/components/app/appModes.ts`
- `src/components/app/AppSidebar.tsx`
- `src/components/app/panels/ComingSoonPanel.tsx`

Why it matters:

- It advertises features that are intentionally unavailable.
- It makes the app feel like a workspace with a roadmap instead of a finished utility.

Recommendation:

- Remove disabled `Adjust` and `Batch` modes from the shipped app in the next cleanup PR.

### 2. Dormant batch infrastructure

Evidence:

- `src/types/batch.ts`
- `src/services/batchQueueService.ts`
- `src/services/bulkDownloadService.ts`
- `src/services/batchQueueService.test.ts`
- `src/services/bulkDownloadService.test.ts`

Why it matters:

- Batch processing is outside the active product boundary.
- The code adds concepts, tests, and dependencies without serving the current app.

Recommendation:

- Delete batch queue, bulk ZIP download, and related tests unless the constitution changes.
- Remove `jszip` once the dormant ZIP path is deleted.

### 3. Dormant recipe and advanced export abstractions

Evidence:

- `src/services/exportRecipeService.ts`
- `src/services/exportRecipeService.test.ts`
- `src/types/processing.ts`
- `src/services/imageService.ts`

Why it matters:

- Recipes and advanced export variants add product surface and implementation paths that are not part of the supported utility flow.
- `ProcessOptions` currently carries transform, target-size, and adjustment fields that push the pipeline beyond the active product contract.

Recommendation:

- Trim processing types and services back to the currently supported surface after scope purge.
- Delete recipe infrastructure if it remains unwired.

### 4. Oversized state hub

Evidence:

- `src/components/app/state/ImageAppContext.tsx`

Why it matters:

- The file is the main maintainability hotspot.
- Refactoring it for batch reuse would optimize for an out-of-scope future instead of the current single-image flow.

Recommendation:

- Simplify the state layer only around the active single-image workflow.
- Do not use batch-mode reuse as the design driver.

### 5. Documentation and test drift

Evidence:

- `README.md` still referenced `eslint.config.mjs`
- `e2e/marketing-pages.spec.ts` expects `/changelog`
- `CHANGELOG.md` still mentions a public changelog route

Why it matters:

- Drift makes the repository harder to trust and maintain.

Recommendation:

- Fix docs drift immediately.
- Remove or repair stale route expectations in the next cleanup PR.

## Dependency Audit

Keep:

- `astro`, `solid-js`, `@astrojs/solid-js`, `tailwindcss`, `vitest`
- `@imgly/background-removal` for the one genuinely complex domain feature in scope
- `@vite-pwa/astro` while offline support remains part of the product promise
- `lucide-astro` and `lucide-solid` as lightweight UI dependencies

Re-evaluate:

- `heic2any`: currently used through `src/services/formatDetectionService.ts`; review again after the lighter HEIC decoder work is decided
- `@resvg/resvg-js` and `satori`: justified only as long as branded OG and icon generation remain worth the maintenance surface

Remove with scope purge if dormant code is deleted:

- `jszip`: only used by `src/services/bulkDownloadService.ts`

Watch closely:

- Root-scoped service worker behavior in `src/pwa.ts` and `src/sw.ts`
- Immediate updates via `clientsClaim()` and `self.skipWaiting()` for an in-memory editing session

## Issue Audit

| Issue                                                                         | Recommendation     | Reason                                                                   |
| ----------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| #108 `fix: add aria-labelledby and keyboard navigation to FAQ accordion`      | Keep               | Clear accessibility fix with current-product value                       |
| #107 `chore: split ImageAppContext into focused modules for batch-mode reuse` | Supersede or close | The batch-reuse goal is no longer a valid architectural driver           |
| #106 `chore: consolidate duplicated Card and SectionHeader components`        | Defer              | Reasonable cleanup, but lower priority than scope purge                  |
| #105 `chore: fill design token gaps...`                                       | Defer              | Low-leverage polish, not a current product-risk item                     |
| #104 `chore: extract shared Chip/Badge primitive...`                          | Close              | Adds abstraction value mainly around marketing polish and coming-soon UI |
| #102 `feat: replace heic2any with a lighter HEIC/HEIF decoder strategy`       | Keep               | Could reduce weight and dependency cost without widening scope           |
| #101 `feat: add a dedicated AVIF encoder path...`                             | Defer              | Adds codec complexity beyond the current core need                       |
| #81 `feat: improve quick-upload and before/after comparison workflows`        | Split or defer     | Clipboard paste aligns; comparison UI should stay optional and minimal   |
| #77 `feat: add batch queue UI with per-item status and actions`               | Close              | Conflicts with the single-image product boundary                         |
| #75 `feat: add crop support`                                                  | Close              | Not part of the supported product surface                                |

## Closed History Audit

Closed work worth preserving because it supports the current product:

- #16 background removal
- #23 HEIC/HEIF input support
- #69 app-flow integration coverage
- #70 object URL lifecycle hardening
- #72 accessibility baseline improvements
- #73 messaging and contributor-doc alignment
- #79 self-hosted background-removal assets

Closed work that explains current scope drift and should be reconsidered in cleanup:

- #24 rotate and flip operations
- #25 social media dimension presets
- #27 high-volume workflows
- #28 image adjustments
- #29 target file size export mode
- #76 batch queue state model
- #78 bulk download strategy
- #80 export recipes

Git history keeps these experiments available. The active codebase does not need to preserve them if they no longer fit the product.

## Open PR Audit

| PR                                                                            | Recommendation     | Reason                                                           |
| ----------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------- |
| #109 `fix: add aria-labelledby and keyboard navigation to FAQ accordion`      | Keep               | Clear accessibility fix                                          |
| #110 `chore: consolidate duplicated Card and SectionHeader components`        | Defer              | Acceptable cleanup, but lower priority than scope reduction      |
| #111 `chore: fill design token gaps...`                                       | Defer              | Minor polish                                                     |
| #112 `chore: extract shared Chip badge primitive...`                          | Close              | Low-value abstraction, especially if coming-soon UI is removed   |
| #113 `chore: split ImageAppContext into focused modules for batch-mode reuse` | Supersede or close | Architectural goal is tied to batch scope                        |
| #114 `feat: add clipboard paste upload and before/after comparison toggle`    | Split or defer     | Mixed-scope PR; paste is stronger than comparison                |
| #115 `feat: add crop support to image processing pipeline`                    | Close              | Out of scope                                                     |
| #116 `feat: add batch queue UI with multi-file upload and per-item status`    | Close              | Out of scope                                                     |
| #117 `feat: add dedicated AVIF encoder path with explicit quality control`    | Defer              | Adds complexity without a demonstrated current-product need      |
| #118 `feat: replace heic2any script loader with native-first HEIC decoder`    | Keep               | Strongest current performance and dependency-alignment candidate |

## Branch Audit

Remote branches mostly map cleanly to currently open pull requests.

The obvious stale remote branch is:

- `origin/chore/issues-38-39-40-41`

Recommendation:

- Delete that remote branch after the current governance checkpoint.

## TODO And Dormant-Reference Audit

- No literal `TODO` or `FIXME` comments were found in the repository.
- Dormant intent currently shows up through shipped coming-soon UI and dormant service layers instead of comments.

## Recommended Execution Plan

### Phase 0. Governance foundation

- Land this PR.
- Use the constitution and audit as the review baseline for future changes.

### Phase 1. Scope purge

- Remove disabled app modes and the coming-soon panel.
- Delete batch queue, bulk download, and export recipe infrastructure if still unwired.
- Remove stale tests and references tied to deleted surfaces.
- Remove dependencies that only served deleted paths.

Suggested PR title:

- `chore: remove dormant batch and coming-soon scaffolding`

### Phase 2. Structural simplification

- Simplify `ImageAppContext` only for the active single-image flow.
- Reduce processing types to the supported product contract.
- Remove abstractions whose main value depends on future features.

### Phase 3. Core workflow hardening

- Add or repair pragmatic regression coverage for resize, compression, conversion, and background removal.
- Replace brittle DOM-selector tests with behavior-focused tests where practical.

### Phase 4. Performance and offline hardening

- Revisit service worker scope, update behavior, and cache bounds.
- Measure bundle growth on the `/app` route.
- Keep heavy decode or background-removal paths lazy.

### Phase 5. UX simplification and stabilization

- Remove remaining clutter.
- Tighten copy and route expectations.
- Finish with accessibility, consistency, and release-readiness fixes.
