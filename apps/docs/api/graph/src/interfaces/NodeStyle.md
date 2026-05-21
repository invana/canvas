# Interface: NodeStyle

Defined in: [graph/src/layer/types.ts:837](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L837)

Visual + structural style for a node. Flat-prefixed scalars for orthogonal
properties (`bgFill`, `bgStrokeWidth`, `labelColor`); polymorphic values
kept structured (`shape`, `icon`, `image`, `decorations`, `effects`,
`badges`).

Per-instance state overlays for a node live at [NodeData.state](NodeData.md#state)
(a sibling of `style`), NOT inside `NodeStyle`.

## Properties

### badges?

> `readonly` `optional` **badges?**: readonly [`NodeBadge`](NodeBadge.md)[]

Defined in: [graph/src/layer/types.ts:934](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L934)

***

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:872](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L872)

***

### bgFill?

> `readonly` `optional` **bgFill?**: [`ShapeFill`](../../../canvas/src/type-aliases/ShapeFill.md)

Defined in: [graph/src/layer/types.ts:871](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L871)

Accepts every `ShapeFillLayer` kind — `solid` / `image` / `glyph` /
`svg` / `svg-url` — and arrays for stacked layers. The `image` kind
doubles as silhouette filler and inset content via its `fit` field
(`'inset'` vs the silhouette modes).

***

### bgStrokeAlignment?

> `readonly` `optional` **bgStrokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

Defined in: [graph/src/layer/types.ts:876](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L876)

***

### bgStrokeAlpha?

> `readonly` `optional` **bgStrokeAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:874](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L874)

***

### bgStrokeCap?

> `readonly` `optional` **bgStrokeCap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [graph/src/layer/types.ts:879](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L879)

***

### bgStrokeColor?

> `readonly` `optional` **bgStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:873](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L873)

***

### bgStrokeDashArray?

> `readonly` `optional` **bgStrokeDashArray?**: readonly \[`number`, `number`\]

Defined in: [graph/src/layer/types.ts:877](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L877)

***

### bgStrokeDashOffset?

> `readonly` `optional` **bgStrokeDashOffset?**: `number`

Defined in: [graph/src/layer/types.ts:878](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L878)

***

### bgStrokeJoin?

> `readonly` `optional` **bgStrokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [graph/src/layer/types.ts:880](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L880)

***

### bgStrokeWidth?

> `readonly` `optional` **bgStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:875](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L875)

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

Defined in: [graph/src/layer/types.ts:947](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L947)

Ordered list of decorations attached to the node. Each entry's `kind`
names a registered canvas decoration; the rest of the entry is that
decoration's style payload. See [NodeDecorationSpec](../type-aliases/NodeDecorationSpec.md).

The resolver concatenates this array across base style + every active
state's overlay, then dedupes by `id` (later precedence wins). Use
`remove: true` in a higher-precedence overlay to drop an earlier entry
with the same id while a state is active.

***

### effects?

> `readonly` `optional` **effects?**: [`NodeEffects`](NodeEffects.md)

Defined in: [graph/src/layer/types.ts:950](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L950)

***

### group?

> `readonly` `optional` **group?**: [`GroupOptions`](GroupOptions.md)

Defined in: [graph/src/layer/types.ts:851](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L851)

Marks this node as a compound group (visual frame drawn behind its
descendants). See [GroupOptions](GroupOptions.md) for the full contract — autoFit
vs userResizable, expanded vs collapsed semantics, header band, edge
re-routing.

Presence of this field is the only discriminator. The structural shape
(`shape: { kind: 'rect' | 'circle' }`) is unchanged; groups reuse the
same primitives as regular nodes.

***

### icon?

> `readonly` `optional` **icon?**: [`NodeIcon`](../type-aliases/NodeIcon.md)

Defined in: [graph/src/layer/types.ts:883](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L883)

***

### image?

> `readonly` `optional` **image?**: [`NodeImage`](NodeImage.md)

Defined in: [graph/src/layer/types.ts:884](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L884)

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:893](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L893)

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:899](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L899)

***

### labelBackgroundAlpha?

> `readonly` `optional` **labelBackgroundAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:918](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L918)

***

### labelBackgroundCornerRadius?

