# Interface: DrawEdgeBehaviourOptions

Defined in: [graph/src/behaviours/DrawEdgeBehaviour.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L28)

Constructor options for `DrawEdgeBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### allowSelfLoop?

> `optional` **allowSelfLoop?**: `boolean`

Defined in: [graph/src/behaviours/DrawEdgeBehaviour.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L39)

Allow releasing on the *source* node to create a self-loop. Default
`false` (releasing on the source cancels). When `true`, the default
`createEdge` factory styles a self-loop as `pathType: 'loop-curve'` with
`sourceAnchor`/`targetAnchor` set to `'center'` (a loop needs center
anchors — `'boundary'` collapses it onto a single silhouette point).

***

### createEdge?

> `optional` **createEdge?**: (`source`, `target`) => [`GraphEdge`](GraphEdge.md)\<`unknown`\>

Defined in: [graph/src/behaviours/DrawEdgeBehaviour.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L46)

Build the edge to insert from the endpoints. Return `null` to veto (e.g.
a duplicate or disallowed pair). Default: `{ id: <generated>, source, target }`,
or a loop-styled edge when `source === target` (see [allowSelfLoop](#allowselfloop)).

#### Parameters

##### source

`string`

##### target

`string`

#### Returns

[`GraphEdge`](GraphEdge.md)\<`unknown`\>

***

### draftStyle?

> `optional` **draftStyle?**: `Partial`\<\{ `alpha`: `number`; `color`: `number`; `dash`: \[`number`, `number`\]; `width`: `number`; \}\>

Defined in: [graph/src/behaviours/DrawEdgeBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L52)

Rubber-band preview stroke. Defaults to a dashed light-blue line.

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

### onEdgeCreate?

> `optional` **onEdgeCreate?**: (`edge`) => `void`

Defined in: [graph/src/behaviours/DrawEdgeBehaviour.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L49)

Fired after an edge is added to the store.

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

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

Defined in: [graph/src/behaviours/DrawEdgeBehaviour.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L30)

Required — the `GraphLayer` id this behaviour draws edges in.

#### Overrides

`BehaviourOptions.targetLayerId`
