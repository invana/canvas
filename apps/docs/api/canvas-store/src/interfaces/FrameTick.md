# Interface: FrameTick

One measured engine frame — the payload of the `render:loop:tick` bus event.
Emitted once per `Canvas.tickOnce`.

## Properties

### cpuMs

> **cpuMs**: `number`

Total CPU cost measured inside the tick (sum of [phases](#phases)).

***

### dt

> **dt**: `number`

Inter-frame period in ms (the renderer ticker's delta) — the FPS
denominator and the primary "speed trace" value.

***

### fps

> **fps**: `number`

`1000 / dt`, clamped to a sane ceiling — instantaneous frames-per-second.

***

### interaction

> **interaction**: [`InteractionKind`](../type-aliases/InteractionKind.md)

The interaction this frame is attributed to (`'idle'` when no gesture is active).

***

### longFrame

> **longFrame**: `boolean`

True when `dt` exceeded the long-frame (jank) threshold.

***

### phases

> **phases**: [`FramePhaseTimings`](../type-aliases/FramePhaseTimings.md)

Per-phase CPU breakdown; the values sum to [cpuMs](#cpums).

***

### ts

> **ts**: `number`

`performance.now()` at the start of this frame's tick.
