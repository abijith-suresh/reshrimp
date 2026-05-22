# Reshrimp

A privacy-first, single-image, client-side image tool built with Astro 6, SolidJS, and TypeScript. Resize, compress, convert, and remove backgrounds in your browser without uploading images. After one online visit, the app shell and core tools work offline. Background removal works offline after its model assets are downloaded once.

## 🚀 Live Demo

[![Vercel](https://img.shields.io/badge/deployed-vercel-black?logo=vercel)](https://reshrimp.vercel.app)

Visit: https://reshrimp.vercel.app

## ✨ Features

- **Client-side processing** - Your images never leave your device
- **Offline-ready core tools** - The app shell, resize, convert, and compress flows work offline after the first online visit
- **Image resizing** - Resize by pixels, percentage, or print units with aspect-ratio control
- **Format conversion** - Convert between JPEG, PNG, WebP, and AVIF
- **Compression** - Optimize file sizes while maintaining quality
- **Background removal** - Runs locally and works offline after its mirrored model assets download once
- **Single-image processing** - Upload one image, choose a few settings, and download the result
- **Privacy first** - No server uploads, everything happens locally

## 🛠️ Tech Stack

- [Astro 6](https://astro.build) - App and site framework
- [SolidJS](https://www.solidjs.com/) - Interactive app UI
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com) - Styling
- [Bun](https://bun.sh/) - Package manager and task runner
- [Vitest](https://vitest.dev/) - Testing framework

## 📦 Project Structure

```
/
├── .github/
│   ├── workflows/      # CI/CD workflows
│   └── dependabot.yml  # Dependency automation
├── docs/               # Product constitution and repository audit
├── .husky/             # Git hooks
├── .vscode/            # VS Code settings
├── public/             # Static assets
├── src/
│   ├── components/     # App and marketing UI
│   ├── layouts/        # Astro layouts
│   ├── pages/          # Astro pages
│   ├── services/       # Image-processing helpers and browser services
│   ├── styles/         # Global styles
│   └── test/           # Test setup and shared mocks
├── astro.config.ts     # Astro configuration
├── eslint.config.ts    # ESLint configuration
├── vitest.config.ts    # Vitest configuration
└── package.json
```

## 🧞 Development Commands

All commands are run from the root of the project:

| Command                             | Action                                                |
| :---------------------------------- | :---------------------------------------------------- |
| `bun install`                       | Install dependencies                                  |
| `bun run assets:background-removal` | Mirror the required background-removal assets locally |
| `bun dev`                           | Start dev server at `localhost:4321`                  |
| `bun run build`                     | Build for production                                  |
| `bun preview`                       | Preview production build locally                      |
| `bun run type-check`                | Run Astro sync and TypeScript checks                  |
| `bun run lint`                      | Run ESLint                                            |
| `bun run lint:fix`                  | Fix ESLint issues                                     |
| `bun run format`                    | Format code with Prettier                             |
| `bun run format:check`              | Check code formatting                                 |
| `bun run test`                      | Run tests once                                        |
| `bun run test:watch`                | Run tests in watch mode                               |
| `bun run verify`                    | Run the full quality gate                             |
| `bun run analyze`                   | Analyze bundle size                                   |

## Background-removal asset delivery

Reshrimp mirrors the minimum background-removal asset set into `public/background-removal/<version>/dist/` before `dev` and `build`.

- runtime requests stay on the app origin instead of depending on a third-party CDN
- only the CPU ONNX runtime plus the `isnet_fp16` model are mirrored, which keeps the asset footprint around 96 MB instead of shipping the full upstream package
- the mirror step still needs network access when assets are missing locally, but the deployed app serves and caches those assets itself once built

## 🤝 Contributing

Please read [AGENTS.md](./AGENTS.md) for development workflow, commit conventions, and contribution guidelines.

Project governance lives in:

- [`docs/CONSTITUTION.md`](./docs/CONSTITUTION.md)
- [`docs/REPOSITORY_AUDIT.md`](./docs/REPOSITORY_AUDIT.md)

## 📄 License

MIT
