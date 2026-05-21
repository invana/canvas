# Type Alias: SeparationFn

> **SeparationFn** = (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:35](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-hierarchy/src/types.ts#L35)

Per-pair separation accessor — passed straight through to d3's
`.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.

## Parameters

### a

`HierarchyNode`\<\{ `id`: `string`; \}\>

### b

`HierarchyNode`\<\{ `id`: `string`; \}\>

## Returns

`number`
