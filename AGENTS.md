# reshrimp — agent brief
Privacy-first browser image utility for preparing one image at a time, for people who must meet a portal's dimension, format, or size limit without uploading the image.

## The Project
Reshrimp runs entirely in the browser: the selected image is processed locally, never uploaded for processing, and the product needs no account, ads, tracking, or analytics. It resizes, compresses, converts, targets a best-effort maximum file size for JPEG/WebP/AVIF, and removes backgrounds — one image at a time.
Canvas re-encoding is the privacy boundary: uploaded metadata such as EXIF and GPS must never survive into an output. User image bytes never cross the network — no uploads, beacons, or error reports containing image content.
Non-goals: batch and editor/workspace flows, server-side image processing, accounts, ads, tracking, and analytics.
Status: live.

## Sources of Truth
| Fact | Where |
|---|---|
| Product intent | § The Project (this file) |
| Runtime behavior | code + tests |
| Commands & deps | package.json |
| How to work here | `CONTRIBUTING.md` |
| Commit rules | commitlint.config.ts |

Code and tests are the authority; this file never overrides executable truth.
