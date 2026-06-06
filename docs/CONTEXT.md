# Product Context

Last updated: 2026-06-06

This document is the product truth for Reshrimp. Update it before changing product scope, promises, or non-goals.

## Product Identity

Reshrimp is a general-purpose, privacy-first browser utility for preparing one image at a time.

It exists because common image-preparation tasks are still frustrating online: application portals, document uploads, profile photos, and similar workflows often require specific dimensions, formats, or smaller files. Many available tools are ad-heavy, confusing, paid, or unclear about whether user images are uploaded.

Reshrimp should be simple enough for anyone with internet access to use, while still being technically credible as a portfolio-quality open source project.

## Core Promise

- Process images locally in the browser.
- Do not upload user images to a server for processing.
- Do not require accounts, signups, or login.
- Do not add ads, tracking, analytics, or dark-pattern monetization.
- Keep the active workflow focused on one image at a time.
- Keep the product honest about what is implemented today.

## Current Product Surface

The active product supports:

- image resizing and dimension changes
- compression through output quality controls
- format conversion
- background removal
- single-image upload, preview, process, and download

These are the only current public product promises.

## Desired Near-Term Capability

Best-effort target file-size export is a desired product direction, but it should not be promised in public copy until it is implemented and reliable.

The intended behavior is:

- the user provides dimensions, output format, and a maximum file size
- Reshrimp attempts to produce an output just under that maximum
- success is best effort, not an exact guarantee
- the UI should reduce manual quality-slider fiddling

## Target Users

Reshrimp is not aimed at a narrow demographic. It should work for anyone who needs a quick, private image utility in the browser.

The strongest use cases are:

- preparing photos or signatures for upload portals
- resizing images for forms, websites, or sharing
- reducing image file size without using an opaque upload service
- converting formats without installing a desktop app
- removing simple photo backgrounds without paying for a server-side tool

## Goals

- Stay useful as a fire-and-forget utility: open, upload, adjust, download, leave.
- Preserve user trust through clear copy and predictable behavior.
- Keep marketing and support pages polished enough to explain why the product exists.
- Keep implementation quality high enough that another developer can inspect the project and see deliberate engineering choices.
- Follow the conventions of the underlying tools instead of inventing unusual project structure.
- Keep the codebase extensible only where there is an actual product need.

## Non-Goals

The current product should not include:

- backend image processing
- image uploads to a server for processing
- accounts, signups, login, sync, or collaboration
- ads, tracking, analytics, or fingerprinting
- multi-image batch flows
- ZIP export flows
- broad editor/workspace metaphors
- crop, rotate, flip, annotation, sticker, text, or drawing tools
- broad adjustment panels beyond the current compression and background-removal scope
- plugin systems, registries, or workflow engines
- speculative code kept only for possible future expansion
- public promises for features that are not implemented

Batch processing may be reconsidered in the future, but it is out of scope until the product context is updated first.

## Constraints

- The app is browser-first and static-site friendly.
- Heavy processing paths should stay lazy or isolated where practical.
- Background removal may rely on third-party model/runtime assets, but user image data must remain local.
- Offline/PWA behavior is current behavior and may be documented as such. Do not remove or expand it without an explicit product decision.
- Performance and bundle cost are product concerns, not only technical concerns.
- Mobile UX matters. Features that are simple in services but awkward in mobile UI should not be added by default.

## Success Criteria

Reshrimp is successful when:

- a user can prepare one image quickly without understanding image-processing terminology
- privacy claims are clear, accurate, and verifiable from the code
- the app feels complete rather than experimental or half-built
- public copy sounds human, honest, and practical
- the app route remains satisfying to use on desktop and mobile
- the codebase is easy for another developer to navigate and trust
- future improvements ship incrementally without expanding scope by accident

## Product Change Rule

If a proposed change alters goals, non-goals, privacy promises, supported operations, or the one-image workflow, update this document first. Code and public copy should follow this document, not the other way around.
