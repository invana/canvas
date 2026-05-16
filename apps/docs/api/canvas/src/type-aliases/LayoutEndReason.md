# Type Alias: LayoutEndReason

> **LayoutEndReason** = `"completed"` \| `"stopped"`

Defined in: [canvas/src/layouts/Layout.ts:50](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layouts/Layout.ts#L50)

Why the run ended.

 - `completed` — the layout settled / finished on its own.
 - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
