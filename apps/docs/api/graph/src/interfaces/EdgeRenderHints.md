# Interface: EdgeRenderHints

Defined in: [graph/src/layer/types.ts:201](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L201)

Render-spec hints for an edge. Optional, all defaulted.

**LEGACY** — superseded by [EdgeStyle](EdgeStyle.md) (v3 G6-aligned shape).

## Properties

### alpha?

> `optional` **alpha?**: `number`

Defined in: [graph/src/layer/types.ts:225](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L225)

Alpha 0–1. Default 1.

***

### anchor?

> `optional` **anchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:205](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L205)

Endpoint anchor for both ends. Default `'boundary'`. See [EdgeAnchor](../type-aliases/EdgeAnchor.md).

***

### arrow?

> `optional` **arrow?**: `boolean`

Defined in: [graph/src/layer/types.ts:227](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L227)

Whether to draw an arrowhead at target. Default `true`.

***

### label?

> `optional` **label?**: [`EdgeLabelHint`](../type-aliases/EdgeLabelHint.md)

Defined in: [graph/src/layer/types.ts:232](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L232)

Optional text label attached to the edge.

#### See

[EdgeLabelHint](../type-aliases/EdgeLabelHint.md)

***

### pathStyleOpts?

> `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:217](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L217)

Path-style-specific options forwarded to the canvas pathStyle function.

***

### pathType?

> `optional` **pathType?**: [`EdgePathType`](../type-aliases/EdgePathType.md)

Defined in: [graph/src/layer/types.ts:203](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L203)

Path-style shortcut. Default `'straight'`.

***

### sourceAnchor?

> `optional` **sourceAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:209](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L209)

Per-endpoint anchor override. Falls back to `anchor` when omitted.

***

### sourceAnchorOpts?

> `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:213](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L213)

Opts forwarded to the source anchor's `endpoint.opts`.

***

### stroke?

> `optional` **stroke?**: `number`

Defined in: [graph/src/layer/types.ts:221](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L221)

Stroke color. Default `0x94a3b8`.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:223](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L223)

Stroke width. Default 1.5.

***

### targetAnchor?

> `optional` **targetAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:211](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L211)

Per-endpoint anchor override; see [sourceAnchor](#sourceanchor).

***

### targetAnchorOpts?

> `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:215](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L215)

Opts for the target anchor; see [sourceAnchorOpts](#sourceanchoropts).

***

### waypoints?

> `optional` **waypoints?**: readonly `object`[]

Defined in: [graph/src/layer/types.ts:219](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L219)

Intermediate control points the connector should respect.
