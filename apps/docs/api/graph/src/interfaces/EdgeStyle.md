# Interface: EdgeStyle

Flat-prefixed style bag for an edge. Edges have one stroke (the path), so
stroke fields are unprefixed. Arrow ends and label keep their distinct
prefixes.

## Properties

### arrowSourceAlpha?

> `readonly` `optional` **arrowSourceAlpha?**: `number`

***

### arrowSourceColor?

> `readonly` `optional` **arrowSourceColor?**: `number`

***

### arrowSourceShape?

> `readonly` `optional` **arrowSourceShape?**: [`ArrowShape`](../type-aliases/ArrowShape.md)

***

### arrowSourceSize?

> `readonly` `optional` **arrowSourceSize?**: `number`

***

### arrowTargetAlpha?

> `readonly` `optional` **arrowTargetAlpha?**: `number`

***

### arrowTargetColor?

> `readonly` `optional` **arrowTargetColor?**: `number`

***

### arrowTargetShape?

> `readonly` `optional` **arrowTargetShape?**: [`ArrowShape`](../type-aliases/ArrowShape.md)

***

### arrowTargetSize?

> `readonly` `optional` **arrowTargetSize?**: `number`

***

### badges?

> `readonly` `optional` **badges?**: readonly [`EdgeBadge`](EdgeBadge.md)[]

Ordered list of badges attached to the edge. Each entry is a real
[EdgeBadge](EdgeBadge.md) — any registered shape kind as the plate, optional
icon / labelText sugar, optional nested decorations and effects.
Placement is parametric along the routed path (`'start' | 'middle' |
'end' | number`) and re-anchors automatically when the path changes
(source / target shape moves, anchor / router / waypoints change).

Resolver semantics match [decorations](#decorations): concatenate across base
+ active state overlays, dedupe by `id`, later precedence wins.

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

Ordered list of decorations attached to the edge. Each entry's `kind`
names a registered canvas connector-decoration; the rest is that
decoration's style payload. See [EdgeDecorationSpec](../type-aliases/EdgeDecorationSpec.md).

Resolver semantics match [NodeStyle.decorations](NodeStyle.md#decorations): concatenate
across base + active state overlays, dedupe by `id`, later precedence
wins.

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"center"` \| `"left"` \| `"right"`

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

***

### labelAutoRotate?

> `readonly` `optional` **labelAutoRotate?**: `boolean`

***

### labelBackgroundAlpha?

> `readonly` `optional` **labelBackgroundAlpha?**: `number`

***

### labelBackgroundCornerRadius?

> `readonly` `optional` **labelBackgroundCornerRadius?**: `number`

***

### labelBackgroundFill?

> `readonly` `optional` **labelBackgroundFill?**: `number`

***

### labelBackgroundPadding?

> `readonly` `optional` **labelBackgroundPadding?**: `number`

***

### labelBackgroundStrokeColor?

> `readonly` `optional` **labelBackgroundStrokeColor?**: `number`

***

### labelBackgroundStrokeWidth?

> `readonly` `optional` **labelBackgroundStrokeWidth?**: `number`

***

### labelCollisionGroup?

> `readonly` `optional` **labelCollisionGroup?**: `string`

Collision partition — labels in different groups never compete.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

***

### labelFontFamily?

> `readonly` `optional` **labelFontFamily?**: `string`

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

***

### labelFontStyle?

> `readonly` `optional` **labelFontStyle?**: `"normal"` \| `"italic"`

***

### labelFontWeight?

> `readonly` `optional` **labelFontWeight?**: `string` \| `number`

***

### labelForceShow?

> `readonly` `optional` **labelForceShow?**: `boolean`

Bypass collision entirely — label always renders.

***

### labelKeepUpright?

> `readonly` `optional` **labelKeepUpright?**: `boolean`

***

### labelLetterSpacing?

> `readonly` `optional` **labelLetterSpacing?**: `number`

***

### labelLineHeight?

> `readonly` `optional` **labelLineHeight?**: `number`

***

### labelMaxZoom?

> `readonly` `optional` **labelMaxZoom?**: `number`

Hide the label above this camera zoom level.

***

### labelMinFontSize?

> `readonly` `optional` **labelMinFontSize?**: `number`

***

### labelMinZoom?

> `readonly` `optional` **labelMinZoom?**: `number`

Hide the label below this camera zoom level.

***

### labelOffsetX?

> `readonly` `optional` **labelOffsetX?**: `number`

***

### labelOffsetY?

> `readonly` `optional` **labelOffsetY?**: `number`

***

### labelPathOffset?

> `readonly` `optional` **labelPathOffset?**: `number`

***

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: `ConnectorLabelPlacement`

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Collision priority — higher wins when two labels overlap.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: `ConnectorLabelStyle`

Escape hatch — full `ConnectorLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, etc.). When set, the adapter uses this payload
verbatim instead of building one from the flat fields.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

***

### shape?

> `readonly` `optional` **shape?**: [`EdgeShapeOptions`](EdgeShapeOptions.md)

***

### strokeAlignment?

> `readonly` `optional` **strokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

***

### strokeCap?

> `readonly` `optional` **strokeCap?**: `"butt"` \| `"round"` \| `"square"`

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

***

### strokeDashArray?

> `readonly` `optional` **strokeDashArray?**: readonly \[`number`, `number`\]

***

### strokeDashOffset?

> `readonly` `optional` **strokeDashOffset?**: `number`

***

### strokeJoin?

> `readonly` `optional` **strokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`
