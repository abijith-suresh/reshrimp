# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.3](https://github.com/abijith-suresh/reshrimp/compare/v0.6.2...v0.6.3) (2026-05-10)


### Features

* remove all GIF support ([#87](https://github.com/abijith-suresh/reshrimp/issues/87)) ([f8be39b](https://github.com/abijith-suresh/reshrimp/commit/f8be39ba5648e5db8605c5f1378d1c7953d40ca3))

## [0.6.2](https://github.com/abijith-suresh/reshrimp/compare/v0.6.1...v0.6.2) (2026-05-10)


### Features

* add batch queue state model ([#89](https://github.com/abijith-suresh/reshrimp/issues/89)) ([3be02a0](https://github.com/abijith-suresh/reshrimp/commit/3be02a0aab0de7f9bbd69896d95edeb67490a941))
* add bulk download strategy with ZIP archive support ([#96](https://github.com/abijith-suresh/reshrimp/issues/96)) ([f435892](https://github.com/abijith-suresh/reshrimp/commit/f435892933629e2be17eee7a92e7fa9544a15aa1))
* add export recipes for common output constraints ([#95](https://github.com/abijith-suresh/reshrimp/issues/95)) ([f185c81](https://github.com/abijith-suresh/reshrimp/commit/f185c8131ec1f30b2c8df2ca1f6f6ed933982d11))
* add HEIC/HEIF input and AVIF output format support ([#92](https://github.com/abijith-suresh/reshrimp/issues/92)) ([2509897](https://github.com/abijith-suresh/reshrimp/commit/2509897109cebfb11b22c8de71044b0255256586))
* add image adjustments (brightness, contrast, saturation) ([#94](https://github.com/abijith-suresh/reshrimp/issues/94)) ([8114338](https://github.com/abijith-suresh/reshrimp/commit/81143380be9e7e6d5e5be461c230d309e4b5667c))
* add rotate and flip transform operations ([#91](https://github.com/abijith-suresh/reshrimp/issues/91)) ([942a896](https://github.com/abijith-suresh/reshrimp/commit/942a89678c1d35762ecd17a5765eeb4b43717864))
* add target file size export mode ([#93](https://github.com/abijith-suresh/reshrimp/issues/93)) ([c4ae393](https://github.com/abijith-suresh/reshrimp/commit/c4ae39313d2739981c45898b2dd5a5a1f05ef668))
* self-host background-removal runtime assets ([#88](https://github.com/abijith-suresh/reshrimp/issues/88)) ([e9511b1](https://github.com/abijith-suresh/reshrimp/commit/e9511b1d0b65fccdd1210f592c9fb5eb4c0e4d41))


### Bug Fixes

* accessibility baseline for landmarks, controls, and reduced motion ([#90](https://github.com/abijith-suresh/reshrimp/issues/90)) ([f60a748](https://github.com/abijith-suresh/reshrimp/commit/f60a74852165205c097ea2da13ec79882c23e7bf))
* tighten object URL lifecycle ([#82](https://github.com/abijith-suresh/reshrimp/issues/82)) ([d608689](https://github.com/abijith-suresh/reshrimp/commit/d6086892385c6cc9c6866f8db17f5d0f350093ea))

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
