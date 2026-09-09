# Interface: ResizeHandleDecorationStyle

## Properties

### bgAlpha?

> `readonly` `optional` **bgAlpha?**: `number`

***

### bgFill?

> `readonly` `optional` **bgFill?**: `number`

Handle fill colour. Default `0xffffff`.

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Optional CSS-style cursor hint for the host renderer's hit pipeline.

***

### placement?

> `readonly` `optional` **placement?**: [`ResizeHandlePlacement`](../type-aliases/ResizeHandlePlacement.md)

Which AABB position the handle sits on. Default `'bottom-right'`.

***

### position?

> `readonly` `optional` **position?**: `object`

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

Side length of the square handle, px. Default `8`.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Handle outline colour. Default `0x6b7fff`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Handle outline width. Default `1.5`.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Visible only when truthy. Domain behaviours flip this on hover/select. Default `true`.
