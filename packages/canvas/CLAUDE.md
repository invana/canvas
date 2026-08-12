# CLAUDE.md — packages/canvas (`@invana/canvas`)

**The engine: a renderer-agnostic orchestrator.** `Canvas` wires the kernel
(`@invana/canvas-store`), the contracts + abstracts (`@invana/canvas-core`) and
a rendering backend (`@invana/renderer-pixijs` by default) together, and ships
the built-in layers / behaviours and the io (export/import) paths.

## The one rule that defines this package

> **This package imports no drawing library — and no third-party library at
> all.**

Not `pixi.js`, not `pixi-viewport`, not `three`. Drawing lives in
`@invana/renderer-pixijs`; this package decides *what* should be on screen and
hands the backend devices to draw it. `pnpm check-boundaries` fails the build on
a violation. See `docs/renderer-split-design.md`.

Its `dependencies` are exactly two entries: `@invana/canvas-core` (contracts +
abstracts) and `@invana/canvas-store` (the kernel). If you find yourself adding
a third-party dep here, the thing you are building belongs in the kernel below,
in `canvas-core`, or in the backend above.

If you need something from a backend, **add it to the contract**
(`packages/canvas-core/src/contracts/IRenderer.ts` and friends) and implement it
there. If the thing you want cannot be expressed without naming a display
object, that is a signal it belongs in the backend, not here.

## The split with `@invana/canvas-core`

Everything a backend **implements** or an extension package **extends** lives in
`@invana/canvas-core` — the renderer contract, the headless double, the
`Layer` / `Behaviour` / `Layout` bases, `CanvasContext`, `Camera` semantics,
gesture arbitration, the registries, connector geometry, badge placement,
tweens and the SVG serialisers. This package **re-exports that entire surface**
from its root, so consumers never need to know which package a symbol lives in
— keep it that way when adding exports. See `packages/canvas-core/CLAUDE.md`.

## What lives here

| Area | Contents |
|---|---|
| Orchestration | `Canvas` (builds the concrete `CanvasContext`, owns the tick, registry instances, renderer lifecycle), `CanvasConfig` (+`deepMerge`), `FrameMeter`, `InteractionTracker`, `assertSerialisable` — all in `engine/` |
| Built-in layers | `WorldLayer` / `ScreenLayer` (the two bases with surfaces), `BackgroundLayer` (paints via `surface.setBackdrop`), `DevInfoLayer`, `LayersPanelLayer` |
| Built-in behaviours | `DragPanBehaviour`, `DragShapeBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour`, `ElementScaleLODBehaviour` — all opt-in, never auto-registered |
| io | `io/` — raster export (through `IRenderer.extract?()`), `exportSVG` document assembly (the pure serialisers live in `canvas-core/svg/`), full-state JSON export/import |
| Re-exports | the whole `@invana/canvas-core` surface, the kernel's spec vocabulary + picking + events + store port + theme (kernel-canonical) |

## What does *not* live here

Contracts, abstracts, camera semantics, registries, connector geometry, badges,
animation, svg serialisers, the headless double → `@invana/canvas-core`. Shapes,
connectors, decorations, effects, markers, paint helpers, textures, the
`Application`, the viewport → `@invana/renderer-pixijs`. Domain concepts (node,
edge, table, lane) → a domain package. Specs, picking, state, events, theme →
`@invana/canvas-store`.

## Picking a layer base — `WorldLayer` vs `ScreenLayer`

**Default to `WorldLayer` for almost everything.** Diagram content (graph nodes,
edges, ER tables, swimlane bodies, custom rendering) is camera-affected — it pans
and zooms with the view.

**Reach for `ScreenLayer` only when content must stay glued to a screen position
regardless of camera:** minimap, dev/FPS overlay, floating toolbars, tooltips at
cursor offsets, loading spinners, scale rulers.

The mental test: *if the user pans 100px right, should this move with the diagram
or stay glued to the screen?*

## How a layer draws

A layer never constructs a display object. At mount it is handed an `ISurface`
(`ctx.createSurface(space, id, opts)`), and draws through it:

- **Durable content** — publish a spec into the store; `SpecProjector` mounts it
  via `surface.primitives`. Serialisable, undoable, headlessly testable, and
  identical across backends.
- **Transient gesture visuals** (lasso, brush, drag ghost) — `surface.overlay(id)`,
  the 11-op immediate-mode device. Never enters state (design D3).
- **A full-surface backdrop** — `surface.setBackdrop(...)`.

Override `surfaceOptions()` when the layer owns device policy the renderer can't
know (e.g. a larger `hitFloorPx` for pinpoint nodes).

## Tests

Tests live in [tests/](tests/) at the package root, mirroring [src/](src/):

```
packages/canvas/
├── src/engine/assertSerialisable.ts
└── tests/engine/assertSerialisable.test.ts   ← imports from '../../src/engine/…'
```

- Never co-locate `*.test.ts` inside `src/`.
- Relative `../../src/...` imports — no path aliases. Symbols that moved to
  `@invana/canvas-core` (Camera, the bases, registries, headless) are imported
  from that package; their tests moved to `packages/canvas-core/tests/`.
- **Tests import no drawing library.** Use `HeadlessRenderer` / `HeadlessSurface` /
  `HeadlessCameraBinding` from `@invana/canvas-core`;
  `Canvas.initWithRenderer(new HeadlessRenderer(), w, h)` drives the whole
  layer / behaviour / state pipeline with no GPU and no DOM.
- `pnpm check-types` covers `src/**` and `tests/**`; `pnpm test` (vitest) discovers
  `tests/**/*.test.ts`.

> Root rule 10 forbids tests in this package **except** the headless coverage
> granted for the renderer split (G6): spec projection, layout output, bounds and
> camera semantics. Picking and spec-geometry tests live in
> `packages/canvas-store/tests/`; base-class/registry/camera tests live in
> `packages/canvas-core/tests/`.

See repo-root [CLAUDE.md](../../CLAUDE.md).
