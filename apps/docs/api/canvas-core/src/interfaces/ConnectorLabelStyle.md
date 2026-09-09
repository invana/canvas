# Interface: ConnectorLabelStyle

Style payload for connector labels.

## Extends

- [`LabelStyleCommon`](LabelStyleCommon.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`alpha`](LabelStyleCommon.md#alpha)

***

### autoRotate?

> `readonly` `optional` **autoRotate?**: `boolean`

Rotate the label so its baseline follows the path tangent. Default `true`.

***

### background?

> `readonly` `optional` **background?**: [`LabelBackground`](LabelBackground.md)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`background`](LabelStyleCommon.md#background)

***

### collisionGroup?

> `readonly` `optional` **collisionGroup?**: `string`

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`collisionGroup`](LabelStyleCommon.md#collisiongroup)

***

### content

> `readonly` **content**: [`LabelContent`](../type-aliases/LabelContent.md)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`content`](LabelStyleCommon.md#content)

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Cursor on hover when the label container has hit-testing enabled.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`cursor`](LabelStyleCommon.md#cursor)

***

### forceShow?

> `readonly` `optional` **forceShow?**: `boolean`

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`forceShow`](LabelStyleCommon.md#forceshow)

***

### interactive?

> `readonly` `optional` **interactive?**: `boolean`

Pointer events enabled on the label container. Default `false`.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`interactive`](LabelStyleCommon.md#interactive)

***

### keepUpright?

> `readonly` `optional` **keepUpright?**: `boolean`

When `autoRotate` is on, flip the label by π if the tangent angle lies in
(π/2, 3π/2) — keeps reading direction upright. Default `true`.

***

### minFontSize?

> `readonly` `optional` **minFontSize?**: `number`

Floor used by the shrink → truncate → hide fit cascade when an
`inside-*` placement requires the label to stay inside the host shape.
Below this size, the cascade moves on to truncation (ellipsis) and
finally hide. Default `9` (px). Ignored for non-`inside-*` placements.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`minFontSize`](LabelStyleCommon.md#minfontsize)

***

### offset?

> `readonly` `optional` **offset?**: `object`

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

Distance to shift along the path tangent, in pixels. Positive = toward
target; negative = toward source. Use this for "pad 24px from source".

***

### placement?

> `readonly` `optional` **placement?**: [`ConnectorLabelPlacement`](../type-aliases/ConnectorLabelPlacement.md)

Default `'center'`.

***

### priority?

> `readonly` `optional` **priority?**: `number`

Read by `LabelCollisionBehaviour` only — the primitive ignores these.
`priority` higher wins ties when collision hides overlap. `collisionGroup`
partitions the collision graph (labels in different groups never compete).
`forceShow: true` bypasses collision entirely.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`priority`](LabelStyleCommon.md#priority)

***

### visibility?

> `readonly` `optional` **visibility?**: [`LabelVisibility`](LabelVisibility.md)

Per-label zoom-band LOD; the decoration mounts/unmounts on threshold.

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`visibility`](LabelStyleCommon.md#visibility)

***

### wrap?

> `readonly` `optional` **wrap?**: [`LabelWrap`](LabelWrap.md)

#### Inherited from

[`LabelStyleCommon`](LabelStyleCommon.md).[`wrap`](LabelStyleCommon.md#wrap)
