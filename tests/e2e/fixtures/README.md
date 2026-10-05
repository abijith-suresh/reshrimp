# Browser fixtures

`metadata.jpg` is a synthetic 512 × 384 noise image generated with Pillow. It contains the EXIF description `reshrimp-private-test-metadata` and sample GPS coordinates. It contains no photograph or personal data. Its variation makes the 40 KB quality target achievable while an approximately one-byte target is impossible.

`transparent.png` is a synthetic 128 × 96 image with a transparent left half and an opaque colored right half. Its 6,144 transparent pixels check that PNG re-encoding preserves source alpha.

`landmarks.png` is a synthetic 160 × 120 image with red, green, blue, and yellow quadrants. Tests sample their centers after resizing and conversion. `landmarks.heic` contains the same image, encoded with Pillow and pillow-heif at quality 90 and 4:4:4 chroma. It exercises the real browser HEIC decoder, not a fake file header.

`oriented.jpg` contains those same quadrants as a 160 × 120 JPEG, with EXIF orientation 6 and a sample description. Its visible dimensions are 120 × 160 after a clockwise rotation. The output must contain that rotation in the pixels and have no EXIF.

`astronaut.jpg` is a 256 × 256 derivative of NASA's portrait of Eileen Collins, taken from [scikit-image 0.24.0](https://github.com/scikit-image/scikit-image/blob/v0.24.0/skimage/data/astronaut.png) and resized/encoded with Sharp at JPEG quality 90. [scikit-image documents the image as public domain](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut). The background test checks the face at 110,55 and the wall at 245,15, plus substantial opaque and transparent regions. It must reject both untouched and fully erased images.

Keep the JPEG metadata-bearing. The browser suite parses its EXIF before using it to test metadata removal.
