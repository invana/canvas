# Interface: PinchZoomBehaviourOptions

## Extends

- [`BehaviourOptions`](BehaviourOptions.md)

## Properties

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

### noDrag?

> `optional` **noDrag?**: `boolean`

If `true`, suppress the implicit pan that accompanies a pinch gesture.
Default `false` — pinch both zooms and centres the viewport on the
midpoint between the two fingers.

***

### percent?

> `optional` **percent?**: `number`

Zoom speed multiplier. Default `0.1`.

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
