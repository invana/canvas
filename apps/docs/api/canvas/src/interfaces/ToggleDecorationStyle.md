# Interface: ToggleDecorationStyle

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L45)

Visual style of a `ToggleDecoration` — the small `+` / `−` button used to
collapse / expand compound groups, and by extension any "open this" /
"close this" affordance a domain layer wants to put on a shape.

The decoration is pure-visual: it paints itself, exposes a shape-local
hit-geometry (`getLocalHitGeometry`), and emits no events. Domain
behaviours (e.g. `CollapseExpandBehaviour` in `@invana/graph`) read the
geometry and do the click-distance math against the host's
`shape:pointerdown` payload — keeps the decoration domain-free and
sidesteps Pixi event-bubbling through the shape gfx.

## Properties

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L59)

Button fill alpha. Default `1`.

***

### bgFill?

> `readonly` `optional` **bgFill?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L57)

Button fill colour. Default `0xffffff` (white).

***

### glyphColor?

> `readonly` `optional` **glyphColor?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L65)

Glyph stroke colour. Default = `strokeColor`.

***

### glyphWidth?

> `readonly` `optional` **glyphWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L67)

Glyph stroke width, px. Default `1.5`.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L74)

Extra offset applied after placement resolution, in shape-local px.
Use to nudge the toggle off a default placement without writing a
custom placement (e.g. push a `bottom-right` toggle further out
past a thick stroke).

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L75)

***

### placement?

> `readonly` `optional` **placement?**: [`TogglePlacement`](../type-aliases/TogglePlacement.md)

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L53)

Where on the host AABB the toggle sits. Default `'bottom'`.

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L87)

Override the keyword-based `placement` resolution with raw shape-local
coordinates. When set, `placement`, `offsetX`, and `offsetY` are all
ignored — the toggle's centre is placed at exactly `(x, y)` in the
host shape's local frame (centre-relative for centred shapes like
`CircleShape`, top-left-relative for `RectShape`).

Use when none of the 12 named placements lands where you want it
(e.g. floating the toggle along a diagonal, or matching a specific
UI mock that doesn't snap to AABB anchors).

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### radius?

> `readonly` `optional` **radius?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L55)

Button outer radius, px. Default `10`.

***

### state?

> `readonly` `optional` **state?**: `"plus"` \| `"minus"`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L51)

Which glyph the button shows. Domain layers flip this through
`setDecoration` whenever the underlying collapsed-state changes.
Default `'plus'`.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L61)

Button outline colour. Default `0x6b7fff` (theme blue).

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ToggleDecoration.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts#L63)

Button outline width, px. Default `1.5`.
