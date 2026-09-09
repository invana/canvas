# Interface: GraphLegendLayerOptions

Constructor options for `GraphLegendLayer`.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: [`GraphLegendColor`](../type-aliases/GraphLegendColor.md)

Panel background. CSS colour or a `{ light, dark }` pair.

***

### borderColor?

> `optional` **borderColor?**: [`GraphLegendColor`](../type-aliases/GraphLegendColor.md)

Panel border colour. CSS colour or a `{ light, dark }` pair.

***

### borderRadius?

> `optional` **borderRadius?**: `number`

Panel corner radius in px. Default `6`.

***

### colors?

> `optional` **colors?**: `Record`\<`string`, `number`\>

Explicit per-type swatch colours as `0xRRGGBB`, keyed by type name (node and
edge types share the map). Wins over the colour resolved from the graph —
reach for it only when the representative element's style isn't the colour
you want in the legend.

***

### countMode?

> `optional` **countMode?**: [`GraphLegendCountMode`](../type-aliases/GraphLegendCountMode.md)

How the count is rendered. Default `'both'`.

***

### edgesTitle?

> `optional` **edgesTitle?**: `string` \| `false`

Edge-section heading. Pass `false` to drop it. Default `'Edges'`.

***

### edgeTypeOf?

> `optional` **edgeTypeOf?**: (`edge`) => `string`

Edge-side sibling of [nodeTypeOf](#nodetypeof).

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`string`

***

### edgeTypes?

> `optional` **edgeTypes?**: readonly `string`[]

Edge-side sibling of [nodeTypes](#nodetypes).

***

### enabled?

> `optional` **enabled?**: `boolean`

Render the overlay at all. Toggle at runtime via [GraphLegendLayer.setEnabled](../classes/GraphLegendLayer.md#setenabled). Default `true`.

***

### fallbackColor?

> `optional` **fallbackColor?**: `number`

Swatch colour for a type whose style resolves no usable colour. Default `0x9ca3af`.

***

### fontSize?

> `optional` **fontSize?**: `number`

Text size in px. Default `11`.

***

### graphLayerId

> **graphLayerId**: `string`

Required — the `GraphLayer` id this legend describes.

***

### hiddenTypeOpacity?

> `optional` **hiddenTypeOpacity?**: `number`

Row opacity when its type is toggled off via [toggleOnClick](#toggleonclick). Applies
to the whole row (swatch included); the type name additionally gets
`line-through` and the muted text colour. Default `0.45`.

***

### hideEmpty?

> `optional` **hideEmpty?**: `boolean`

Drop rows whose visible count is `0` (i.e. the type is entirely filtered
out). Default `false` — a zeroed row is usually the point of a legend.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Inset from the chosen corner, in screen pixels. A single number applies to
both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
header bar). A missing axis on the object form falls back to `10`.
Default `10`.

***

### maxRows?

> `optional` **maxRows?**: `number`

Cap on rows *per section*; the remainder collapses into a single
`+N more` row. `0` means no cap. Default `12`.

***

### mode?

> `optional` **mode?**: [`GraphLegendMode`](../type-aliases/GraphLegendMode.md)

How `{ light, dark }` colours resolve. Default `'auto'`.

***

### mutedColor?

> `optional` **mutedColor?**: [`GraphLegendColor`](../type-aliases/GraphLegendColor.md)

Section-heading + count colour. CSS colour or a `{ light, dark }` pair.

***

### nodesTitle?

> `optional` **nodesTitle?**: `string` \| `false`

Node-section heading. Pass `false` to drop it. Default `'Nodes'`.

***

### nodeTypeOf?

> `optional` **nodeTypeOf?**: (`node`) => `string`

How to read a node's type. Defaults to the same accessor `deriveSchema`
uses (`node.type`, then `data.type` / `.label` / `.kind` / `.group` /
`.category`, then `'node'`) — so the legend and the schema panel agree.
Non-serialisable: pass it in the constructor, not through `canvas.update`.

#### Parameters

##### node

[`GraphNode`](GraphNode.md)

#### Returns

`string`

***

### nodeTypes?

> `optional` **nodeTypes?**: readonly `string`[]

Restrict the legend to these type names (in this order, ignoring
[sort](#sort)). Types absent from the store are skipped. Unset → every
observed type.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default `0.95`.

***

### position?

> `optional` **position?**: [`GraphLegendPosition`](../type-aliases/GraphLegendPosition.md)

Anchor corner. Default `'top-left'`.

***

### showCounts?

> `optional` **showCounts?**: `boolean`

Show the per-type counts. Default `true`.

***

### showEdges?

> `optional` **showEdges?**: `boolean`

Include the edge-type section. Default `true`.

***

### showNodes?

> `optional` **showNodes?**: `boolean`

Include the node-type section. Default `true`.

***

### sort?

> `optional` **sort?**: [`GraphLegendSort`](../type-aliases/GraphLegendSort.md)

Row ordering within each section. Default `'count-desc'`.

***

### swatchSize?

> `optional` **swatchSize?**: `number`

Node swatch diameter (and edge swatch stroke length basis) in px. Default `10`.

***

### textColor?

> `optional` **textColor?**: [`GraphLegendColor`](../type-aliases/GraphLegendColor.md)

Row text colour. CSS colour or a `{ light, dark }` pair.

***

### title?

> `optional` **title?**: `string` \| `false`

Panel heading. Pass `false` (or `''`) for no heading. Default `'Legend'`.

***

### toggleOnClick?

> `optional` **toggleOnClick?**: `boolean`

Make rows clickable, toggling the whole type's visibility in the graph —
click `Person` to hide every Person node, click again to bring them back.
A toggled-off row renders **struck through and muted** (see
[hiddenTypeOpacity](#hiddentypeopacity)) so the legend doubles as the filter's own state
display.

Default `false` — interaction is opt-in, mirroring the engine's
behaviours-don't-auto-enable rule. The GraphLegendLayerEvents.row:click
event fires either way, so a host can wire its own reaction (drive a query,
select instead of hide) with this left off.

Only the row elements take pointer events; the panel's padding and section
headings stay `pointer-events:none`, so panning the canvas "through" the
legend still works everywhere except directly on a row.
