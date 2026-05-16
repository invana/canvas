# Type Alias: SeparationFn

> **SeparationFn** = (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:35](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L35)

Per-pair separation accessor — passed straight through to d3's
`.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.

## Parameters

### a

`HierarchyNode`\<\{ `id`: `string`; \}\>

### b

`HierarchyNode`\<\{ `id`: `string`; \}\>

## Returns

`number`
