# Interface: LabelWrap

Defined in: [canvas/src/primitives/types.ts:1080](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1080)

Wrap / overflow controls. Applies to both plain text and HTML text.

## Properties

### maxHeight?

> `readonly` `optional` **maxHeight?**: `number`

Defined in: [canvas/src/primitives/types.ts:1089](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1089)

Pixel cap on render height. Combined with the text's `lineHeight` (read
from `LabelContent.lineHeight` or derived from `fontSize`) to derive an
effective `maxLines = floor(maxHeight / lineHeight)`. If both `maxHeight`
and `maxLines` are set, the smaller (more restrictive) wins.

***

### maxLines?

> `readonly` `optional` **maxLines?**: `number`

Defined in: [canvas/src/primitives/types.ts:1091](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1091)

Cap on rendered lines; lines past this are dropped (after `overflow`).

***

### maxWidth?

> `readonly` `optional` **maxWidth?**: `number`

Defined in: [canvas/src/primitives/types.ts:1082](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1082)

Pixel cap on render width. Triggers word-wrap when set.

***

### overflow?

> `readonly` `optional` **overflow?**: `"clip"` \| `"ellipsis"`

Defined in: [canvas/src/primitives/types.ts:1095](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1095)

Truncation policy for content past `maxLines`. Default `'ellipsis'`.

***

### wordWrap?

> `readonly` `optional` **wordWrap?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1093](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L1093)

Enable wrap explicitly; auto-true when `maxWidth` is set.
