# Interface: NodeStyle

Visual + structural style for a node. Flat-prefixed scalars for orthogonal
properties (`bgFill`, `bgStrokeWidth`, `labelColor`); polymorphic values
kept structured (`shape`, `icon`, `image`, `decorations`, `effects`,
`badges`).

Per-instance state overlays for a node live at `GraphNode.state`
(a sibling of `style`), NOT inside `NodeStyle`.

## Properties

### badges?

> `readonly` `optional` **badges?**: readonly [`NodeBadge`](NodeBadge.md)[]

***

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

***

### bgFill?

> `readonly` `optional` **bgFill?**: `ShapeFill`

Accepts every `ShapeFillLayer` kind — `solid` / `image` / `glyph` /
`svg` / `svg-url` — and arrays for stacked layers. The `image` kind
doubles as silhouette filler and inset content via its `fit` field
(`'inset'` vs the silhouette modes).

***

### bgStrokeAlignment?

> `readonly` `optional` **bgStrokeAlignment?**: `"center"` \| `"inside"` \| `"outside"`

***

### bgStrokeAlpha?

> `readonly` `optional` **bgStrokeAlpha?**: `number`

***

### bgStrokeCap?

> `readonly` `optional` **bgStrokeCap?**: `"butt"` \| `"round"` \| `"square"`

***

### bgStrokeColor?

> `readonly` `optional` **bgStrokeColor?**: `number`

***

### bgStrokeDashArray?

> `readonly` `optional` **bgStrokeDashArray?**: readonly \[`number`, `number`\]

***

### bgStrokeDashOffset?

> `readonly` `optional` **bgStrokeDashOffset?**: `number`

***

### bgStrokeJoin?

> `readonly` `optional` **bgStrokeJoin?**: `"round"` \| `"miter"` \| `"bevel"`

***

### bgStrokeWidth?

> `readonly` `optional` **bgStrokeWidth?**: `number`

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

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

***

### group?

> `readonly` `optional` **group?**: [`GroupOptions`](GroupOptions.md)

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

***

### image?

> `readonly` `optional` **image?**: [`NodeImage`](NodeImage.md)

***

### labelAlign?

> `readonly` `optional` **labelAlign?**: `"center"` \| `"left"` \| `"right"`

***

### labelAlpha?

> `readonly` `optional` **labelAlpha?**: `number`

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

### labelPlacement?

> `readonly` `optional` **labelPlacement?**: `ShapeLabelPlacement`

***

### labelPriority?

> `readonly` `optional` **labelPriority?**: `number`

Collision priority — higher wins when two labels overlap.

***

### labelRotation?

> `readonly` `optional` **labelRotation?**: `number`

Radians.

***

### labelStyle?

> `readonly` `optional` **labelStyle?**: `ShapeLabelStyle`

Escape hatch — full `ShapeLabelStyle` payload from `@invana/canvas`.
Use this when the flat `label*` fields don't cover the case (wrap,
html-text content, custom collision settings, etc.). When set, the
adapter uses this payload verbatim instead of building one from the
flat fields. Flat label fields are ignored on the same node.

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

***

### resizable?

> `readonly` `optional` **resizable?**: `boolean`

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

***

### size?

> `readonly` `optional` **size?**: `number`

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
