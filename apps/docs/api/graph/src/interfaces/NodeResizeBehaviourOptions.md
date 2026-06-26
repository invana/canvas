# Interface: NodeResizeBehaviourOptions

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L86)

## Extends

- `BehaviourOptions`

## Properties

### dashArray?

> `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:96](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L96)

Dash pattern `[dashLength, gapLength]` in px. Default `[5, 4]`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### frameColor?

> `optional` **frameColor?**: `number`

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L94)

Frame border + handle outline colour. Default `0x6b7fff`.

***

### framePadding?

> `optional` **framePadding?**: `number`

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:98](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L98)

Gap between host silhouette and the dashed frame. Default `4`.

***

### handleFill?

> `optional` **handleFill?**: `number`

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L92)

Handle fill colour. Default `0xffffff`.

***

### handleRadius?

> `optional` **handleRadius?**: `number`

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:90](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L90)

Handle outer radius in px. Default `5`.

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### minSize?

> `optional` **minSize?**: `number`

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:100](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L100)

Minimum width / height / radius the behaviour allows during drag. Default `20`.

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

Defined in: [graph/src/behaviours/NodeResizeBehaviour.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeResizeBehaviour.ts#L88)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

`BehaviourOptions.targetLayerId`
