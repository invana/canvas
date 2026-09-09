# Type Alias: InsetFillLayer

> **InsetFillLayer** = `Extract`\<[`ShapeFillLayer`](ShapeFillLayer.md), \{ `kind`: `"glyph"` \| `"svg"` \| `"svg-url"`; \}\>

The **inset-content** half of [ShapeFillLayer](ShapeFillLayer.md) — the layer kinds a
backend mounts *inside* the silhouette as a child rather than painting
*into* it. Named here (not only where it is mounted) because it is part of
the vocabulary: a `CompositePart` of kind `'icon'` carries one, so the spec
types must be able to reference it without reaching into a renderer.
