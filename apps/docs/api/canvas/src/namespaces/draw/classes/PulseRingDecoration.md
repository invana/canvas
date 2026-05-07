# Class: PulseRingDecoration

Defined in: [packages/canvas/src/renderers/draw/decorations/pulse-ring.ts:23](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/decorations/pulse-ring.ts#L23)

`@invana/canvas/draw` — pure-function paint primitives.

The low-level drawing API for everything that consumes the renderer:
graph viz, ER diagrams, swimlanes, flowcharts, server-room visualisations,
and any other domain layer built on top of `ShapesRenderer`.

Primitives have ONE responsibility each:
  - shape primitives    : emit a shape's geometry into a Graphics
  - connector primitives: emit a polyline into a Graphics (no markers!)
  - text primitives     : mount a Text/HTMLText display object into a Container
  - routers             : pure (endpoints) → polyline
  - decorations         : emit decoration geometry given host bounds

The draw module never composes two primitives into one — composition (a
node that has a label, an edge that has an arrow, a rack that has blinking
lights) is always a Layer concern.

## Implements

- [`AnimatedDecoration`](../interfaces/AnimatedDecoration.md)

## Constructors

### Constructor

> **new PulseRingDecoration**(`_slot`, `g`, `opts`): `PulseRingDecoration`

Defined in: [packages/canvas/src/renderers/draw/decorations/pulse-ring.ts:28](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/decorations/pulse-ring.ts#L28)

#### Parameters

##### \_slot

`Container`

##### g

[`Graphics`](../../../interfaces/Graphics.md)

##### opts

[`PulseRingOpts`](../interfaces/PulseRingOpts.md)

#### Returns

`PulseRingDecoration`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/draw/decorations/pulse-ring.ts:47](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/decorations/pulse-ring.ts#L47)

Final cleanup. Renderer is responsible for clearing the Graphics afterwards.

#### Returns

`void`

#### Implementation of

[`AnimatedDecoration`](../interfaces/AnimatedDecoration.md).[`destroy`](../interfaces/AnimatedDecoration.md#destroy)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/renderers/draw/decorations/pulse-ring.ts:40](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/decorations/pulse-ring.ts#L40)

Advance animation by `deltaMs`. Return `false` to retire (renderer drops it).

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

#### Implementation of

[`AnimatedDecoration`](../interfaces/AnimatedDecoration.md).[`tick`](../interfaces/AnimatedDecoration.md#tick)

***

### update()

> **update**(`bounds`, `hostKind?`): `void`

Defined in: [packages/canvas/src/renderers/draw/decorations/pulse-ring.ts:34](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/decorations/pulse-ring.ts#L34)

Re-render with new host bounds (called on host spec change).

#### Parameters

##### bounds

[`Rect`](../interfaces/Rect.md)

##### hostKind?

`string`

#### Returns

`void`

#### Implementation of

[`AnimatedDecoration`](../interfaces/AnimatedDecoration.md).[`update`](../interfaces/AnimatedDecoration.md#update)
