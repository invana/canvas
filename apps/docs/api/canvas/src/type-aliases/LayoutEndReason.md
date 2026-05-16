# Type Alias: LayoutEndReason

> **LayoutEndReason** = `"completed"` \| `"stopped"`

Defined in: [canvas/src/layouts/Layout.ts:50](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layouts/Layout.ts#L50)

Why the run ended.

 - `completed` — the layout settled / finished on its own.
 - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
