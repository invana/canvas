# ClickSelectPlugin

Toggles a state on clicked nodes/edges. Supports single and multi-select with configurable modifier keys, N-degree neighbour expansion, optional dimming of unselected elements, and a programmatic selection API. All options are runtime-mutable.

> **Package:** `@invana/plugins-graph-data`
>
> **Requires:** `GraphDataPlugin` registered first.

This plugin is **opt-in** — it does not modify any visual state until a click happens.

## Setup

```ts
import { GraphDataPlugin, ClickSelectPlugin } from '@invana/plugins-graph-data';

await canvas.plugins.register(new GraphDataPlugin({ data }));

await canvas.plugins.register(new ClickSelectPlugin({
  multiple:        true,
  trigger:         ['shift'],
  state:           'selected',
  unselectedState: 'muted',
}));
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'click-select'` | Plugin id override. |
| `graphDataId` | `string` | `'graph-data'` | Id of the `GraphDataPlugin` to read/write through. |
| `enable` | `boolean \| (element) => boolean` | `true` | Global on/off or per-element predicate. |
| `multiple` | `boolean` | `false` | Allow selecting more than one element at a time. |
| `trigger` | `SelectModifierKey[]` | `['shift']` | Modifier key(s) that activate multi-select. Pass `[]` to extend selection on every click. |
| `degree` | `number` | `0` | N-hop neighbour expansion. `0` = clicked element only; `1` = direct neighbours. |
| `direction` | `'incoming' \| 'outgoing' \| 'both'` | `'both'` | Edge traversal direction for neighbour expansion. |
| `state` | `string` | `'selected'` | State applied to every selected element. |
| `unselectedState` | `string` | `undefined` | State applied to every unselected element. Omit to skip dimming. |
| `clearOnBackground` | `boolean` | `true` | Clear the selection when clicking the empty canvas background. |
| `onSelect` | `(element) => void` | — | Called when an element is added to the selection. |
| `onDeselect` | `(element) => void` | — | Called when an element is removed from the selection. |
| `onSelectionChange` | `(snapshot) => void` | — | Called once per click after the selection has settled. |

`SelectModifierKey` is one of `'shift' | 'control' | 'alt' | 'meta'`.

## API

### `setOptions(patch)`

Update any option at runtime. State and visual changes are applied immediately.

```ts
clickSelect.setOptions({ degree: 2, unselectedState: 'muted' });
```

### Selection manipulation

```ts
clickSelect.select('n1');                             // replace selection with one element
clickSelect.selectMultiple([{ id: 'n1' }, { id: 'n2', type: 'connector' }]);
clickSelect.addToSelection('n3');                     // extend selection
clickSelect.deselect('n1');                           // remove from selection
clickSelect.toggle('n2');                             // toggle
clickSelect.clearSelection();                         // clear all
```

### Querying

```ts
clickSelect.isSelected('n1');          // boolean
clickSelect.getSelectedIds();          // string[] — shapes + connectors
clickSelect.getSelectedShapeIds();     // string[] — nodes only
clickSelect.getSelectedConnectorIds(); // string[] — edges only
```

### `store`

A `SelectionStore` instance kept in sync with the plugin. Subscribe for reactive downstream state.

```ts
clickSelect.store.on('selection:changed', (snapshot) => {
  console.log('shapes:', snapshot.shapeIds, 'connectors:', snapshot.connectorIds);
});
```

## Callbacks

`onSelect` / `onDeselect` receive a `SelectableElement`:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Element id. |
| `type` | `'shape' \| 'connector'` | Node or edge. |
| `element` | `BaseShape \| BaseConnector` | Underlying rendered instance. |

`onSelectionChange` receives `{ shapeIds: string[]; connectorIds: string[] }`.

## Examples

### Single select

```ts
await canvas.plugins.register(new ClickSelectPlugin({ state: 'selected' }));
```

### Multi-select with Shift

```ts
await canvas.plugins.register(new ClickSelectPlugin({
  multiple:        true,
  trigger:         ['shift'],
  state:           'selected',
  unselectedState: 'muted',
}));
```

### N-degree neighbour highlight

```ts
await canvas.plugins.register(new ClickSelectPlugin({
  degree:    1,
  direction: 'both',
  state:     'selected',
}));
```

### Listen to selection changes

```ts
const sel = new ClickSelectPlugin({
  onSelectionChange: ({ shapeIds }) => {
    console.log('selected nodes:', shapeIds);
  },
});
await canvas.plugins.register(sel);
```
