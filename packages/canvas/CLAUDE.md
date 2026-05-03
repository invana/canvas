# CLAUDE.md — packages/canvas (`@invana/canvas`)

The engine. Implements the Layer / Behaviour / Layout / Renderer architecture defined in `architecture-proposal.md` (repo root).

**Status:** skeleton. Built fresh during the architecture rewrite. Reference the matching `*-deprecated` package for the prior implementation, but do not import it.

## Scope (per proposal §5 + §2.7)

- `Canvas`, `CameraAPI`, `CanvasContext`
- Base classes/interfaces: `Layer`, `WorldLayer`, `ScreenLayer`, `Behaviour`, `Layout`
- `Store<T>` (zustand+immer alias) for **small, observable interaction state**, `EventEmitter`, `CanvasEventBus`, `CanvasEvent`
- `ColumnStore` — typed-array column store for **bulk hot data** (node positions, edge attrs). Domain packages extend it. Scales to millions of items at machine-rate mutations. See `architecture-proposal.md` §2.1 for the bifurcated state model rationale.
- `DirtyBatcher` — pure, RAF-free; Canvas owns the single `requestAnimationFrame`
- `LayerRegistry`, `BehaviourRegistry`, `SurfaceManager`
- `ShapesRenderer` — primitive renderer with five extensible registries: shapes, connectors, markers, routers, **decorations**. Used by Layers; never added to `canvas.layers`.
  - Base interfaces: `IShape`, `IConnector`, `IMarker`, `IRouter`, `IShapeDecoration`, `IConnectorDecoration`.
  - Built-in shapes: `circle`, `rect`, `ellipse`, `polygon`, `path`, `image`, `text`.
  - Built-in connectors: `line`, `curve`.
  - Built-in markers: `arrow`, `circle`, `square`, `diamond`.
  - Built-in routers: `straight`, `orthogonal`, `bezier`.
  - Built-in decorations: `halo`, `border`, `glow`, `marching-ants`, `pulse-ring`, `dashed-border-rotating`. Animated decorations advance their phase via `tickAnimations(dt)` called by the Canvas tick.
- Built-in layers: `BackgroundLayer`, `ThemedBackgroundLayer` (`WorldLayer`); `DevInfoLayer` (`ScreenLayer`)
- Built-in behaviours (all opt-in — never auto-registered): `DragPanBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour`

### Why decoration rendering logic lives here, not in domain packages

A halo, a border, a marching-ants animation, a pulse ring — none of these are graph-specific. They're generic 2D visuals that ER diagrams, flowcharts, swimlanes, and graph all want, identically. So the rendering logic lives in `@invana/canvas/renderers/shapes/decorations/` and ships once. Domain packages add **named sugar methods** (`graphLayer.haloNode(id)`, `erLayer.haloTable(id)`) that mutate state and are projected to the same generic `renderer.setDecoration(id, 'halo', ...)` call. One implementation, many domain wrappers.

## Subpath exports

Public API ships under three subpaths:

- `@invana/canvas` — kernel: Canvas, base classes, registries, store, events, surfaces, camera
- `@invana/canvas/renderers/shapes` — `ShapesRenderer` + base interfaces + built-in primitives + built-in decorations
- `@invana/canvas/toolkit` — `BackgroundLayer`, `DevInfoLayer`, `DragPanBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour`

## Rules (carry-over from old `packages/canvas`)

- PixiJS is internal — never re-exported.
- `graphics-utils/` (when present) is internal-only.
- No `new Graphics()` / `new Container()` outside this package's `src/`.
- All public events go through `EventBus` / layer events; no raw PixiJS events leak.
- tsup config: ESM, `external: ['pixi.js']`.

## Tests

Tests live in [tests/](tests/) at the package root, mirroring the [src/](src/) tree:

```
packages/canvas/
├── src/
│   ├── events/EventEmitter.ts
│   └── state/ColumnStore.ts
└── tests/
    ├── events/EventEmitter.test.ts        ← imports from '../../src/events/EventEmitter'
    └── state/ColumnStore.test.ts          ← imports from '../../src/state/ColumnStore'
```

- Never co-locate `*.test.ts` files inside `src/`.
- Test files use relative `../../src/...` imports — no path aliases.
- A single `tsconfig.json` covers both `src/**` and `tests/**` (so VS Code's TS language server lights up test files automatically).
- `pnpm check-types` runs `tsc --noEmit` once — covers both.
- `pnpm test` (vitest) auto-discovers `tests/**/*.test.ts`. Use `pnpm test:watch` for the dev loop.

See repo-root [CLAUDE.md](../../CLAUDE.md) §10 for the global rule.
