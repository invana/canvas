# Interface: PinchZoomBehaviourOptions

Defined in: [canvas/src/behaviours/PinchZoomBehaviour.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/PinchZoomBehaviour.ts#L15)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

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

### noDrag?

> `optional` **noDrag?**: `boolean`

Defined in: [canvas/src/behaviours/PinchZoomBehaviour.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/PinchZoomBehaviour.ts#L21)

If `true`, suppress the implicit pan that accompanies a pinch gesture.
Default `false` — pinch both zooms and centres the viewport on the
midpoint between the two fingers.

***

### percent?

> `optional` **percent?**: `number`

Defined in: [canvas/src/behaviours/PinchZoomBehaviour.ts:23](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/behaviours/PinchZoomBehaviour.ts#L23)

Zoom speed multiplier. Default `0.1`.

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
