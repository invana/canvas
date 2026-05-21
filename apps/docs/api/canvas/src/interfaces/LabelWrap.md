# Interface: LabelWrap

Defined in: [canvas/src/primitives/types.ts:1208](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1208)

Wrap / overflow controls. Applies to both plain text and HTML text.

## Properties

### maxHeight?

> `readonly` `optional` **maxHeight?**: `number`

Defined in: [canvas/src/primitives/types.ts:1217](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1217)

Pixel cap on render height. Combined with the text's `lineHeight` (read
from `LabelContent.lineHeight` or derived from `fontSize`) to derive an
effective `maxLines = floor(maxHeight / lineHeight)`. If both `maxHeight`
and `maxLines` are set, the smaller (more restrictive) wins.

***

### maxLines?

> `readonly` `optional` **maxLines?**: `number`

Defined in: [canvas/src/primitives/types.ts:1219](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1219)

Cap on rendered lines; lines past this are dropped (after `overflow`).

***

### maxWidth?

> `readonly` `optional` **maxWidth?**: `number`

Defined in: [canvas/src/primitives/types.ts:1210](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1210)

Pixel cap on render width. Triggers word-wrap when set.

***

### overflow?

> `readonly` `optional` **overflow?**: `"clip"` \| `"ellipsis"`

Defined in: [canvas/src/primitives/types.ts:1223](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1223)

Truncation policy for content past `maxLines`. Default `'ellipsis'`.

***

### wordWrap?

> `readonly` `optional` **wordWrap?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:1221](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1221)

Enable wrap explicitly; auto-true when `maxWidth` is set.
