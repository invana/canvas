# Interface: CanvasEventBusOptions

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:95](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/events/CanvasEventBus.ts#L95)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:98](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/events/CanvasEventBus.ts#L98)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
