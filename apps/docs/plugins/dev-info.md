# DevInfoPlugin

A developer overlay that continuously displays camera state, pointer coordinates, FPS, and canvas dimensions. Useful during development and debugging.

The overlay is a plain HTML element layered above the canvas — it never interferes with pointer events on the scene.

## Setup

```ts
import { DevInfoPlugin } from '@invana/canvas';

const devInfo = new DevInfoPlugin({ corner: 'top-right' });
await canvas.plugins.register(devInfo);
```

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `corner` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-left'` | Position of the overlay panel |
| `enabled` | `boolean` | `true` | Initial visibility |
| `fontSize` | `number` | `11` | Font size in px |
| `opacity` | `number` | `0.92` | Panel opacity (0–1) |
| `backgroundColor` | `string` | `'rgba(10,10,10,0.82)'` | Panel background CSS color |
| `textColor` | `string` | `'#c8d3e0'` | Text color |
| `accentColor` | `string` | `'#4fc3f7'` | Accent / header color |

## What it displays

- Canvas display size (width × height)
- Camera position (`x`, `y`) and zoom scale
- Visible world bounds
- Pointer position — screen-space and world-space coordinates
- Frame rate (FPS)

## Toggle at runtime

```ts
// Via plugin instance
devInfo.disable(); // hide
devInfo.enable();  // show

// Via PluginSystem
canvas.plugins.setEnabled('dev-info', false);
canvas.plugins.setEnabled('dev-info', true);
```

## Custom plugin id

```ts
new DevInfoPlugin({ corner: 'bottom-right' })
// default id: 'dev-info'
```

To override the id (e.g. for multiple instances), subclass or set via the constructor internals — the plugin id is always `'dev-info'`.
