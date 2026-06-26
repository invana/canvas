# Interface: BaseDetailViewProps

Defined in: [canvas-react/src/toolbars/detailView.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L12)

Shared props for the engine-aware detail panels (`NodeDetailView` /
`EdgeDetailView`). Each maps a [ViewContext](ViewContext.md) to a `DetailCard` +
`PropertyDetailView`; these are the knobs they have in common.

## Properties

### className?

> `optional` **className?**: `string`

Defined in: [canvas-react/src/toolbars/detailView.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L32)

Class on the card — the placement + sizing + appearance surface (the panels
are layout-agnostic). Spread [dockCardClassName](../functions/dockCardClassName.md) for a full-height dock.

***

### ctx

> **ctx**: [`ViewContext`](ViewContext.md)

Defined in: [canvas-react/src/toolbars/detailView.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L17)

The clicked element's full context — passed in by the `panel` render-prop of
`<ClickViewBehaviour>`.

***

### hints?

> `optional` **hints?**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/toolbars/detailView.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L27)

Per-key kind hint, forwarded to `PropertyDetailView`.

***

### renderers?

> `optional` **renderers?**: `PropertyRenderer`[]

Defined in: [canvas-react/src/toolbars/detailView.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L25)

Extra property renderers, tried before the built-ins — add or override a
data type with a single [PropertyRenderer](../variables/Canvas.md) object. Forwarded to
`PropertyDetailView`.

***

### showId?

> `optional` **showId?**: `boolean`

Defined in: [canvas-react/src/toolbars/detailView.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L19)

Show the element id as the card subtitle. Default `true`.

***

### style?

> `optional` **style?**: `CSSProperties`

Defined in: [canvas-react/src/toolbars/detailView.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/toolbars/detailView.ts#L34)

Inline style on the card — the runtime-valued companion to [className](#classname).
