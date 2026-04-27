# Layers

The layer system provides Photoshop-style z-ordered rendering layers. Each layer is a named bucket that sits at a specific z-index. Plugins create their own layers during registration; the `LayerManager` lets you show, hide, reorder, and adjust opacity at runtime.

Access via `canvas.layers`.

## Layer properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier |
| `zIndex` | `number` | Render order — higher values render on top |
| `label` | `string?` | Optional human-readable name for debugging |
| `visible` | `boolean` | Whether the layer is rendered |
| `opacity` | `number` | 0 (transparent) – 1 (fully opaque) |
| `locked` | `boolean?` | Hides from UI pickers but still renders |

## API

```ts
const { layers } = canvas;

// Retrieve all layers sorted by zIndex
const all = layers.getLayers();

// Find a specific layer
const layer = layers.getLayer('background-layer');

// Visibility
layers.showLayer('background-layer');
layers.hideLayer('background-layer');

// Opacity
layers.setLayerOpacity('shapes', 0.5);

// Z-order
layers.setLayerZIndex('shapes', 20);
```

## Layer events

| Event | Payload | Fires when |
|---|---|---|
| `layer:visibility-changed` | `{ layerId, visible }` | `showLayer` / `hideLayer` called |

```ts
canvas.events.on('layer:visibility-changed', ({ layerId, visible }) => {
  console.log(layerId, visible ? 'shown' : 'hidden');
});
```

## How plugins create layers

Plugins receive a `PluginContext` during `register()`. They call `ctx.createLayer()` for world-space layers (affected by camera pan/zoom) or `ctx.createScreenLayer()` for HUD/overlay layers (fixed, camera-independent):

```ts
// World-space layer (inside the camera viewport)
ctx.createLayer({ id: 'my-shapes', zIndex: 10, label: 'Shapes' });

// Screen-space layer (fixed overlay — e.g. background, HUD)
ctx.createScreenLayer({ id: 'my-overlay', zIndex: -1000 });
```

You do not normally call these directly unless writing a custom plugin.
