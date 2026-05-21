# Interface: BubbleSetsLayerEvents

Defined in: [graph-layer-bubble-sets/src/types.ts:165](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L165)

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

## Extends

- [`EventMap`](../../../canvas/src/type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### recompute

> **recompute**: `object`

Defined in: [graph-layer-bubble-sets/src/types.ts:167](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L167)

Fired after each full recompute, before paint.

#### durationMs

> **durationMs**: `number`

#### sets

> **sets**: `number`

***

### set:painted

> **set:painted**: `object`

Defined in: [graph-layer-bubble-sets/src/types.ts:169](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-bubble-sets/src/types.ts#L169)

Fired once per set after it's painted.

#### setId

> **setId**: `string`

#### vertices

> **vertices**: `number`
