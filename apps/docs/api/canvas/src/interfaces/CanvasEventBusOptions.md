# Interface: CanvasEventBusOptions

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:95](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/events/CanvasEventBus.ts#L95)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:98](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/events/CanvasEventBus.ts#L98)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
