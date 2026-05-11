# LayersPanelLayer

A developer overlay that lists every layer currently mounted on the canvas and exposes a checkbox per row to toggle that layer's `visible` flag. Useful for inspecting and isolating layers during development — flip off the labels layer to check edge routing, hide the background to capture a transparent screenshot, etc.

`LayersPanelLayer` is a [`ScreenLayer`](/guide/layers#picking-a-base-worldlayer-vs-screenlayer) rendered as a plain absolutely-positioned HTML `<div>` above the canvas — same pattern as [`DevInfoLayer`](/layers/dev-info-layer). Unlike `DevInfoLayer`, the overlay receives pointer events (so the checkboxes are clickable); the layer itself still opts out of engine hit-testing via `hittable: false`.

The panel re-renders on `'layer:added'` / `'layer:removed'`. Its own row is filtered out so the user cannot hide it via itself.

## Usage

```ts
import { Canvas, LayersPanelLayer } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

const panel = new LayersPanelLayer({ corner: 'top-right' });
canvas.layers.add(panel);

// Toggle the panel itself at runtime
panel.setEnabled(false);
panel.setEnabled(true);

// Hide a noisy layer from the listing
panel.setOptions({ hideIds: ['debug-grid'] });
```

If you mutate `layer.visible` from external code, call `panel.refresh()` to bring the checkboxes back in sync — the engine does not emit an event for visibility changes.

## Headless mode

When `ctx.canvasElement` is `undefined` (i.e. the canvas was created via `Canvas.initWithStage`), the layer mounts cleanly but renders nothing.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `corner` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-right'` | Which corner of the canvas's parent to anchor to. |
| `enabled` | `boolean` | `true` | Show the overlay. Toggle at runtime with `setEnabled()`. |
| `fontSize` | `number` | `11` | Font size in px. |
| `opacity` | `number` | `0.92` | Panel opacity (0–1). |
| `backgroundColor` | `string` | `'rgba(10,10,10,0.82)'` | Overlay background CSS color. |
| `textColor` | `string` | `'#c8d3e0'` | Text color. |
| `accentColor` | `string` | `'#4fc3f7'` | Header accent color. |
| `hideIds` | `readonly string[]` | `[]` | Layer ids to hide from the listing. The panel's own id is always hidden regardless. |
| `id` | `string` | `'layers-panel'` | Layer id. |
| `zIndex` | `number` | `9998` | Pixi z-index inside the screen stage. Sits just below `DevInfoLayer`. |

## API

| Method | Purpose |
|---|---|
| `setEnabled(enabled: boolean)` | Show or hide the panel without removing the layer. |
| `enable()` / `disable()` | Equivalent to `setEnabled(true)` / `setEnabled(false)`. |
| `setOptions(partial)` | Update display options at runtime (corner, colors, font size, `hideIds`, …). |
| `refresh()` | Force a re-render — use after mutating a layer's `visible` flag externally. |

## How visibility toggling works

The panel installs a single delegated `change` listener on its root `<div>`. When a checkbox changes, the listener looks up the matching layer via `ctx.layers.get(layerId)` and assigns `layer.visible = input.checked`. There is no intermediate state — the checkbox is a direct view of the layer's `visible` flag.

## Hit-testing

`hitTest()` returns `null` — the DOM overlay handles its own clicks and never participates in engine hit-testing.

## Related

- [`DevInfoLayer`](/layers/dev-info-layer) — sibling overlay showing runtime canvas / camera / pointer / FPS info.
- [Engine → Events](/guide/events) — `layer:added` / `layer:removed` events drive the panel's re-render.
