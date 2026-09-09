# Interface: UseLayoutOptions

## Properties

### applyInitial?

> `optional` **applyInitial?**: `boolean`

Apply the initial layout once the target layer is mounted. Default `true`.

***

### fitPadding?

> `optional` **fitPadding?**: `number`

Padding for the post-layout `camera.fitContent`. Default `80`.

***

### initial?

> `optional` **initial?**: `string`

Initially-selected key. Default: first key of `layouts`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Optional key → human label map for the picker. Default: identity.

***

### layerId?

> `optional` **layerId?**: `string`

Target `GraphLayer` id. Default `'graph'`.
