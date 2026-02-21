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

# Type check
bun run type-check

# Format code
bun run format

# Check formatting
bun run format:check
```

## DevContainer

The repository includes a DevContainer configuration for a consistent, fully containerized development environment.

**Includes:** Node.js 24, Bun, GitHub CLI, and VSCode extensions (Astro, ESLint, Prettier, Tailwind CSS, EditorConfig, Vitest, Path IntelliSense).

**Setup (requires Docker Desktop or Podman):**

1. Install the VSCode **Dev Containers** extension (`ms-vscode-remote.remote-containers`)
2. Open the repository in VSCode
3. Press `F1` → **"Dev Containers: Reopen in Container"**

The container automatically runs `bun install` on creation and forwards port 4321 for the Astro dev server.

## Git Workflow

### Branch Naming

- Format: `type/description` (kebab-case)
- Examples: `feat/add-og-images`, `fix/broken-nav`, `chore/update-deps`
- Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

### Commit Message Format

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

- **type**: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`
- **scope**: optional, e.g., `feat(nav): add mobile menu`
- **subject**: present tense, ≤50 chars, no period at end

| Type       | When to use                     |
| ---------- | ------------------------------- |
| `feat`     | New feature                     |
| `fix`      | Bug fix                         |
| `docs`     | Documentation only              |
| `refactor` | Code change without feature/fix |
| `chore`    | Build, deps, config             |
| `test`     | Tests only                      |

### PR Workflow

1. Pull latest main: `git checkout main && git pull origin main`
2. Cut branch: `git checkout -b type/description`
3. Make atomic commits (one logical change per commit)
4. Push branch: `git push -u origin type/description`
5. Open PR: `gh pr create --title "type: description" --body "..."`
6. Wait for CI to pass
7. **Merge using squash merge** (keeps main history linear)
8. Delete branch after merge
9. Update `CHANGELOG.md` with a summary of changes

### Key Rules

- Never commit directly to `main`
- Pre-commit hook runs lint-staged automatically
- `commit-msg` hook validates commit format via commitlint
- Keep commits atomic — one logical change, one commit
