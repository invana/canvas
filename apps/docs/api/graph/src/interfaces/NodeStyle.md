# Interface: NodeStyle

Defined in: [graph/src/layer/types.ts:867](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L867)

Visual + structural style for a node. Flat-prefixed scalars for orthogonal
properties (`bgFill`, `bgStrokeWidth`, `labelColor`); polymorphic values
kept structured (`shape`, `icon`, `image`, `decorations`, `effects`,
`badges`).

Per-instance state overlays for a node live at [NodeData.state](NodeData.md#state)
(a sibling of `style`), NOT inside `NodeStyle`.

## Properties

### badges?

> `readonly` `optional` **badges?**: readonly [`NodeBadge`](NodeBadge.md)[]

Defined in: [graph/src/layer/types.ts:987](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L987)

***

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:925](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L925)

***

### bgFill?

> `readonly` `optional` **bgFill?**: `ShapeFill`

Defined in: [graph/src/layer/types.ts:924](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L924)

Accepts every `ShapeFillLayer` kind — `solid` / `image` / `glyph` /
`svg` / `svg-url` — and arrays for stacked layers. The `image` kind
doubles as silhouette filler and inset content via its `fit` field
(`'inset'` vs the silhouette modes).

***

### bgStrokeAlignment?

> `readonly` `optional` **bgStrokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

Defined in: [graph/src/layer/types.ts:929](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L929)

***

### bgStrokeAlpha?

> `readonly` `optional` **bgStrokeAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:927](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L927)

***

### bgStrokeCap?

> `readonly` `optional` **bgStrokeCap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [graph/src/layer/types.ts:932](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L932)

***

### bgStrokeColor?

> `readonly` `optional` **bgStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:926](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L926)

***

### bgStrokeDashArray?

> `readonly` `optional` **bgStrokeDashArray?**: readonly \[`number`, `number`\]

Defined in: [graph/src/layer/types.ts:930](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L930)

***

### bgStrokeDashOffset?

> `readonly` `optional` **bgStrokeDashOffset?**: `number`

Defined in: [graph/src/layer/types.ts:931](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L931)

***

### bgStrokeJoin?

> `readonly` `optional` **bgStrokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [graph/src/layer/types.ts:933](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L933)

***

### bgStrokeWidth?

> `readonly` `optional` **bgStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:928](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L928)

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

Defined in: [graph/src/layer/types.ts:1000](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1000)

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

Defined in: [graph/src/layer/types.ts:1003](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1003)

***

### group?

> `readonly` `optional` **group?**: [`GroupOptions`](GroupOptions.md)

Defined in: [graph/src/layer/types.ts:904](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L904)

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

Defined in: [graph/src/layer/types.ts:936](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L936)

***

### image?

> `readonly` `optional` **image?**: [`NodeImage`](NodeImage.md)

