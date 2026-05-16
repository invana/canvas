# Function: makeEventType()

> **makeEventType**(`source`, `name`): `string`

Defined in: [canvas/src/events/CanvasEvent.ts:36](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/events/CanvasEvent.ts#L36)

Build a `<source-kind>:<source-id>:<event-name>` envelope-type string.
Centralised so the convention can't drift.

## Parameters

### source

[`EventSource`](../interfaces/EventSource.md)

### name

`string`

## Returns

`string`