> `readonly` `optional` **labelBackgroundCornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:922](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L922)

***

### labelBackgroundFill?

> `readonly` `optional` **labelBackgroundFill?**: `number`

Defined in: [graph/src/layer/types.ts:917](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L917)

***

### labelBackgroundPadding?

> `readonly` `optional` **labelBackgroundPadding?**: `number`

Defined in: [graph/src/layer/types.ts:921](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L921)

***

### labelBackgroundStrokeColor?

> `readonly` `optional` **labelBackgroundStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:919](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L919)

***

### labelBackgroundStrokeWidth?

> `readonly` `optional` **labelBackgroundStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:920](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L920)

***

### labelCollisionGroup?

> `readonly` `optional` **labelCollisionGroup?**: `string`

Defined in: [graph/src/layer/types.ts:912](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L912)

Collision partition — labels in different groups never compete.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:888](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L888)

***

### labelFontFamily?

> `readonly` `optional` **labelFontFamily?**: `string`

Defined in: [graph/src/layer/types.ts:890](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L890)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:889](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L889)

***

### labelFontStyle?

> `readonly` `optional` **labelFontStyle?**: `"normal"` \| `"italic"`

Defined in: [graph/src/layer/types.ts:892](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L892)

***

### labelFontWeight?

> `readonly` `optional` **labelFontWeight?**: `string` \| `number`

Defined in: [graph/src/layer/types.ts:891](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L891)

***

### labelForceShow?

> `readonly` `optional` **labelForceShow?**: `boolean`

Defined in: [graph/src/layer/types.ts:914](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L914)

Bypass collision entirely — label always renders.

***

### labelLetterSpacing?

> `readonly` `optional` **labelLetterSpacing?**: `number`

Defined in: [graph/src/layer/types.ts:895](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L895)

***

### labelLineHeight?

> `readonly` `optional` **labelLineHeight?**: `number`

Defined in: [graph/src/layer/types.ts:894](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L894)

***

### labelMaxZoom?

> `readonly` `optional` **labelMaxZoom?**: `number`

Defined in: [graph/src/layer/types.ts:908](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L908)

Hide the label above this camera zoom level.

***

### labelMinFontSize?

> `readonly` `optional` **labelMinFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:900](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L900)

***

### labelMinZoom?

> `readonly` `optional` **labelMinZoom?**: `number`

Defined in: [graph/src/layer/types.ts:906](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L906)

Hide the label below this camera zoom level.

***

### labelOffsetX?

> `readonly` `optional` **labelOffsetX?**: `number`

Defined in: [graph/src/layer/types.ts:897](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L897)

***

### labelOffsetY?

> `readonly` `optional` **labelOffsetY?**: `number`

Defined in: [graph/src/layer/types.ts:898](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L898)

***

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: [`ShapeLabelPlacement`](../../../canvas/src/type-aliases/ShapeLabelPlacement.md)

Defined in: [graph/src/layer/types.ts:896](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L896)

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Defined in: [graph/src/layer/types.ts:910](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L910)

Collision priority — higher wins when two labels overlap.

***

### labelRotation?

> `readonly` `optional` **labelRotation?**: `number`

Defined in: [graph/src/layer/types.ts:902](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L902)

Radians.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: [`ShapeLabelStyle`](../../../canvas/src/interfaces/ShapeLabelStyle.md)

Defined in: [graph/src/layer/types.ts:931](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L931)

Escape hatch — full `ShapeLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, custom collision settings, etc.). When set, the
adapter uses this payload verbatim instead of building one from the
flat fields. Flat label fields are ignored on the same node.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:887](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L887)

***

### resizable?

> `readonly` `optional` **resizable?**: `boolean`

Defined in: [graph/src/layer/types.ts:862](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L862)

When `true`, `NodeResizeBehaviour` mounts corner-handle decorations on
this node (rect / circle only) and lets the user drag to resize. The
drag writes back to `style.shape.width` / `height` / `radius` directly
(and `position` for non-corner-anchored rect drags). Independent from
`style.group?.userResizable`, which targets group frames specifically
— but both are honoured by the same behaviour, so a single registered
`NodeResizeBehaviour` handles every resizable node in the layer.

***

### shape?

> `readonly` `optional` **shape?**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:839](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L839)
