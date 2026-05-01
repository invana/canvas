# HoverActivatePlugin

Applies a state to hovered nodes/edges and optionally highlights their neighbours up to N hops. Supports per-element enable predicates and inactive dimming of everything else. All options are runtime-mutable.

> **Package:** `@invana/plugins-graph-data`
>
> **Requires:** `GraphDataPlugin` registered first.

This plugin is **opt-in** — without it, `shape:pointerover` / `shape:pointerout` events are still emitted but no visual state changes.

## Setup

```ts
import { GraphDataPlugin, HoverActivatePlugin } from '@invana/plugins-graph-data';

await canvas.plugins.register(new GraphDataPlugin({ data }));

await canvas.plugins.register(new HoverActivatePlugin({
  state:         'active',
  degree:        1,
  direction:     'both',
  inactiveState: 'inactive',
}));
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'hover-activate'` | Plugin id override. |
| `graphDataId` | `string` | `'graph-data'` | Id of the `GraphDataPlugin` to read/write through. |
| `enable` | `boolean \| (element) => boolean` | `true` | Global on/off or per-element predicate. |
| `state` | `string` | `'active'` | State applied to the hovered element and its expanded neighbours. |
| `inactiveState` | `string` | `undefined` | State applied to every element NOT in the active set. Omit to skip dimming. |
| `degree` | `number` | `0` | N-hop neighbour expansion. `0` = hovered element only; `1` = direct neighbours. |
| `direction` | `'incoming' \| 'outgoing' \| 'both'` | `'both'` | Edge traversal direction for neighbour expansion. |
| `animation` | `boolean` | `true` | Reserved for future transition support. |
| `onHover` | `(element) => void` | — | Called when an element becomes hovered. |
| `onHoverEnd` | `(element) => void` | — | Called when hover ends on a previously hovered element. |

## API

### `setOptions(patch)`

Update any option at runtime. When `state` or `inactiveState` changes the current hover effect is cleared first so the next hover applies the new visual cleanly.

```ts
hoverPlugin.setOptions({ degree: 2, inactiveState: 'muted' });
```

### `clearHover()`

Programmatically clear all states applied by the current hover.

```ts
hoverPlugin.clearHover();
```

### `hoveredElement`

Read-only property. The element currently driving the hover effect, or `null` when nothing is hovered.

```ts
const el = hoverPlugin.hoveredElement; // { id, type, element } | null
```

### `store`

A `HoverStore` instance updated by this plugin. Subscribe for reactive downstream state.

```ts
hoverPlugin.store.on('hover:changed', ({ id, type }) => {
  console.log('hovered:', id, type);
});
```

## Callbacks

```ts
await canvas.plugins.register(new HoverActivatePlugin({
  onHover:    el => console.log('hover',    el.id, el.type),
  onHoverEnd: el => console.log('hoverEnd', el.id, el.type),
}));
```

`el` is a `HoverableElement`:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Element id. |
| `type` | `'shape' \| 'connector'` | Whether this is a node or an edge. |
| `element` | `BaseShape \| BaseConnector` | The underlying rendered instance. |

## Examples

### Basic hover highlight

```ts
await canvas.plugins.register(new HoverActivatePlugin({ state: 'active' }));
```

### Neighbour highlight with dimming

```ts
await canvas.plugins.register(new HoverActivatePlugin({
  state:         'active',
  inactiveState: 'inactive',
  degree:        1,
  direction:     'both',
}));
```

### Selective enabling (nodes only)

```ts
await canvas.plugins.register(new HoverActivatePlugin({
  enable: el => el.type === 'shape',
  state:  'highlight',
}));
```
