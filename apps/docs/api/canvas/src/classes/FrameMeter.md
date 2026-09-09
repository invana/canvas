# Class: FrameMeter

Fixed-capacity ring buffer of [FrameTick](../../../canvas-store/src/interfaces/FrameTick.md) samples plus the per-frame FPS
math — the engine's frame-performance recorder. `Canvas.tickOnce` hands it raw
per-phase timings via [sample](#sample); the meter derives `fps` / `cpuMs` /
`longFrame`, stores the result, and returns it so the caller can emit it on the
`render:loop:tick` bus event.

Two read models sit on top of the same data:
- **push** — the `render:loop:tick` event (the OTel adapter taps this).
- **pull** — [stats](#stats) / [recent](#recent) / [last](#last) for a HUD or status
  bar (e.g. `DevInfoLayer`) that wants "the last second" on demand.

The buffer is a pre-sized array written round-robin, so steady-state recording
allocates only the small [FrameTick](../../../canvas-store/src/interfaces/FrameTick.md) it returns (no growth, no GC churn).

## Constructors

### Constructor

> **new FrameMeter**(`opts?`): `FrameMeter`

#### Parameters

##### opts?

###### capacity?

`number`

Ring size in frames. Default `240` (~4s at 60fps).

###### longFrameMs?

`number`

`dt` threshold for [FrameTick.longFrame](../../../canvas-store/src/interfaces/FrameTick.md#longframe).
  Default `25` (below ~40fps).

#### Returns

`FrameMeter`

## Accessors

### last

#### Get Signature

> **get** **last**(): [`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)

The most recently recorded frame, or `undefined` before the first sample.

##### Returns

[`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)

***

### size

#### Get Signature

> **get** **size**(): `number`

Number of samples currently held (≤ capacity).

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Drop every recorded sample.

#### Returns

`void`

***

### recent()

> **recent**(`n?`): [`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)[]

The last `n` samples in chronological (oldest → newest) order. Defaults to
every held sample. Returns a fresh array; the [FrameTick](../../../canvas-store/src/interfaces/FrameTick.md)s themselves
are shared (treat as read-only).

#### Parameters

##### n?

`number`

#### Returns

[`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)[]

***

### sample()

> **sample**(`input`): [`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)

Derive a [FrameTick](../../../canvas-store/src/interfaces/FrameTick.md) from one frame's raw measurements, store it, and
return it (for emission). `dt` is the inter-frame period; `phases` are the
measured CPU sub-costs — their sum becomes [FrameTick.cpuMs](../../../canvas-store/src/interfaces/FrameTick.md#cpums).

#### Parameters

##### input

###### dt

`number`

###### interaction

[`InteractionKind`](../../../canvas-store/src/type-aliases/InteractionKind.md)

###### phases

[`FramePhaseTimings`](../../../canvas-store/src/type-aliases/FramePhaseTimings.md)

###### ts

`number`

#### Returns

[`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)

***

### stats()

> **stats**(`windowMs?`): [`FrameStats`](../../../canvas-store/src/interfaces/FrameStats.md)

Summarise the most recent `windowMs` of frames (default 1000ms) into
percentile frame-times + median FPS + a dropped-frame count. Cheap enough to
call every HUD repaint. Returns a zeroed summary when no samples fall in the
window.

#### Parameters

##### windowMs?

`number` = `1000`

#### Returns

[`FrameStats`](../../../canvas-store/src/interfaces/FrameStats.md)
