# Interface: ContextMenuBehaviourOptions

Constructor options for `ContextMenuBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### onContextMenu?

> `optional` **onContextMenu?**: (`event`) => `void`

Fired on a qualifying right-click.

#### Parameters

##### event

[`ContextMenuEvent`](ContextMenuEvent.md)

#### Returns

`void`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### state?

> `optional` **state?**: `string`

Optional transient state name applied to the right-clicked node/edge (e.g.
`'context-open'`). The previously marked target is cleared first, so at
most one element carries it at a time. Cleared on disable/destroy.
`null`/`undefined` disables this. Default `null`.

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### targets?

> `optional` **targets?**: readonly [`ContextMenuTargetType`](../type-aliases/ContextMenuTargetType.md)[]

Which targets fire `onContextMenu`. A right-click on a target not in this
list is ignored. Default `['node', 'edge', 'canvas']`.
