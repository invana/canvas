# Interface: ToggleDecorationStyle

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

Button fill alpha. Default `1`.

***

### bgFill?

> `readonly` `optional` **bgFill?**: `number`

Button fill colour. Default `0xffffff` (white).

***

### glyphColor?

> `readonly` `optional` **glyphColor?**: `number`

Glyph stroke colour. Default = `strokeColor`.

***

### glyphWidth?

> `readonly` `optional` **glyphWidth?**: `number`

Glyph stroke width, px. Default `1.5`.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Extra offset applied after placement resolution, in shape-local px.
Use to nudge the toggle off a default placement without writing a
custom placement (e.g. push a `bottom-right` toggle further out
past a thick stroke).

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

***

### placement?

> `readonly` `optional` **placement?**: [`TogglePlacement`](../type-aliases/TogglePlacement.md)

Where on the host AABB the toggle sits. Default `'bottom'`.

***

### position?

> `readonly` `optional` **position?**: `object`

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

Button outer radius, px. Default `10`.

***

### state?

> `readonly` `optional` **state?**: `"plus"` \| `"minus"`

Which glyph the button shows. Domain layers flip this through
`setDecoration` whenever the underlying collapsed-state changes.
Default `'plus'`.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Button outline colour. Default `0x6b7fff` (theme blue).

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Button outline width, px. Default `1.5`.
