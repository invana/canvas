# Interface: PositionTransitionOptions

Options for [animatePositions](../functions/animatePositions.md).

Positions are passed as flat `Float32Array`s of length `n * 2` — `x, y`
interleaved per node — the same shape `GraphStore.setPositionsBulk` consumes,
so a layout can hand its result buffer straight through.

## Properties

### duration

> **duration**: `number`

Transition duration in milliseconds. `<= 0` snaps to `to` immediately.

***

### easing?

> `optional` **easing?**: [`Easing`](../type-aliases/Easing.md)

Eased progress curve. Default [easeOutCubic](../variables/easeOutCubic.md).

***

### from

> **from**: `Float32Array`

Start positions (`n * 2`, x/y interleaved). Usually the nodes' current spots.

***

### onComplete?

> `optional` **onComplete?**: () => `void`

Fires once when the transition finishes naturally. NOT called on `cancel()`.

#### Returns

`void`

***

### onFrame

> **onFrame**: (`xy`) => `void`

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

Target positions (`n * 2`, x/y interleaved). The computed layout result.
