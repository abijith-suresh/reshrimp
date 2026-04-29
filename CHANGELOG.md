# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.1] - 2026-04-29

### Fixed

- Prevented duplicate page listeners from accumulating across Astro SPA navigations.
- Kept the marketing header stable across sibling page transitions instead of re-slotting it during navigation.

### Changed

- Centralized background-removal asset configuration and supported image format metadata to reduce maintenance drift.
- Removed unused processing helpers and tightened download-link cleanup coverage in the automated test suite.

## [0.6.0] - 2026-03-24

### Added

- Offline-ready browser-based image tools with final launch polish for the mature `/app` workflow.

### Changed

- Locked the product around the dedicated app and marketing split plus the stabilized background-removal experience.

## [0.5.0] - 2026-02-26

### Added

- SolidJS app migration, a custom 404 page, a public changelog route, and comprehensive unit test coverage.

### Changed

- Reworked header and footer architecture and cleaned up the app and site structure for release readiness.

## [0.4.0] - 2026-02-16

### Added

- SEO infrastructure, sitemap and robots support, build-time OG image generation, and branded icons and assets.

### Changed

- Strengthened the marketing surface around the browser-first image tools.

## [0.3.0] - 2026-02-14

### Added

- Optional background removal with progress feedback and format-aware processing behavior.

## [0.2.0] - 2026-02-12

### Added

- Soft Pop design system rebuild with shared components, refreshed landing and app UX, content pages, blog scaffolding, and smoother transitions.

### Changed

- Reframed the early MVP into a branded product surface instead of a raw tool demo.

## [0.1.0] - 2026-02-10

### Added

- Initial MVP with private browser-based image processing, drag-and-drop uploads, and the first landing/app flow.

[unreleased]: https://github.com/abijith-suresh/reshrimp/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/abijith-suresh/reshrimp/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/abijith-suresh/reshrimp/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/abijith-suresh/reshrimp/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/abijith-suresh/reshrimp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/abijith-suresh/reshrimp/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/abijith-suresh/reshrimp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/abijith-suresh/reshrimp/releases/tag/v0.1.0
