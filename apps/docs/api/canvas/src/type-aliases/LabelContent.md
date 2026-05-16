# Type Alias: LabelContent

> **LabelContent** = \{ `align?`: `"left"` \| `"center"` \| `"right"`; `alpha?`: `number`; `fill?`: `number`; `fontFamily?`: `string`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontVariant?`: `"normal"` \| `"small-caps"`; `fontWeight?`: `number` \| `string`; `kind`: `"text"`; `letterSpacing?`: `number`; `lineHeight?`: `number`; `shadow?`: \{ `alpha?`: `number`; `blur?`: `number`; `color`: `number`; `offsetX?`: `number`; `offsetY?`: `number`; \}; `stroke?`: \{ `color`: `number`; `width`: `number`; \}; `text`: `string`; \} \| \{ `alpha?`: `number`; `cssOverrides?`: `ReadonlyArray`\<`string`\>; `defaultFill?`: `number` \| `string`; `defaultFontFamily?`: `string`; `defaultFontSize?`: `number`; `defaultFontWeight?`: `number` \| `string`; `html`: `string`; `kind`: `"html-text"`; `tagStyles?`: `Readonly`\<`Record`\<`string`, [`HtmlTagStyle`](../interfaces/HtmlTagStyle.md)\>\>; `width?`: `number`; \}

Defined in: [canvas/src/primitives/types.ts:1006](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1006)

The visible content of a `LabelDecoration`. Two variants:

- `'text'` — plain Pixi `Text`. Single style, fast, comfortable up to a few
  thousand visible labels. Supports wrap / maxLines / ellipsis via Pixi's
  built-in word-wrap plus a truncation pass.
- `'html-text'` — Pixi `HTMLText`. Inline tags (`<b>`, `<i>`, custom tags
  via `tagStyles`) and CSS overrides. Each instance rasterises HTML to a
  canvas, so this kind is suitable for tens to a couple hundred visible
  labels — not for graph-wide use.

`bitmap-text` (Pixi `BitmapText`) is planned as a third kind for very-high-
density graphs; not in v0.

## Union Members

### Type Literal

\{ `align?`: `"left"` \| `"center"` \| `"right"`; `alpha?`: `number`; `fill?`: `number`; `fontFamily?`: `string`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontVariant?`: `"normal"` \| `"small-caps"`; `fontWeight?`: `number` \| `string`; `kind`: `"text"`; `letterSpacing?`: `number`; `lineHeight?`: `number`; `shadow?`: \{ `alpha?`: `number`; `blur?`: `number`; `color`: `number`; `offsetX?`: `number`; `offsetY?`: `number`; \}; `stroke?`: \{ `color`: `number`; `width`: `number`; \}; `text`: `string`; \}

#### align?

> `readonly` `optional` **align?**: `"left"` \| `"center"` \| `"right"`

Horizontal alignment when wrap produces multiple lines.

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### fill?

> `readonly` `optional` **fill?**: `number`

Fill colour as hex. Default `0x111827` (near-black).

#### fontFamily?

> `readonly` `optional` **fontFamily?**: `string`

#### fontSize?

> `readonly` `optional` **fontSize?**: `number`

#### fontStyle?

> `readonly` `optional` **fontStyle?**: `"normal"` \| `"italic"`

#### fontVariant?

> `readonly` `optional` **fontVariant?**: `"normal"` \| `"small-caps"`

#### fontWeight?

> `readonly` `optional` **fontWeight?**: `number` \| `string`

#### kind

> `readonly` **kind**: `"text"`

#### letterSpacing?

> `readonly` `optional` **letterSpacing?**: `number`

#### lineHeight?

> `readonly` `optional` **lineHeight?**: `number`

#### shadow?

> `readonly` `optional` **shadow?**: `object`

Drop shadow on text glyphs (distinct from background pill shadow).

##### shadow.alpha?

> `optional` **alpha?**: `number`

##### shadow.blur?

> `optional` **blur?**: `number`

##### shadow.color

> **color**: `number`

##### shadow.offsetX?

> `optional` **offsetX?**: `number`

##### shadow.offsetY?

> `optional` **offsetY?**: `number`

#### stroke?

> `readonly` `optional` **stroke?**: `object`

##### stroke.color

> **color**: `number`

##### stroke.width

> **width**: `number`

#### text

> `readonly` **text**: `string`

***

### Type Literal

\{ `alpha?`: `number`; `cssOverrides?`: `ReadonlyArray`\<`string`\>; `defaultFill?`: `number` \| `string`; `defaultFontFamily?`: `string`; `defaultFontSize?`: `number`; `defaultFontWeight?`: `number` \| `string`; `html`: `string`; `kind`: `"html-text"`; `tagStyles?`: `Readonly`\<`Record`\<`string`, [`HtmlTagStyle`](../interfaces/HtmlTagStyle.md)\>\>; `width?`: `number`; \}

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### cssOverrides?

> `readonly` `optional` **cssOverrides?**: `ReadonlyArray`\<`string`\>

Raw CSS rules injected as a `<style>` block before the HTML body —
useful for loading icon fonts or `@font-face` declarations referenced
by the inline HTML.

#### defaultFill?

> `readonly` `optional` **defaultFill?**: `number` \| `string`

#### defaultFontFamily?

> `readonly` `optional` **defaultFontFamily?**: `string`

Base style applied when no tag override matches.

#### defaultFontSize?

> `readonly` `optional` **defaultFontSize?**: `number`

#### defaultFontWeight?

> `readonly` `optional` **defaultFontWeight?**: `number` \| `string`

#### html

> `readonly` **html**: `string`

#### kind

> `readonly` **kind**: `"html-text"`

#### tagStyles?

> `readonly` `optional` **tagStyles?**: `Readonly`\<`Record`\<`string`, [`HtmlTagStyle`](../interfaces/HtmlTagStyle.md)\>\>

Per-tag style overrides (e.g. `{ b: { fontWeight: 700 }, hl: { fill: '#facc15' } }`).
Custom tags are supported — Pixi forwards them to its tag stylesheet.

#### width?

> `readonly` `optional` **width?**: `number`

Fixed render width for `HTMLText`. Required for word-wrap; Pixi
`HTMLText` needs an explicit width to know when to break lines.
