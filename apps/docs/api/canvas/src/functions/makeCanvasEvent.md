# Function: makeCanvasEvent()

> **makeCanvasEvent**\<`TPayload`\>(`source`, `name`, `payload`): [`CanvasEvent`](../interfaces/CanvasEvent.md)\<`TPayload`\>

Defined in: [packages/canvas/src/events/CanvasEvent.ts:45](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/events/CanvasEvent.ts#L45)

Construct a CanvasEvent envelope. The source is captured by reference, but the
caller is expected to honour the rule that source ids are immutable for the
lifetime of the source — so reading the envelope's `source.id` later is safe.

## Type Parameters

### TPayload

`TPayload`

## Parameters

### source

[`EventSource`](../interfaces/EventSource.md)

### name

`string`

### payload

`TPayload`

## Returns

[`CanvasEvent`](../interfaces/CanvasEvent.md)\<`TPayload`\>
