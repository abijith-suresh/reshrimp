# Codebase Health — 2026-04-29

## Summary

The codebase is in decent shape overall: `bun run test`, `bun run type-check`, `bun run lint`, and `bun run build` all pass, and the service/util layers have solid unit coverage. The main health issues are concentrated in the browser app shell: too much core workflow logic lives in the top-level Solid component, and several Astro page scripts are not lifecycle-safe under SPA navigation. Remediation effort looks moderate and should be done incrementally.

## Findings

### High

- [ ] `src/components/app/ImageApp.tsx` — The core upload → process → download workflow, resize-unit conversion, preset synchronization, background-removal format coupling, and state-reset rules all live in a 456-line UI component. That violates the project rule to keep business logic in services/shared helpers, and there are no component/integration tests covering the real browser flow.
- [x] `src/layouts/Layout.astro`, `src/components/shared/MarketingHeader.astro`, `src/pages/faq.astro` — `astro:page-load` initializers register global `pointerdown`, `scroll`, and `click` handlers on every navigation without idempotence or cleanup. In SPA mode this will accumulate duplicate listeners and can cause repeated ripple effects, header updates, and FAQ toggles over time.

### Medium

- [ ] `src/layouts/Layout.astro`, `src/layouts/MarketingLayout.astro`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/faq.astro`, `src/pages/privacy.astro`, `src/pages/changelog/index.astro`, `src/pages/404.astro` — The layout/page structure nests multiple `<main>` landmarks, which creates invalid document semantics and weakens accessibility landmarks/skip-link behavior.
- [x] `src/services/backgroundRemovalService.ts`, `src/sw.ts`, `src/config/backgroundRemoval.ts` — Background-removal asset details were duplicated across runtime loading and caching code. Centralizing the CDN path, version, model, and cache settings prevents processing/offline support drift during future upgrades.
- [x] `src/components/app/UploadArea.tsx`, `src/components/app/ProcessingControls.tsx`, `src/services/validationService.ts`, `src/config/imageFormats.ts` — Supported-format knowledge was split across the file input `accept` string, format-select options, and validation logic. Centralizing the format list and labels keeps future format changes consistent.
- [ ] `src/services/imageService.ts`, `src/utils/imageUtils.ts`, `src/types/image.ts`, `src/services/backgroundRemovalService.ts`, `src/test/mocks.ts` — Several exports/types appear to be dead weight or drift from the current single-image product (`resizeImage`, `convertFormat`, `compressImage`, `getImageDimensions`, `clamp`, `ImageState`, `isBackgroundRemovalSupported`, `getLatestCanvasMock`). Keeping them around makes the public surface harder to understand.

### Low

- [ ] `src/components/app/ProcessingControls.tsx` — Tooltip-dismiss behavior is implemented twice with nearly identical `onMount`/document-click wiring. A small shared click-outside helper would simplify the component.
- [ ] `src/utils/imageUtils.test.ts`, `src/test/mocks.ts` — The download-link tests emit jsdom navigation noise and do not fully assert timed cleanup, which lowers test-signal quality even though the suite passes.

## Recommended Order

1. Fix the SPA listener accumulation in `Layout.astro`, `MarketingHeader.astro`, and `faq.astro` first because it affects live runtime behavior and can compound with every client-side navigation.
2. Refactor `ImageApp.tsx` next: extract workflow/state rules into shared helpers or services, then add integration tests around the real upload/process/download path before making other app-flow changes.
3. Clean up the layout semantics (`<main>` nesting) once the app shell behavior is stable.
4. Centralize format/background-removal configuration so future dependency or feature changes only need to happen in one place.
5. Remove dead code and finish with the smaller component/test cleanup items.
