# Agent Instructions - reshrimp

## Product Summary

Reshrimp is a privacy-first browser image utility for one image at a time.

The current public product surface is resize, compression through quality controls, format conversion, and background removal. Best-effort target file-size export is desired soon, but it is not a public promise until implemented.

## Document Ownership

- `README.md`: user-facing current behavior only.
- `docs/CONTEXT.md`: product truth, goals, non-goals, constraints, and success criteria.
- `docs/ARCHITECTURE.md`: technical truth, stack, boundaries, processing flow, and runtime behavior.
- `docs/CONTRIBUTING.md`: development workflow, commands, commits, PRs, and contribution rules.
- `AGENTS.md`: agent behavior, document ownership, and truth-maintenance rules.

Historical governance or audit files must not override the documents above.

## Truth Maintenance Rules

- If product scope changes, update `docs/CONTEXT.md` first.
- If architecture, dependencies, or processing flow changes, update `docs/ARCHITECTURE.md` in the same work.
- If workflow or quality gates change, update `docs/CONTRIBUTING.md`.
- If public behavior changes, update `README.md` and relevant marketing copy.
- Do not advertise unimplemented features.
- Treat stale docs as defects.

## Hard Product Rules

- Keep image processing client-side in the browser.
- Do not add server-side image processing unless the maintainer explicitly changes the product context.
- Do not add accounts, login, sync, or collaboration.
- Do not add ads, analytics, tracking, or fingerprinting.
- Keep the active app flow focused on one image at a time.
- Treat batch processing as out of scope until `docs/CONTEXT.md` changes first.
- Treat broad editor/workspace features as out of scope until `docs/CONTEXT.md` changes first.
- Keep public copy human, honest, and specific to implemented behavior.

## Stack

- Astro 6
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
