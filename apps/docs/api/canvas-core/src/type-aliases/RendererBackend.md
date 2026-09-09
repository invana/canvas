# Type Alias: RendererBackend

> **RendererBackend** = `"webgpu"` \| `"webgl"` \| `"canvas"` \| `string` & `object`

The backend a renderer resolved to at mount. Open-ended (`string & {}`) so a
concrete adapter can report a backend the kernel doesn't enumerate, while the
common trio stays autocompletable.
