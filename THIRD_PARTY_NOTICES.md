# Third-party notices

Reshrimp's own code is MIT-licensed (see `LICENSE`). The site also ships code, model files, and fonts from other projects, each under its own licence. This file lists them, with versions taken from `package.json` and the installed packages. It is a list of notices, not legal advice.

## Background removal

| Component                                                                     | Version | Licence                                    | Used for                                                                                                  |
| ----------------------------------------------------------------------------- | ------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [`@imgly/background-removal`](https://github.com/imgly/background-removal-js) | 1.7.0   | AGPL-3.0 (`LICENSE.md` in the npm package) | Background-removal library. Bundled into the site's JavaScript.                                           |
| `@imgly/background-removal-data` model and runtime files, packaged by IMG.LY  | 1.7.0   | AGPL-3.0                                   | The `isnet_fp16` model and ONNX runtime files. Copied at build time to `/background-removal/1.7.0/dist/`. |
| [`onnxruntime-web`](https://github.com/microsoft/onnxruntime)                 | 1.21.0  | MIT                                        | Runs the model in the browser. JavaScript is bundled, and its wasm files are among the mirrored files.    |

IMG.LY's third-party list (`ThirdPartyLicenses.json` in the npm package) names the model architecture as ISNet, from https://github.com/xuebinqin/DIS, and labels it "MIT". The DIS repository itself states Apache-2.0. We did not independently confirm the terms of the trained model weights, so we repeat IMG.LY's attribution and no more.

The `@imgly/background-removal` package also bundles `lodash-es`, `ndarray`, and `zod`, all MIT.

## HEIC decoding

| Component                                           | Version               | Licence            | Used for                                                       |
| --------------------------------------------------- | --------------------- | ------------------ | -------------------------------------------------------------- |
| [`heic2any`](https://github.com/alexcorvi/heic2any) | 0.0.4                 | MIT                | Converts HEIC and HEIF input to an image the browser can read. |
| [libheif](https://github.com/strukturag/libheif)    | bundled in `heic2any` | LGPL-3.0 (library) | HEIC decoder compiled into `heic2any`.                         |

## Runtime libraries

| Component                                                 | Version | Licence | Used for                      |
| --------------------------------------------------------- | ------- | ------- | ----------------------------- |
| [`solid-js`](https://github.com/solidjs/solid)            | 1.9.18  | MIT     | The editor UI.                |
| [`astro`](https://github.com/withastro/astro)             | 7.4.4   | MIT     | Site framework.               |
| [`@astrojs/solid-js`](https://github.com/withastro/astro) | 7.1.2   | MIT     | Solid integration for Astro.  |
| [`@astrojs/sitemap`](https://github.com/withastro/astro)  | 3.7.4   | MIT     | Generates the sitemap.        |
| [`lucide-solid`](https://github.com/lucide-icons/lucide)  | 1.66.0  | ISC     | Icons in the editor.          |
| [`lucide-astro`](https://github.com/lucide-icons/lucide)  | 0.556.0 | MIT     | Icons on the marketing pages. |

## Fonts

The font files are in `src/assets/fonts/`, each family with its licence text beside it.

| Font                                                                                 | Licence                   | Copyright                                              | Licence text                                  |
| ------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) (Regular, SemiBold) | SIL Open Font License 1.1 | Copyright 2020 The Plus Jakarta Sans Project Authors   | `src/assets/fonts/OFL-PlusJakartaSans.txt`    |
| [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) (Bold)              | SIL Open Font License 1.1 | Copyright 2022 The Bricolage Grotesque Project Authors | `src/assets/fonts/OFL-BricolageGrotesque.txt` |

## Build-only

These run when the site is built, to render the social preview images. They are not sent to browsers.

| Component                                               | Version | Licence |
| ------------------------------------------------------- | ------- | ------- |
| [`satori`](https://github.com/vercel/satori)            | 0.63.2  | MPL-2.0 |
| [`@resvg/resvg-js`](https://github.com/yisibl/resvg-js) | 2.6.2   | MPL-2.0 |

Development tools such as Biome, Vitest, and Playwright are not listed because they are not part of the shipped site.
