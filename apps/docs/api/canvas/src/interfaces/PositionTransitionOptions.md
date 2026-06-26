# Interface: PositionTransitionOptions

Defined in: [canvas/src/layouts/animatePositions.ts:11](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L11)

Options for [animatePositions](../functions/animatePositions.md).

Positions are passed as flat `Float32Array`s of length `n * 2` — `x, y`
interleaved per node — the same shape `GraphStore.setPositionsBulk` consumes,
so a layout can hand its result buffer straight through.

## Properties

### duration

> **duration**: `number`

Defined in: [canvas/src/layouts/animatePositions.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L17)

Transition duration in milliseconds. `<= 0` snaps to `to` immediately.

***

### easing?

> `optional` **easing?**: [`Easing`](../type-aliases/Easing.md)

Defined in: [canvas/src/layouts/animatePositions.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L19)

Eased progress curve. Default [easeOutCubic](../variables/easeOutCubic.md).

***

### from

> **from**: `Float32Array`

Defined in: [canvas/src/layouts/animatePositions.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L13)

Start positions (`n * 2`, x/y interleaved). Usually the nodes' current spots.

***

### onComplete?

> `optional` **onComplete?**: () => `void`

Defined in: [canvas/src/layouts/animatePositions.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L27)

Fires once when the transition finishes naturally. NOT called on `cancel()`.

#### Returns

`void`

***

### onFrame

> **onFrame**: (`xy`) => `void`

Defined in: [canvas/src/layouts/animatePositions.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L25)

Called once per frame with the interpolated buffer — write it straight to
the store (e.g. `store.setPositionsBulk(ids, xy)`). The SAME buffer is
reused every frame; copy it if you need to retain it.

#### Parameters

##### xy

`Float32Array`

#### Returns

`void`

***

### to

> **to**: `Float32Array`

Defined in: [canvas/src/layouts/animatePositions.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L15)

Target positions (`n * 2`, x/y interleaved). The computed layout result.