Defined in: [graph/src/layer/types.ts:937](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L937)

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"left"` \| `"right"` \| `"center"`

Defined in: [graph/src/layer/types.ts:946](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L946)

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:952](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L952)

***

### labelBackgroundAlpha?

> `readonly` `optional` **labelBackgroundAlpha?**: `number`

Defined in: [graph/src/layer/types.ts:971](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L971)

***

### labelBackgroundCornerRadius?

> `readonly` `optional` **labelBackgroundCornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:975](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L975)

***

### labelBackgroundFill?

> `readonly` `optional` **labelBackgroundFill?**: `number`

Defined in: [graph/src/layer/types.ts:970](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L970)

***

### labelBackgroundPadding?

> `readonly` `optional` **labelBackgroundPadding?**: `number`

Defined in: [graph/src/layer/types.ts:974](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L974)

***

### labelBackgroundStrokeColor?

> `readonly` `optional` **labelBackgroundStrokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:972](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L972)

***

### labelBackgroundStrokeWidth?

> `readonly` `optional` **labelBackgroundStrokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:973](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L973)

***

### labelCollisionGroup?

> `readonly` `optional` **labelCollisionGroup?**: `string`

Defined in: [graph/src/layer/types.ts:965](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L965)

Collision partition — labels in different groups never compete.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:941](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L941)

***

### labelFontFamily?

> `readonly` `optional` **labelFontFamily?**: `string`

Defined in: [graph/src/layer/types.ts:943](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L943)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:942](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L942)

***

### labelFontStyle?

> `readonly` `optional` **labelFontStyle?**: `"normal"` \| `"italic"`

Defined in: [graph/src/layer/types.ts:945](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L945)

***

### labelFontWeight?

> `readonly` `optional` **labelFontWeight?**: `string` \| `number`

Defined in: [graph/src/layer/types.ts:944](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L944)

***

### labelForceShow?

> `readonly` `optional` **labelForceShow?**: `boolean`

Defined in: [graph/src/layer/types.ts:967](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L967)

Bypass collision entirely — label always renders.

***

### labelLetterSpacing?

> `readonly` `optional` **labelLetterSpacing?**: `number`

Defined in: [graph/src/layer/types.ts:948](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L948)

***

### labelLineHeight?

> `readonly` `optional` **labelLineHeight?**: `number`

Defined in: [graph/src/layer/types.ts:947](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L947)

***

### labelMaxZoom?

> `readonly` `optional` **labelMaxZoom?**: `number`

Defined in: [graph/src/layer/types.ts:961](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L961)

Hide the label above this camera zoom level.

***

### labelMinFontSize?

> `readonly` `optional` **labelMinFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:953](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L953)

***

### labelMinZoom?

> `readonly` `optional` **labelMinZoom?**: `number`

Defined in: [graph/src/layer/types.ts:959](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L959)

Hide the label below this camera zoom level.

***

### labelOffsetX?

> `readonly` `optional` **labelOffsetX?**: `number`

Defined in: [graph/src/layer/types.ts:950](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L950)

***

### labelOffsetY?

> `readonly` `optional` **labelOffsetY?**: `number`

Defined in: [graph/src/layer/types.ts:951](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L951)

***

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: `ShapeLabelPlacement`

Defined in: [graph/src/layer/types.ts:949](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L949)

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Defined in: [graph/src/layer/types.ts:963](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L963)

Collision priority — higher wins when two labels overlap.

***

### labelRotation?

> `readonly` `optional` **labelRotation?**: `number`

Defined in: [graph/src/layer/types.ts:955](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L955)

Radians.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: `ShapeLabelStyle`

Defined in: [graph/src/layer/types.ts:984](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L984)

Escape hatch — full `ShapeLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, custom collision settings, etc.). When set, the
adapter uses this payload verbatim instead of building one from the
flat fields. Flat label fields are ignored on the same node.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:940](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L940)

***

### resizable?

> `readonly` `optional` **resizable?**: `boolean`

Defined in: [graph/src/layer/types.ts:915](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L915)

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

Defined in: [graph/src/layer/types.ts:869](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L869)

***

### size?

> `readonly` `optional` **size?**: `number`

Defined in: [graph/src/layer/types.ts:892](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L892)

Unified normalized size. When set, overrides the resolved `shape`'s
intrinsic size fields at style-resolution time (before the spec reaches
the renderer, `boundsOfNode`, or any layout's bounds query). Per-kind
mapping:

- `circle` / `regular-polygon` — `shape.radius = size`
- `rect` — `shape.width = shape.height = 2 * size`
- `arc` — `shape.outerR = size` (and `shape.innerR` scaled so its ratio
  to `outerR` is preserved)
- `star` — `shape.outerRadius = size` (and `shape.innerRadius` scaled to
  preserve its ratio)
- `polygon` / custom — no canonical size axis; `size` is ignored

Honoured uniformly by `boundsOfNode`, `D3ForceLayout` (collide.radius
receives the `GraphNode` and reads the normalized `shape.radius` via
`resolveNodeStyle`), and `ElkLayout` (reads bounds via `boundsOfNode`).
Use this when a single number should drive a node's footprint regardless
of which shape kind it renders as — e.g. degree-based sizing,
data-driven scaling.
