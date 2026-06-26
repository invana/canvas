# Interface: EdgeStyle

Defined in: [graph/src/layer/types.ts:1110](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1110)

Flat-prefixed style bag for an edge. Edges have one stroke (the path), so
stroke fields are unprefixed. Arrow ends and label keep their distinct
prefixes.

## Properties

### arrowSourceAlpha?

> `readonly` `optional` **arrowSourceAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1128)

***

### arrowSourceColor?

> `readonly` `optional` **arrowSourceColor?**: `number`

Defined in: [graph/src/layer/types.ts:1127](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1127)

***

### arrowSourceShape?

> `readonly` `optional` **arrowSourceShape?**: [`ArrowShape`](../type-aliases/ArrowShape.md)

Defined in: [graph/src/layer/types.ts:1125](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1125)

***

### arrowSourceSize?

> `readonly` `optional` **arrowSourceSize?**: `number`

Defined in: [graph/src/layer/types.ts:1126](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1126)

***

### arrowTargetAlpha?

> `readonly` `optional` **arrowTargetAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1132)

***

### arrowTargetColor?

> `readonly` `optional` **arrowTargetColor?**: `number`

Defined in: [graph/src/layer/types.ts:1131](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1131)

***

### arrowTargetShape?

> `readonly` `optional` **arrowTargetShape?**: [`ArrowShape`](../type-aliases/ArrowShape.md)

Defined in: [graph/src/layer/types.ts:1129](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1129)

***

### arrowTargetSize?

> `readonly` `optional` **arrowTargetSize?**: `number`

Defined in: [graph/src/layer/types.ts:1130](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1130)

***

### badges?

> `readonly` `optional` **badges?**: readonly [`EdgeBadge`](EdgeBadge.md)[]

Defined in: [graph/src/layer/types.ts:1203](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1203)

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

Defined in: [graph/src/layer/types.ts:1189](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1189)

Ordered list of decorations attached to the edge. Each entry's `kind`
names a registered canvas connector-decoration; the rest is that
decoration's style payload. See [EdgeDecorationSpec](../type-aliases/EdgeDecorationSpec.md).

Resolver semantics match [NodeStyle.decorations](NodeStyle.md#decorations): concatenate
across base + active state overlays, dedupe by `id`, later precedence
wins.

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:1141](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1141)

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1150](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1150)

***

### labelAutoRotate?

> `readonly` `optional` **labelAutoRotate?**: `boolean`

Defined in: [graph/src/layer/types.ts:1146](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1146)

***

### labelBackgroundAlpha?

> `readonly` `optional` **labelBackgroundAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1165](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1165)

***

### labelBackgroundCornerRadius?

> `readonly` `optional` **labelBackgroundCornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:1169](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1169)

***

### labelBackgroundFill?

> `readonly` `optional` **labelBackgroundFill?**: `number`

Defined in: [graph/src/layer/types.ts:1164](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1164)

***

### labelBackgroundPadding?

> `readonly` `optional` **labelBackgroundPadding?**: `number`

Defined in: [graph/src/layer/types.ts:1168](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1168)

***

### labelBackgroundStrokeColor?

> `readonly` `optional` **labelBackgroundStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:1166](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1166)

***

### labelBackgroundStrokeWidth?

> `readonly` `optional` **labelBackgroundStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:1167](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1167)

***

### labelCollisionGroup?

> `readonly` `optional` **labelCollisionGroup?**: `string`

Defined in: [graph/src/layer/types.ts:1161](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1161)

Collision partition — labels in different groups never compete.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:1136](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1136)

***

### labelFontFamily?

> `readonly` `optional` **labelFontFamily?**: `string`

Defined in: [graph/src/layer/types.ts:1138](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1138)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:1137](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1137)

***

### labelFontStyle?

> `readonly` `optional` **labelFontStyle?**: `"normal"` \| `"italic"`

Defined in: [graph/src/layer/types.ts:1140](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1140)

***

### labelFontWeight?

> `readonly` `optional` **labelFontWeight?**: `string` \| `number`

Defined in: [graph/src/layer/types.ts:1139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1139)

***

### labelForceShow?

> `readonly` `optional` **labelForceShow?**: `boolean`

Defined in: [graph/src/layer/types.ts:1163](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1163)

Bypass collision entirely — label always renders.

***

### labelKeepUpright?

> `readonly` `optional` **labelKeepUpright?**: `boolean`

Defined in: [graph/src/layer/types.ts:1147](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1147)

***

### labelLetterSpacing?

> `readonly` `optional` **labelLetterSpacing?**: `number`

Defined in: [graph/src/layer/types.ts:1143](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1143)

***

### labelLineHeight?

> `readonly` `optional` **labelLineHeight?**: `number`

Defined in: [graph/src/layer/types.ts:1142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1142)

***

### labelMaxZoom?

> `readonly` `optional` **labelMaxZoom?**: `number`

Defined in: [graph/src/layer/types.ts:1157](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1157)

Hide the label above this camera zoom level.

***

### labelMinFontSize?

> `readonly` `optional` **labelMinFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:1151](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1151)

***

### labelMinZoom?

> `readonly` `optional` **labelMinZoom?**: `number`

Defined in: [graph/src/layer/types.ts:1155](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1155)

Hide the label below this camera zoom level.

***

### labelOffsetX?

> `readonly` `optional` **labelOffsetX?**: `number`

Defined in: [graph/src/layer/types.ts:1148](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1148)

***

### labelOffsetY?

> `readonly` `optional` **labelOffsetY?**: `number`

Defined in: [graph/src/layer/types.ts:1149](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1149)

***

### labelPathOffset?

> `readonly` `optional` **labelPathOffset?**: `number`

Defined in: [graph/src/layer/types.ts:1145](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1145)

***

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: `ConnectorLabelPlacement`

Defined in: [graph/src/layer/types.ts:1144](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1144)

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Defined in: [graph/src/layer/types.ts:1159](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1159)

Collision priority — higher wins when two labels overlap.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: `ConnectorLabelStyle`

Defined in: [graph/src/layer/types.ts:1177](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1177)

Escape hatch — full `ConnectorLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, etc.). When set, the adapter uses this payload
verbatim instead of building one from the flat fields.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:1135](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1135)

***

### shape?

> `readonly` `optional` **shape?**: [`EdgeShapeOptions`](EdgeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:1112](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1112)

***

### strokeAlignment?

> `readonly` `optional` **strokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

Defined in: [graph/src/layer/types.ts:1118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1118)

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1116](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1116)

***

### strokeCap?

> `readonly` `optional` **strokeCap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [graph/src/layer/types.ts:1121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1121)

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:1115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1115)

***

### strokeDashArray?

> `readonly` `optional` **strokeDashArray?**: readonly \[`number`, `number`\]

Defined in: [graph/src/layer/types.ts:1119](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1119)

***

### strokeDashOffset?

> `readonly` `optional` **strokeDashOffset?**: `number`

Defined in: [graph/src/layer/types.ts:1120](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1120)

***

### strokeJoin?

> `readonly` `optional` **strokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [graph/src/layer/types.ts:1122](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1122)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:1117](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1117)
