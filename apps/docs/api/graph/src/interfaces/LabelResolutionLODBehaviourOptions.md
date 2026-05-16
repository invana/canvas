# Interface: LabelResolutionLODBehaviourOptions

Defined in: [graph/src/behaviours/LabelResolutionLODBehaviour.ts:60](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/LabelResolutionLODBehaviour.ts#L60)

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### baseResolution?

> `optional` **baseResolution?**: `number`

Defined in: [graph/src/behaviours/LabelResolutionLODBehaviour.ts:69](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/LabelResolutionLODBehaviour.ts#L69)

Base resolution to multiply by the active tier's multiplier. Default
`window.devicePixelRatio` (≈ 1 on standard displays, 2 on retina). Set
this if your Canvas was initialised with a custom `resolution` option.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### hysteresis?

> `optional` **hysteresis?**: `number`

Defined in: [graph/src/behaviours/LabelResolutionLODBehaviour.ts:90](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/LabelResolutionLODBehaviour.ts#L90)

Hysteresis applied to *downward* tier changes. After crossing UP into
tier N at `levels[N].minZoom`, the behaviour only reverts to tier N-1
once zoom drops below `levels[N].minZoom - hysteresis`. Prevents
flicker when the user dithers on a threshold. Default `0.1`.

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/LabelResolutionLODBehaviour.ts:62](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/LabelResolutionLODBehaviour.ts#L62)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### levels?

> `optional` **levels?**: `LabelResolutionLODTier`[]

Defined in: [graph/src/behaviours/LabelResolutionLODBehaviour.ts:82](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/LabelResolutionLODBehaviour.ts#L82)

Discrete zoom tiers, evaluated as a step function. Each tier names a
`minZoom` at which it activates and a `multiplier` applied to
`baseResolution` while it's active. Order doesn't matter — the
behaviour sorts by `minZoom` internally.

Pick *few, widely-spaced* tiers: every additional tier means another
GPU re-raster of every label during a typical zoom-in pass. Default:
`[{ minZoom: 0, multiplier: 1 }, { minZoom: 1.5, multiplier: 4 }]` —
one threshold, one re-raster.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)
