# Interface: SelectionFrameDecorationStyle

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:54](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L54)

## Properties

### borderAlpha?

> `readonly` `optional` **borderAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:72](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L72)

Border alpha. Default `0.6` — ghosts the frame so the host silhouette reads as the real thing.

***

### borderColor?

> `readonly` `optional` **borderColor?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L56)

Border line colour. Default `0x6b7fff` (theme blue).

***

### borderStyle?

> `readonly` `optional` **borderStyle?**: [`SelectionFrameBorderStyle`](../type-aliases/SelectionFrameBorderStyle.md)

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:64](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L64)

`'solid'` | `'dashed'` | `'dotted'`. Default `'dotted'` — reads as a
helper / annotation rather than the host's actual outline. When
[dashArray](#dasharray) is supplied it wins over this preset.

***

### borderWidth?

> `readonly` `optional` **borderWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:58](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L58)

Border line width, px. Default `1.5`.

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:70](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L70)

Custom dash pattern `[dashLength, gapLength]` in px. Overrides
[borderStyle](#borderstyle) entirely when set — use when the presets don't
land where you want them.

***

### handleCornerRadius?

> `readonly` `optional` **handleCornerRadius?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:94](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L94)

Corner radius for square handles only. Default `1.5` for a subtly
rounded look; pass `0` for hard corners. Ignored when
`handleShape: 'circle'`.

***

### handleFill?

> `readonly` `optional` **handleFill?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:96](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L96)

Handle fill colour. Default `0xffffff`.

***

### handleFillAlpha?

> `readonly` `optional` **handleFillAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:98](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L98)

Handle fill alpha. Default `1`.

***

### handleRadius?

> `readonly` `optional` **handleRadius?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:88](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L88)

Half-extent of the handle in px. For circle handles this is the
outer radius; for square handles it's half the side length, so the
visible size matches a circle of the same value. Default `5`.

***

### handles?

> `readonly` `optional` **handles?**: readonly [`SelectionFramePlacement`](../type-aliases/SelectionFramePlacement.md)[]

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L111)

Which handles to render. Default = all eight. Pass a smaller array to
suppress edge midpoints (`['top-left', 'top-right', 'bottom-left',
'bottom-right']`) or limit to a single axis (`['right']` for the
radial circle case).

***

### handleShape?

> `readonly` `optional` **handleShape?**: [`SelectionFrameHandleShape`](../type-aliases/SelectionFrameHandleShape.md)

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L82)

`'circle'` (default) paints round nubs; `'square'` paints squares.

***

### handleStrokeAlpha?

> `readonly` `optional` **handleStrokeAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:104](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L104)

Handle outline alpha. Default `1`.

***

### handleStrokeColor?

> `readonly` `optional` **handleStrokeColor?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:100](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L100)

Handle outline colour. Default = `borderColor`.

***

### handleStrokeWidth?

> `readonly` `optional` **handleStrokeWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:102](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L102)

Handle outline width in px. Default `1.5`. Pass `0` for no outline.

***

### padding?

> `readonly` `optional` **padding?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:78](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L78)

Outward inset between the host AABB and the dashed frame. Lets the
frame visually "wrap" the host without touching the silhouette.
Default `4`.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:113](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L113)

Visible only when truthy. Default `true`.
