# Interface: SelectionFrameDecorationStyle

## Properties

### borderAlpha?

> `readonly` `optional` **borderAlpha?**: `number`

Border alpha. Default `0.6` — ghosts the frame so the host silhouette reads as the real thing.

***

### borderColor?

> `readonly` `optional` **borderColor?**: `number`

Border line colour. Default `0x6b7fff` (theme blue).

***

### borderStyle?

> `readonly` `optional` **borderStyle?**: [`SelectionFrameBorderStyle`](../type-aliases/SelectionFrameBorderStyle.md)

`'solid'` | `'dashed'` | `'dotted'`. Default `'dotted'` — reads as a
helper / annotation rather than the host's actual outline. When
[dashArray](#dasharray) is supplied it wins over this preset.

***

### borderWidth?

> `readonly` `optional` **borderWidth?**: `number`

Border line width, px. Default `1.5`.

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Custom dash pattern `[dashLength, gapLength]` in px. Overrides
[borderStyle](#borderstyle) entirely when set — use when the presets don't
land where you want them.

***

### handleCornerRadius?

> `readonly` `optional` **handleCornerRadius?**: `number`

Corner radius for square handles only. Default `1.5` for a subtly
rounded look; pass `0` for hard corners. Ignored when
`handleShape: 'circle'`.

***

### handleFill?

> `readonly` `optional` **handleFill?**: `number`

Handle fill colour. Default `0xffffff`.

***

### handleFillAlpha?

> `readonly` `optional` **handleFillAlpha?**: `number`

Handle fill alpha. Default `1`.

***

### handleRadius?

> `readonly` `optional` **handleRadius?**: `number`

Half-extent of the handle in px. For circle handles this is the
outer radius; for square handles it's half the side length, so the
visible size matches a circle of the same value. Default `5`.

***

### handles?

> `readonly` `optional` **handles?**: readonly [`SelectionFramePlacement`](../type-aliases/SelectionFramePlacement.md)[]

Which handles to render. Default = all eight. Pass a smaller array to
suppress edge midpoints (`['top-left', 'top-right', 'bottom-left',
'bottom-right']`) or limit to a single axis (`['right']` for the
radial circle case).

***

### handleShape?

> `readonly` `optional` **handleShape?**: [`SelectionFrameHandleShape`](../type-aliases/SelectionFrameHandleShape.md)

`'circle'` (default) paints round nubs; `'square'` paints squares.

***

### handleStrokeAlpha?

> `readonly` `optional` **handleStrokeAlpha?**: `number`

Handle outline alpha. Default `1`.

***

### handleStrokeColor?

> `readonly` `optional` **handleStrokeColor?**: `number`

Handle outline colour. Default = `borderColor`.

***

### handleStrokeWidth?

> `readonly` `optional` **handleStrokeWidth?**: `number`

Handle outline width in px. Default `1.5`. Pass `0` for no outline.

***

### padding?

> `readonly` `optional` **padding?**: `number`

Outward inset between the host AABB and the dashed frame. Lets the
frame visually "wrap" the host without touching the silhouette.
Default `4`.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Visible only when truthy. Default `true`.
