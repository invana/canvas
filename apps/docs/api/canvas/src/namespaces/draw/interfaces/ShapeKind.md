# Interface: ShapeKind\<TSpec\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:117](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L117)

Shape primitive descriptor.

`draw` emits the shape's geometry into the supplied Graphics, baking the
affine transform `(ox, oy, rot)` into emitted vertex coordinates. No
Container ownership, no Graphics ownership, no `this`.

Symmetric shapes (circle) ignore `rot`. Asymmetric shapes (arrow, polygon)
use it. Default origin is (0, 0) — the renderer positions the parent
Container at `(spec.x, spec.y)`, so embedded callers (compounds in a
higher-level layer) pass a non-zero origin to draw at an offset.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Methods

### bounds()

> **bounds**(`spec`): [`Rect`](Rect.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:119](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L119)

#### Parameters

##### spec

`TSpec`

#### Returns

[`Rect`](Rect.md)

***

### contains()?

> `optional` **contains**(`spec`, `lx`, `ly`): `boolean`

Defined in: [packages/canvas/src/renderers/draw/types.ts:120](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L120)

#### Parameters

##### spec

`TSpec`

##### lx

`number`

##### ly

`number`

#### Returns

`boolean`

***

### draw()

> **draw**(`g`, `spec`, `ox?`, `oy?`, `rot?`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:118](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L118)

#### Parameters

##### g

[`Graphics`](../../../interfaces/Graphics.md)

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
