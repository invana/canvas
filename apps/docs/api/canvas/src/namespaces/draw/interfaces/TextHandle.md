# Interface: TextHandle\<TSpec\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:154](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L154)

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

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:158](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L158)

#### Returns

`void`

***

### setLabelResolution()?

> `optional` **setLabelResolution**(`resolution`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:156](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L156)

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setLODLevel()?

> `optional` **setLODLevel**(`level`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:157](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L157)

#### Parameters

##### level

`number`

#### Returns

`void`

***

### update()

> **update**(`spec`, `ox?`, `oy?`, `rot?`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:155](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L155)

#### Parameters

##### spec

`TSpec`

##### ox?

`number`

##### oy?

`number`

##### rot?

`number`

#### Returns

`void`
