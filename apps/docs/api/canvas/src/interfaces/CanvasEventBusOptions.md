# Interface: CanvasEventBusOptions

Defined in: [canvas/src/events/CanvasEventBus.ts:129](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L129)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [canvas/src/events/CanvasEventBus.ts:132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L132)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
