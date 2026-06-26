# Interface: ViewContext

Defined in: [canvas-react/src/hooks/useViewContext.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L24)

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

Defined in: [canvas-react/src/hooks/useViewContext.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L45)

The resolved engine canvas.

***

### close

> **close**: () => `void`

Defined in: [canvas-react/src/hooks/useViewContext.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L51)

Dismiss the viewer (clears the `ClickViewBehaviour` target).

#### Returns

`void`

***

### data

> **data**: `Record`\<`string`, `unknown`\>

Defined in: [canvas-react/src/hooks/useViewContext.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L39)

Current `data` as a flat map — values keep their original type (number,
string, array, object, …) for type-aware rendering. See [useViewData](../functions/useViewData.md).

***

### edge?

> `optional` **edge?**: `GraphEdge`

Defined in: [canvas-react/src/hooks/useViewContext.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L30)

Raw stored edge — present when `kind === 'edge'`.

***

### id

> **id**: `string`

Defined in: [canvas-react/src/hooks/useViewContext.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L26)

***

### kind

> **kind**: `"node"` \| `"edge"`

Defined in: [canvas-react/src/hooks/useViewContext.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L25)

***

### label

> **label**: `string`

Defined in: [canvas-react/src/hooks/useViewContext.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L32)

Effective (resolved) label text. Empty for edges.

***

### layer

> **layer**: `GraphLayer`

Defined in: [canvas-react/src/hooks/useViewContext.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L47)

The target `GraphLayer`.

***

### node?

> `optional` **node?**: `GraphNode`

Defined in: [canvas-react/src/hooks/useViewContext.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L28)

Raw stored node — present when `kind === 'node'`.

***

### source?

> `optional` **source?**: `string`

Defined in: [canvas-react/src/hooks/useViewContext.ts:41](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L41)

Source node id — edges only.

***

### store

> **store**: `GraphStore`

Defined in: [canvas-react/src/hooks/useViewContext.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L49)

The layer's store — write here (spread prior `style`) to edit.

***

### target?

> `optional` **target?**: `string`

Defined in: [canvas-react/src/hooks/useViewContext.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L43)

Target node id — edges only.

***

### type?

> `optional` **type?**: `string`

Defined in: [canvas-react/src/hooks/useViewContext.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewContext.ts#L34)

The element's free-form `type` tag, when set.
