# Interface: ConnectorPaintStyle

Defined in: [packages/canvas/src/primitives/types.ts:326](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L326)

Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:328](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L328)

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [packages/canvas/src/primitives/types.ts:332](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L332)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:327](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L327)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [packages/canvas/src/primitives/types.ts:330](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L330)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:331](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L331)

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [packages/canvas/src/primitives/types.ts:333](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L333)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:329](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L329)

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:340](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L340)

When `true`, markers paint with `color` / `alpha` instead of their own
spec colors. Glow / halo decorations use this so the decoration covers
path + markers as a unified silhouette; marching-ants leaves it
undefined so markers stay normal-colored over the dashed line.
