# Reshrimp

Reshrimp is a private browser image utility for preparing one image at a time.

Use it when you need to resize an image, reduce its file size, convert it to another format, or remove a background without uploading the image to someone else's server.

Try it: https://reshrimp.vercel.app

## What It Does

- Resize images by pixels, percentage, inches, or centimetres.
- Open JPEG, PNG, WebP, AVIF, and HEIC. Export JPEG and PNG in every browser, and WebP where the browser can encode it.
- Reduce file size by adjusting output quality for supported formats.
- Set a maximum output size for JPEG or WebP. Reshrimp adjusts quality to try to fit; this is best effort, and the target may not be reachable.
- Remove backgrounds locally in the browser and export PNG with transparency.
- One image at a time. There is no batch mode.

## Why It Exists

Many upload portals ask for images with strict dimensions, file formats, or file-size limits. Most online tools for this show ads and do not say whether your photo is uploaded. Reshrimp does the work in your browser: choose one image, change it, download it.

## Privacy

Your image is processed in your browser. Reshrimp does not upload your image for processing, does not require an account, and does not run ads or analytics.

The site is hosted on Vercel. Like any host, it sees ordinary request details such as your IP address when pages load. It never receives your image.

Background removal needs about 100 MB of model and runtime files. Your browser downloads them from the same site the first time you use it. The image itself stays on your device.

## Current Limits

- One image at a time.
- Maximum upload size is 50 MB.
- Images over 16,384 px on a side or 32 megapixels in total are rejected. Some 48 MP and 50 MP phone photos exceed this.
- Very large images may be slow or fail depending on your device memory and browser limits.
- Output support varies by browser. WebP export depends on whether the browser can encode it.
- The DPI setting only converts inches or centimetres to pixels. It is not written into the file.
- There is no crop.
- File-size targeting adjusts quality for JPEG and WebP and never changes the pixel dimensions. PNG and transparent background-removal exports stay lossless and do not support a size target.
- If an image cannot be reduced enough at the minimum attempted quality, Reshrimp returns its smallest attempt and reports that the target was not met.

## Run It Locally

```bash
mise install
bun install --frozen-lockfile
bun run dev
```

`mise install` installs the Bun and Node versions pinned in `mise.toml`. The first `bun run dev` or `bun run build` downloads the background-removal files, so it needs network access. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Contributing

Bug reports and issues are welcome. For a code change, open an issue first so we can agree on the approach before you write it.

To report a security problem or a privacy leak, see [SECURITY.md](SECURITY.md).

## Source And License

Source code: https://github.com/abijith-suresh/reshrimp

Reshrimp's own code is MIT-licensed. Background removal uses `@imgly/background-removal`, which is AGPL-3.0. HEIC decoding uses libheif (LGPL-3.0) through heic2any. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
