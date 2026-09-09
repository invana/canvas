# Type Alias: RenderPreference

> **RenderPreference** = `"webgpu"` \| `"webgl"` \| `"canvas"`

Preferred drawing backend, in descending order of capability:

- `'webgpu'` — the fastest path where the browser supports it.
- `'webgl'` — the universal fallback; opt out of WebGPU entirely by asking for it.
- `'canvas'` — the 2D-context renderer of last resort (no GPU context at all).

**This is the single declaration of the preference vocabulary.** The engine's
`CanvasOptions.preference` and each backend's own preference type alias *this*,
so the seam between them cannot silently diverge — it did once, and a
`'canvas'` request was quietly downgraded to WebGL for it. Omit the option
entirely to let the backend choose (the documented default); there is no
separate `'auto'` spelling of that.
