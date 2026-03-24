# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-24

### Added

- Browser-based image processing for JPEG, PNG, WebP, and GIF uploads, with export to JPEG, PNG, or WebP
- Resize controls with optional aspect ratio lock, format conversion, and adjustable compression quality
- Offline-ready app shell and core tools after the first online visit
- Optional background removal that runs locally in the browser, exports PNG to preserve transparency, and works offline after its model assets are downloaded once
- Original and processed preview tabs with dimensions, file size, size-change feedback, and one-click download
- Dedicated marketing and support pages for features, privacy, FAQ, about, and changelog, plus sitemap and social preview metadata

### Changed

- The app now uses a dedicated `/app` workflow separate from the marketing site
- Enabling background removal fixes output to PNG and disables manual format selection
- Uploading a new image resets prior results and processing controls before the next run

## [0.1.0] - 2025-02-08

### Added

- Initial project setup with Astro framework
- Image processing functionality (resize, convert, compress)
- Privacy-first browser-based image processing (no server uploads)
- Support for JPEG, PNG, WebP, and GIF formats
- Drag-and-drop image upload interface
- Marketing landing page with feature highlights
- AGENTS.md documentation for AI contributors

[unreleased]: https://github.com/abijith-suresh/reshrimp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/abijith-suresh/reshrimp/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/abijith-suresh/reshrimp/releases/tag/v0.1.0
