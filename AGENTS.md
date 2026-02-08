# AGENTS.md

This document outlines project conventions and workflows for AI agents and contributors.

## Project Structure

This is an Astro project with TypeScript support.

- `src/` - Source code directory
- `public/` - Static assets
- `package.json` - Project dependencies and scripts
- `astro.config.mjs` - Astro configuration
- `tsconfig.json` - TypeScript configuration

## Development Commands

```bash
# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun preview
```

## Git Workflow

### Branch Naming Conventions

All branches should follow the `type/description` format:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/add-search-modal` |
| `fix/` | Bug fixes | `fix/header-alignment` |
| `docs/` | Documentation changes | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/simplify-utils` |
| `chore/` | Maintenance tasks | `chore/update-deps` |

**Examples:**

- `feat/add-dark-mode`
- `fix/mobile-navigation-bug`
- `docs/api-documentation`

### Commit Message Format

Use Conventional Commits format:

```
type(scope): subject
```

**Types:**

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add dark mode toggle` |
| `fix` | Bug fix | `fix: resolve mobile navigation bug` |
| `docs` | Documentation | `docs: update README with setup instructions` |
| `refactor` | Code refactoring | `refactor: simplify search component logic` |
| `chore` | Maintenance | `chore: update dependencies` |
| `test` | Adding tests | `test: add unit tests for utils` |

**Guidelines:**

- Use present tense ("add" not "added")
- Keep subject under 50 characters
- Reference issue numbers when applicable: `fix: resolve header bug (#42)`

### Pull Request Workflow

**1. Create branch from main:**

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

**2. Make atomic commits:**

- Each commit should represent a single logical change
- Write clear, descriptive commit messages

**3. Push branch to origin:**

```bash
git push -u origin feat/your-feature-name
```

**4. Create PR using gh CLI:**

```bash
gh pr create --title "feat: add new feature" --body "Description of changes"
```

**5. Wait for CI checks to pass:**

- PRs require all CI checks (lint, format, build) to pass
- Review and address any failures

**6. Merge using squash merge:**

- Squash all commits into a single clean commit
- Ensures linear history on main branch

**7. Delete branch after merge:**

```bash
git branch -d feat/your-feature-name
git push origin --delete feat/your-feature-name
```

## Code Style

- Follow existing code patterns and conventions
- Use TypeScript strictly
- Keep components small and focused
- Use Astro's built-in features where possible

## AI Agent Guidelines

- Always check the git status before making changes
- Follow the branch naming and commit conventions above
- Never commit directly to `main` - always use PR workflow
- Keep responses concise and to the point
- Avoid unnecessary explanations in code comments
