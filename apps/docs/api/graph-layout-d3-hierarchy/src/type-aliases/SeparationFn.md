# Type Alias: SeparationFn

> **SeparationFn** = (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:35](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layout-d3-hierarchy/src/types.ts#L35)

Per-pair separation accessor — passed straight through to d3's
`.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.

## Parameters

### a

`HierarchyNode`\<\{ `id`: `string`; \}\>

### b

`HierarchyNode`\<\{ `id`: `string`; \}\>

## Returns

`number`
