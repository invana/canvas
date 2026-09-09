# Variable: UNKNOWN\_TYPE

> `const` **UNKNOWN\_TYPE**: `"unknown"` = `'unknown'`

The `type` assigned to a record inserted without one.

`GraphNode.type` and `GraphEdge.type` are **required**, so every reader sees a
`string` without a guard. This is the value to use for a record that genuinely
has no kind. `GraphStore` also defaults to it on insert and update, as a
runtime net for the paths that bypass the compiler — `importData` of an older
snapshot, JSON parsed at runtime, and `Partial` patches.

A named export rather than a bare literal so consumers can branch on it
(`node.type === UNKNOWN_TYPE`) without a magic string.

⚠️ **Reserved.** `ColorByBehaviour` treats it as `fallbackColor` rather than a
palette category, so a record deliberately typed `'unknown'` renders grey. If
you need a real category, pick a different name.
