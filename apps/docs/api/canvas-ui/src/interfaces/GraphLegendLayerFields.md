# Interface: GraphLegendLayerFields

Flat form-field shape the `@invana/forms` generator renders. Identical to
[GraphLegendLayerOptions](GraphLegendLayerOptions.md) except: the engine's `margin: number | { x?, y? }`
union is split into two scalar fields (a single field can't be both),
`fallbackColor` becomes a `#rrggbb` string (what the colour swatch emits), and
the three headings are plain strings — a text input expresses "no heading" as
`''`, never `false`.

## Extends

- `Omit`\<[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md), `"margin"` \| `"fallbackColor"` \| `"title"` \| `"nodesTitle"` \| `"edgesTitle"`\>

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Panel background as a CSS colour (may be `rgba(...)`).

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`backgroundColor`](GraphLegendLayerOptions.md#backgroundcolor)

***

### borderColor?

> `optional` **borderColor?**: `string`

Panel border colour as a CSS colour (may be `rgba(...)`).

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`borderColor`](GraphLegendLayerOptions.md#bordercolor)

***

### borderRadius?

> `optional` **borderRadius?**: `number`

Panel corner radius in px. Default `6`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`borderRadius`](GraphLegendLayerOptions.md#borderradius)

***

### countMode?

> `optional` **countMode?**: `GraphLegendCountMode`

How the count is rendered. Default `'both'` (`visible / total`).

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`countMode`](GraphLegendLayerOptions.md#countmode)

***

### edgesTitle?

> `optional` **edgesTitle?**: `string`

Edge-section heading; `''` for none.

***

### fallbackColor?

> `optional` **fallbackColor?**: `string`

Fallback swatch colour as `#rrggbb`.

***

### fontSize?

> `optional` **fontSize?**: `number`

Text size in px. Default `11`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`fontSize`](GraphLegendLayerOptions.md#fontsize)

***

### hiddenTypeOpacity?

> `optional` **hiddenTypeOpacity?**: `number`

Row opacity when its type is toggled off. Default `0.45`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`hiddenTypeOpacity`](GraphLegendLayerOptions.md#hiddentypeopacity)

***

### hideEmpty?

> `optional` **hideEmpty?**: `boolean`

Drop rows whose visible count is `0`. Default `false`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`hideEmpty`](GraphLegendLayerOptions.md#hideempty)

***

### marginX?

> `optional` **marginX?**: `number`

Horizontal inset in px. Maps into `margin`.

***

### marginY?

> `optional` **marginY?**: `number`

Vertical inset in px. Maps into `margin`.

***

### maxRows?

> `optional` **maxRows?**: `number`

Cap on rows per section; the remainder collapses to `+N more`. `0` = no cap. Default `12`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`maxRows`](GraphLegendLayerOptions.md#maxrows)

***

### mode?

> `optional` **mode?**: `GraphLegendMode`

How `{ light, dark }` colours resolve. Default `'auto'`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`mode`](GraphLegendLayerOptions.md#mode)

***

### mutedColor?

> `optional` **mutedColor?**: `string`

Section-heading + count colour as a CSS colour.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`mutedColor`](GraphLegendLayerOptions.md#mutedcolor)

***

### nodesTitle?

> `optional` **nodesTitle?**: `string`

Node-section heading; `''` for none.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default `0.95`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`opacity`](GraphLegendLayerOptions.md#opacity)

***

### position?

> `optional` **position?**: `GraphLegendPosition`

Anchor corner. Default `'top-left'`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`position`](GraphLegendLayerOptions.md#position)

***

### showCounts?

> `optional` **showCounts?**: `boolean`

Show the per-type counts. Default `true`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`showCounts`](GraphLegendLayerOptions.md#showcounts)

***

### showEdges?

> `optional` **showEdges?**: `boolean`

Include the edge-type section. Default `true`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`showEdges`](GraphLegendLayerOptions.md#showedges)

***

### showNodes?

> `optional` **showNodes?**: `boolean`

Include the node-type section. Default `true`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`showNodes`](GraphLegendLayerOptions.md#shownodes)

***

### sort?

> `optional` **sort?**: `GraphLegendSort`

Row ordering within each section. Default `'count-desc'`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`sort`](GraphLegendLayerOptions.md#sort)

***

### swatchSize?

> `optional` **swatchSize?**: `number`

Node swatch diameter in px (the edge swatch derives its length from it). Default `10`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`swatchSize`](GraphLegendLayerOptions.md#swatchsize)

***

### textColor?

> `optional` **textColor?**: `string`

Row text colour as a CSS colour.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`textColor`](GraphLegendLayerOptions.md#textcolor)

***

### title?

> `optional` **title?**: `string`

Panel heading; `''` for none.

***

### toggleOnClick?

> `optional` **toggleOnClick?**: `boolean`

Make rows clickable, toggling that type's visibility in the graph (a
toggled-off row renders struck through and muted). Default `false`.

#### Inherited from

[`GraphLegendLayerOptions`](GraphLegendLayerOptions.md).[`toggleOnClick`](GraphLegendLayerOptions.md#toggleonclick)
