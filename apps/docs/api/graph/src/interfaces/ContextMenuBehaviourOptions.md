# Interface: ContextMenuBehaviourOptions

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L62)

Constructor options for `ContextMenuBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### onContextMenu?

> `optional` **onContextMenu?**: (`event`) => `void`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:81](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L81)

Fired on a qualifying right-click.

#### Parameters

##### event

[`ContextMenuEvent`](ContextMenuEvent.md)

#### Returns

`void`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`BehaviourOptions.shortcuts`

***

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L78)

Optional transient state name applied to the right-clicked node/edge (e.g.
`'context-open'`). The previously marked target is cleared first, so at
most one element carries it at a time. Cleared on disable/destroy.
`null`/`undefined` disables this. Default `null`.

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L64)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

`BehaviourOptions.targetLayerId`

***

### targets?

> `optional` **targets?**: readonly [`ContextMenuTargetType`](../type-aliases/ContextMenuTargetType.md)[]

Defined in: [graph/src/behaviours/ContextMenuBehaviour.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ContextMenuBehaviour.ts#L70)

Which targets fire `onContextMenu`. A right-click on a target not in this
list is ignored. Default `['node', 'edge', 'canvas']`.
