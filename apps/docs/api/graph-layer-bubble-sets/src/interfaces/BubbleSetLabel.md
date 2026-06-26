# Interface: BubbleSetLabel

Defined in: [graph-layer-bubble-sets/src/types.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L33)

Optional label printed on the set's contour. Styling pulls from the set's
own [BubbleSetStyle](BubbleSetStyle.md) (background = `fill` at full opacity, text
picked for contrast). The flat field is intentionally minimal; richer
label control lands once we settle on a layer-wide label primitive.

## Properties

### color?

> `optional` **color?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L44)

Override text colour. Default contrasts with the set's fill.

***

### fontSize?

> `optional` **fontSize?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L46)

Font size in world units. Default `11`.

***

### placement?

> `optional` **placement?**: `"contour-end"` \| `"centroid"`

Defined in: [graph-layer-bubble-sets/src/types.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L42)

Where to anchor the label.
- `'contour-end'` (default) — the last point of the contour, rotated to
  match the local tangent. Matches G6's BubbleSets label placement.
- `'centroid'` — average of contour points, no rotation.

***

### text

> **text**: `string`

Defined in: [graph-layer-bubble-sets/src/types.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L35)

Required label text.
