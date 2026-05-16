# Interface: ConnectorLabelStyle

Defined in: [canvas/src/primitives/types.ts:1181](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1181)

Style payload for connector labels.

## Extends

- [`LabelStyleCommon`](LabelStyleCommon.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:1114](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1114)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`alpha`](LabelStyleCommon.md#alpha)

***

### autoRotate?

> `readonly` `optional` **autoRotate?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1190](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1190)

Rotate the label so its baseline follows the path tangent. Default `true`.

***

### background?

> `readonly` `optional` **background?**: [`LabelBackground`](LabelBackground.md)

Defined in: [canvas/src/primitives/types.ts:1110](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1110)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`background`](LabelStyleCommon.md#background)

***

### collisionGroup?

> `readonly` `optional` **collisionGroup?**: `string`

Defined in: [canvas/src/primitives/types.ts:1128](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1128)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`collisionGroup`](LabelStyleCommon.md#collisiongroup)

***

### content

> `readonly` **content**: [`LabelContent`](../type-aliases/LabelContent.md)

Defined in: [canvas/src/primitives/types.ts:1109](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1109)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`content`](LabelStyleCommon.md#content)

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Defined in: [canvas/src/primitives/types.ts:1118](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1118)

Cursor on hover when the label container has hit-testing enabled.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`cursor`](LabelStyleCommon.md#cursor)

***

### forceShow?

> `readonly` `optional` **forceShow?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1129](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1129)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`forceShow`](LabelStyleCommon.md#forceshow)

***

### interactive?

> `readonly` `optional` **interactive?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1120](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1120)

Pointer events enabled on the label container. Default `false`.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`interactive`](LabelStyleCommon.md#interactive)

***

### keepUpright?

> `readonly` `optional` **keepUpright?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1195](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1195)

When `autoRotate` is on, flip the label by π if the tangent angle lies in
(π/2, 3π/2) — keeps reading direction upright. Default `true`.

***

### minFontSize?

> `readonly` `optional` **minFontSize?**: `number`

Defined in: [canvas/src/primitives/types.ts:1136](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1136)

Floor used by the shrink → truncate → hide fit cascade when an
`inside-*` placement requires the label to stay inside the host shape.
Below this size, the cascade moves on to truncation (ellipsis) and
finally hide. Default `9` (px). Ignored for non-`inside-*` placements.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`minFontSize`](LabelStyleCommon.md#minfontsize)

***

### offset?

> `readonly` `optional` **offset?**: `object`

Defined in: [canvas/src/primitives/types.ts:1113](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1113)

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

Defined in: [canvas/src/primitives/types.ts:1188](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1188)

Distance to shift along the path tangent, in pixels. Positive = toward
target; negative = toward source. Use this for "pad 24px from source".

***

### placement?

> `readonly` `optional` **placement?**: [`ConnectorLabelPlacement`](../type-aliases/ConnectorLabelPlacement.md)

Defined in: [canvas/src/primitives/types.ts:1183](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1183)

Default `'center'`.

***

### priority?

> `readonly` `optional` **priority?**: `number`

Defined in: [canvas/src/primitives/types.ts:1127](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1127)

Read by `LabelCollisionBehaviour` only — the primitive ignores these.
`priority` higher wins ties when collision hides overlap. `collisionGroup`
partitions the collision graph (labels in different groups never compete).
`forceShow: true` bypasses collision entirely.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`priority`](LabelStyleCommon.md#priority)

***

### visibility?

> `readonly` `optional` **visibility?**: [`LabelVisibility`](LabelVisibility.md)

Defined in: [canvas/src/primitives/types.ts:1116](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1116)

Per-label zoom-band LOD; the decoration mounts/unmounts on threshold.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`visibility`](LabelStyleCommon.md#visibility)

***

### wrap?

> `readonly` `optional` **wrap?**: [`LabelWrap`](LabelWrap.md)

Defined in: [canvas/src/primitives/types.ts:1111](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L1111)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`wrap`](LabelStyleCommon.md#wrap)
