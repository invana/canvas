# Type Alias: SeparationFn

> **SeparationFn** = (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L36)

Per-pair separation accessor — passed straight through to d3's
`.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.

## Parameters

### a

`HierarchyNode`\<\{ `id`: `string`; \}\>

### b

`HierarchyNode`\<\{ `id`: `string`; \}\>

## Returns

`number`
