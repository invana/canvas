# Type Alias: LayoutEndReason

> **LayoutEndReason** = `"completed"` \| `"stopped"`

Defined in: [canvas/src/layouts/Layout.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L50)

Why the run ended.

 - `completed` — the layout settled / finished on its own.
 - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
