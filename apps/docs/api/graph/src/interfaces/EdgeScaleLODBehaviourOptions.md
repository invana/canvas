# Interface: EdgeScaleLODBehaviourOptions

## Extends

- `ElementScaleLODBehaviourOptions`

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

`ElementScaleLODBehaviourOptions.enabled`

***

### id

> **id**: `string`

#### Inherited from

`ElementScaleLODBehaviourOptions.id`

***

### layers

> **layers**: [`EdgeScaleLODConfig`](EdgeScaleLODConfig.md)[]

One config per `GraphLayer` to drive.

***

### scaleEpsilon?

> `optional` **scaleEpsilon?**: `number`

Skip `apply` when the relative scale change since the last applied
frame is below this threshold (`|scale - lastScale| / lastScale`).
Set to `0` to disable the skip. Default `0.005` (0.5%) — sub-pixel
stroke / size deltas at typical screen DPIs, which the user can't
perceive but a wheel-zoom gesture fires 60×/sec of.

#### Inherited from

`ElementScaleLODBehaviourOptions.scaleEpsilon`

***

### settleMs?

> `optional` **settleMs?**: `number`

When `> 0`, switch from per-frame RAF apply to a trailing-edge
debounce: skip work during a continuous gesture and run one final
`apply` after `settleMs` of zoom silence. Useful for expensive
passes (e.g. thousands of connector redraws) where mid-gesture
visual drift is preferable to a frame-rate collapse. Default `0`
(RAF mode).

#### Inherited from

`ElementScaleLODBehaviourOptions.settleMs`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`ElementScaleLODBehaviourOptions.shortcuts`

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

`ElementScaleLODBehaviourOptions.targetLayerId`
