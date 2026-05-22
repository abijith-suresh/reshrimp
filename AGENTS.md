# Agent Instructions — reshrimp

## Overview

- Reshrimp is a tiny, privacy-first, single-image utility app.
- The supported product surface is resize, compression, format conversion, and background removal.
- Keep changes aligned with the current browser-first app flow unless the user explicitly asks for backend work.

## Product Constitution

- Read `docs/CONSTITUTION.md` and `docs/REPOSITORY_AUDIT.md` before broad refactors or cleanup passes.
- Treat batch flows, editor/workspace metaphors, shipped "coming soon" UI, and speculative abstractions as out of scope unless the constitution changes first.
- Prefer deletion over preserving dormant code. Git history is the archive.

## Stack

- Astro 6
- SolidJS
- Tailwind CSS v4
- TypeScript
- Bun

## Commands

- Install deps: `bun install`
- Dev server: `bun run dev`
- Quality gate: `bun run verify`
- Individual steps: `bun run type-check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`

## Project Map

- `src/components/app/`: app UI
- `src/services/`: image processing services
- `src/lib/`, `src/utils/`, `src/config/`: shared helpers and constants
- `src/test/`: test setup and test files

## Hard Rules

- Keep business logic in `src/services/` or shared helpers, not scattered through UI components.
- Follow the existing Astro + Solid structure instead of introducing another UI framework.
- Preserve the current app behavior and performance posture when changing image-processing flows.
- Do not introduce architecture for future features that are not part of the active product.

## Git And CI

- Branch from the latest `main` before starting changes.
- Never commit directly to `main`.
- Commit and PR titles must use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`.
- Before push, run `bun run verify`.
- `pre-commit` runs `lint-staged`, `commit-msg` runs `commitlint`, and `pre-push` runs `bun run verify`.
- CI enforces `quality` and `pr-title` checks on pull requests.
- Squash merge is the expected merge strategy.
- Open one focused PR at a time, then stop and wait for review or merge feedback before continuing.
