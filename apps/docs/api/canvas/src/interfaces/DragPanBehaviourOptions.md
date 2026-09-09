# Interface: DragPanBehaviourOptions

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### decelerate?

> `optional` **decelerate?**: `boolean`

Add momentum deceleration after pointer lift. Default `true`.

***

### dragCursor?

> `optional` **dragCursor?**: `string`

Cursor applied to the canvas while the pan pointer is held. Set on
pointer-press (matching `mouseButtons` / `modifier`), restored to the
previous value on release. Default `'grabbing'`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### modifier?

> `optional` **modifier?**: [`DragModifier`](../type-aliases/DragModifier.md)

Which modifier key must be held during drag. Default `'none'`.

***

### mouseButtons?

> `optional` **mouseButtons?**: `"left"` \| `"right"` \| `"middle"` \| `"all"`

Allowed mouse buttons. Default `'left'`. Forwarded to the camera.

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
