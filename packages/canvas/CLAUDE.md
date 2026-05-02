# CLAUDE.md — packages/canvas (`@invana/canvas`)

The engine. Implements the Layer / Behaviour / Layout / Renderer architecture defined in `architecture-proposal.md` (repo root).

**Status:** skeleton. Built fresh during the architecture rewrite. Reference the matching `*-deprecated` package for the prior implementation, but do not import it.

## Scope (per proposal §5)

- `Canvas`, `CameraAPI`, `CanvasContext`
- Base classes/interfaces: `Layer`, `WorldLayer`, `ScreenLayer`, `Behaviour`, `Layout`
- `Store<T>` (zustand alias), `EventEmitter`, `CanvasEventBus`, `CanvasEvent`
- `LayerRegistry`, `BehaviourRegistry`, `SurfaceManager`
- `ShapesRenderer`, `BaseShape`, `BaseConnector` — primitive renderer (used by Layers; never added to `canvas.layers`)
- Built-in layers: `BackgroundLayer`, `ThemedBackgroundLayer` (`WorldLayer`); `DevInfoLayer` (`ScreenLayer`)
- Built-in behaviour: `CameraInputBehaviour` (default registered + enabled)

## Rules (carry-over from old `packages/canvas`)

- PixiJS is internal — never re-exported.
- `graphics-utils/` (when present) is internal-only.
- No `new Graphics()` / `new Container()` outside this package's `src/`.
- All public events go through `EventBus` / layer events; no raw PixiJS events leak.
- tsup config: ESM, `external: ['pixi.js']`.
