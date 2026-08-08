# Contributing

This document describes the development workflow for Reshrimp.

## Before You Start

Read these documents first:

- `docs/CONTEXT.md` for product truth
- `docs/ARCHITECTURE.md` for technical truth
- `AGENTS.md` for agent behavior and documentation ownership

Do not expand product scope unless `docs/CONTEXT.md` is updated first.

## Setup

Use Bun from the repository root.

```bash
bun install
```

## Commands

```bash
bun run dev
bun run type-check
bun run lint
bun run format:check
bun run test
bun run build
bun run verify
```

`bun run verify` is the full quality gate and should pass before pushing.

Pull request CI uses the pinned central Bun quality workflow, runs dependency review, and reports both through the required `quality` check. Pull request titles use the pinned central Conventional Commit workflow and retain the required local `pr-title` check.

Background-removal assets are mirrored before `dev` and `build` through the configured package scripts. If assets are missing locally, that step needs network access.

## Workflow

1. Start from the latest `main`.
2. Create a focused branch.
3. Make the smallest correct change.
4. Keep product copy, context docs, and implementation aligned.
5. Run the relevant checks, preferably `bun run verify` before push.
6. Open one focused pull request.
7. Stop and wait for review or merge feedback before starting unrelated work.

## Branches

Use kebab-case branch names with a conventional prefix.

Examples:

- `feat/target-file-size-export`
- `fix/background-removal-progress`
- `docs/refresh-product-copy`
- `refactor/simplify-image-workflow`
- `chore/prune-stale-branches`

## Commits And Pull Requests

Use Conventional Commits for commits and PR titles.

Allowed types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `chore`
- `test`
- `ci`

Examples:

- `feat: add target file size export`
- `fix: preserve png transparency after background removal`
- `docs: clarify privacy copy`

## Product Guardrails

Current contributions should preserve these constraints:

- one image at a time
- browser-local processing
- no server-side image processing
- no accounts or authentication
- no ads, tracking, or analytics
- no batch UI unless `docs/CONTEXT.md` changes first
- no editor/workspace expansion unless `docs/CONTEXT.md` changes first
- no public copy for unimplemented features

Target file-size export is a desired near-term capability, but public copy should not promise it until it is implemented.

## Code Style

- Follow the established Astro, SolidJS, TypeScript, and Tailwind patterns.
- Keep image-processing logic in `src/services/` or shared helpers.
- Keep UI components focused on state display and user interaction.
- Prefer clear explicit modules over generic registries or workflow engines.
- Avoid speculative abstractions for future features.
- Use existing design tokens and spacing patterns before adding one-off values.
- Add comments only when they explain non-obvious behavior.

## Tests

Add or update tests when behavior changes.

Prefer:

- service tests for processing rules and edge cases
- behavior-focused UI tests for upload, process, preview, error, and download flows
- accessible queries where practical

Avoid:

- snapshot-heavy suites
- brittle DOM selectors when a user-facing query is available
- tests that only lock in implementation details

## Documentation

Documentation is part of the product.

- Update `README.md` only with user-facing current behavior.
- Update `docs/CONTEXT.md` before changing product promises or scope.
- Update `docs/ARCHITECTURE.md` when technical structure changes.
- Update this file when development workflow changes.
- Update `AGENTS.md` when agent behavior or document ownership changes.
