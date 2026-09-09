# Function: useGraphEvent()

> **useGraphEvent**\<`K`\>(`event`, `handler`, `opts?`): `void`

Subscribe to a graph event — a `GraphStore` event (`node:visibility`,
`edge:visibility`, `node:add`, …) or a `GraphLayer` event (`group:visibility`,
`data:changed`, `style:changed`) — for the lifetime of the calling component.

Resolves the engine like the other canvas hooks (context or explicit
`opts.canvas`), looks up the `GraphLayer` by `opts.layerId` (default
`'graph'`), and attaches to the right emitter (`layer.store.events` or
`layer.events`). The handler is held in a ref, so changing it between renders
does **not** re-subscribe; only a change of the resolved canvas, layer id, or
event name does. No-op (until the layer exists) when the id isn't mounted yet.

## Type Parameters

### K

`K` *extends* keyof [`GraphEventMap`](../interfaces/GraphEventMap.md)

## Parameters

### event

`K`

### handler

(`payload`) => `void`

### opts?

[`UseGraphEventOptions`](../interfaces/UseGraphEventOptions.md) = `{}`

## Returns

`void`

## Example

```ts
useGraphEvent('node:visibility', () => setHidden([...layer.store.hiddenNodes()]));
useGraphEvent('group:visibility', ({ groupId, hidden }) => …);
```
