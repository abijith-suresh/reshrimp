# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- robots.txt with sitemap reference (#11)
- Sitemap generation via @astrojs/sitemap integration (#11)
- Open Graph and Twitter Card meta tags in Layout (#11)
- Named `<slot name="head" />` in Layout for per-page head content (#11)
- JSON-LD WebApplication structured data on home page (#11)
- `og-image.png` (1200×630) and `apple-touch-icon.png` (180×180) static assets (#15)
- `SITE_DESCRIPTION` constant in config/constants.ts (#11)
- Background removal feature using @imgly/background-removal (#16)
  - Client-side background removal with WebAssembly/ONNX
  - Automatic PNG output to preserve transparency
  - Progress indicator during model loading
  - Checkbox control in processing panel
- Info tooltip on background removal checkbox (Lucide icon, hover + click)
- Soft Pop design system with custom CSS variables for tokens
- Smooth fade and slide animations with dedicated keyframes
- Cross-fade transitions between Original/Processed image tabs

### Fixed

- Progress indicator showing "NaN%" on repeated background removal runs
- Format selector not visually reflecting PNG override when background removal is enabled
- Stale processed results persisting in UI when uploading a new image
- File selector opening twice on second image upload
- Layout shift when toggling background removal checkbox

### Changed

- Format selector now locks to PNG and disables when background removal is checked
- Background removal info displayed via tooltip instead of inline notes
- Processed state and controls reset to defaults on new image upload
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
