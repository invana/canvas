# Interface: CanvasEventBusOptions

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:95](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/CanvasEventBus.ts#L95)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:98](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/CanvasEventBus.ts#L98)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
