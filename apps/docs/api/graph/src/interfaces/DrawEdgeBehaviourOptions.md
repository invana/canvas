# Interface: DrawEdgeBehaviourOptions

Constructor options for `DrawEdgeBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### allowSelfLoop?

> `optional` **allowSelfLoop?**: `boolean`

Allow releasing on the *source* node to create a self-loop. Default
`false` (releasing on the source cancels). When `true`, the default
`createEdge` factory styles a self-loop as `pathType: 'loop-curve'` with
`sourceAnchor`/`targetAnchor` set to `'center'` (a loop needs center
anchors — `'boundary'` collapses it onto a single silhouette point).

***

### createEdge?

> `optional` **createEdge?**: (`source`, `target`) => [`GraphEdge`](GraphEdge.md)\<`unknown`\>

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

Rubber-band preview stroke. Defaults to a dashed light-blue line.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### onEdgeCreate?

> `optional` **onEdgeCreate?**: (`edge`) => `void`

Fired after an edge is added to the store.

#### Parameters

##### edge

[`GraphEdge`](GraphEdge.md)

#### Returns

`void`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour draws edges in.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)
