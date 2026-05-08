# Type Alias: EventMap

> **EventMap** = `Record`\<`string`, `unknown`\>

Defined in: [packages/canvas/src/events/EventEmitter.ts:19](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/events/EventEmitter.ts#L19)

Typed event emitter — generic over an event-map shape.

Used by `Canvas`, every `Layer`, every `Behaviour`, and the `ShapesRenderer`.
Hard-wired to play nicely with `CanvasEventBus.tap()` (see `events/CanvasEventBus.ts`)
but functions standalone.

## Example

```ts
type GraphLayerEvents = {
  'node:hover': { id: string };
  'selection:changed': { ids: ReadonlySet<string> };
};
const events = new EventEmitter<GraphLayerEvents>();
const off = events.on('node:hover', ({ id }) => console.log(id));
events.emit('node:hover', { id: 'n-42' });
off();
```
