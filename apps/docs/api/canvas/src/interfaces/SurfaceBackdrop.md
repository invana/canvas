# Interface: SurfaceBackdrop

A full-surface backdrop: a solid fill, optionally overlaid with a repeating
tile that can be offset and scaled to follow the camera.

The split of responsibility is the point. The **engine** decides what the
pattern looks like — dots, grid, lines, spacing, colour, DPR — and rasterises
one tile with a 2D canvas, which needs no backend at all. The **backend**
decides how that tile is repeated across the surface, which is the only part
that touches the GPU.

This is deliberately not a spec and not an overlay. A backdrop is neither
durable content (it is derived from theme + camera, never authored) nor a
transient gesture visual — it is a property of the surface itself.

## Properties

### color

> `readonly` **color**: `string` \| `number`

Solid fill painted behind everything on the surface.

***

### height

> `readonly` **height**: `number`

***

### tile?

> `readonly` `optional` **tile?**: `object`

Optional repeating tile drawn over the solid fill.

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### offsetX

> `readonly` **offsetX**: `number`

Tile offset in surface pixels — how the pattern tracks the camera.

#### offsetY

> `readonly` **offsetY**: `number`

#### scale

> `readonly` **scale**: `number`

Uniform scale applied to the tile.

#### source

> `readonly` **source**: `CanvasImageSource`

One tile, already rasterised by the engine. A plain DOM image source, so
a backend wraps it in whatever texture type it uses.

Identity matters: a backend may cache its texture and rebuild only when
this changes, so pass the *same* object when only the transform moves.

#### visible?

> `readonly` `optional` **visible?**: `boolean`

`false` hides the tile while keeping the solid fill.

***

### width

> `readonly` **width**: `number`

Surface size in CSS pixels.
