# Interface: ArcSpec

Defined in: [canvas/src/primitives/types.ts:463](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L463)

Annular sector centred at `(x, y)` between radii `innerR`/`outerR` and
angles `startAngle`/`endAngle` (radians). Angle convention: `0` is along
`+x` (3 o'clock); increasing values sweep clockwise on screen.

Special cases:
- `innerR === 0` → pie slice.
- `endAngle - startAngle >= 2π` and `innerR > 0` → full annulus (ring).
- `endAngle - startAngle >= 2π` and `innerR === 0` → full disc (prefer
  `CircleSpec` for that case).

The natural fit for sunburst / partition layouts where each node is an
arc-shaped region rather than a positioned dot. Pair with
`D3HierarchyLayout({ mode: 'sunburst' })`, which writes the four arc
parameters per node.

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:393](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L393)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### endAngle

> `readonly` **endAngle**: `number`

Defined in: [canvas/src/primitives/types.ts:468](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L468)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [canvas/src/primitives/types.ts:389](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L389)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### innerR

> `readonly` **innerR**: `number`

Defined in: [canvas/src/primitives/types.ts:465](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L465)

***

### kind

> `readonly` **kind**: `"arc"`

Defined in: [canvas/src/primitives/types.ts:464](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L464)

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### outerR

> `readonly` **outerR**: `number`

Defined in: [canvas/src/primitives/types.ts:466](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L466)

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Defined in: [canvas/src/primitives/types.ts:407](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L407)

Container-level rotation in radians, applied around the shape's
top-left local origin. Composes with effect-driven transform deltas
— the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
so connector-hosted badges with `autoRotate: true` keep rotating
smoothly even while a `shake` / `breathing` effect runs on top.

For per-shape geometric rotation (the visible rotation of a regular
polygon's vertices, a star's points, etc.), use the kind-specific
`rotation` field on those shape specs — that one rotates the *geometry*
before it's drawn; this one rotates the *container* after.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`rotation`](BaseShapeSpec.md#rotation)

***

### startAngle

> `readonly` **startAngle**: `number`

Defined in: [canvas/src/primitives/types.ts:467](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L467)

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [canvas/src/primitives/types.ts:390](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L390)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:394](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L394)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### x

> `readonly` **x**: `number`

Defined in: [canvas/src/primitives/types.ts:387](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L387)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

Defined in: [canvas/src/primitives/types.ts:388](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L388)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:392](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L392)

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
