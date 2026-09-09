# Type Alias: FramePhase

> **FramePhase** = `"camera"` \| `"dataFlush"` \| `"layers"`

The CPU sub-phases measured inside one engine tick (`Canvas.tickOnce`):
- `camera` — advancing viewport plugins (`camera.tick`).
- `dataFlush` — draining every registered data source's coalesced flush.
- `layers` — per-layer `flush()` + `tickAnimations()`.

These sum to [FrameTick.cpuMs](../interfaces/FrameTick.md#cpums). GPU render + browser compositing happen
*outside* the tick and are therefore not in this breakdown — the remainder
`dt - cpuMs` approximates render + idle.
