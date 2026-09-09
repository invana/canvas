# Interface: BubbleSetLabel

Optional label printed on the set's contour. Styling pulls from the set's
own [BubbleSetStyle](BubbleSetStyle.md) (background = `fill` at full opacity, text
picked for contrast). The flat field is intentionally minimal; richer
label control lands once we settle on a layer-wide label primitive.

## Properties

### color?

> `optional` **color?**: `number`

Override text colour. Default contrasts with the set's fill.

***

### fontSize?

> `optional` **fontSize?**: `number`

Font size in world units. Default `11`.

***

### placement?

> `optional` **placement?**: `"contour-end"` \| `"centroid"`

Where to anchor the label.
- `'contour-end'` (default) — the last point of the contour, rotated to
  match the local tangent. Matches G6's BubbleSets label placement.
- `'centroid'` — average of contour points, no rotation.

***

### text

> **text**: `string`

Required label text.
