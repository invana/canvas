# Interface: GraphLayerEvents

Defined in: [graph/src/layer/types.ts:1311](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1311)

Layer-level event payloads (separate from store events). Pointer/drag/etc.
arrive in later phases; today this is just the aggregated lifecycle.

## Indexable

> \[`event`: `string`\]: `unknown`

## Properties

### data:changed

> **data:changed**: `object`

Defined in: [graph/src/layer/types.ts:1312](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1312)

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

Defined in: [graph/src/layer/types.ts:1320](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1320)

#### count

> **count**: `number`
