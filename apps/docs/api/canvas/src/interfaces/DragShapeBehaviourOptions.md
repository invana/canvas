# Interface: DragShapeBehaviourOptions

Defined in: [canvas/src/behaviours/DragShapeBehaviour.ts:36](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L36)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### dragCursor?

> `readonly` `optional` **dragCursor?**: `string`

Defined in: [canvas/src/behaviours/DragShapeBehaviour.ts:54](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L54)

Optional cursor while dragging. Applied on drag start and cleared on
drag end. Default `'grabbing'`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### filter?

> `readonly` `optional` **filter?**: (`id`) => `boolean`

Defined in: [canvas/src/behaviours/DragShapeBehaviour.ts:43](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L43)

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

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`layerId`](BehaviourOptions.md#layerid)

***

### renderer

> `readonly` **renderer**: [`PrimitivesRenderer`](../classes/PrimitivesRenderer.md)

Defined in: [canvas/src/behaviours/DragShapeBehaviour.ts:38](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L38)

The renderer whose shapes this behaviour can drag.

***

### reRouteConnectors?

> `readonly` `optional` **reRouteConnectors?**: `boolean`

Defined in: [canvas/src/behaviours/DragShapeBehaviour.ts:49](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/DragShapeBehaviour.ts#L49)

Re-route every connector after each move. Default `true` — needed for
obstacle-aware routers (`manhattan` etc.) so they recompute when
obstacles move. Set `false` to avoid the per-move re-route cost.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)
