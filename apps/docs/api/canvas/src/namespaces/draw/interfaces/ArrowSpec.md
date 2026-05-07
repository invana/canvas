# Interface: ArrowSpec

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:16](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L16)

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

Defined in: [packages/canvas/src/renderers/draw/types.ts:79](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L79)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### fill?

> `readonly` `optional` **fill?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:20](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L20)

***

### fillAlpha?

> `readonly` `optional` **fillAlpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:21](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L21)

***

### kind

> `readonly` **kind**: `"arrow"`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:17](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L17)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### size

> `readonly` **size**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:19](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L19)

Total length, tip → tail.

***

### stroke?

> `readonly` `optional` **stroke?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:22](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L22)

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:24](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L24)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/renderers/draw/shapes/arrow.ts:23](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/arrow.ts#L23)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:80](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L80)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### x

> `readonly` **x**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:76](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L76)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:77](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L77)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:78](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L78)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
