# Interface: LabelWrap

Wrap / overflow controls. Applies to both plain text and HTML text.

## Properties

### maxHeight?

> `readonly` `optional` **maxHeight?**: `number`

Pixel cap on render height. Combined with the text's `lineHeight` (read
from `LabelContent.lineHeight` or derived from `fontSize`) to derive an
effective `maxLines = floor(maxHeight / lineHeight)`. If both `maxHeight`
and `maxLines` are set, the smaller (more restrictive) wins.

***

### maxLines?

> `readonly` `optional` **maxLines?**: `number`

Cap on rendered lines; lines past this are dropped (after `overflow`).

***

### maxWidth?

> `readonly` `optional` **maxWidth?**: `number`

Pixel cap on render width. Triggers word-wrap when set.

***

### overflow?

> `readonly` `optional` **overflow?**: `"clip"` \| `"ellipsis"`

Truncation policy for content past `maxLines`. Default `'ellipsis'`.

***

### wordWrap?

> `readonly` `optional` **wordWrap?**: `boolean`

Enable wrap explicitly; auto-true when `maxWidth` is set.
