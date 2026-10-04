# Browser fixtures

`metadata.jpg` is a synthetic 512 × 384 noise image generated with Pillow. It contains the EXIF description `reshrimp-private-test-metadata` and sample GPS coordinates. It contains no photograph or personal data. Its variation makes the 40 KB quality target achievable while an approximately one-byte target is impossible.

`transparent.png` is a synthetic 128 × 96 image with a transparent left half and an opaque colored right half. Its 6,144 transparent pixels check that PNG re-encoding preserves source alpha.

Keep the JPEG metadata-bearing. The browser suite checks its EXIF marker before using it to test metadata removal.
