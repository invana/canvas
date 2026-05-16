# Interface: EdgeSizeLODBehaviourOptions

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:62](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L62)

## Extends

- [`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md).[`id`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md#id)

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:41](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L41)

Layer-scoped behaviours target a specific Layer by id. Canvas-scoped
behaviours have no `layerId` and `scope: 'canvas'`.

#### Inherited from

[`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md#layerid)

***

### layers

> **layers**: [`EdgeSizeLODConfig`](EdgeSizeLODConfig.md)[]

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:64](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L64)

One config per `GraphLayer` to drive.

***

### scaleEpsilon?

> `optional` **scaleEpsilon?**: `number`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:67](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L67)

Skip `apply` when the relative scale change since the last applied
frame is below this threshold (`|scale - lastScale| / lastScale`).
Set to `0` to disable the skip. Default `0.005` (0.5%) — sub-pixel
stroke / size deltas at typical screen DPIs, which the user can't
perceive but a wheel-zoom gesture fires 60×/sec of.

#### Inherited from

[`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md).[`scaleEpsilon`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md#scaleepsilon)

***

### settleMs?

> `optional` **settleMs?**: `number`

Defined in: [canvas/src/behaviours/ElementSizeLODBehaviour.ts:76](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/ElementSizeLODBehaviour.ts#L76)

When `> 0`, switch from per-frame RAF apply to a trailing-edge
debounce: skip work during a continuous gesture and run one final
`apply` after `settleMs` of zoom silence. Useful for expensive
passes (e.g. thousands of connector redraws) where mid-gesture
visual drift is preferable to a frame-rate collapse. Default `0`
(RAF mode).

#### Inherited from

[`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md).[`settleMs`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md#settlems)

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`ElementSizeLODBehaviourOptions`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/ElementSizeLODBehaviourOptions.md#shortcuts)
