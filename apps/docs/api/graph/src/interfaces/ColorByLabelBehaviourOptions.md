# Interface: ColorByLabelBehaviourOptions

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:69](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L69)

Constructor options for `ColorByLabelBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### colorEdges?

> `optional` **colorEdges?**: `boolean`

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:81](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L81)

Colour edges (their `strokeColor` + `arrowTargetColor`). Default `true`.

***

### colorNodes?

> `optional` **colorNodes?**: `boolean`

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:79](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L79)

Colour nodes (their `bgFill`). Default `true`.

***

### edgeLabel?

> `optional` **edgeLabel?**: [`ColorLabelAccessor`](../type-aliases/ColorLabelAccessor.md)\<[`GraphEdge`](GraphEdge.md)\<`unknown`\>\>

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L77)

Per-edge label accessor. Default: `edge.type`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### fallbackColor?

> `optional` **fallbackColor?**: `number`

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L83)

Colour for items whose label is missing/empty. Default `0x9ca3af` (grey).

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### nodeLabel?

> `optional` **nodeLabel?**: [`ColorLabelAccessor`](../type-aliases/ColorLabelAccessor.md)\<[`GraphNode`](GraphNode.md)\<`unknown`\>\>

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L75)

Per-node label accessor. Default: `node.type`.

***

### palette?

> `optional` **palette?**: readonly `number`[]

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L73)

Colours (0xRRGGBB) cycled per distinct label. Default [DEFAULT\_LABEL\_PALETTE](../variables/DEFAULT_LABEL_PALETTE.md).

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`BehaviourOptions.shortcuts`

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/ColorByLabelBehaviour.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ColorByLabelBehaviour.ts#L71)

Required — the `GraphLayer` id this behaviour colours.

#### Overrides

`BehaviourOptions.targetLayerId`
