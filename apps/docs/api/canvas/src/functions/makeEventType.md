# Function: makeEventType()

> **makeEventType**(`source`, `name`): `string`

Defined in: [canvas/src/events/CanvasEvent.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEvent.ts#L36)

Build a `<source-kind>:<source-id>:<event-name>` envelope-type string.
Centralised so the convention can't drift.

## Parameters

### source

[`EventSource`](../interfaces/EventSource.md)

### name

`string`

## Returns

`string`
