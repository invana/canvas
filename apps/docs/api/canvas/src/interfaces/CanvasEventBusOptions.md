# Interface: CanvasEventBusOptions

Defined in: [canvas/src/events/CanvasEventBus.ts:95](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/events/CanvasEventBus.ts#L95)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [canvas/src/events/CanvasEventBus.ts:98](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/events/CanvasEventBus.ts#L98)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
