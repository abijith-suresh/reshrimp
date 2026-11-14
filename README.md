# Reshrimp

Reshrimp resizes, compresses, converts, and removes backgrounds from images in your browser. Your images are never uploaded.

Try it: https://reshrimp.vercel.app

## What it does

- Resize by pixels, percentage, inches, or centimetres.
- Convert between JPEG, PNG, and WebP. It also opens AVIF and HEIC.
- Compress a JPEG or WebP to a maximum file size. The limit is best effort.
- Remove a background and export a transparent PNG.

It works on one image at a time.

## Privacy

Your image is processed in your browser and never uploaded. There is no account, no ads, and no tracking. Background removal downloads about 100 MB of model files from the same site the first time you use it, and the image still stays on your device.

## Run it locally

```bash
mise install
bun install --frozen-lockfile
bun run dev
```

`mise install` installs the Bun and Node versions in `mise.toml`. The first run downloads the background-removal files, so it needs network access.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to make a change. To report a security problem or a privacy leak, see [SECURITY.md](SECURITY.md).

## Licence

Reshrimp's own code is MIT-licensed (see [LICENSE](LICENSE)). It ships other projects under their own licences:

- Background removal uses [`@imgly/background-removal`](https://github.com/imgly/background-removal-js), which is AGPL-3.0.
- HEIC decoding uses [heic2any](https://github.com/alexcorvi/heic2any), which bundles [libheif](https://github.com/strukturag/libheif) (LGPL-3.0).
- The fonts, [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) and [Bricolage Grotesque](https://github.com/ateliertriay/bricolage), are under the SIL Open Font License. Their texts are in `src/assets/fonts/`.
