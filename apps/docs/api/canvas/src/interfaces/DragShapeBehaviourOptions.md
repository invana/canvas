# Interface: DragShapeBehaviourOptions

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### dragCursor?

> `readonly` `optional` **dragCursor?**: `string`

Optional cursor while dragging. Applied on drag start and cleared on
drag end. Default `'grabbing'`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### filter?

> `readonly` `optional` **filter?**: (`id`) => `boolean`

Optional predicate to restrict which shape ids are draggable. Returning
`false` ignores the pointerdown. Default = every shape is draggable.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### renderer

> `readonly` **renderer**: [`IElementRenderer`](IElementRenderer.md)

The renderer whose shapes this behaviour can drag.

***

### reRouteConnectors?

> `readonly` `optional` **reRouteConnectors?**: `boolean`

Re-route every connector after each move. Default `true` — needed for
obstacle-aware routers (`manhattan` etc.) so they recompute when
obstacles move. Set `false` to avoid the per-move re-route cost.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`targetLayerId`](BehaviourOptions.md#targetlayerid)
