# Interface: ClickInspectBehaviourOptions

Defined in: [graph/src/behaviours/ClickInspectBehaviour.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickInspectBehaviour.ts#L50)

Constructor options for `ClickInspectBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

Defined in: [graph/src/behaviours/ClickInspectBehaviour.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickInspectBehaviour.ts#L55)

Clear the inspected element when clicking the empty canvas. Default `true`.

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

Defined in: [graph/src/behaviours/ClickInspectBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickInspectBehaviour.ts#L52)

Required — the `GraphLayer` id this behaviour reads clicks from.

#### Overrides

`BehaviourOptions.targetLayerId`
