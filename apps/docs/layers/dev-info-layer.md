# DevInfoLayer

A developer HUD overlay that continuously reports the canvas's runtime state. Useful while building behaviours, debugging camera math, or eyeballing render performance.

`DevInfoLayer` is a [`ScreenLayer`](/guide/layers#picking-a-base-worldlayer-vs-screenlayer) implemented as a plain absolutely-positioned HTML `<div>` layered above the canvas. The pixi `container` is unused — overlay rendering is pure DOM. The DOM uses `pointer-events: none`, so the panel never interferes with the scene's pointer events.

## What it displays

- **Canvas** — display size in CSS pixels.
- **Camera** — `x`, `y`, and `zoom` scale.
- **World Bounds** — the visible world rectangle: `x` / `y` / `right` / `bottom` / `width` / `height`.
- **Pointer** — pointer position in both screen and world coordinates.
- **Performance** — frames-per-second (sampled in 500 ms buckets).

The panel re-renders on `camera:pan`, `camera:zoom`, native `pointermove`, and the FPS ticker.

## Usage

```ts
import { Canvas, DevInfoLayer } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

const devInfo = new DevInfoLayer({ corner: 'bottom-left' });
canvas.layers.add(devInfo);

// Toggle at runtime — keeps the layer mounted, just hides the overlay
devInfo.setEnabled(false);
devInfo.setEnabled(true);

// Update display options at runtime
devInfo.setOptions({ corner: 'top-right', fontSize: 12 });
```

## Headless mode

When `ctx.canvasElement` is `undefined` (i.e. the canvas was created via `Canvas.initWithStage`), the layer mounts cleanly but renders nothing. No special handling needed in tests.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `corner` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-left'` | Which corner of the canvas's parent to anchor to. |
| `enabled` | `boolean` | `true` | Show the overlay. Toggle at runtime with `setEnabled()`. |
| `fontSize` | `number` | `11` | Font size in px. |
| `opacity` | `number` | `0.92` | Panel opacity (0–1). |
| `backgroundColor` | `string` | `'rgba(10,10,10,0.82)'` | Overlay background CSS color. |
| `textColor` | `string` | `'#c8d3e0'` | Text color. |
| `accentColor` | `string` | `'#4fc3f7'` | Header / section accent color. |
| `id` | `string` | `'dev-info'` | Layer id. |
| `zIndex` | `number` | `9999` | Pixi z-index inside the screen stage. |

## API

| Method | Purpose |
|---|---|
| `setEnabled(enabled: boolean)` | Show or hide the overlay without removing the layer. |
| `enable()` | Equivalent to `setEnabled(true)`. |
| `disable()` | Equivalent to `setEnabled(false)`. Also stops the FPS ticker. |
| `setOptions(partial)` | Update display options at runtime (corner, colors, font size, …). |

## Hit-testing

`hitTest()` always returns `null` — the DOM overlay is decorative and never participates in engine hit-testing.

## Related

- [`LayersPanelLayer`](/layers/layers-panel-layer) — sibling overlay for toggling layer visibility.
- [Engine → Events](/guide/events) — the `camera:pan` / `camera:zoom` events that drive the overlay updates.
