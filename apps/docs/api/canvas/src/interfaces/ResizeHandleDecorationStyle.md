# Interface: ResizeHandleDecorationStyle

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L22)

## Properties

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:29](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L29)

***

### bgFill?

> `readonly` `optional` **bgFill?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L28)

Handle fill colour. Default `0xffffff`.

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L35)

Optional CSS-style cursor hint for the host renderer's hit pipeline.

***

### placement?

> `readonly` `optional` **placement?**: [`ResizeHandlePlacement`](../type-aliases/ResizeHandlePlacement.md)

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L24)

Which AABB position the handle sits on. Default `'bottom-right'`.

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L46)

Override the keyword-based `placement` resolution with raw shape-local
coordinates. When set, `placement` is ignored — the handle's centre is
placed at exactly `(x, y)` in the host shape's local frame. The
reported hit geometry's `placement` field still reflects the
configured `placement` (or `'bottom-right'` if omitted) so consumers
that switch on it for resize-direction math still work.

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### size?

> `readonly` `optional` **size?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L26)

Side length of the square handle, px. Default `8`.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L31)

Handle outline colour. Default `0x6b7fff`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L33)

Handle outline width. Default `1.5`.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L37)

Visible only when truthy. Domain behaviours flip this on hover/select. Default `true`.
