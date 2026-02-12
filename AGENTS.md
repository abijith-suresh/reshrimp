# AGENTS.md

This document outlines project conventions and workflows for AI agents and contributors.

## Project Structure

This is an Astro project with TypeScript support.

- `src/` - Source code directory
  - `components/` - UI components (organized by feature: marketing/, app/)
  - `services/` - Business logic services
  - `lib/` - Utility libraries
  - `utils/` - Helper functions
  - `types/` - TypeScript type definitions
  - `config/` - Application constants
  - `test/` - Test files and setup
- `public/` - Static assets
- `package.json` - Project dependencies and scripts
- `astro.config.mjs` - Astro configuration
- `tsconfig.json` - TypeScript configuration (strict mode)

## Development Commands

```bash
# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun preview

# Run all tests
bun run test

# Run single test file
bun run test -- src/services/imageService.test.ts

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Lint code
bun run lint

# Lint and fix issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check
```

## Git Workflow

### Branch Naming Conventions

All branches should follow the `type/description` format:

| Prefix      | Purpose               | Example                   |
| ----------- | --------------------- | ------------------------- |
| `feat/`     | New features          | `feat/add-search-modal`   |
| `fix/`      | Bug fixes             | `fix/header-alignment`    |
| `docs/`     | Documentation changes | `docs/update-readme`      |
| `refactor/` | Code refactoring      | `refactor/simplify-utils` |
| `chore/`    | Maintenance tasks     | `chore/update-deps`       |

### Commit Message Format

Use Conventional Commits format:

```
type(scope): subject
```

**Types:** feat, fix, docs, refactor, chore, test

**Guidelines:**

- Use present tense ("add" not "added")
- Keep subject under 50 characters
- Reference issue numbers: `fix: resolve header bug (#42)`

### Pull Request Workflow

1. Create branch from main: `git checkout -b feat/your-feature-name`
2. Make atomic commits with clear messages
3. Push branch: `git push -u origin feat/your-feature-name`
4. Create PR: `gh pr create --title "feat: add feature" --body "Description"`
5. Wait for CI checks (lint, format, build) to pass
6. Merge using regular merge commit (not squash) with a clean message
7. Delete branch after merge

## Code Style

### TypeScript

- Use strict TypeScript with explicit types
- Use `type` keyword for type imports: `import type { Foo } from './types'`
- Define interfaces in dedicated files under `src/types/`
- Use PascalCase for types/interfaces, camelCase for variables/functions
- Export explicit return types on public functions

### Formatting (Prettier)

- Semi-colons: enabled
- Single quotes: enabled
- Tab width: 2 spaces
- Trailing commas: ES5 compatible
- Print width: 100 characters

### Imports

- Group imports: external libs first, then internal modules
- Use path aliases when configured
- Avoid default exports, prefer named exports
- Use `type` imports for type-only dependencies

### Naming Conventions

- Components: PascalCase (e.g., `ImageUpload.astro`)
- Functions: camelCase (e.g., `processImage()`)
- Constants: UPPER_SNAKE_CASE for true constants
- Files: camelCase for TS/JS, PascalCase for components

### Error Handling

- Use async/await with try/catch for async operations
- Return validation results as objects with `valid` and `error` fields
- Avoid throwing errors for expected failure cases
- Use descriptive error messages

### Documentation

- Add JSDoc comments for exported functions explaining purpose and params
- Keep inline comments minimal - prefer self-documenting code
- Document complex algorithms or business logic

### Testing

- Co-locate tests next to source files: `file.ts` → `file.test.ts`
- Use Vitest with jsdom environment
- Import from `vitest` for test utilities
- Test behavior, not implementation details

## AI Agent Guidelines

- Always check git status before making changes
- Follow branch naming and commit conventions
- Never commit directly to `main` - always use PR workflow
- Keep responses concise and to the point
- Avoid unnecessary explanations in code comments
- Run `bun run lint && bun run format:check` before committing
