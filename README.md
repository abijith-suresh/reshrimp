# Reshrimp

Reshrimp is a private browser image utility for preparing one image at a time.

Use it when you need to resize an image, reduce its file size, convert it to another format, or remove a background without uploading the image to someone else's server.

Try it: https://reshrimp.vercel.app

## What It Does

- Resize images by pixels, percentage, inches, or centimetres.
- Convert between common browser image formats such as JPEG, PNG, WebP, and AVIF when supported by your browser.
- Reduce file size by adjusting output quality for supported formats.
- Remove backgrounds locally in the browser and export PNG with transparency.
- Process one image at a time so the app stays simple and predictable.

## Why It Exists

Many upload portals ask for images with strict dimensions, file formats, or file-size limits. Existing online tools can be cluttered, confusing, ad-heavy, or unclear about whether your image is uploaded.

Reshrimp is built to be a straightforward alternative: open the app, choose one image, make the needed changes, download the result, and leave.

## Privacy

Your image is processed in your browser. Reshrimp does not upload your image for processing, does not require an account, and does not run ads or analytics.

The app still loads website files like any web app. Background removal also loads model/runtime assets before it can run, but the image itself stays on your device.

## Offline Use

After the first online visit, the app shell and core tools can work offline. Background removal can also work offline after its model assets have been downloaded once.

## Current Limits

- One image at a time.
- Maximum upload size is 50 MB.
- Very large images may be slow or fail depending on your device memory and browser limits.
- Output support can vary by browser, especially for newer formats.

## Source And License

Reshrimp is open source under the MIT license.

Source code: https://github.com/abijith-suresh/reshrimp
