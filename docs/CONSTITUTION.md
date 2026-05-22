# Reshrimp Constitution

## Product Identity

Reshrimp is a small browser utility for one image at a time.

The supported product surface is:

1. Image resize
2. Image compression
3. Image format conversion
4. Background removal

Every change should reinforce the same product qualities:

- privacy-first
- fully client-side
- offline-capable where feasible
- performance-sensitive
- intentionally simple
- single-image focused
- low-friction
- utility-oriented

The intended user session is short:

1. Open the app
2. Upload one image
3. Make a small number of clear choices
4. Download the result
5. Leave

## Out Of Scope

The active product is not an editor, workspace, or creative suite.

Do not add or preserve these by default:

- batch processing
- multi-image queues
- ZIP export flows
- workflow chaining
- export recipe systems
- brightness, contrast, saturation, or other adjustment panels
- crop, rotate, flip, or editor-style transform surfaces
- social media presets
- annotations, stickers, or text tools
- accounts, sync, or collaboration
- plugin systems or registries
- generative or playground-style AI features
- shipped "coming soon" UI
- hidden dormant features kept only for possible future use

If real product evidence ever changes this boundary, update this document first and only then add code.

## Architecture Rules

- Keep marketing and mostly static pages in `.astro` components.
- Keep the interactive tool in the `/app` Solid surface unless there is a measured reason to split it.
- Keep image-processing rules in `src/services/` and pure helpers, not scattered through UI components.
- Keep shared constants and metadata in `src/config/`.
- Prefer small, explicit modules over generic systems.
- Reuse components naturally, but do not build primitive farms, registries, or workflow engines for a small utility app.
- Do not keep abstractions whose main value depends on future product expansion.

Use this litmus test before adding abstraction:

> Would this still be justified if Reshrimp never gained another feature?

If the answer is no, prefer simpler code or deletion.

## Dependency Rules

- Prefer browser APIs and framework-native patterns first.
- Add dependencies only when they clearly improve correctness, performance, or domain capability.
- Avoid tiny helper packages and wrappers around native APIs.
- Remove dependencies that only serve dormant or out-of-scope code.
- Treat supply-chain risk and bundle cost as product concerns, not just tooling concerns.

## Testing Rules

- Strongly test resize, compression, conversion, background removal, export behavior, and critical error handling.
- Favor service-level tests for business logic.
- Keep UI tests pragmatic and behavior-focused.
- Prefer accessible queries over brittle selectors.
- Do not add snapshot-heavy or implementation-detail-heavy test suites.

## Performance And Offline Rules

- Keep the main route lean and lazy-load heavy processing paths.
- Keep marketing pages mostly static.
- Keep service worker scope and caches intentional.
- Do not cache user-uploaded images or generated outputs by default.
- Keep third-party network dependencies out of the core image-processing path.
- Preserve the current privacy story: images stay on the device.

## Cleanup Rules

- Delete dead code.
- Delete dormant features.
- Delete "coming soon" systems from shipped UI.
- Delete abstractions that are no longer justified.
- Delete unused dependencies after their code paths are removed.
- Prefer a smaller active codebase over preserving speculative work.

Git history is the archive. The working tree should reflect the current product, not past experiments.

## Delivery Rules

- Work in focused PRs with one clear purpose.
- Explain deletions and tradeoffs explicitly.
- Run `bun run verify` before pushing.
- Use conventional commit and PR titles.
- After opening a PR, stop and wait for review or merge feedback before starting the next phase.
