# Interface: CreateNodeBehaviourOptions

Defined in: [graph/src/behaviours/CreateNodeBehaviour.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/CreateNodeBehaviour.ts#L24)

Constructor options for `CreateNodeBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### createNode?

> `optional` **createNode?**: (`world`) => [`GraphNode`](GraphNode.md)\<`unknown`\>

Defined in: [graph/src/behaviours/CreateNodeBehaviour.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/CreateNodeBehaviour.ts#L32)

Build the node to insert from the click's world position. Return `null`
to veto creation. Default: `{ id: <generated>, position }`.

#### Parameters

##### world

###### x

`number`

###### y

`number`

#### Returns

[`GraphNode`](GraphNode.md)\<`unknown`\>

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### onNodeCreate?

> `optional` **onNodeCreate?**: (`node`) => `void`

Defined in: [graph/src/behaviours/CreateNodeBehaviour.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/CreateNodeBehaviour.ts#L35)

Fired after a node is added to the store.

#### Parameters

##### node

[`GraphNode`](GraphNode.md)

#### Returns

`void`

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

Defined in: [graph/src/behaviours/CreateNodeBehaviour.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/CreateNodeBehaviour.ts#L26)

Required — the `GraphLayer` id this behaviour adds nodes to.

#### Overrides

`BehaviourOptions.targetLayerId`
