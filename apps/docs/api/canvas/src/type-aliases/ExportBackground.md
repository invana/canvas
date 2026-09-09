# Type Alias: ExportBackground

> **ExportBackground** = `"transparent"` \| `"canvas"` \| `number` \| `string`

Background fill for an exported image / SVG:
- `'transparent'` — no fill (alpha PNG/WebP/SVG; JPEG falls back to white).
- `'canvas'` — match the on-screen canvas background (resolved from the
  background layer / active theme surface / `CanvasOptions.backgroundColor`).
- a hex `number` (`0xRRGGBB`) or any CSS colour `string`.
