# Type Alias: LayoutEndReason

> **LayoutEndReason** = `"completed"` \| `"stopped"`

Defined in: [canvas/src/layouts/Layout.ts:50](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layouts/Layout.ts#L50)

Why the run ended.

 - `completed` — the layout settled / finished on its own.
 - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
