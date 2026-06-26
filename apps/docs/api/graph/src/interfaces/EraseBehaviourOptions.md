# Interface: EraseBehaviourOptions

Defined in: [graph/src/behaviours/EraseBehaviour.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EraseBehaviour.ts#L39)

Constructor options for `EraseBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

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

### onErase?

> `optional` **onErase?**: (`removed`) => `void`

Defined in: [graph/src/behaviours/EraseBehaviour.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EraseBehaviour.ts#L47)

Fired after an element is removed, with the captured pre-removal state.

#### Parameters

##### removed

[`ErasedElement`](../type-aliases/ErasedElement.md)

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

### target?

> `optional` **target?**: [`EraseTargetKind`](../type-aliases/EraseTargetKind.md)

Defined in: [graph/src/behaviours/EraseBehaviour.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EraseBehaviour.ts#L44)

Which element kinds a click removes. Default `'both'`.

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/EraseBehaviour.ts:41](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EraseBehaviour.ts#L41)

Required — the `GraphLayer` id this behaviour erases from.

#### Overrides

`BehaviourOptions.targetLayerId`
