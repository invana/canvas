# Interface: AnimatedDecoration

Defined in: [packages/canvas/src/renderers/draw/types.ts:203](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L203)

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

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:209](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L209)

Final cleanup. Renderer is responsible for clearing the Graphics afterwards.

#### Returns

`void`

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:207](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L207)

Advance animation by `deltaMs`. Return `false` to retire (renderer drops it).

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()

> **update**(`bounds`, `hostKind?`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:205](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L205)

Re-render with new host bounds (called on host spec change).

#### Parameters

##### bounds

[`Rect`](Rect.md)

##### hostKind?

`string`

#### Returns

`void`
