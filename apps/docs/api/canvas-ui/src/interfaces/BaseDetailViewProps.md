# Interface: BaseDetailViewProps

Shared props for the engine-aware detail panels (`NodeDetailView` /
`EdgeDetailView`). Each maps a ViewContext to a `DetailCard` +
`PropertyDetailView`; these are the knobs they have in common.

## Properties

### className?

> `optional` **className?**: `string`

Class on the card — the placement + sizing + appearance surface (the panels
are layout-agnostic). Spread [dockCardClassName](../functions/dockCardClassName.md) for a full-height dock.

***

### ctx

> **ctx**: `ViewContext`

The clicked element's full context — passed in by the `panel` render-prop of
`<ClickViewBehaviour>`.

***

### hints?

> `optional` **hints?**: `Record`\<`string`, `string`\>

Per-key kind hint, forwarded to `PropertyDetailView`.

***

### renderers?

> `optional` **renderers?**: `PropertyRenderer`[]

Extra property renderers, tried before the built-ins — add or override a
data type with a single [PropertyRenderer](../../../canvas/src/variables/SpecStore.md) object. Forwarded to
`PropertyDetailView`.

***

### showId?

> `optional` **showId?**: `boolean`

Show the element id as the card subtitle. Default `true`.

***

### style?

> `optional` **style?**: `CSSProperties`

Inline style on the card — the runtime-valued companion to [className](#classname).
