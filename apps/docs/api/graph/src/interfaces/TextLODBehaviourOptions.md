# Interface: TextLODBehaviourOptions

Constructor options for [TextLODBehaviour](../classes/TextLODBehaviour.md).

## Extends

- [`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md)

## Properties

### alwaysShowTop?

> `optional` **alwaysShowTop?**: `number`

Keep labels shown for the most **central** nodes even when the zoom band
hides the rest — a **fraction** in `(0, 1]` by degree centrality (in + out
edges). `0.1` keeps the top 10%. Relative, not an absolute edge count, so it
adapts across graphs of different densities. Omit / `0` to gate all text
uniformly.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md).[`enabled`](ContentLODBehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md).[`id`](ContentLODBehaviourOptions.md#id)

***

### maxZoom?

> `readonly` `optional` **maxZoom?**: `number`

Show at/below this camera scale. Omit for "no upper bound".

#### Inherited from

[`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md).[`maxZoom`](ContentLODBehaviourOptions.md#maxzoom)

***

### minZoom?

> `readonly` `optional` **minZoom?**: `number`

Show at/above this camera scale. Omit for "no lower bound".

#### Inherited from

[`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md).[`minZoom`](ContentLODBehaviourOptions.md#minzoom)

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md).[`shortcuts`](ContentLODBehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour drives.

#### Inherited from

[`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md).[`targetLayerId`](ContentLODBehaviourOptions.md#targetlayerid)
