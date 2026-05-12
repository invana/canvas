# Graph events

::: warning Planned — in design
Names and payloads below are the target convention for `@invana/graph`. Not yet shipped.
:::

`GraphLayer` emits semantic events on `graphLayer.events`. Names are **split by type** — `node:*` and `edge:*` are distinct events, each with a typed payload. There is no flat `element:*` channel.

Per the [engine events model](../guide/events.md), every `layer.events` emit also flows through the canvas tap channel wrapped in a `CanvasEvent` envelope.

## Node events

| Event | Payload |
|---|---|
| `node:pointerover` / `node:pointerout` | `{ nodeId, nodeData, worldX, worldY, pointerId, modifiers }` |
| `node:pointerdown` / `node:pointerup` / `node:pointermove` | same + `{ button }` |
| `node:click` / `node:doubleclick` | same + `{ button }` |
| `node:contextmenu` | same |
| `node:dragstart` / `node:drag` / `node:dragend` | `{ nodeId, nodeData, worldX, worldY, dx, dy, modifiers }` |
| `node:statechange` | `{ nodeId, state, active }` |
| `node:added` / `node:removed` | `{ nodeId }` |

Drag events are emitted by `DragNodeBehaviour`, not by the layer's pointer template methods — the layer itself only synthesises tap/click/doubleclick.

## Edge events

The same 14 variants for edges, with `edgeId` / `edgeData` instead of `nodeId` / `nodeData`:

`edge:pointerover` / `edge:pointerout` / `edge:pointerdown` / `edge:pointerup` / `edge:pointermove` / `edge:click` / `edge:doubleclick` / `edge:contextmenu` / `edge:statechange` / `edge:added` / `edge:removed`. (Edge drag events ship when `DragEdgeBehaviour` lands; not v0.)

## Data lifecycle

| Event | Payload |
|---|---|
| `data:changed` | `{ addedNodes, removedNodes, addedEdges, removedEdges }` — counts |
| `positions:updated` | `{ count }` — emitted by layouts after writing back |
| `selection:changed` | `{ added, removed, selected }` — sets of ids |
| `viewport:fitcontent` | `{}` — emitted after `fitContent()` |

## Why split by type, not discriminated

A discriminated `element:click` event with a `kind: 'node' | 'edge'` field forces every subscriber to switch-and-cast at the call site, and TypeScript can't narrow a single event payload to the right interface. Splitting gives:

- `graph.events.on('node:click', e => e.nodeData.id)` — no narrowing
- Subscribers that only care about nodes never receive edge events
- Tap-channel suffix filtering ("only `node:*`") works naturally

## Subscribing

```ts
graph.events.on('node:click', ({ nodeId, nodeData, worldX, worldY }) => {
  console.log('clicked', nodeId, nodeData.data);
});

const off = graph.events.on('selection:changed', ({ selected }) => {
  hud.setSelection(selected);
});
off();
```

For telemetry, subscribe once on the tap channel and filter by suffix:

```ts
canvas.events.tap(e => {
  if (e.type.endsWith(':node:click')) metrics.send('graph.node.click');
});
```
