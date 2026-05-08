# Function: makeEventType()

> **makeEventType**(`source`, `name`): `string`

Defined in: [packages/canvas/src/events/CanvasEvent.ts:36](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/events/CanvasEvent.ts#L36)

Build a `<source-kind>:<source-id>:<event-name>` envelope-type string.
Centralised so the convention can't drift.

## Parameters

### source

[`EventSource`](../interfaces/EventSource.md)

### name

`string`

## Returns

`string`
