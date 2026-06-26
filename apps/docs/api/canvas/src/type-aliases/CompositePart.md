# Type Alias: CompositePart

> **CompositePart** = `object` & `PartFill` \| `object` & `PartFill` \| \{ `part`: `"line"`; `stroke`: `PartStroke`; `x`: `number`; `x2`: `number`; `y`: `number`; `y2`: `number`; \} \| \{ `align?`: `"left"` \| `"center"` \| `"right"`; `anchor?`: `"left"` \| `"center"` \| `"right"`; `fill?`: `number`; `fontSize?`: `number`; `fontStyle?`: `"normal"` \| `"italic"`; `fontVariant?`: `"normal"` \| `"small-caps"`; `fontWeight?`: `number` \| `string`; `lineHeight?`: `number`; `maxLines?`: `number`; `maxWidth?`: `number`; `overflow?`: `"clip"` \| `"ellipsis"`; `part`: `"label"`; `text`: `string`; `x`: `number`; `y`: `number`; \}

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L35)

A child element of a [CompositeShape](../classes/CompositeShape.md), positioned at a coordinate
relative to the composite's top-left origin.

- `'rect'` / `'circle'` / `'line'` — geometry traced into the shared body
  `Graphics`. Fill/stroke are solid colours (the simple sugar fields here);
  for gradient / image / dashed paint, compose dedicated shapes instead.
- `'label'` — a text block mounted as a Pixi text child. `anchor` picks
  which horizontal edge of the measured block lands at `x` (default left);
  `maxWidth` enables word-wrap, `maxLines` + `overflow` drive ellipsis.

## Union Members

`object` & `PartFill`

***

`object` & `PartFill`

***

### Type Literal

\{ `part`: `"line"`; `stroke`: `PartStroke`; `x`: `number`; `x2`: `number`; `y`: `number`; `y2`: `number`; \}

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
