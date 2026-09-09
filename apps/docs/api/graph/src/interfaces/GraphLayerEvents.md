# Interface: GraphLayerEvents

Layer-level event payloads (separate from store events). Pointer/drag/etc.
arrive in later phases; today this is just the aggregated lifecycle.

## Indexable

> \[`event`: `string`\]: `unknown`

## Properties

### data:changed

> **data:changed**: `object`

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

### group:visibility

> **group:visibility**: `object`

A group **container** was hidden/shown as a unit via `hideGroup(s)` /
`showGroup(s)` / `toggleGroupHidden`. `hidden` is the container's
post-change state; fired once per group whose container actually
transitioned (no-op calls emit nothing). A convenience signal for a
"hidden groups" panel so it needn't filter every member's store
`node:visibility`. It is *not* a cache — read the truth from
`isGroupHidden(id)` / `hiddenGroups()`. Note: hiding a container via the
per-node `hideNode` (which does not sweep the subtree) emits the store's
`node:visibility`, not this — subscribe to both if you must catch every
path, or just derive from `hiddenGroups()` on `node:visibility`.

#### groupId

> **groupId**: `string`

#### hidden

> **hidden**: `boolean`

***

### node:drag-end

> **node:drag-end**: `object`

#### nodeId

> **nodeId**: `string`

#### nodeIds

> **nodeIds**: readonly `string`[]

***

### node:drag-start

> **node:drag-start**: `object`

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

#### count

> **count**: `number`

***

### style:changed

> **style:changed**: `object`

The layer-level style template changed (node / edge defaults or the state
catalogue) — emitted by `setNodeDefaults` / `setEdgeDefaults` /
`setStateConfigs` (and therefore by any `applyOptions` patch or behaviour
that writes the template, e.g. `ColorByBehaviour`). Distinct from
`data:changed` (topology / positions). Dependents that mirror resolved
styling — e.g. `MiniMapLayer` — subscribe to repaint. See
`unified-canvas-options-plan.md` §7.2.

#### scope

> **scope**: `"node"` \| `"edge"` \| `"state"`
