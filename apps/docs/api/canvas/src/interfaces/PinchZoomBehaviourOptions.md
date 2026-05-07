# Interface: PinchZoomBehaviourOptions

Defined in: [packages/canvas/src/behaviours/PinchZoomBehaviour.ts:15](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/PinchZoomBehaviour.ts#L15)

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`enabled`](BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`id`](BehaviourOptions.md#id)

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`layerId`](BehaviourOptions.md#layerid)

***

### noDrag?

> `optional` **noDrag?**: `boolean`

Defined in: [packages/canvas/src/behaviours/PinchZoomBehaviour.ts:21](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/PinchZoomBehaviour.ts#L21)

If `true`, suppress the implicit pan that accompanies a pinch gesture.
Default `false` — pinch both zooms and centres the viewport on the
midpoint between the two fingers.

***

### percent?

> `optional` **percent?**: `number`

Defined in: [packages/canvas/src/behaviours/PinchZoomBehaviour.ts:23](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/PinchZoomBehaviour.ts#L23)

Zoom speed multiplier. Default `0.1`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [packages/canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](BehaviourOptions.md).[`shortcuts`](BehaviourOptions.md#shortcuts)
