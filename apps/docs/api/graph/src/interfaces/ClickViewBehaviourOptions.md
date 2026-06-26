# Interface: ClickViewBehaviourOptions

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L52)

Constructor options for `ClickViewBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L57)

Clear the viewed element when clicking the empty canvas. Default `true`.

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

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L54)

Required — the `GraphLayer` id this behaviour reads clicks from.

#### Overrides

`BehaviourOptions.targetLayerId`
