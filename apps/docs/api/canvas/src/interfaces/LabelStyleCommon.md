# Interface: LabelStyleCommon

Defined in: [canvas/src/primitives/types.ts:1238](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1238)

Common style block shared by shape- and connector-anchored labels.
Placement / offset / rotation specifics live on the host-specific spec.

## Extended by

- [`ShapeLabelStyle`](ShapeLabelStyle.md)
- [`ConnectorLabelStyle`](ConnectorLabelStyle.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:1244](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1244)

***

### background?

> `readonly` `optional` **background?**: [`LabelBackground`](LabelBackground.md)

Defined in: [canvas/src/primitives/types.ts:1240](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1240)

***

### collisionGroup?

> `readonly` `optional` **collisionGroup?**: `string`

Defined in: [canvas/src/primitives/types.ts:1258](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1258)

***

### content

> `readonly` **content**: [`LabelContent`](../type-aliases/LabelContent.md)

Defined in: [canvas/src/primitives/types.ts:1239](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1239)

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Defined in: [canvas/src/primitives/types.ts:1248](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1248)

Cursor on hover when the label container has hit-testing enabled.

***

### forceShow?

> `readonly` `optional` **forceShow?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1259](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1259)

***

### interactive?

> `readonly` `optional` **interactive?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1250](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1250)

Pointer events enabled on the label container. Default `false`.

***

### minFontSize?

> `readonly` `optional` **minFontSize?**: `number`

Defined in: [canvas/src/primitives/types.ts:1266](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1266)

Floor used by the shrink → truncate → hide fit cascade when an
`inside-*` placement requires the label to stay inside the host shape.
Below this size, the cascade moves on to truncation (ellipsis) and
finally hide. Default `9` (px). Ignored for non-`inside-*` placements.

***

### offset?

> `readonly` `optional` **offset?**: `object`

Defined in: [canvas/src/primitives/types.ts:1243](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1243)

Screen-space offset in pixels applied *after* any auto-rotation.

#### x?

> `readonly` `optional` **x?**: `number`

#### y?

> `readonly` `optional` **y?**: `number`

***

### priority?

> `readonly` `optional` **priority?**: `number`

Defined in: [canvas/src/primitives/types.ts:1257](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1257)

Read by `LabelCollisionBehaviour` only — the primitive ignores these.
`priority` higher wins ties when collision hides overlap. `collisionGroup`
partitions the collision graph (labels in different groups never compete).
`forceShow: true` bypasses collision entirely.

***

### visibility?

> `readonly` `optional` **visibility?**: [`LabelVisibility`](LabelVisibility.md)

Defined in: [canvas/src/primitives/types.ts:1246](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1246)

Per-label zoom-band LOD; the decoration mounts/unmounts on threshold.

***

### wrap?

> `readonly` `optional` **wrap?**: [`LabelWrap`](LabelWrap.md)

Defined in: [canvas/src/primitives/types.ts:1241](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1241)
