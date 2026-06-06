# Architecture

Last updated: 2026-06-06

This document is the technical truth for Reshrimp. Update it when architecture, processing flow, dependencies, or project structure changes.

## Stack

- Astro 6 for pages, layouts, routing, build, and mostly static marketing surfaces.
- SolidJS for the interactive image app mounted at `/app`.
- TypeScript for application, service, and test code.
- Tailwind CSS v4 for styling, supported by shared design tokens.
- Bun for package management and task running.
- Vitest with jsdom for unit and behavior tests.

## Runtime Model

Reshrimp is a static, browser-first web app. There is no application backend for image processing.

Marketing and support pages render through Astro. The app route loads a SolidJS component with `client:only="solid-js"` because image selection, canvas work, object URLs, and background removal are browser-only concerns.

## Project Map

- `src/pages/`: Astro routes.
- `src/layouts/`: shared page shells.
- `src/components/marketing/`: marketing-page components.
- `src/components/shared/`: shared Astro components used across marketing pages.
- `src/components/app/`: SolidJS app UI for upload, controls, preview, and download.
- `src/components/ui/`: small shared UI primitives.
- `src/services/`: image-processing, validation, workflow, format, canvas, and background-removal services.
- `src/config/`: shared constants, image format metadata, background-removal asset configuration, and OG metadata.
- `src/utils/`: small reusable helpers.
- `src/styles/`: global design tokens and shared component styles.
- `src/test/`: test setup and browser mocks.
- `scripts/`: build/dev support scripts.
- `public/`: static assets served by the deployed app.

## Image Workflow

The app flow is:

1. The user selects one image.
2. The file is validated for type and size.
3. Image metadata is read locally in the browser.
4. UI controls produce processing options.
5. Services process the image locally.
6. The result is exposed through an object URL for preview.
7. Download creates a temporary link from the in-memory Blob.
8. Object URLs are revoked when replaced, when a new file is loaded, and when the app unmounts.

Processing order is:

1. Decode HEIC/HEIF input to PNG when needed.
2. Remove background when enabled.
3. Load the working image into the browser.
4. Calculate output dimensions.
5. Draw to canvas.
6. Choose the requested output format or a browser-supported fallback.
7. Encode the canvas to a Blob with quality settings where supported.

## Service Boundaries

Business logic belongs in services or shared helpers, not scattered through UI components.

- `imageService.ts` coordinates image processing.
- `imageWorkflowService.ts` translates UI state into processing options and dimension values.
- `canvasService.ts` wraps image loading, canvas drawing, encoding, and format support checks.
- `validationService.ts` owns file validation and download filename generation.
- `formatDetectionService.ts` handles HEIC/HEIF decoding.
- `backgroundRemovalService.ts` wraps the background-removal library and model configuration.

UI components should gather input, show state, and call context actions. They should not grow independent processing rules.

## Formats And Limits

Accepted input formats are defined in `src/config/imageFormats.ts`.

Current accepted inputs:

- JPEG
- PNG
- WebP
- AVIF
- HEIC
- HEIF

Current output formats:

- JPEG
- PNG
- WebP
- AVIF when supported by the browser

The upload hard limit is 50 MB. Large files above the recommended threshold should produce a warning. Canvas processing also guards against images beyond the configured maximum pixel dimension.

## Background Removal

Background removal runs in the browser through `@imgly/background-removal`.

The app mirrors the required model/runtime assets into `public/background-removal/<version>/dist/` before `dev` and `build`. This keeps runtime requests on the app origin for the deployed app and avoids shipping unused upstream assets.

Only the current CPU runtime and selected model are mirrored. Do not add alternate models or GPU/runtime variants without a measured product need.

## PWA And Offline Behavior

Production builds register a service worker through `@vite-pwa/astro` and Workbox.

Current behavior:

- the app shell and core tools can work offline after the first online visit
- background-removal assets can be cached after download
- uploaded images and generated outputs are not intentionally cached
- service worker cache scope and expiration rules must stay explicit

Offline support is current behavior, but it should not justify unrelated architecture or product scope expansion.

## Styling

Styling should preserve the established Soft Pop visual direction while reducing one-off values.

Use Tailwind utilities for component layout and state styling. Use `src/styles/global.css` for global tokens and base styles. Use `src/styles/components.css` only for shared app primitives or styles that cannot be expressed cleanly inline.

Prefer existing tokens and repeated spacing values before introducing new arbitrary values. If a new design token is needed, add it deliberately and use it consistently.

## Dependencies

Dependencies should serve active product needs.

Prefer browser APIs and framework-native patterns before adding packages. Add dependencies only when they clearly improve correctness, performance, or a domain capability that Reshrimp actually ships.

Remove dependencies when their only consumers are removed.

## Testing

Service-level tests should cover image-processing rules, conversion behavior, validation, background-removal integration boundaries, and object URL lifecycle behavior.

UI tests should focus on user-observable app behavior: upload, process, preview, errors, and download. Avoid snapshot-heavy tests and avoid testing implementation details unless they protect a real regression.

## Architecture Change Rule

Before adding new abstractions, ask whether they would still be justified if Reshrimp never gained another major feature. If not, prefer simpler code or deletion.
