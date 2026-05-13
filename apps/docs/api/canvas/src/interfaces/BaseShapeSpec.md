# Interface: BaseShapeSpec

Defined in: [packages/canvas/src/primitives/types.ts:363](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L363)

## Extended by

- [`ArrowMarkerSpec`](ArrowMarkerSpec.md)
- [`CircleSpec`](CircleSpec.md)
- [`RectSpec`](RectSpec.md)
- [`PolygonSpec`](PolygonSpec.md)
- [`RegularPolygonSpec`](RegularPolygonSpec.md)
- [`StarSpec`](StarSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:371](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L371)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [packages/canvas/src/primitives/types.ts:367](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L367)

***

### kind

> `readonly` **kind**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:364](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L364)

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [packages/canvas/src/primitives/types.ts:368](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L368)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:372](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L372)

***

### x

> `readonly` **x**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:365](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L365)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:366](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L366)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:370](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L370)

Default `0`. Higher = on top. Used for hit-test resolution.
