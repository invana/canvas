# Interface: CanvasEventBusOptions

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:95](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L95)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:98](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L98)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
