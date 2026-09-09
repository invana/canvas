# Type Alias: CompositeIconKind

> **CompositeIconKind** = `"glyph"` \| `"svg-url"`

Icon-inset kinds the `icon` part exposes. The engine's `InsetLayer` union also
has a raw `'svg'` (path-d) variant; the editor supports the two common inset
forms in v1 (an `'svg'` icon round-trips as `'glyph'`).
