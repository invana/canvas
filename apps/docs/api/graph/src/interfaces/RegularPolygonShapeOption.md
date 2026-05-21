# Interface: RegularPolygonShapeOption

Defined in: [graph/src/layer/types.ts:235](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L235)

Regular n-gon. With `rotation = 0` the first vertex points straight up, so
a triangle / pentagon / hexagon points up by default. Pass
`rotation: Math.PI / sides` for flat-top.

## Properties

### kind

> `readonly` **kind**: `"regular-polygon"`

Defined in: [graph/src/layer/types.ts:236](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L236)

***

### radius

> `readonly` **radius**: `number`

Defined in: [graph/src/layer/types.ts:238](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L238)

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Defined in: [graph/src/layer/types.ts:239](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L239)

***

### sides

> `readonly` **sides**: `number`

Defined in: [graph/src/layer/types.ts:237](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L237)
