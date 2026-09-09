# Interface: LabelStyleCommon

Common style block shared by shape- and connector-anchored labels.
Placement / offset / rotation specifics live on the host-specific spec.

## Extended by

- [`ShapeLabelStyle`](ShapeLabelStyle.md)
- [`ConnectorLabelStyle`](ConnectorLabelStyle.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

***

### background?

> `readonly` `optional` **background?**: [`LabelBackground`](LabelBackground.md)

***

### collisionGroup?

> `readonly` `optional` **collisionGroup?**: `string`

***

### content

> `readonly` **content**: [`LabelContent`](../type-aliases/LabelContent.md)

***

### cursor?

> `readonly` `optional` **cursor?**: `string`

Cursor on hover when the label container has hit-testing enabled.

***

### forceShow?

> `readonly` `optional` **forceShow?**: `boolean`

***

### interactive?

> `readonly` `optional` **interactive?**: `boolean`

Pointer events enabled on the label container. Default `false`.

***

### minFontSize?

> `readonly` `optional` **minFontSize?**: `number`

Floor used by the shrink → truncate → hide fit cascade when an
`inside-*` placement requires the label to stay inside the host shape.
Below this size, the cascade moves on to truncation (ellipsis) and
finally hide. Default `9` (px). Ignored for non-`inside-*` placements.

***

### offset?

> `readonly` `optional` **offset?**: `object`

Screen-space offset in pixels applied *after* any auto-rotation.

#### x?

> `readonly` `optional` **x?**: `number`

#### y?

> `readonly` `optional` **y?**: `number`

***

### priority?

> `readonly` `optional` **priority?**: `number`

Read by `LabelCollisionBehaviour` only — the primitive ignores these.
`priority` higher wins ties when collision hides overlap. `collisionGroup`
partitions the collision graph (labels in different groups never compete).
`forceShow: true` bypasses collision entirely.

***

### visibility?

> `readonly` `optional` **visibility?**: [`LabelVisibility`](LabelVisibility.md)

Per-label zoom-band LOD; the decoration mounts/unmounts on threshold.

***

### wrap?

> `readonly` `optional` **wrap?**: [`LabelWrap`](LabelWrap.md)
