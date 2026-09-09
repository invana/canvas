# Type Alias: SeparationFn

> **SeparationFn** = (`a`, `b`) => `number`

Per-pair separation accessor — passed straight through to d3's
`.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.

## Parameters

### a

`HierarchyNode`\<\{ `id`: `string`; \}\>

### b

`HierarchyNode`\<\{ `id`: `string`; \}\>

## Returns

`number`
