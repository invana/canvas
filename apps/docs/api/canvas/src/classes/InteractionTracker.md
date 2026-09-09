# Class: InteractionTracker

Attributes each rendered frame to the user gesture in flight, so the frame
meter can tag its samples with an [InteractionKind](../../../canvas-store/src/type-aliases/InteractionKind.md). This is the piece
that turns a flat FPS trace into "which action caused the dip".

It listens to the bus's interaction lifecycle and derives a single current
label. Two shapes of gesture are handled differently:

- **Bracketed** (`drag`, `layout`) — have explicit start/end events, so they
  are sticky: active from start until end.
- **Momentary** (`zoom`, `pan`) — fire a burst of events during the gesture
  but have no "end", so they decay to `'idle'` after IDLE\_MS of
  silence, capturing the inertia tail without sticking forever.
- **Hover** sits between: `input:node:hover` carries an id (enter) or `null`
  (leave), so it is tracked as an explicit boolean.

Priority when several are live: `layout` > `drag` > `hover` > momentary
(`zoom`/`pan`) > `idle`. Bracketed, higher-intent gestures win over the
momentary camera tail.

## Constructors

### Constructor

> **new InteractionTracker**(`bus`, `now?`): `InteractionTracker`

#### Parameters

##### bus

[`CanvasEventBus`](CanvasEventBus.md)

##### now?

() => `number`

#### Returns

`InteractionTracker`

## Methods

### current()

> **current**(`now?`): [`InteractionKind`](../../../canvas-store/src/type-aliases/InteractionKind.md)

The interaction the frame at `now` (a `performance.now()`-scale timestamp)
should be attributed to. Pass the frame's own start time so the idle-decay
is measured against the frame, not wall-clock drift.

#### Parameters

##### now?

`number` = `...`

#### Returns

[`InteractionKind`](../../../canvas-store/src/type-aliases/InteractionKind.md)

***

### dispose()

> **dispose**(): `void`

Detach every bus subscription.

#### Returns

`void`
