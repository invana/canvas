# Function: makeEventType()

> **makeEventType**(`source`, `name`): `string`

Defined in: [packages/canvas/src/events/CanvasEvent.ts:36](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/events/CanvasEvent.ts#L36)

Build a `<source-kind>:<source-id>:<event-name>` envelope-type string.
Centralised so the convention can't drift.

## Parameters

### source

[`EventSource`](../interfaces/EventSource.md)

### name

`string`

## Returns

`string`
