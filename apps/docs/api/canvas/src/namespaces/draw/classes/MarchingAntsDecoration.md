# Class: MarchingAntsDecoration

Defined in: [packages/canvas/src/renderers/draw/decorations/marching-ants.ts:30](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/decorations/marching-ants.ts#L30)

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

> **new MarchingAntsDecoration**(`_slot`, `g`, `opts`): `MarchingAntsDecoration`

Defined in: [packages/canvas/src/renderers/draw/decorations/marching-ants.ts:35](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/decorations/marching-ants.ts#L35)

#### Parameters

##### \_slot

`Container`

##### g

[`Graphics`](../../../interfaces/Graphics.md)

##### opts

[`MarchingAntsOpts`](../interfaces/MarchingAntsOpts.md)

#### Returns

`MarchingAntsDecoration`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/draw/decorations/marching-ants.ts:58](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/decorations/marching-ants.ts#L58)

Final cleanup. Renderer is responsible for clearing the Graphics afterwards.

#### Returns

`void`

#### Implementation of

[`AnimatedDecoration`](../interfaces/AnimatedDecoration.md).[`destroy`](../interfaces/AnimatedDecoration.md#destroy)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/renderers/draw/decorations/marching-ants.ts:47](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/decorations/marching-ants.ts#L47)

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

Defined in: [packages/canvas/src/renderers/draw/decorations/marching-ants.ts:41](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/decorations/marching-ants.ts#L41)

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
