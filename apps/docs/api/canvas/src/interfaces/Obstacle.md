# Interface: Obstacle

Defined in: [canvas/src/primitives/types.ts:95](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L95)

Obstacle handed to obstacle-aware routers. `Obstacle extends Rect` so any
`Rect[]` is assignable; the optional `containsInflated` callback unlocks
silhouette-tight routing for non-rect shapes (circles, polygons, paths).

## Extends

- [`Rect`](Rect.md)

## Properties

### containsInflated?

> `readonly` `optional` **containsInflated?**: (`worldX`, `worldY`, `inflate`) => `boolean`

Defined in: [canvas/src/primitives/types.ts:107](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L107)

Optional silhouette obstacle-test in world coordinates. Returns `true`
when `(worldX, worldY)` lies inside the obstacle's silhouette OR within
`inflate` world units of it.

Routers use this for pixel-accurate marking — when present, the grid
blocks only cells that pass this test (in addition to the cheap AABB
pre-filter). When absent, the inflated AABB is the source of truth.

Shapes opt in by overriding `IShape.obstacleTest`.

#### Parameters

##### worldX

`number`

##### worldY

`number`

##### inflate

`number`

#### Returns

`boolean`

***

### height

> `readonly` **height**: `number`

Defined in: [canvas/src/primitives/types.ts:34](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L34)

#### Inherited from

[`Rect`](Rect.md).[`height`](Rect.md#height)

***

### width

> `readonly` **width**: `number`

Defined in: [canvas/src/primitives/types.ts:33](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L33)

#### Inherited from

[`Rect`](Rect.md).[`width`](Rect.md#width)

***

### x

> `readonly` **x**: `number`

Defined in: [canvas/src/primitives/types.ts:31](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L31)

#### Inherited from

[`Rect`](Rect.md).[`x`](Rect.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [canvas/src/primitives/types.ts:32](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L32)

#### Inherited from

[`Rect`](Rect.md).[`y`](Rect.md#y)
