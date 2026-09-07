# Agent Instructions - reshrimp

## Product Summary

Reshrimp is a privacy-first browser image utility for one image at a time.

It exists because common image-preparation tasks are still frustrating online: application portals, document uploads, profile photos, and similar workflows often require specific dimensions, formats, or smaller files. Many available tools are ad-heavy, confusing, paid, or unclear about whether user images are uploaded.

## Product Truth

This section is the product source of truth. Update it before changing product scope, promises, or non-goals. Code and public copy follow this section, not the other way around.

### Core Promise

- Process images locally in the browser.
- Do not upload user images to a server for processing.
- Do not require accounts, signups, or login.
- Do not add ads, tracking, analytics, or dark-pattern monetization.
- Keep the active workflow focused on one image at a time.
- Keep the product honest about what is implemented today.

### Current Product Surface

The active product supports:

- image resizing and dimension changes
- compression through output quality controls
- format conversion
- background removal
- single-image upload, preview, process, and download

These are the only current public product promises.

### Desired Near-Term Capability

Best-effort target file-size export is a desired product direction, but it should not be promised in public copy until it is implemented and reliable.

The intended behavior is:

- the user provides dimensions, output format, and a maximum file size
- Reshrimp attempts to produce an output just under that maximum
- success is best effort, not an exact guarantee
- the UI should reduce manual quality-slider fiddling

### Non-Goals

The current product does not include, and must not gain without this section changing first:

- backend image processing or server-side image uploads
- accounts, signups, login, sync, or collaboration
- ads, tracking, analytics, or fingerprinting
- multi-image batch flows or ZIP export flows
- broad editor/workspace metaphors
- crop, rotate, flip, annotation, sticker, text, or drawing tools
- broad adjustment panels beyond the current compression and background-removal scope
- plugin systems, registries, or workflow engines
- speculative code kept only for possible future expansion
- public promises for features that are not implemented

## Hard Rules

These rules are enforceable invariants. Violating any of them is a defect even if tests pass.

### Privacy

- All image processing runs client-side in the browser.
- User image data never crosses the network: no uploads, no beacons, no error reports containing image content.
- Background-removal model and runtime assets must be served from the app origin (origin-pinned `publicPath`, mirrored at build time). Never let the library fetch model assets from a third-party CDN at runtime.
- Canvas re-encoding is the privacy boundary: uploaded metadata (EXIF/GPS) must not survive into outputs.

### Correctness

- Business logic lives in `src/services/` or shared helpers, never in UI components. Components gather input, show state, and call context actions.
- Object URLs are revoked when replaced, when a new file is loaded, when the app unmounts, and on processing error. Any new image flow must preserve all four paths.
- File validation and download naming live in `validationService` as the single gate.
- Heavy dependencies (background removal, HEIC decoding) load lazily, never in the initial bundle.
- Processing state changes must not corrupt sessions: results are applied only to the image they were produced from.

### Scope

- One image at a time. Batch processing is out of scope until Product Truth changes first.
- Broad editor/workspace features are out of scope until Product Truth changes first.
- Do not preserve dormant code for possible future features. Prefer deletion over unused abstractions.

### Consistency

- Follow the existing Astro and SolidJS structure.
- Use existing design tokens and spacing patterns before introducing new one-off values.
- Keep heavy processing paths lazy or isolated where practical.
- Keep public copy human, honest, and specific to implemented behavior.

## Documentation

- `README.md`: user-facing current behavior only.
- `CONTRIBUTING.md`: development workflow, commands, commits, PRs, and contribution rules.
- `AGENTS.md`: agent behavior, product truth, and hard rules.

If product scope changes, update the Product Truth section of this file first, then code, then public copy. If the workflow changes, update `CONTRIBUTING.md`. If public behavior changes, update `README.md` and marketing copy. Do not advertise unimplemented features. Treat stale docs as defects.

## Commands

- Install dependencies: `bun install`
- Dev server: `bun run dev`
- Full quality gate: `bun run verify`
- Individual checks: `bun run type-check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`

## Git And CI

- Branch from the latest `main` before starting changes.
- Never commit directly to `main`.
- Commit and PR titles must use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, or `ci`.
- Before push, run `bun run verify` when feasible.
- `pre-commit` runs `lint-staged`, `commit-msg` runs `commitlint`, and `pre-push` runs `bun run verify`.
- CI enforces quality and PR-title checks on pull requests.
- Squash merge is the expected merge strategy.
- Open one focused PR at a time, then stop and wait for review or merge feedback before continuing.
