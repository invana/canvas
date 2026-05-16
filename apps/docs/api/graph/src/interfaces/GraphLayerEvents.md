# Interface: GraphLayerEvents

Defined in: [graph/src/layer/types.ts:847](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L847)

Layer-level event payloads (separate from store events). Pointer/drag/etc.
arrive in later phases; today this is just the aggregated lifecycle.

## Indexable

> \[`event`: `string`\]: `unknown`

## Properties

### data:changed

> **data:changed**: `object`

Defined in: [graph/src/layer/types.ts:848](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L848)

#### addedEdges

> **addedEdges**: `number`

#### addedNodes

> **addedNodes**: `number`

#### removedEdges

> **removedEdges**: `number`

#### removedNodes

> **removedNodes**: `number`

#### updatedEdges

> **updatedEdges**: `number`

#### updatedNodes

> **updatedNodes**: `number`

***

### positions:updated

> **positions:updated**: `object`

Defined in: [graph/src/layer/types.ts:856](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L856)

#### count

> **count**: `number`
