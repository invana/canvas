# Interface: ConnectorLabelStyle

Defined in: [canvas/src/primitives/types.ts:1311](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1311)

Style payload for connector labels.

## Extends

- [`LabelStyleCommon`](LabelStyleCommon.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:1244](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1244)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`alpha`](LabelStyleCommon.md#alpha)

***

### autoRotate?

> `readonly` `optional` **autoRotate?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1320](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1320)

Rotate the label so its baseline follows the path tangent. Default `true`.

***

### background?

> `readonly` `optional` **background?**: [`LabelBackground`](LabelBackground.md)

Defined in: [canvas/src/primitives/types.ts:1240](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1240)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`background`](LabelStyleCommon.md#background)

***

### collisionGroup?

> `readonly` `optional` **collisionGroup?**: `string`

Defined in: [canvas/src/primitives/types.ts:1258](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1258)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`collisionGroup`](LabelStyleCommon.md#collisiongroup)

***

### content

> `readonly` **content**: [`LabelContent`](../type-aliases/LabelContent.md)

Defined in: [canvas/src/primitives/types.ts:1239](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1239)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`content`](LabelStyleCommon.md#content)

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Defined in: [canvas/src/primitives/types.ts:1248](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1248)

Cursor on hover when the label container has hit-testing enabled.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`cursor`](LabelStyleCommon.md#cursor)

***

### forceShow?

> `readonly` `optional` **forceShow?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1259](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1259)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`forceShow`](LabelStyleCommon.md#forceshow)

***

### interactive?

> `readonly` `optional` **interactive?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1250](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1250)

Pointer events enabled on the label container. Default `false`.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`interactive`](LabelStyleCommon.md#interactive)

***

### keepUpright?

> `readonly` `optional` **keepUpright?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1325](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1325)

When `autoRotate` is on, flip the label by π if the tangent angle lies in
(π/2, 3π/2) — keeps reading direction upright. Default `true`.

***

### minFontSize?

> `readonly` `optional` **minFontSize?**: `number`

Defined in: [canvas/src/primitives/types.ts:1266](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1266)

Floor used by the shrink → truncate → hide fit cascade when an
`inside-*` placement requires the label to stay inside the host shape.
Below this size, the cascade moves on to truncation (ellipsis) and
finally hide. Default `9` (px). Ignored for non-`inside-*` placements.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`minFontSize`](LabelStyleCommon.md#minfontsize)

***

### offset?

> `readonly` `optional` **offset?**: `object`

Defined in: [canvas/src/primitives/types.ts:1243](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1243)

Screen-space offset in pixels applied *after* any auto-rotation.

#### x?

> `readonly` `optional` **x?**: `number`

#### y?

> `readonly` `optional` **y?**: `number`

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`offset`](LabelStyleCommon.md#offset)

***

### pathOffset?

> `readonly` `optional` **pathOffset?**: `number`

Defined in: [canvas/src/primitives/types.ts:1318](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1318)

Distance to shift along the path tangent, in pixels. Positive = toward
target; negative = toward source. Use this for "pad 24px from source".

***

### placement?

> `readonly` `optional` **placement?**: [`ConnectorLabelPlacement`](../type-aliases/ConnectorLabelPlacement.md)

Defined in: [canvas/src/primitives/types.ts:1313](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1313)

Default `'center'`.

***

### priority?

> `readonly` `optional` **priority?**: `number`

Defined in: [canvas/src/primitives/types.ts:1257](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1257)

Read by `LabelCollisionBehaviour` only — the primitive ignores these.
`priority` higher wins ties when collision hides overlap. `collisionGroup`
partitions the collision graph (labels in different groups never compete).
`forceShow: true` bypasses collision entirely.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`priority`](LabelStyleCommon.md#priority)

***

### visibility?

> `readonly` `optional` **visibility?**: [`LabelVisibility`](LabelVisibility.md)

Defined in: [canvas/src/primitives/types.ts:1246](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1246)

Per-label zoom-band LOD; the decoration mounts/unmounts on threshold.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`visibility`](LabelStyleCommon.md#visibility)

***

### wrap?

> `readonly` `optional` **wrap?**: [`LabelWrap`](LabelWrap.md)

Defined in: [canvas/src/primitives/types.ts:1241](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L1241)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`wrap`](LabelStyleCommon.md#wrap)
