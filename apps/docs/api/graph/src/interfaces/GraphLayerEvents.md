# Interface: GraphLayerEvents

Defined in: packages/graph/src/layer/types.ts:81

Layer-level event payloads (separate from store events). Pointer/drag/etc.
arrive in later phases; today this is just the aggregated lifecycle.

## Indexable

> \[`event`: `string`\]: `unknown`

## Properties

### data:changed

> **data:changed**: `object`

Defined in: packages/graph/src/layer/types.ts:82

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

Defined in: packages/graph/src/layer/types.ts:90

#### count

> **count**: `number`
