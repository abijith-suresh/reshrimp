# Reshrimp TODO List

## ✅ Completed

- [x] Implement core image processing functionality
- [x] Fix double image selection bug
- [x] Fix page refresh on process button
- [x] Create marketing landing page
- [x] Restructure site (/, /app routes)
- [x] Add shared header/footer components
- [x] Fix navigation and base path issues
- [x] Centralize configuration constants

## 🎯 High Priority (Next Sprint)

### 1. UI/UX Improvements ⭐

**Status**: Ready to start
**Why**: User mentioned design needs work

**Tasks**:

- [ ] Redesign landing page with better visual hierarchy
- [ ] Improve app page layout and spacing
- [ ] Add image preview comparison (side-by-side or slider)
- [ ] Better visual feedback during processing (progress bar)
- [ ] Improve mobile responsiveness
- [ ] Add loading states and skeleton screens
- [ ] Improve error message styling
- [ ] Add tooltips for controls

**Deliverable**: Modern, clean, professional-looking interface

---

### 2. Enhanced Image Operations

**Status**: Ready to start
**Why**: Expand core functionality

**Tasks**:

- [ ] Add crop tool with preview
- [ ] Add rotate (90°, 180°, 270°, custom)
- [ ] Add flip (horizontal, vertical)
- [ ] Add brightness/contrast controls
- [ ] Add saturation/hue controls
- [ ] Add blur/sharpen filters
- [ ] Add grayscale/sepia filters
- [ ] Add image metadata editor (EXIF)

**Deliverable**: Comprehensive image editing toolkit

---

### 3. Batch Processing UI

**Status**: Architecture supports it, needs UI
**Why**: Major value-add for users

**Tasks**:

- [ ] Add multi-file upload support
- [ ] Create batch queue UI component
- [ ] Add "Apply to All" option for settings
- [ ] Show progress for batch operations
- [ ] Add batch download as ZIP
- [ ] Add drag-to-reorder in queue

**Deliverable**: Process multiple images at once

---

## 🚀 Medium Priority

### 4. PWA & Offline Support

**Status**: Planned
**Why**: True privacy requires offline capability

**Tasks**:

- [ ] Create service worker for offline caching
- [ ] Add manifest.json for installability
- [ ] Add "Add to Home Screen" prompt
- [ ] Cache static assets
- [ ] Add offline indicator
- [ ] Test offline functionality

**Deliverable**: Fully functional PWA

---

### 5. Performance Optimization

**Status**: Planned
**Why**: Better UX, especially for large images

**Tasks**:

- [ ] Implement Web Workers for image processing
- [ ] Add progressive image loading
- [ ] Optimize canvas operations
- [ ] Add image size warnings (>10MB)
- [ ] Implement result caching
- [ ] Profile and optimize bottlenecks

**Deliverable**: Fast, non-blocking processing

---

### 6. Testing & Quality Assurance

**Status**: No tests yet
**Why**: Ensure reliability and prevent regressions

**Tasks**:

- [ ] Set up Vitest for unit testing
- [ ] Add tests for image services
- [ ] Add tests for validation logic
- [ ] Add tests for utilities
- [ ] Set up Playwright for E2E tests
- [ ] Add visual regression tests
- [ ] Add CI test coverage reporting

**Deliverable**: Robust test suite with >80% coverage

---

## 📚 Low Priority (Future)

### 7. Advanced Features

- [ ] Undo/redo functionality
- [ ] Before/after comparison tool
- [ ] Image diff tool
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Preset profiles (e.g., "Web Optimized", "Print Quality")
- [ ] Custom watermarking
- [ ] Background removal (ML-based)

### 8. Documentation & Content

- [ ] Create user guide/tutorial
- [ ] Add interactive onboarding
- [ ] Create about page with privacy philosophy
- [ ] Add privacy policy page
- [ ] Create API documentation
- [ ] Add contributing guide
- [ ] Add FAQ section

### 9. Infrastructure & DevOps

- [ ] Set up custom domain (reshrimp.com)
- [ ] Add privacy-friendly analytics (Plausible/Fathom)
- [ ] Add error monitoring (Sentry)
- [ ] Add performance monitoring
- [ ] Set up staging environment
- [ ] Add changelog/release notes

### 10. Community & Growth

- [ ] Add share functionality (not images, just the tool)
- [ ] Add feedback form
- [ ] Create Twitter/social presence
- [ ] Submit to ProductHunt
- [ ] Add testimonials section
- [ ] Create video demo/tutorial

---

## 🐛 Known Issues

_None currently_

---

## 💡 Ideas / Backlog

- Browser extension version
- Desktop app (Electron/Tauri)
- API for programmatic access
- Integration with cloud storage (with local processing)
- Bulk rename tool
- Format converter playground
- Image optimization analyzer/scorer

---

## 📝 Notes

- Keep design simple and privacy-focused
- No tracking, no analytics that compromise privacy
- All processing must remain client-side
- Maintain fast load times (<2s)
- Mobile-first approach
- Accessibility is important (WCAG 2.1 AA)

---

**Last Updated**: 2026-02-10
**Current Version**: MVP (v0.1.0)
**Next Milestone**: Enhanced UI/UX + More Image Operations (v0.2.0)
