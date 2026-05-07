# Interface: CanvasEventBusOptions

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:95](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/events/CanvasEventBus.ts#L95)

## Properties

### source?

> `optional` **source?**: [`EventSource`](EventSource.md)

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:98](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/events/CanvasEventBus.ts#L98)

Source identity for envelopes the bus publishes via its own `emit()`.
Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance.
