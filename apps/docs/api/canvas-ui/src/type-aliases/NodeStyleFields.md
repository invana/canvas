# Type Alias: NodeStyleFields

> **NodeStyleFields** = `NodeStylePassthroughFields` & `NodeStyleEncodedFields`

Defined in: [canvas-ui/src/editors/node-style/types.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/node-style/types.ts#L77)

Flat form-field shape the `@invana/forms` generator renders. The passthrough
half is **derived from NodeStyle**; the rest is re-encoded for scalar
inputs (see NodeStyleEncodedFields). `styleToForm` / `formToStyle`
(`mapping.ts`) round-trip between this and `Partial<NodeStyle>`.
