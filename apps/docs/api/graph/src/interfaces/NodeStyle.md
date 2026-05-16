# Interface: NodeStyle

Defined in: [graph/src/layer/types.ts:483](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L483)

Visual + structural style for a node. Flat-prefixed scalars for orthogonal
properties (`bgFill`, `bgStrokeWidth`, `labelColor`); polymorphic values
kept structured (`shape`, `icon`, `image`, `decorations`, `effects`,
`badges`).

Per-instance state overlays for a node live at [NodeData.state](NodeData.md#state)
(a sibling of `style`), NOT inside `NodeStyle`.

## Properties

### badges?

> `readonly` `optional` **badges?**: readonly [`NodeBadge`](NodeBadge.md)[]

Defined in: [graph/src/layer/types.ts:555](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L555)

***

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:493](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L493)

***

### bgFill?

> `readonly` `optional` **bgFill?**: [`ShapeFill`](../../../canvas/src/type-aliases/ShapeFill.md)

Defined in: [graph/src/layer/types.ts:492](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L492)

Accepts all six `ShapeFillLayer` kinds — `solid` / `image` / `glyph` /
`svg` / `svg-url` / `image-inset` — and arrays for stacked layers.

***

### bgStrokeAlignment?

> `readonly` `optional` **bgStrokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

Defined in: [graph/src/layer/types.ts:497](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L497)

***

### bgStrokeAlpha?

> `readonly` `optional` **bgStrokeAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:495](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L495)

***

### bgStrokeCap?

> `readonly` `optional` **bgStrokeCap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [graph/src/layer/types.ts:500](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L500)

***

### bgStrokeColor?

> `readonly` `optional` **bgStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:494](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L494)

***

### bgStrokeDashArray?

> `readonly` `optional` **bgStrokeDashArray?**: readonly \[`number`, `number`\]

Defined in: [graph/src/layer/types.ts:498](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L498)

***

### bgStrokeDashOffset?

> `readonly` `optional` **bgStrokeDashOffset?**: `number`

Defined in: [graph/src/layer/types.ts:499](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L499)

***

### bgStrokeJoin?

> `readonly` `optional` **bgStrokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [graph/src/layer/types.ts:501](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L501)

***

### bgStrokeWidth?

> `readonly` `optional` **bgStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:496](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L496)

***

### decorations?

> `readonly` `optional` **decorations?**: [`NodeDecorations`](NodeDecorations.md)

Defined in: [graph/src/layer/types.ts:558](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L558)

***

### effects?

> `readonly` `optional` **effects?**: [`NodeEffects`](NodeEffects.md)

Defined in: [graph/src/layer/types.ts:561](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L561)

***

### icon?

> `readonly` `optional` **icon?**: [`NodeIcon`](../type-aliases/NodeIcon.md)

Defined in: [graph/src/layer/types.ts:504](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L504)

***

### image?

> `readonly` `optional` **image?**: [`NodeImage`](NodeImage.md)

Defined in: [graph/src/layer/types.ts:505](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L505)

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:514](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L514)

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:520](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L520)

***

### labelBackgroundAlpha?

> `readonly` `optional` **labelBackgroundAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:539](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L539)

***

### labelBackgroundCornerRadius?

> `readonly` `optional` **labelBackgroundCornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:543](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L543)

***

### labelBackgroundFill?

> `readonly` `optional` **labelBackgroundFill?**: `number`

Defined in: [graph/src/layer/types.ts:538](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L538)

***

### labelBackgroundPadding?

> `readonly` `optional` **labelBackgroundPadding?**: `number`

Defined in: [graph/src/layer/types.ts:542](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L542)

***

### labelBackgroundStrokeColor?

> `readonly` `optional` **labelBackgroundStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:540](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L540)

***

### labelBackgroundStrokeWidth?

> `readonly` `optional` **labelBackgroundStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:541](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L541)

***

### labelCollisionGroup?

> `readonly` `optional` **labelCollisionGroup?**: `string`

Defined in: [graph/src/layer/types.ts:533](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L533)

Collision partition — labels in different groups never compete.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:509](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L509)

***

### labelFontFamily?

> `readonly` `optional` **labelFontFamily?**: `string`

Defined in: [graph/src/layer/types.ts:511](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L511)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:510](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L510)

***

### labelFontStyle?

> `readonly` `optional` **labelFontStyle?**: `"normal"` \| `"italic"`

Defined in: [graph/src/layer/types.ts:513](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L513)

***

### labelFontWeight?

> `readonly` `optional` **labelFontWeight?**: `string` \| `number`

Defined in: [graph/src/layer/types.ts:512](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L512)

***

### labelForceShow?

> `readonly` `optional` **labelForceShow?**: `boolean`

Defined in: [graph/src/layer/types.ts:535](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L535)

Bypass collision entirely — label always renders.

***

### labelLetterSpacing?

> `readonly` `optional` **labelLetterSpacing?**: `number`

Defined in: [graph/src/layer/types.ts:516](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L516)

***

### labelLineHeight?

> `readonly` `optional` **labelLineHeight?**: `number`

Defined in: [graph/src/layer/types.ts:515](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L515)

***

### labelMaxZoom?

> `readonly` `optional` **labelMaxZoom?**: `number`

Defined in: [graph/src/layer/types.ts:529](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L529)

Hide the label above this camera zoom level.

***

### labelMinFontSize?

> `readonly` `optional` **labelMinFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:521](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L521)

***

### labelMinZoom?

> `readonly` `optional` **labelMinZoom?**: `number`

Defined in: [graph/src/layer/types.ts:527](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L527)

Hide the label below this camera zoom level.

***

### labelOffsetX?

> `readonly` `optional` **labelOffsetX?**: `number`

Defined in: [graph/src/layer/types.ts:518](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L518)

***

### labelOffsetY?

> `readonly` `optional` **labelOffsetY?**: `number`

Defined in: [graph/src/layer/types.ts:519](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L519)

***

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: [`ShapeLabelPlacement`](../../../canvas/src/type-aliases/ShapeLabelPlacement.md)

Defined in: [graph/src/layer/types.ts:517](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L517)

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Defined in: [graph/src/layer/types.ts:531](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L531)

Collision priority — higher wins when two labels overlap.

***

### labelRotation?

> `readonly` `optional` **labelRotation?**: `number`

Defined in: [graph/src/layer/types.ts:523](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L523)

Radians.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: [`ShapeLabelStyle`](../../../canvas/src/interfaces/ShapeLabelStyle.md)

Defined in: [graph/src/layer/types.ts:552](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L552)

Escape hatch — full `ShapeLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, custom collision settings, etc.). When set, the
adapter uses this payload verbatim instead of building one from the
flat fields. Flat label fields are ignored on the same node.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:508](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L508)

***

### shape?

> `readonly` `optional` **shape?**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:485](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L485)
