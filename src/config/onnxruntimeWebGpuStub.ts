// Intentionally empty stand-in for `onnxruntime-web/webgpu`.
//
// Background removal runs imgly with `device: "cpu"` (pinned in
// backgroundRemovalService), so imgly never imports the webgpu runtime. The
// astro config aliases the import here to keep the ~24 MB jsep wasm and the
// webgpu bundle out of the build output. See astro.config.ts.
export default {};
