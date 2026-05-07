# Interface: PathSpec

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:37](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L37)

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

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:79](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L79)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### commands

> `readonly` **commands**: readonly [`PathCommand`](../type-aliases/PathCommand.md)[]

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:39](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L39)

***

### fill?

> `readonly` `optional` **fill?**: [`FillInput`](../type-aliases/FillInput.md)

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:40](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L40)

***

### fillAlpha?

> `readonly` `optional` **fillAlpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:41](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L41)

***

### fillFit?

> `readonly` `optional` **fillFit?**: [`FillFit`](../type-aliases/FillFit.md)

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:42](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L42)

***

### kind

> `readonly` **kind**: `"path"`

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:38](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L38)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### stroke?

> `readonly` `optional` **stroke?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:43](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L43)

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:45](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L45)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:44](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/path.ts#L44)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:80](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L80)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### x

> `readonly` **x**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:76](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L76)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:77](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L77)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:78](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L78)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
