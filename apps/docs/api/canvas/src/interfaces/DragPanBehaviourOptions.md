# Interface: DragPanBehaviourOptions

Defined in: [packages/canvas/src/behaviours/DragPanBehaviour.ts:21](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/DragPanBehaviour.ts#L21)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### decelerate?

> `optional` **decelerate?**: `boolean`

Defined in: [packages/canvas/src/behaviours/DragPanBehaviour.ts:27](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/DragPanBehaviour.ts#L27)

Add momentum deceleration after pointer lift. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`layerId`](BehaviourOptions.md#layerid)

***

### modifier?

> `optional` **modifier?**: [`DragModifier`](../type-aliases/DragModifier.md)

Defined in: [packages/canvas/src/behaviours/DragPanBehaviour.ts:23](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/DragPanBehaviour.ts#L23)

Which modifier key must be held during drag. Default `'none'`.

***

### mouseButtons?

> `optional` **mouseButtons?**: `"all"` \| `"left"` \| `"right"` \| `"middle"`

Defined in: [packages/canvas/src/behaviours/DragPanBehaviour.ts:25](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/DragPanBehaviour.ts#L25)

Allowed mouse buttons. Default `'left'`. Forwarded to pixi-viewport.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)
