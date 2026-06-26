# Interface: RegularPolygonShapeOption

Defined in: [graph/src/layer/types.ts:243](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L243)

Regular n-gon. With `rotation = 0` the first vertex points straight up, so
a triangle / pentagon / hexagon points up by default. Pass
`rotation: Math.PI / sides` for flat-top.

## Properties

### kind

> `readonly` **kind**: `"regular-polygon"`

Defined in: [graph/src/layer/types.ts:244](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L244)

***

### radius

> `readonly` **radius**: `number`

Defined in: [graph/src/layer/types.ts:246](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L246)

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Defined in: [graph/src/layer/types.ts:247](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L247)

***

### sides

> `readonly` **sides**: `number`

Defined in: [graph/src/layer/types.ts:245](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L245)
