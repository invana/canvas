# Interface: GraphLayerEvents

Defined in: [graph/src/layer/types.ts:1394](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1394)

Layer-level event payloads (separate from store events). Pointer/drag/etc.
arrive in later phases; today this is just the aggregated lifecycle.

## Indexable

> \[`event`: `string`\]: `unknown`

## Properties

### data:changed

> **data:changed**: `object`

Defined in: [graph/src/layer/types.ts:1395](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1395)

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

### node:drag-end

> **node:drag-end**: `object`

Defined in: [graph/src/layer/types.ts:1420](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1420)

#### nodeId

> **nodeId**: `string`

#### nodeIds

> **nodeIds**: readonly `string`[]

***

### node:drag-start

> **node:drag-start**: `object`

Defined in: [graph/src/layer/types.ts:1419](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1419)

A user-driven node drag began. Behaviours emitting this signal the
intent to hold a node's position against any physics / layout that
would otherwise move it. Layouts (e.g. `D3ForceLayout`) subscribe and
apply a *transient* lock — they MUST NOT mutate the store's
`GraphNode.pinned` flag in response, since that is reserved for
user-data semantics (permanent pin). The matching `node:drag-end`
releases the transient lock.

`nodeId` is the *grabbed* node (the gesture's primary). `nodeIds` is the
full set of primary nodes being dragged together — `[nodeId]` for a plain
single-node drag, or every selected node for a multi-selection drag. Group
descendants are NOT listed here; consumers that care about them expand via
`store.descendantsOf(id)`.

#### nodeId

> **nodeId**: `string`

#### nodeIds

> **nodeIds**: readonly `string`[]

***

### positions:updated

> **positions:updated**: `object`

Defined in: [graph/src/layer/types.ts:1403](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1403)

#### count

> **count**: `number`

***

### style:changed

> **style:changed**: `object`

Defined in: [graph/src/layer/types.ts:1430](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1430)

The layer-level style template changed (node / edge defaults or the state
catalogue) — emitted by `setNodeDefaults` / `setEdgeDefaults` /
`setStateConfigs` (and therefore by any `applyOptions` patch or behaviour
that writes the template, e.g. `ColorByLabelBehaviour`). Distinct from
`data:changed` (topology / positions). Dependents that mirror resolved
styling — e.g. `MiniMapLayer` — subscribe to repaint. See
`unified-canvas-options-plan.md` §7.2.

#### scope

> **scope**: `"node"` \| `"edge"` \| `"state"`
