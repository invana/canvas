# Type Alias: SeparationFn

> **SeparationFn** = (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:35](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-hierarchy/src/types.ts#L35)

Per-pair separation accessor — passed straight through to d3's
`.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.

## Parameters

### a

`HierarchyNode`\<\{ `id`: `string`; \}\>

### b

`HierarchyNode`\<\{ `id`: `string`; \}\>

## Returns

`number`
