# Type Alias: ShapeFillLayer

> **ShapeFillLayer** = \{ `alpha?`: `number`; `color`: `number`; `kind`: `"solid"`; \} \| \{ `alpha?`: `number`; `fit?`: `"fill"` \| `"cover"` \| `"contain"` \| `"none"` \| `"tile"`; `kind`: `"image"`; `url`: `string`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \} \| \{ `align?`: `"left"` \| `"center"` \| `"right"`; `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `fontFamily?`: `string`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"text"`; `text`: `string`; `widthRatio?`: `number`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `kind`: `"image-inset"`; `sizeRatio?`: `number`; `url`: `string`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

Defined in: [packages/canvas/src/primitives/types.ts:175](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L175)

One layer of a shape's fill. Layers split by role:

- **Silhouette fillers** (`solid`, `image`) — paint into the silhouette via
  Pixi's `g.fill()`. Multiple silhouette layers stack via alpha; each is
  re-traced before painting.
- **Inset content** (`glyph`, `svg`, `image-inset`) — mounted as Container
  children of the shape's `gfx`. Sized by `sizeRatio` (fraction of the
  smaller bounds dimension) and positioned by `anchor` (default `'center'`).

The engine has no dedicated "icon" kind — icon-library specifics (Font
Awesome glyphs, Lucide SVGs, Fluent icons, …) are produced by developer
code and dropped into a `glyph` or `svg` layer directly.

## Union Members

### Type Literal

\{ `alpha?`: `number`; `color`: `number`; `kind`: `"solid"`; \}

***

### Type Literal

\{ `alpha?`: `number`; `fit?`: `"fill"` \| `"cover"` \| `"contain"` \| `"none"` \| `"tile"`; `kind`: `"image"`; `url`: `string`; \}

***

### Type Literal

\{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \}

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### anchor?

> `readonly` `optional` **anchor?**: [`InsetAnchor`](InsetAnchor.md)

Anchor relative to the shape's bounds. Default `'center'`.

#### char

> `readonly` **char**: `string`

#### color?

> `readonly` `optional` **color?**: `number`

Glyph color. Default `0xffffff`.

#### fontFamily?

> `readonly` `optional` **fontFamily?**: `string`

Required for icon-font glyphs; optional for system-font Unicode.

#### fontStyle?

> `readonly` `optional` **fontStyle?**: `"normal"` \| `"italic"`

#### fontWeight?

> `readonly` `optional` **fontWeight?**: `number` \| `string`

Font weight (CSS value, e.g. `400`, `900`, `'bold'`). Required for
icon fonts that pack different glyph sets per weight.

#### kind

> `readonly` **kind**: `"glyph"`

Font-rendered character (icon-font codepoint, Unicode symbol, emoji).

#### sizeRatio?

> `readonly` `optional` **sizeRatio?**: `number`

Size as fraction of the shape's smaller bounds dimension. Default `0.6`.

***

### Type Literal

\{ `align?`: `"left"` \| `"center"` \| `"right"`; `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `fontFamily?`: `string`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"text"`; `text`: `string`; `widthRatio?`: `number`; \}

#### align?

> `readonly` `optional` **align?**: `"left"` \| `"center"` \| `"right"`

Horizontal alignment within the (possibly clipped) text block. Default `'center'`.

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### anchor?

> `readonly` `optional` **anchor?**: [`InsetAnchor`](InsetAnchor.md)

Anchor relative to the shape's bounds. Default `'center'`.

#### color?

> `readonly` `optional` **color?**: `number`

Text color. Default `0x000000`.

#### fontFamily?

> `readonly` `optional` **fontFamily?**: `string`

#### fontSize?

> `readonly` `optional` **fontSize?**: `number`

Pixel font size at scale 1. Default `12`.

#### fontStyle?

> `readonly` `optional` **fontStyle?**: `"normal"` \| `"italic"`

#### fontWeight?

> `readonly` `optional` **fontWeight?**: `number` \| `string`

#### kind

> `readonly` **kind**: `"text"`

Multi-character text label rendered as inset content (badge labels,
card titles, ER cell values, anything that needs more than the
single-char `glyph` kind). Sized to fit the shape's bounds width
(minus the inset margin used by other inset layers) and anchored the
same way.

#### text

> `readonly` **text**: `string`

#### widthRatio?

> `readonly` `optional` **widthRatio?**: `number`

Maximum render width as a fraction of `bounds.width`. Default `0.85`.
The text is scaled down (never up) to fit. For corner anchors, the
cap is half of the available width to preserve room for the opposite
corner's content.

***

### Type Literal

\{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### anchor?

> `readonly` `optional` **anchor?**: [`InsetAnchor`](InsetAnchor.md)

#### color?

> `readonly` `optional` **color?**: `number`

#### kind

> `readonly` **kind**: `"svg"`

SVG path-d. Multiple subpaths (`M...M...`) are supported.

#### pathD

> `readonly` **pathD**: `string`

#### sizeRatio?

> `readonly` `optional` **sizeRatio?**: `number`

#### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Stroke width when rendering. Default `2`.

#### viewBox?

> `readonly` `optional` **viewBox?**: `object`

Viewport the path was authored in. Default `{ width: 24, height: 24 }`.

##### viewBox.height

> `readonly` **height**: `number`

##### viewBox.width

> `readonly` **width**: `number`

***

### Type Literal

\{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `kind`: `"image-inset"`; `sizeRatio?`: `number`; `url`: `string`; \}

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### anchor?

> `readonly` `optional` **anchor?**: [`InsetAnchor`](InsetAnchor.md)

#### kind

> `readonly` **kind**: `"image-inset"`

Raster image inset (small logo on a plate, photo thumb on a card).

#### sizeRatio?

> `readonly` `optional` **sizeRatio?**: `number`

#### url

> `readonly` **url**: `string`

***

### Type Literal

\{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### anchor?

> `readonly` `optional` **anchor?**: [`InsetAnchor`](InsetAnchor.md)

#### color?

> `readonly` `optional` **color?**: `number`

#### kind

> `readonly` **kind**: `"svg-url"`

Vector SVG icon fetched from a URL. The engine fetches the SVG,
extracts every drawing primitive (`path` / `ellipse` / `circle` /
`rect` / `line` / `polyline` / `polygon`) into a single concatenated
`pathD`, and renders it as a Pixi Graphics path. Fetched lazily on
first use; the resulting `pathD` is cached globally per URL.

Use this when a consumer wants to point at their own remote SVG
(logo, custom diagram, sample artwork). For curated icon-library
usage, prefer an icon-font glyph via `kind: 'glyph'` — the
library is icon-vendor-agnostic and intentionally has no
vendor-specific fetch glue.

#### sizeRatio?

> `readonly` `optional` **sizeRatio?**: `number`

#### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

#### url

> `readonly` **url**: `string`

#### viewBox?

> `readonly` `optional` **viewBox?**: `object`

##### viewBox.height

> `readonly` **height**: `number`

##### viewBox.width

> `readonly` **width**: `number`
