# Reshrimp

A client-side image manipulation tool built with Astro and TypeScript. Resize, compress, convert formats, and more - all in your browser without uploading to any server.

## 🚀 Live Demo

Visit: https://abijith-suresh.github.io/reshrimp

## ✨ Features

- **Client-side processing** - Your images never leave your device
- **Image resizing** - Adjust dimensions with various options
- **Format conversion** - Convert between JPEG, PNG, WebP, and more
- **Compression** - Optimize file sizes while maintaining quality
- **Batch processing** - Process multiple images at once
- **Privacy first** - No server uploads, everything happens locally

## 🛠️ Tech Stack

- [Astro](https://astro.build) - Static site generator
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com) - Styling
- [Vitest](https://vitest.dev/) - Testing framework

## 📦 Project Structure

```
/
├── .github/
│   ├── workflows/      # CI/CD workflows
│   └── dependabot.yml  # Dependency automation
├── .husky/             # Git hooks
├── .vscode/            # VS Code settings
├── public/             # Static assets
├── src/
│   ├── layouts/        # Astro layouts
│   ├── pages/          # Astro pages
│   ├── styles/         # Global styles
│   └── test/           # Test files
├── astro.config.mjs    # Astro configuration
├── eslint.config.mjs   # ESLint configuration
├── vitest.config.ts    # Vitest configuration
└── package.json
```

## 🧞 Development Commands

All commands are run from the root of the project:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `bun install`          | Install dependencies                             |
| `bun dev`              | Start dev server at `localhost:4321`             |
| `bun run build`        | Build for production                             |
| `bun preview`          | Preview production build locally                 |
| `bun run lint`         | Run ESLint                                       |
| `bun run lint:fix`     | Fix ESLint issues                                |
| `bun run format`       | Format code with Prettier                        |
| `bun run format:check` | Check code formatting                            |
| `bun run test`         | Run tests once                                   |
| `bun run test:watch`   | Run tests in watch mode                          |
| `bun run analyze`      | Analyze bundle size                              |

## 🤝 Contributing

Please read [AGENTS.md](./AGENTS.md) for development workflow, commit conventions, and contribution guidelines.

## 📄 License

MIT
