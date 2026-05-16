# Type Alias: ShapeFillLayer

> **ShapeFillLayer** = \{ `alpha?`: `number`; `color`: `number`; `kind`: `"solid"`; \} \| \{ `alpha?`: `number`; `fit?`: `"fill"` \| `"cover"` \| `"contain"` \| `"none"` \| `"tile"`; `kind`: `"image"`; `url`: `string`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `char`: `string`; `color?`: `number`; `fontFamily?`: `string`; `fontStyle?`: `"normal"` \| `"italic"`; `fontWeight?`: `number` \| `string`; `kind`: `"glyph"`; `sizeRatio?`: `number`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `kind`: `"svg"`; `pathD`: `string`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `kind`: `"image-inset"`; `sizeRatio?`: `number`; `url`: `string`; \} \| \{ `alpha?`: `number`; `anchor?`: [`InsetAnchor`](InsetAnchor.md); `color?`: `number`; `kind`: `"svg-url"`; `sizeRatio?`: `number`; `strokeWidth?`: `number`; `url`: `string`; `viewBox?`: \{ `height`: `number`; `width`: `number`; \}; \}

Defined in: [canvas/src/primitives/types.ts:175](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L175)

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
