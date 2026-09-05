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

The current product should not include:

- backend image processing
- image uploads to a server for processing
- accounts, signups, login, sync, or collaboration
- ads, tracking, analytics, or fingerprinting
- multi-image batch flows
- ZIP export flows
- broad editor/workspace metaphors
- crop, rotate, flip, annotation, sticker, text, or drawing tools
- broad adjustment panels beyond the current compression and background-removal scope
- plugin systems, registries, or workflow engines
- speculative code kept only for possible future expansion
- public promises for features that are not implemented

Batch processing may be reconsidered in the future, but it is out of scope until this section changes first.

### Constraints

- The app is browser-first and static-site friendly.
- Heavy processing paths should stay lazy or isolated where practical.
- Background removal may rely on third-party model/runtime assets, but user image data must remain local.
- Offline/PWA behavior is current behavior and may be documented as such. Do not remove or expand it without an explicit product decision.
- Performance and bundle cost are product concerns, not only technical concerns.
- Mobile UX matters. Features that are simple in services but awkward in mobile UI should not be added by default.

### Success Criteria

Reshrimp is successful when:

- a user can prepare one image quickly without understanding image-processing terminology
- privacy claims are clear, accurate, and verifiable from the code
- the app feels complete rather than experimental or half-built
- public copy sounds human, honest, and practical
- the app route remains satisfying to use on desktop and mobile
- future improvements ship incrementally without expanding scope by accident

## Document Ownership

- `README.md`: user-facing current behavior only.
- `ARCHITECTURE.md`: technical truth, stack, boundaries, processing flow, and runtime behavior.
- `CONTRIBUTING.md`: development workflow, commands, commits, PRs, and contribution rules.
- `AGENTS.md`: agent behavior, product truth, and truth-maintenance rules.

Historical governance or audit files must not override the documents above.

## Truth Maintenance Rules

- If product scope changes, update the Product Truth section of this file first.
- If architecture, dependencies, or processing flow changes, update `ARCHITECTURE.md` in the same work.
- If workflow or quality gates change, update `CONTRIBUTING.md`.
- If public behavior changes, update `README.md` and relevant marketing copy.
- Do not advertise unimplemented features.
- Treat stale docs as defects.

## Hard Product Rules

- Keep image processing client-side in the browser.
- Do not add server-side image processing unless the maintainer explicitly changes the product truth above.
- Do not add accounts, login, sync, or collaboration.
- Do not add ads, analytics, tracking, or fingerprinting.
- Keep the active app flow focused on one image at a time.
- Treat batch processing as out of scope until the Product Truth section changes first.
- Treat broad editor/workspace features as out of scope until the Product Truth section changes first.
- Keep public copy human, honest, and specific to implemented behavior.

## Stack

- Astro 7
- SolidJS
- Tailwind CSS v4
- TypeScript
- Bun
- Vitest

## Commands

- Install dependencies: `bun install`
- Dev server: `bun run dev`
- Full quality gate: `bun run verify`
- Individual checks: `bun run type-check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`

## Project Map

- `src/pages/`: Astro routes
- `src/layouts/`: page shells
- `src/components/app/`: SolidJS app UI
- `src/components/marketing/`: marketing components
- `src/components/ui/`: shared UI primitives
- `src/services/`: image-processing and workflow services
- `src/config/`: constants and supported format metadata
- `src/utils/`: shared helpers
- `src/styles/`: global tokens and shared CSS
- `src/test/`: test setup and mocks

## Engineering Rules

- Keep business logic in `src/services/` or shared helpers, not UI components.
- Follow the existing Astro and SolidJS structure.
- Prefer small, explicit modules over generic systems.
- Do not preserve dormant code for possible future features.
- Prefer deletion over unused abstractions.
- Preserve object URL cleanup and user-image privacy when changing image flows.
- Keep heavy processing paths lazy or isolated where practical.
- Use existing design tokens and spacing patterns before introducing new one-off values.

## Git And CI

- Branch from the latest `main` before starting changes.
- Never commit directly to `main`.
- Commit and PR titles must use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, or `ci`.
- Before push, run `bun run verify` when feasible.
- `pre-commit` runs `lint-staged`, `commit-msg` runs `commitlint`, and `pre-push` runs `bun run verify`.
- CI enforces quality and PR-title checks on pull requests.
- Squash merge is the expected merge strategy.
- Open one focused PR at a time, then stop and wait for review or merge feedback before continuing.
