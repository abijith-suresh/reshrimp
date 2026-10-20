# reshrimp — agent brief
Privacy-first browser image utility for preparing one image at a time, for people who must meet a portal's dimension, format, or size limit without uploading the image.

## The Project
Reshrimp runs entirely in the browser: the selected image is processed locally, never uploaded for processing, and the product needs no account, ads, tracking, or analytics. It resizes, compresses, converts, targets a best-effort maximum file size for JPEG/WebP/AVIF, and removes backgrounds — one image at a time.
Status: live.

## How I Work Here
- Never commit to main. Work on a focused branch, open one PR at a time, then wait for review. Squash merge.
- Use Conventional Commits; types live in commitlint.config.ts.
- Write focused tests for what you touched; CI owns the full suite. Run `verify` before handoff.
- Update § The Project before changing product scope or promises, then code, then public copy.
- Prefer deletion over dormant abstractions.
- Keep public copy honest and specific to what is implemented.

## Traps
- Canvas re-encoding is the privacy boundary: uploaded metadata (EXIF/GPS) must not survive into outputs.
- Object URLs must be revoked on all four paths — when replaced, when a new file is loaded, when the app unmounts, and on processing error.
- Heavy dependencies (background removal, HEIC decoding) must load lazily, never in the initial bundle.
- One image at a time; batch and editor/workspace flows are out of scope until § The Project changes first.
- Background-removal model/runtime assets must come from the app origin (origin-pinned `publicPath`, mirrored at build time); never a third-party CDN.
- User image bytes never cross the network — no uploads, beacons, or error reports containing image content.
- Business logic belongs in `src/services/` or shared helpers, not UI components. `validationService` is the single gate for validation and download naming.
- Styling: Tailwind utilities only — no scoped component CSS or `@apply` component classes; shared design values live in the single `@theme` block in `src/styles/global.css`.

## Sources of Truth
| Fact | Where |
|---|---|
| Product intent | § The Project (this file) |
| Runtime behavior | code + tests |
| Commands & deps | package.json |
| Commit rules | commitlint.config.ts |
| Dev workflow, branches, releases, test layers | CONTRIBUTING.md |
Code and tests are the authority; this file never overrides executable truth.
