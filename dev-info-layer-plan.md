# DevInfoLayer — port from `canvas-deprecated`

## Context

`packages/canvas-deprecated` shipped `DevInfoPlugin`, a DOM overlay that displayed live canvas size, camera state, world bounds, pointer coords, and FPS. The new architecture replaces plugins with **Layers + Behaviours**, and the project `CLAUDE.md` lists `DevInfoLayer` as a planned built-in toolkit layer — but it has not been implemented yet (only referenced in a doc comment at `packages/canvas/src/layers/ScreenLayer.ts:12` and in `packages/canvas/CLAUDE.md`'s "Built-in layers" / `@invana/canvas/toolkit` sections).

This plan brings the deprecated overlay forward as a proper `ScreenLayer` subclass, keeping the DOM-overlay rendering approach (no pointer interference, no PixiJS Text cost, easy to style) but wiring it into the new lifecycle, event bus, and toolkit subpath export.

---

## Approach

- **Type**: `ScreenLayer` subclass (not a plugin). Per `packages/canvas/CLAUDE.md` "Picking a layer base", overlays that stay glued to the screen and don't pan/zoom are exactly the case for `ScreenLayer`.
- **Rendering**: DOM `<div>` overlay appended to the canvas's parent element — mirrors the deprecated approach, `pointer-events: none`, monospace, corner-anchored.
- **Sections**: all five from the deprecated version — Canvas size, Camera (x/y/zoom), World bounds, Pointer (screen+world), FPS.
- **Engine surface change** (minimal): expose `canvasElement?: HTMLCanvasElement` on `CanvasContext` so any DOM-overlay layer can read it. Populated in `Canvas._wireScene()` from `app.canvas`; left undefined for `initWithStage` (headless/test path).

---

## Files to create

### 1. `packages/canvas/src/toolkit/DevInfoLayer.ts` (new)

`DevInfoLayer extends ScreenLayer<DevInfoLayerOptions, DevInfoLayerState, DevInfoLayerEvents>`.

- Constructor takes `{ id?, zIndex?, ...DevInfoLayerOptions }`. Defaults match deprecated `DEFAULT_OPTIONS` (`packages/canvas-deprecated/src/plugins/builtin/DevInfoPlugin.ts:26-34`):
  - `corner: 'bottom-left'`
  - `enabled: true`
  - `fontSize: 11`, `opacity: 0.92`
  - `backgroundColor: 'rgba(10,10,10,0.82)'`, `textColor: '#c8d3e0'`, `accentColor: '#4fc3f7'`
- Public API: `setEnabled(b)`, `enable()`, `disable()`, `setOptions(partial)` — same as deprecated.
- `hitTest(_x, _y) → null` (overlay is `pointer-events:none`; never participates in canvas hit-testing).
- Lifecycle:
  - `onMount(ctx)`:
    - If `ctx.canvasElement` is undefined, no-op (headless/test mode).
    - Create the `<div>`, append to `ctx.canvasElement.parentElement`, set `position:relative` on parent if static (same idempotent guard as deprecated).
    - Subscribe `ctx.events.on('camera:pan', this._update)` and `'camera:zoom'` (typed events exist at `packages/canvas/src/events/CanvasEventBus.ts:57-71`).
    - Attach native `pointermove` listener on `ctx.canvasElement` for live pointer coords (engine does not emit `pointermove` as a typed event — same gap the deprecated plugin worked around).
    - Start the RAF-driven FPS sampler (500ms bucket — copy verbatim from deprecated `_startFpsTicker`).
  - `onUnmount(ctx)`: cancel RAF, remove DOM, remove native listener, unsubscribe events.
- `_update()` builds inner HTML — port `lines` block from deprecated `DevInfoPlugin._update()` (lines 239-287) verbatim, with **one substitution**:
  - `cam.getBounds()` → `cam.getVisibleBounds()` (the new `Camera` exposes `getVisibleBounds()` at `packages/canvas/src/camera/Camera.ts:235`; the old name does not exist on the new class).
  - Use `ctx.canvasElement.clientWidth || ctx.canvasElement.width` for the canvas size row.
- `_applyStyles()` and corner positioning — copy verbatim from deprecated (lines 181-211).
- `n()` formatter helper — copy verbatim (lines 293-295).

### 2. `packages/canvas/src/toolkit/index.ts` (new)

Re-export the toolkit surface promised in `packages/canvas/CLAUDE.md`:

```ts
export { DevInfoLayer } from './DevInfoLayer';
export type { DevInfoLayerOptions, DevInfoCorner } from './DevInfoLayer';
```

(`BackgroundLayer` and the camera input behaviours listed in CLAUDE.md's `./toolkit` paragraph will be added in their own ports; this file starts as a real entry point with just `DevInfoLayer`.)

### 3. `apps/storybook/stories/Canvas/Toolkit/DevInfoLayer.stories.ts` (new)

One story showing `DevInfoLayer` on top of a minimal canvas with `CameraInputBehaviour` enabled so panning/zooming visibly updates the overlay. Follow the saved Storybook rules:

- All code (constants, GUI setup, layer wiring) lives inside `play` — per memory `feedback_story_code_in_play.md`.
- Call `canvas.camera.fitContent(layer.getBounds(), 100)` after content is added — per memory `feedback_center_drawing.md` (the content here will be the existing primitives or just a `BackgroundLayer` when available; if neither is wired yet, a small ad-hoc world-space rectangle on a one-off `WorldLayer` is fine for the demo).
- A second story variant: `corner: 'top-right'` with `setEnabled(false)` toggled via a GUI button to exercise runtime enable/disable.

---

## Files to modify

### 4. `packages/canvas/src/context/CanvasContext.ts`

Add the optional field:

```ts
/**
 * The underlying HTMLCanvasElement when running in DOM mode (i.e. `Canvas.init`).
 * Undefined for `initWithStage` (headless/test). Layers that overlay DOM
 * content above the canvas — `DevInfoLayer`, tooltips, popovers — read this.
 */
readonly canvasElement?: HTMLCanvasElement;
```

### 5. `packages/canvas/src/engine/Canvas.ts`

In `_wireScene(...)` (around line 295-340 where the `CanvasContext` object literal is built), add `canvasElement: this.app?.canvas` to the constructed context. The `initWithStage` path leaves it undefined naturally because `this.app` is undefined there.

### 6. `packages/canvas/package.json`

Add the toolkit subpath to `exports`:

```json
"./toolkit": {
  "types": "./src/toolkit/index.ts",
  "default": "./src/toolkit/index.js"
}
```

### 7. `packages/canvas/tsup.config.ts`

Add `'src/toolkit/index.ts'` to the `entry` array.

---

## Critical files (reference)

- **Source to port**: `packages/canvas-deprecated/src/plugins/builtin/DevInfoPlugin.ts` (296 lines — read-only reference; do not import from it)
- **Base class**: `packages/canvas/src/layers/ScreenLayer.ts` (note `onMount`/`onUnmount` are the hooks to override, not `register`/`destroy`)
- **Camera API**: `packages/canvas/src/camera/Camera.ts` — `x`, `y`, `scale`, `screenWidth`, `screenHeight`, `toWorld(sx, sy)`, **`getVisibleBounds()`** (rename from deprecated `getBounds()`)
- **Event bus**: `packages/canvas/src/events/CanvasEventBus.ts:57-71` — `camera:pan` / `camera:zoom` payloads
- **Context interface**: `packages/canvas/src/context/CanvasContext.ts`
- **Canvas wiring**: `packages/canvas/src/engine/Canvas.ts:_wireScene` (~line 295) and `app.canvas` is created at line 167-186
- **Plan location rule**: `~/.claude/projects/.../memory/feedback_plans_in_repo.md` — plans live in repo root

---

## Rules being honoured

- No tests in `packages/canvas` (memory `feedback_no_tests_canvas.md`, project CLAUDE.md §10).
- No reads from `canvas-deprecated` once port is done — the file is referenced once for the verbatim copy of styles + render logic and never imported.
- All public events go through `ctx.events` / `layer.events`; the native `pointermove` listener is on the DOM canvas element (PixiJS / engine does not emit `pointermove` as a typed event — same trade-off as deprecated).
- `DevInfoLayer` does not auto-enable behaviours (it isn't a behaviour); but it does auto-mount its overlay on `onMount`, gated by the `enabled: boolean` option — matches deprecated semantics.

---

## Verification

1. `pnpm --filter @invana/canvas build` — confirms the toolkit subpath compiles and ships.
2. `pnpm --filter @invana/canvas check-types` — confirms `CanvasContext.canvasElement` addition is wired into `Canvas._wireScene` without type errors anywhere else (LayerRegistry, behaviours, etc. all consume `CanvasContext`).
3. `pnpm --filter @canvas/storybook dev` → open `Canvas / Toolkit / DevInfoLayer`:
   - Overlay visible in the chosen corner with all five sections.
   - Pan + zoom (via `CameraInputBehaviour`) update camera + world-bounds rows live.
   - Pointer rows update on mousemove inside the canvas.
   - FPS rows update ~twice per second.
   - Second story variant: toggling the GUI button calls `devInfo.setEnabled(false)` / `true` and the overlay mounts/unmounts cleanly with no leaked listeners (verify in DevTools: no orphan `<div data-dev-info-layer>`).
4. `pnpm --filter @canvas/docs build` — confirms TypeDoc picks up the new `@invana/canvas/toolkit` subpath if the docs site indexes it.
