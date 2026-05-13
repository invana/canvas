# Interface: NodeRenderHints

Defined in: packages/graph/src/layer/types.ts:17

Render-spec hints a caller may put under `node.data` to control how the
layer renders this node. All fields are optional; defaults below.

## Properties

### alpha?

> `optional` **alpha?**: `number`

Defined in: packages/graph/src/layer/types.ts:33

Alpha 0–1. Default 1.

***

### cornerRadius?

> `optional` **cornerRadius?**: `number`

Defined in: packages/graph/src/layer/types.ts:25

Rect corner radius. Default 4.

***

### fill?

> `optional` **fill?**: `number` \| `false`

Defined in: packages/graph/src/layer/types.ts:27

Fill color (0xRRGGBB) or `false` for no fill. Default `0x3b82f6`.

***

### height?

> `optional` **height?**: `number`

Defined in: packages/graph/src/layer/types.ts:23

Height (rect only). Defaults to `size` for square rects.

***

### label?

> `optional` **label?**: `string`

Defined in: packages/graph/src/layer/types.ts:35

Optional human label — rendered by future extensions, ignored for now.

***

### shape?

> `optional` **shape?**: [`NodeShapeKind`](../type-aliases/NodeShapeKind.md)

Defined in: packages/graph/src/layer/types.ts:19

Shape kind. Default `'circle'`.

***

### size?

> `optional` **size?**: `number`

Defined in: packages/graph/src/layer/types.ts:21

Diameter (circle) or width (rect). Default 32.

***

### stroke?

> `optional` **stroke?**: `number` \| `false`

Defined in: packages/graph/src/layer/types.ts:29

Stroke color (0xRRGGBB) or `false` for no stroke. Default `0x1d4ed8`.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

Defined in: packages/graph/src/layer/types.ts:31

Stroke width. Default 1.
