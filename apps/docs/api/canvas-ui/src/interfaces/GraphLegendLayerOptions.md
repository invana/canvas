# Interface: GraphLegendLayerOptions

The subset of `GraphLegendLayerOptions` this editor produces — a serialisable patch.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Panel background as a CSS colour (may be `rgba(...)`).

***

### borderColor?

> `optional` **borderColor?**: `string`

Panel border colour as a CSS colour (may be `rgba(...)`).

***

### borderRadius?

> `optional` **borderRadius?**: `number`

Panel corner radius in px. Default `6`.

***

### countMode?

> `optional` **countMode?**: `GraphLegendCountMode`

How the count is rendered. Default `'both'` (`visible / total`).

***

### edgesTitle?

> `optional` **edgesTitle?**: `string` \| `false`

Edge-section heading. `false` / empty hides it. Default `'Edges'`.

***

### fallbackColor?

> `optional` **fallbackColor?**: `number`

Swatch colour for a type with no resolvable colour, as `0xRRGGBB`. Default `0x9ca3af`.

***

### fontSize?

> `optional` **fontSize?**: `number`

Text size in px. Default `11`.

***

### hiddenTypeOpacity?

> `optional` **hiddenTypeOpacity?**: `number`

Row opacity when its type is toggled off. Default `0.45`.

***

### hideEmpty?

> `optional` **hideEmpty?**: `boolean`

Drop rows whose visible count is `0`. Default `false`.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Inset from the chosen corner in screen px — uniform or per-axis. Default `10`.

***

### maxRows?

> `optional` **maxRows?**: `number`

Cap on rows per section; the remainder collapses to `+N more`. `0` = no cap. Default `12`.

***

### mode?

> `optional` **mode?**: `GraphLegendMode`

How `{ light, dark }` colours resolve. Default `'auto'`.

***

### mutedColor?

> `optional` **mutedColor?**: `string`

Section-heading + count colour as a CSS colour.

***

### nodesTitle?

> `optional` **nodesTitle?**: `string` \| `false`

Node-section heading. `false` / empty hides it. Default `'Nodes'`.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default `0.95`.

***

### position?

> `optional` **position?**: `GraphLegendPosition`

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

> `optional` **sort?**: `GraphLegendSort`

Row ordering within each section. Default `'count-desc'`.

***

### swatchSize?

> `optional` **swatchSize?**: `number`

Node swatch diameter in px (the edge swatch derives its length from it). Default `10`.

***

### textColor?

> `optional` **textColor?**: `string`

Row text colour as a CSS colour.

***

### title?

> `optional` **title?**: `string` \| `false`

Panel heading. `false` (or an empty string) hides it. Default `'Legend'`.

***

### toggleOnClick?

> `optional` **toggleOnClick?**: `boolean`

Make rows clickable, toggling that type's visibility in the graph (a
toggled-off row renders struck through and muted). Default `false`.
