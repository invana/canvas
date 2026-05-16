# Function: makeEventType()

> **makeEventType**(`source`, `name`): `string`

Defined in: [canvas/src/events/CanvasEvent.ts:36](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEvent.ts#L36)

Build a `<source-kind>:<source-id>:<event-name>` envelope-type string.
Centralised so the convention can't drift.

## Parameters

### source

[`EventSource`](../interfaces/EventSource.md)

### name

`string`

## Returns

`string`
