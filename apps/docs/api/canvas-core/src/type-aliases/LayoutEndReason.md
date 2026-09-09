# Type Alias: LayoutEndReason

> **LayoutEndReason** = `"completed"` \| `"stopped"`

Why the run ended.

 - `completed` — the layout settled / finished on its own.
 - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
