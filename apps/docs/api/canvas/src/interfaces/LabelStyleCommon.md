# Interface: LabelStyleCommon

Defined in: [canvas/src/primitives/types.ts:1236](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1236)

Common style block shared by shape- and connector-anchored labels.
Placement / offset / rotation specifics live on the host-specific spec.

## Extended by

- [`ShapeLabelStyle`](ShapeLabelStyle.md)
- [`ConnectorLabelStyle`](ConnectorLabelStyle.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:1242](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1242)

***

### background?

> `readonly` `optional` **background?**: [`LabelBackground`](LabelBackground.md)

Defined in: [canvas/src/primitives/types.ts:1238](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1238)

***

### collisionGroup?

> `readonly` `optional` **collisionGroup?**: `string`

Defined in: [canvas/src/primitives/types.ts:1256](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1256)

***

### content

> `readonly` **content**: [`LabelContent`](../type-aliases/LabelContent.md)

Defined in: [canvas/src/primitives/types.ts:1237](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1237)

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Defined in: [canvas/src/primitives/types.ts:1246](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1246)

Cursor on hover when the label container has hit-testing enabled.

***

### forceShow?

> `readonly` `optional` **forceShow?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1257](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1257)

***

### interactive?

> `readonly` `optional` **interactive?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1248](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1248)

Pointer events enabled on the label container. Default `false`.

***

### minFontSize?

> `readonly` `optional` **minFontSize?**: `number`

Defined in: [canvas/src/primitives/types.ts:1264](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1264)

Floor used by the shrink → truncate → hide fit cascade when an
`inside-*` placement requires the label to stay inside the host shape.
Below this size, the cascade moves on to truncation (ellipsis) and
finally hide. Default `9` (px). Ignored for non-`inside-*` placements.

***

### offset?

> `readonly` `optional` **offset?**: `object`

Defined in: [canvas/src/primitives/types.ts:1241](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1241)

Screen-space offset in pixels applied *after* any auto-rotation.

#### x?

> `readonly` `optional` **x?**: `number`

#### y?

> `readonly` `optional` **y?**: `number`

***

### priority?

> `readonly` `optional` **priority?**: `number`

Defined in: [canvas/src/primitives/types.ts:1255](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1255)

Read by `LabelCollisionBehaviour` only — the primitive ignores these.
`priority` higher wins ties when collision hides overlap. `collisionGroup`
partitions the collision graph (labels in different groups never compete).
`forceShow: true` bypasses collision entirely.

***

### visibility?

> `readonly` `optional` **visibility?**: [`LabelVisibility`](LabelVisibility.md)

Defined in: [canvas/src/primitives/types.ts:1244](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1244)

Per-label zoom-band LOD; the decoration mounts/unmounts on threshold.

***

### wrap?

> `readonly` `optional` **wrap?**: [`LabelWrap`](LabelWrap.md)

Defined in: [canvas/src/primitives/types.ts:1239](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1239)
