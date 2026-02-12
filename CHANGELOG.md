# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Soft Pop design system with custom CSS variables for tokens
- Smooth fade and slide animations with dedicated keyframes
- Cross-fade transitions between Original/Processed image tabs

### Changed

- Consolidated app UI components into single page file for better animation control
- Removed preview 'popup' animation (unwanted translateY effect)
- Tab switching now uses visibility/opacity for smooth transitions instead of display toggle
- Page transitions updated to use consistent fade animations

### Removed

- TODO.md (moving to integrated task management)
- Separated component files (DownloadButton, ImagePreview, ImageUploadArea, ProcessingControls)

## [0.1.0] - 2025-02-08

### Added

- Initial project setup with Astro framework
- Image processing functionality (resize, convert, compress)
- Privacy-first browser-based image processing (no server uploads)
- Support for JPEG, PNG, WebP, and GIF formats
- Drag-and-drop image upload interface
- Marketing landing page with feature highlights
- AGENTS.md documentation for AI contributors

## [0.1.0] - 2025-02-08

### Added

- MVP release with core image processing capabilities
- Responsive UI with Tailwind CSS
- Client-side image compression and format conversion
- Batch processing support (architecture prepared)

[unreleased]: https://github.com/abijith-suresh/reshrimp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/abijith-suresh/reshrimp/releases/tag/v0.1.0
