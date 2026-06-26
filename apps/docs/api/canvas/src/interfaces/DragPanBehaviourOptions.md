# Interface: DragPanBehaviourOptions

Defined in: [canvas/src/behaviours/DragPanBehaviour.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/DragPanBehaviour.ts#L30)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### decelerate?

> `optional` **decelerate?**: `boolean`

Defined in: [canvas/src/behaviours/DragPanBehaviour.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/DragPanBehaviour.ts#L36)

Add momentum deceleration after pointer lift. Default `true`.

***

### dragCursor?

> `optional` **dragCursor?**: `string`

Defined in: [canvas/src/behaviours/DragPanBehaviour.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/DragPanBehaviour.ts#L42)

Cursor applied to the canvas while the pan pointer is held. Set on
pointer-press (matching `mouseButtons` / `modifier`), restored to the
previous value on release. Default `'grabbing'`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L45)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L38)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### modifier?

> `optional` **modifier?**: [`DragModifier`](../type-aliases/DragModifier.md)

Defined in: [canvas/src/behaviours/DragPanBehaviour.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/DragPanBehaviour.ts#L32)

Which modifier key must be held during drag. Default `'none'`.

***

### mouseButtons?

> `optional` **mouseButtons?**: `"all"` \| `"left"` \| `"right"` \| `"middle"`

Defined in: [canvas/src/behaviours/DragPanBehaviour.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/DragPanBehaviour.ts#L34)

Allowed mouse buttons. Default `'left'`. Forwarded to pixi-viewport.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L51)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/Behaviour.ts#L43)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`targetLayerId`](BehaviourOptions.md#targetlayerid)
