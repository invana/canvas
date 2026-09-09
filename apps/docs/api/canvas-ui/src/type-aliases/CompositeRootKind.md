# Type Alias: CompositeRootKind

> **CompositeRootKind** = `"none"` \| `"rect"` \| `"circle"` \| `"regular-polygon"` \| `"star"`

Root-silhouette kinds the composite editor's **Root** section exposes.
`'none'` omits `root` → the default rounded-rect body built from
`cornerRadius` + the body `fill` / `stroke`. `CompositeRootSpec` also allows
`ellipse` / `polygon` / `arc`; the editor covers the common four for v1 (a
root of another kind round-trips as `'none'` — see `mapping.ts`).
