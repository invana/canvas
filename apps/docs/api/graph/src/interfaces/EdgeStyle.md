# Interface: EdgeStyle

Defined in: [graph/src/layer/types.ts:1057](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1057)

Flat-prefixed style bag for an edge. Edges have one stroke (the path), so
stroke fields are unprefixed. Arrow ends and label keep their distinct
prefixes.

## Properties

### arrowSourceAlpha?

> `readonly` `optional` **arrowSourceAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1075](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1075)

***

### arrowSourceColor?

> `readonly` `optional` **arrowSourceColor?**: `number`

Defined in: [graph/src/layer/types.ts:1074](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1074)

***

### arrowSourceShape?

> `readonly` `optional` **arrowSourceShape?**: [`ArrowShape`](../type-aliases/ArrowShape.md)

Defined in: [graph/src/layer/types.ts:1072](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1072)

***

### arrowSourceSize?

> `readonly` `optional` **arrowSourceSize?**: `number`

Defined in: [graph/src/layer/types.ts:1073](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1073)

***

### arrowTargetAlpha?

> `readonly` `optional` **arrowTargetAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1079](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1079)

***

### arrowTargetColor?

> `readonly` `optional` **arrowTargetColor?**: `number`

Defined in: [graph/src/layer/types.ts:1078](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1078)

***

### arrowTargetShape?

> `readonly` `optional` **arrowTargetShape?**: [`ArrowShape`](../type-aliases/ArrowShape.md)

Defined in: [graph/src/layer/types.ts:1076](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1076)

***

### arrowTargetSize?

> `readonly` `optional` **arrowTargetSize?**: `number`

Defined in: [graph/src/layer/types.ts:1077](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1077)

***

### badges?

> `readonly` `optional` **badges?**: readonly [`EdgeBadge`](EdgeBadge.md)[]

Defined in: [graph/src/layer/types.ts:1150](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1150)

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

Defined in: [graph/src/layer/types.ts:1136](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1136)

Ordered list of decorations attached to the edge. Each entry's `kind`
names a registered canvas connector-decoration; the rest is that
decoration's style payload. See [EdgeDecorationSpec](../type-aliases/EdgeDecorationSpec.md).

Resolver semantics match [NodeStyle.decorations](NodeStyle.md#decorations): concatenate
across base + active state overlays, dedupe by `id`, later precedence
wins.

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:1088](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1088)

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1097](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1097)

***

### labelAutoRotate?

> `readonly` `optional` **labelAutoRotate?**: `boolean`

Defined in: [graph/src/layer/types.ts:1093](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1093)

***

### labelBackgroundAlpha?

> `readonly` `optional` **labelBackgroundAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1112](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1112)

***

### labelBackgroundCornerRadius?

> `readonly` `optional` **labelBackgroundCornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:1116](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1116)

***

### labelBackgroundFill?

> `readonly` `optional` **labelBackgroundFill?**: `number`

Defined in: [graph/src/layer/types.ts:1111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1111)

***

### labelBackgroundPadding?

> `readonly` `optional` **labelBackgroundPadding?**: `number`

Defined in: [graph/src/layer/types.ts:1115](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1115)

***

### labelBackgroundStrokeColor?

> `readonly` `optional` **labelBackgroundStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:1113](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1113)

***

### labelBackgroundStrokeWidth?

> `readonly` `optional` **labelBackgroundStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:1114](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1114)

***

### labelCollisionGroup?

> `readonly` `optional` **labelCollisionGroup?**: `string`

Defined in: [graph/src/layer/types.ts:1108](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1108)

Collision partition — labels in different groups never compete.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:1083](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1083)

***

### labelFontFamily?

> `readonly` `optional` **labelFontFamily?**: `string`

Defined in: [graph/src/layer/types.ts:1085](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1085)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:1084](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1084)

***

### labelFontStyle?

> `readonly` `optional` **labelFontStyle?**: `"normal"` \| `"italic"`

Defined in: [graph/src/layer/types.ts:1087](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1087)

***

### labelFontWeight?

> `readonly` `optional` **labelFontWeight?**: `string` \| `number`

Defined in: [graph/src/layer/types.ts:1086](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1086)

***

### labelForceShow?

> `readonly` `optional` **labelForceShow?**: `boolean`

Defined in: [graph/src/layer/types.ts:1110](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1110)

Bypass collision entirely — label always renders.

***

### labelKeepUpright?

> `readonly` `optional` **labelKeepUpright?**: `boolean`

Defined in: [graph/src/layer/types.ts:1094](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1094)

***

### labelLetterSpacing?

> `readonly` `optional` **labelLetterSpacing?**: `number`

Defined in: [graph/src/layer/types.ts:1090](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1090)

***

### labelLineHeight?

> `readonly` `optional` **labelLineHeight?**: `number`

Defined in: [graph/src/layer/types.ts:1089](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1089)

***

### labelMaxZoom?

> `readonly` `optional` **labelMaxZoom?**: `number`

Defined in: [graph/src/layer/types.ts:1104](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1104)

Hide the label above this camera zoom level.

***

### labelMinFontSize?

> `readonly` `optional` **labelMinFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:1098](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1098)

***

### labelMinZoom?

> `readonly` `optional` **labelMinZoom?**: `number`

Defined in: [graph/src/layer/types.ts:1102](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1102)

Hide the label below this camera zoom level.

***

### labelOffsetX?

> `readonly` `optional` **labelOffsetX?**: `number`

Defined in: [graph/src/layer/types.ts:1095](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1095)

***

### labelOffsetY?

> `readonly` `optional` **labelOffsetY?**: `number`

Defined in: [graph/src/layer/types.ts:1096](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1096)

***

### labelPathOffset?

> `readonly` `optional` **labelPathOffset?**: `number`

Defined in: [graph/src/layer/types.ts:1092](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1092)

***

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: [`ConnectorLabelPlacement`](../../../canvas/src/type-aliases/ConnectorLabelPlacement.md)

Defined in: [graph/src/layer/types.ts:1091](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1091)

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Defined in: [graph/src/layer/types.ts:1106](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1106)

Collision priority — higher wins when two labels overlap.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: [`ConnectorLabelStyle`](../../../canvas/src/interfaces/ConnectorLabelStyle.md)

Defined in: [graph/src/layer/types.ts:1124](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1124)

Escape hatch — full `ConnectorLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, etc.). When set, the adapter uses this payload
verbatim instead of building one from the flat fields.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:1082](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1082)

***

### shape?

> `readonly` `optional` **shape?**: [`EdgeShapeOptions`](EdgeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:1059](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1059)

***

### strokeAlignment?

> `readonly` `optional` **strokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

Defined in: [graph/src/layer/types.ts:1065](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1065)

***

### strokeAlpha?

> `readonly` `optional` **strokeAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:1063](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1063)

***

### strokeCap?

> `readonly` `optional` **strokeCap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [graph/src/layer/types.ts:1068](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1068)

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:1062](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1062)

***

### strokeDashArray?

> `readonly` `optional` **strokeDashArray?**: readonly \[`number`, `number`\]

Defined in: [graph/src/layer/types.ts:1066](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1066)

***

### strokeDashOffset?

> `readonly` `optional` **strokeDashOffset?**: `number`

Defined in: [graph/src/layer/types.ts:1067](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1067)

***

### strokeJoin?

> `readonly` `optional` **strokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [graph/src/layer/types.ts:1069](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1069)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:1064](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1064)
