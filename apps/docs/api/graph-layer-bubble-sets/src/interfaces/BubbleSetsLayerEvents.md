# Interface: BubbleSetsLayerEvents

Defined in: [graph-layer-bubble-sets/src/types.ts:165](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L165)

## Extends

- `EventMap`

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### recompute

> **recompute**: `object`

Defined in: [graph-layer-bubble-sets/src/types.ts:167](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L167)

Fired after each full recompute, before paint.

#### durationMs

> **durationMs**: `number`

#### sets

> **sets**: `number`

***

### set:painted

> **set:painted**: `object`

Defined in: [graph-layer-bubble-sets/src/types.ts:169](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L169)

Fired once per set after it's painted.

#### setId

> **setId**: `string`

#### vertices

> **vertices**: `number`
