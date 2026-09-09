# Interface: ViewContext

The full "info" handed to a custom viewer UI (the `panel` render-prop on
`<ClickViewBehaviour>`). It bundles the **resolved display fields** (from
[useViewData](../functions/useViewData.md)), the **raw stored entity**, and **engine handles** so the
UI can do anything — render read-only details (visualiser) or a form editor
that commits through the store / history (modeller).

`kind` is `'node' | 'edge'` today; it's intentionally the discriminator the
UI switches on, so new clickable data types can widen this union later without
changing the contract.

## Properties

### canvas

> **canvas**: `Canvas`

The resolved engine canvas.

***

### close

> **close**: () => `void`

Dismiss the viewer (clears the `ClickViewBehaviour` target).

#### Returns

`void`

***

### data

> **data**: `Record`\<`string`, `unknown`\>

Current `data` as a flat map — values keep their original type (number,
string, array, object, …) for type-aware rendering. See [useViewData](../functions/useViewData.md).

***

### edge?

> `optional` **edge?**: `GraphEdge`

Raw stored edge — present when `kind === 'edge'`.

***

### id

> **id**: `string`

***

### kind

> **kind**: `"node"` \| `"edge"`

***

### label

> **label**: `string`

Effective (resolved) label text. Empty for edges.

***

### layer

> **layer**: `GraphLayer`

The target `GraphLayer`.

***

### node?

> `optional` **node?**: `GraphNode`

Raw stored node — present when `kind === 'node'`.

***

### source?

> `optional` **source?**: `string`

Source node id — edges only.

***

### store

> **store**: `GraphStore`

The layer's store — write here (spread prior `style`) to edit.

***

### target?

> `optional` **target?**: `string`

Target node id — edges only.

***

### type?

> `optional` **type?**: `string`

The element's free-form `type` tag, when set.
