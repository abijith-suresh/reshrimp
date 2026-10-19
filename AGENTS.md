# Reshrimp — agent brief
Privacy-first browser image utility that prepares one image at a time, for people who must meet a portal's dimension, format, or size limit without uploading the image.

## The Project
Core promise: process the selected image entirely in the browser — never upload it for processing, never require an account, never add ads, tracking, or analytics, and keep the workflow focused on one image. The current surface is resize (pixels, percentage, inches, centimetres), compression via output quality, best-effort maximum file size for JPEG/WebP/AVIF, format conversion, local background removal, and single-image upload/preview/process/download.
Non-goals: backend or server-side image processing; accounts, login, sync, or collaboration; ads, tracking, analytics, or fingerprinting; multi-image batch or ZIP flows; editor/workspace metaphors; crop, rotate, flip, annotation, sticker, text, or drawing tools; adjustment panels beyond compression and background removal; plugin, registry, or workflow-engine systems; speculative code kept for future features; public promises for unimplemented behavior.
Status: live.

## How I Work Here
- Quality gate: `verify` — run before handoff. It runs type-check, lint, format:check, unit coverage, asset-sync tests, and the production build.
- Commits: Conventional Commits; types live in commitlint.config.ts. Squash merges; never commit to main. One focused PR at a time, then wait for review.
- Hard rules — violating any is a defect even if tests pass:
  - Privacy: all processing is client-side; user image bytes never cross the network (no uploads, beacons, or error reports with image content). Background-removal model/runtime assets load from the app origin (origin-pinned `publicPath`, mirrored at build time), never a third-party CDN.
  - Canvas re-encoding is the privacy boundary: uploaded metadata (EXIF/GPS) must not survive into outputs.
  - Business logic lives in `src/services/` or shared helpers, never in UI components; components gather input, show state, and call context actions.
  - Object URLs are revoked when replaced, when a new file is loaded, when the app unmounts, and on processing error — any new image flow must preserve all four paths.
  - `validationService` is the single gate for file validation and download naming.
  - Heavy deps (background removal, HEIC decoding) load lazily, never in the initial bundle.
  - Results are applied only to the image they were produced from; processing state changes must not corrupt sessions.
  - One image at a time, and no editor/workspace expansion, until § The Project changes first. Prefer deletion over dormant abstractions.
  - Styling: Tailwind utilities only — no scoped component CSS or `@apply` component classes. Shared design values stay in the single `@theme` block in `src/styles/global.css`. Handwritten CSS is limited to font loading, shared keyframes, global defaults/accessibility overrides, and browser-specific selectors; inline styles only for runtime-computed values.
  - Keep public copy human, honest, and specific to implemented behavior.

## Sources of Truth
| Fact | Where |
|---|---|
| Product intent | § The Project (this file) |
| Runtime behavior | code + tests |
| Commands & deps | package.json |
| Commit rules | commitlint.config.ts |
| Dev workflow, branches, releases, test layers | CONTRIBUTING.md |
Code and tests are the authority; this file never overrides executable truth.

## Getting Around
- `src/services/` — image pipeline: validation, format detection, canvas/encoding, background removal, workflow orchestration.
- `src/components/app/` — single-image app UI: upload, preview, panels, controls, and `state/` (session context plus object-URL lifecycle).
- `src/components/marketing/`, `src/layouts/`, `src/pages/` — Astro site, marketing sections, and page routes/initializers.
- `src/config/`, `src/types/`, `src/utils/`, `src/lib/` — shared config, types, and helpers.
- `src/styles/` — the `@theme` tokens in `global.css` and browser-primitives CSS.
- `src/test/`, `tests/e2e/`, `scripts/` — jsdom setup/mocks, Playwright browser suite, and build-time asset mirroring.
