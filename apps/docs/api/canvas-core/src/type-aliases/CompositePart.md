# Type Alias: CompositePart

> **CompositePart** = `object` & [`CompositePartFill`](../interfaces/CompositePartFill.md) \| `object` & [`CompositePartFill`](../interfaces/CompositePartFill.md) \| \{ `part`: `"line"`; `stroke`: [`CompositePartStroke`](../interfaces/CompositePartStroke.md); `x`: `number`; `x2`: `number`; `y`: `number`; `y2`: `number`; \} \| \{ `align?`: `"left"` \| `"center"` \| `"right"`; `anchor?`: `"left"` \| `"center"` \| `"right"`; `fill?`: `number`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontVariant?`: `"normal"` \| `"small-caps"`; `fontWeight?`: `number` \| `string`; `lineHeight?`: `number`; `maxLines?`: `number`; `maxWidth?`: `number`; `overflow?`: `"clip"` \| `"ellipsis"`; `part`: `"label"`; `text`: `string`; `x`: `number`; `y`: `number`; \} \| \{ `background?`: \{ `cornerRadius?`: `number`; `fill`: `number`; `fillAlpha?`: `number`; \}; `hitId?`: `string`; `icon`: [`InsetFillLayer`](InsetFillLayer.md); `part`: `"icon"`; `size`: `number`; `x`: `number`; `y`: `number`; \}

A child element of a composite shape, positioned at a coordinate relative to
the composite's top-left origin.

- `'rect'` / `'circle'` / `'line'` — geometry traced into the shared body.
  Fill/stroke are solid colours (the simple sugar fields here); for gradient /
  image / dashed paint, compose dedicated shapes instead.
- `'label'` — a text block. `anchor` picks which horizontal edge of the
  measured block lands at `x` (default left); `maxWidth` enables word-wrap,
  `maxLines` + `overflow` drive ellipsis.
- `'icon'` — a small vector inset (icon-font `glyph` / `svg` / `svg-url`)
  mounted into a `size × size` box at `(x, y)`, reusing the engine's
  [InsetFillLayer](InsetFillLayer.md) vocabulary. An optional `background` traces a chip
  (e.g. a coloured rounded square) behind the glyph — the type-tag look.

`rect` / `circle` / `icon` parts may carry a `hitId` to become an addressable
**sub-part**: the renderer reports the topmost `hitId` under a point and turns
it into `shape:partover` / `shape:partout` events (e.g. per-row hover on a
table card). A transparent full-row `rect` with a `hitId` is the idiomatic way
to make a whole row hoverable.

## Union Members

`object` & [`CompositePartFill`](../interfaces/CompositePartFill.md)

***

`object` & [`CompositePartFill`](../interfaces/CompositePartFill.md)

***

### Type Literal

\{ `part`: `"line"`; `stroke`: [`CompositePartStroke`](../interfaces/CompositePartStroke.md); `x`: `number`; `x2`: `number`; `y`: `number`; `y2`: `number`; \}

***

### Type Literal

\{ `align?`: `"left"` \| `"center"` \| `"right"`; `anchor?`: `"left"` \| `"center"` \| `"right"`; `fill?`: `number`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontVariant?`: `"normal"` \| `"small-caps"`; `fontWeight?`: `number` \| `string`; `lineHeight?`: `number`; `maxLines?`: `number`; `maxWidth?`: `number`; `overflow?`: `"clip"` \| `"ellipsis"`; `part`: `"label"`; `text`: `string`; `x`: `number`; `y`: `number`; \}

#### align?

> `readonly` `optional` **align?**: `"left"` \| `"center"` \| `"right"`

#### anchor?

> `readonly` `optional` **anchor?**: `"left"` \| `"center"` \| `"right"`

Horizontal anchor of the text block at `(x, y)`. Default `'left'`.

#### fill?

> `readonly` `optional` **fill?**: `number`

#### fontSize?

> `readonly` `optional` **fontSize?**: `number`

#### fontStyle?

> `readonly` `optional` **fontStyle?**: `"normal"` \| `"italic"`

#### fontVariant?

> `readonly` `optional` **fontVariant?**: `"normal"` \| `"small-caps"`

#### fontWeight?

> `readonly` `optional` **fontWeight?**: `number` \| `string`

#### lineHeight?

> `readonly` `optional` **lineHeight?**: `number`

#### maxLines?

> `readonly` `optional` **maxLines?**: `number`

#### maxWidth?

> `readonly` `optional` **maxWidth?**: `number`

#### overflow?

> `readonly` `optional` **overflow?**: `"clip"` \| `"ellipsis"`

#### part

> `readonly` **part**: `"label"`

#### text

> `readonly` **text**: `string`

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### Type Literal

\{ `background?`: \{ `cornerRadius?`: `number`; `fill`: `number`; `fillAlpha?`: `number`; \}; `hitId?`: `string`; `icon`: [`InsetFillLayer`](InsetFillLayer.md); `part`: `"icon"`; `size`: `number`; `x`: `number`; `y`: `number`; \}

#### background?

> `readonly` `optional` **background?**: `object`

Optional chip traced behind the glyph (the coloured type-tag square).

##### background.cornerRadius?

> `readonly` `optional` **cornerRadius?**: `number`

##### background.fill

> `readonly` **fill**: `number`

##### background.fillAlpha?

> `readonly` `optional` **fillAlpha?**: `number`

#### hitId?

> `readonly` `optional` **hitId?**: `string`

Marks this icon's box as an addressable sub-part for sub-part hit-testing.

#### icon

> `readonly` **icon**: [`InsetFillLayer`](InsetFillLayer.md)

Icon content — the engine's inset vocabulary (glyph / svg / svg-url).

#### part

> `readonly` **part**: `"icon"`

#### size

> `readonly` **size**: `number`

Side of the square box the icon is mounted into; the glyph scales to fit.

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`
