# Type Alias: GraphLegendLayerEvents

> **GraphLegendLayerEvents** = `object`

Layer-level event payloads.

A `type` alias rather than an `interface` so it satisfies the engine's
`EventMap` (`Record<string, unknown>`) constraint — only aliases get TypeScript's
implicit index signature.

## Properties

### row:click

> **row:click**: `object`

A legend row was clicked. Fires whether or not
[GraphLegendLayerOptions.toggleOnClick](../interfaces/GraphLegendLayerOptions.md#toggleonclick) is on — with it off nothing in
the graph changes and `hidden` simply reports the row's unchanged toggle
state, so a host can implement its own reaction (drive a query, select the
type, open a filter) without the built-in hide/show.

#### hidden

> **hidden**: `boolean`

#### kind

> **kind**: [`GraphLegendRowKind`](GraphLegendRowKind.md)

#### type

> **type**: `string`

***

### type:visibility

> **type:visibility**: `object`

A type was toggled off (`hidden: true`) or back on. Only fires when
[GraphLegendLayerOptions.toggleOnClick](../interfaces/GraphLegendLayerOptions.md#toggleonclick) actually applied the change,
so it's the one to listen to for "the legend filtered the graph".

#### hidden

> **hidden**: `boolean`

#### kind

> **kind**: [`GraphLegendRowKind`](GraphLegendRowKind.md)

#### type

> **type**: `string`
