# Interface: TextResolutionLODBehaviourOptions

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### baseResolution?

> `optional` **baseResolution?**: `number`

Base resolution to multiply by the active tier's multiplier. Default
`window.devicePixelRatio` (≈ 1 on standard displays, 2 on retina). Set
this if your Canvas was initialised with a custom `resolution` option.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### hysteresis?

> `optional` **hysteresis?**: `number`

Hysteresis applied to *downward* tier changes. After crossing UP into
tier N at `levels[N].minZoom`, the behaviour only reverts to tier N-1
once zoom drops below `levels[N].minZoom - hysteresis`. Prevents
flicker when the user dithers on a threshold. Default `0.1`.

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### levels?

> `optional` **levels?**: `TextResolutionLODTier`[]

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

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)
