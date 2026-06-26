# Interface: EdgeSizeLODBehaviourOptions

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L62)

## Extends

- `ElementSizeLODBehaviourOptions`

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`ElementSizeLODBehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`ElementSizeLODBehaviourOptions.id`

***

### layers

> **layers**: [`EdgeSizeLODConfig`](EdgeSizeLODConfig.md)[]

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L64)

One config per `GraphLayer` to drive.

***

### scaleEpsilon?

> `optional` **scaleEpsilon?**: `number`

Defined in: canvas/dist/index.d.ts:1700

Skip `apply` when the relative scale change since the last applied
frame is below this threshold (`|scale - lastScale| / lastScale`).
Set to `0` to disable the skip. Default `0.005` (0.5%) — sub-pixel
stroke / size deltas at typical screen DPIs, which the user can't
perceive but a wheel-zoom gesture fires 60×/sec of.

#### Inherited from

`ElementSizeLODBehaviourOptions.scaleEpsilon`

***

### settleMs?

> `optional` **settleMs?**: `number`

Defined in: canvas/dist/index.d.ts:1709

When `> 0`, switch from per-frame RAF apply to a trailing-edge
debounce: skip work during a continuous gesture and run one final
`apply` after `settleMs` of zoom silence. Useful for expensive
passes (e.g. thousands of connector redraws) where mid-gesture
visual drift is preferable to a frame-rate collapse. Default `0`
(RAF mode).

#### Inherited from

`ElementSizeLODBehaviourOptions.settleMs`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`ElementSizeLODBehaviourOptions.shortcuts`

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:731

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `targetLayerId` and `scope: 'canvas'`.

#### Inherited from

`ElementSizeLODBehaviourOptions.targetLayerId`
