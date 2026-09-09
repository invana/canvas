# Interface: ContentLODBehaviourOptions

Constructor options shared by every content-LOD behaviour.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`ZoomBand`](ZoomBand.md)

## Extended by

- [`TextLODBehaviourOptions`](TextLODBehaviourOptions.md)

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### maxZoom?

> `readonly` `optional` **maxZoom?**: `number`

Show at/below this camera scale. Omit for "no upper bound".

#### Inherited from

[`ZoomBand`](ZoomBand.md).[`maxZoom`](ZoomBand.md#maxzoom)

***

### minZoom?

> `readonly` `optional` **minZoom?**: `number`

Show at/above this camera scale. Omit for "no lower bound".

#### Inherited from

[`ZoomBand`](ZoomBand.md).[`minZoom`](ZoomBand.md#minzoom)

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
