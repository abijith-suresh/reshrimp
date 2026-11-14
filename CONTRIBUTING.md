# Contributing

Bug reports and issues are welcome. For a code change, open an issue first so the approach is agreed before you write it.

Read `AGENTS.md` first for what the product is. Reshrimp handles one image at a time, in the browser. Batch and editor flows, server-side processing, accounts, ads, and analytics are out of scope.

## Setup

`mise.toml` pins the Bun and Node versions, and the `packageManager` field in `package.json` must match its Bun version.

```bash
mise install
bun install --frozen-lockfile
bun run dev
```

The first `bun run dev` or `bun run build` downloads about 100 MB of background-removal model files into `public/background-removal/`, so it needs network access. Run the commands below with `mise exec --` if mise is not activated in your shell.

## Checks

| Command                  | What it does                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `bun run verify`         | Type check, lint, format check, unit tests with coverage, asset-sync tests, and build. Run before push. |
| `bun run test:e2e:build` | Build, then run the Playwright browser tests.                                                           |
| `bun run format`         | Fix formatting (Biome).                                                                                 |

The `pre-push` hook runs `bun run verify`. CI runs the same checks except coverage and the asset-sync tests, then adds the browser tests. Install the browsers once with `bunx playwright install chromium firefox webkit`.

Add a focused test for the behavior you change, at the layer that can catch the bug:

| Layer      | Location                                                |
| ---------- | ------------------------------------------------------- |
| Service    | Beside each module in `src/`                            |
| Context    | `src/components/app/state/`                             |
| Component  | Beside each component in `src/`                         |
| Browser    | `tests/e2e/` (image output, metadata removal, requests) |
| Asset sync | `scripts/sync-background-removal-assets.test.mjs`       |

Do not lower the coverage thresholds to remove a test.

## Making a change

1. Branch from the latest `main` with a kebab-case name and a type prefix, such as `fix/background-removal-progress`.
2. Keep the change small and focused. Do not commit to `main`.
3. Use Conventional Commits for commits and for the PR title, for example `fix: keep png transparency after background removal`. The allowed types are in `commitlint.config.ts`, and the header is at most 72 characters. Pull requests are squash merged, so the title becomes the commit.
4. Run `bun run verify` and open one pull request.

Releases are automated from the commit messages.

## Rules that break the product

- Canvas re-encoding is the privacy boundary. EXIF, GPS, and other metadata must not survive into an output.
- Image bytes never leave the browser. No uploads, beacons, or error reports that contain image content.
- Revoke object URLs when they are replaced, when a new file loads, when the app unmounts, and on a processing error.
- Load background removal and HEIC decoding lazily. They must not enter the initial bundle.
- Serve the background-removal model and runtime from the app origin (the origin-pinned `publicPath`, mirrored at build time), never from a third-party CDN.
- Keep processing logic in `src/services/` or shared helpers, not in UI components. `validationService` validates uploads and names downloads, and `imageService` checks resize targets and pixel limits before it processes an image.
- Do not describe features that are not implemented.

## Pinned dependencies

- `onnxruntime-web` is pinned to exactly 1.21.0. `@imgly/background-removal` 1.7.0 requires that exact version, and the model files mirrored from IMG.LY go with it. Change them together.
- The `overrides` block in `package.json` pins transitive packages to clear audit findings. Run `bun audit` before you remove or change one.

## Code style

- Follow the existing Astro, SolidJS, TypeScript, and Tailwind patterns, and prefer small explicit modules over generic abstractions.
- Style with Tailwind utility classes. Shared values live in the `@theme` block in `src/styles/global.css`. Use its semantic colour tokens and type scale instead of raw values, and `buttonVariants` in `src/components/ui/button.ts` for buttons.
- Do not add scoped component styles or `@apply` classes. Handwritten CSS is for font loading, shared keyframes, global defaults, and browser-specific selectors.
- Add comments only where the behavior is not obvious.

## Documentation

Update `README.md` only for behavior that exists today. Update `AGENTS.md` before you change what the product promises.
