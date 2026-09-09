# Type Alias: NodeStyleFields

> **NodeStyleFields** = `NodeStylePassthroughFields` & `NodeStyleEncodedFields`

Flat form-field shape the `@invana/forms` generator renders. The passthrough
half is **derived from NodeStyle**; the rest is re-encoded for scalar
inputs (see NodeStyleEncodedFields). `styleToForm` / `formToStyle`
(`mapping.ts`) round-trip between this and `Partial<NodeStyle>`.
