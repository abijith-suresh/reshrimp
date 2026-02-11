---
title: 'Image Compression Explained: Quality vs File Size'
description: 'Understand how image compression works, what the quality slider actually does, and how to find the sweet spot for your images.'
publishDate: 2025-01-01
author: 'Reshrimp Team'
tags: ['guide', 'compression', 'optimization']
---

## What is image compression?

Image compression reduces file size by removing data from an image. There are two fundamental approaches: lossy and lossless. Understanding the difference helps you make better decisions about quality settings.

## Lossy compression (JPEG, WebP lossy)

Lossy compression works by discarding visual information that humans are less likely to notice. The algorithm analyzes the image and removes fine details, subtle color variations, and high-frequency patterns.

**How it works at a high level:**

1. The image is divided into small blocks (typically 8x8 pixels for JPEG)
2. Each block is transformed into frequency components (DCT transform)
3. High-frequency components (fine details) are reduced or eliminated
4. The remaining data is efficiently encoded

The **quality setting** (0-100%) controls how aggressively the algorithm discards information:

- **90-100%** — Virtually indistinguishable from the original. File size reduction of 30-60%
- **75-89%** — Minor artifacts visible on close inspection. File size reduction of 60-80%
- **50-74%** — Noticeable quality loss, but acceptable for web thumbnails. 80-90% size reduction
- **Below 50%** — Significant quality loss. Useful only when file size is critical

## Lossless compression (PNG, WebP lossless)

Lossless compression reduces file size without discarding any information. The decompressed image is pixel-identical to the original. It works by finding and efficiently encoding patterns in the data.

**Common techniques:**

- **Run-length encoding** — Compressing sequences of identical pixels
- **Dictionary coding** — Finding repeated patterns across the image
- **Prediction** — Predicting pixel values from neighbors and encoding only the difference

Lossless compression typically achieves 30-70% file size reduction, depending on image content. Simple graphics with flat colors compress better than complex photographs.

## Finding the sweet spot

For most web use cases, the quality sweet spot is between **80-92%**:

- Below 80%, artifacts become noticeable in photographs
- Above 92%, the file size increase isn't justified by the marginal quality improvement
- The default Reshrimp setting of 92% works well for most images

### Tips for different content types

**Photographs:** 82-90% quality is usually sufficient. The complex detail in photos hides compression artifacts well.

**Screenshots with text:** Use PNG (lossless) when possible. JPEG compression creates visible artifacts around sharp text edges, even at high quality.

**Graphics and illustrations:** PNG for flat colors and sharp edges. WebP lossy at 90%+ if you need smaller files.

**Thumbnails (< 200px):** You can go lower on quality (70-80%) since the small display size hides artifacts.

## Practical example

Consider a 4000x3000 photograph from a phone camera:

| Format        | Quality  | File Size | Visual Difference       |
| ------------- | -------- | --------- | ----------------------- |
| Original JPEG | —        | 4.2 MB    | Baseline                |
| JPEG          | 92%      | 1.8 MB    | Imperceptible           |
| JPEG          | 85%      | 980 KB    | Barely noticeable       |
| JPEG          | 75%      | 620 KB    | Minor artifacts on zoom |
| WebP          | 85%      | 720 KB    | Barely noticeable       |
| WebP          | 75%      | 450 KB    | Minor artifacts on zoom |
| PNG           | Lossless | 12.1 MB   | Identical (but huge)    |

## Using Reshrimp for compression

1. Upload your image
2. Optionally set target dimensions (smaller images = smaller files)
3. Choose your output format (WebP for best compression)
4. Adjust the quality slider while watching the file size comparison
5. Download when you're happy with the balance

The real-time size comparison in Reshrimp shows you exactly how much space you're saving, so you can make an informed decision without guessing.
