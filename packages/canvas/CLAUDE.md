# CLAUDE.md — packages/canvas (`@invana/canvas`)

**The engine: a renderer-agnostic orchestrator.** Implements the Layer / Behaviour /
Layout architecture from `docs/architecture-proposal.md`, over the kernel
(`@invana/canvas-store`), and defines the contract a drawing backend implements.

## The one rule that defines this package

> **This package imports no drawing library — and, as of the dependency
> consolidation, no third-party library at all.**

Not `pixi.js`, not `pixi-viewport`, not `three`. Drawing lives in
`@invana/renderer-pixijs`; this package decides *what* should be on screen and
hands the backend devices to draw it. `pnpm check-boundaries` fails the build on
a violation. See `docs/renderer-split-design.md`.

Its `dependencies` are exactly one entry: `@invana/canvas-store`. State
(`zustand`/`immer`) and picking (`rbush`) both live in the kernel now — if you
find yourself adding a third-party dep here, that is a strong signal the thing
you are building belongs either in the kernel below or the backend above.

If you need something from a backend, **add it to the contract**
(`src/renderer/IRenderer.ts` and friends) and implement it there. If the thing
you want cannot be expressed without naming a display object, that is a signal it
belongs in the backend, not here.

## What lives here

| Area | Contents |
|---|---|
| Orchestration | `Canvas`, `CanvasContext`, `Layer` / `WorldLayer` / `ScreenLayer`, `Behaviour`, `Layout`, the three registries |
| **The renderer contract** | `renderer/` — `IRenderer` (lifecycle, surfaces, camera binding, capabilities), `ISurface` (a layer's slice + `setBackdrop`), `IElementRenderer` (what a domain layer calls), `IOverlayDevice` (11 ops, transient only), `SpecProjector` |
| **Headless backend** | `renderer/HeadlessRenderer.ts` + `camera/HeadlessCameraBinding.ts` — draws nothing, implements everything. Not a product renderer: a test double (§7) so layouts, picking and projection are testable with no GPU |
| **Spec vocabulary** (re-export) | Defined in `@invana/canvas-store`; re-exported from this package's root and its `./specs` subpath so every existing consumer keeps working. Edit it there |
| **Picking** (re-export) | `PickingIndex` / `HitIndex` also live in `@invana/canvas-store`, beside the specs they hit-test. Picking is still *interaction*, not drawing (design D5) — it simply sits below the engine rather than inside it, which is what let this package drop `rbush` |
| **Connector geometry** | `connectors/` — routers, path styles, anchors, `pathSampling`. Spec in, `Path` out; a second backend reuses these verbatim |
| Placement + time | `badges/` (placement maths), `animation/` (`Tween`, easings) |
| Camera | `Camera` (clamp, anchored zoom, fit, bus + store sync) over `ICameraBinding` — no backend type |
| Export | `export/` — **SVG is engine-side and spec-driven** (works headless); raster goes through `IRenderer.extract?()` |
| Built-in layers | `BackgroundLayer` (paints via `surface.setBackdrop`), `DevInfoLayer`, `LayersPanelLayer` |
| Built-in behaviours | `DragPanBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour` — all opt-in, never auto-registered |
| Gesture arbitration | `input/GestureArbiter` — one gesture owns the pointer; camera behaviours yield |

## What does *not* live here

Shapes, connectors, decorations, effects, markers, paint helpers, textures, icon
fonts, the `Application`, the viewport — all in `@invana/renderer-pixijs`. Domain
concepts (node, edge, table, lane) belong to a domain package.

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
├── src/camera/Camera.ts
└── tests/camera/Camera.test.ts   ← imports from '../../src/camera/Camera'
```

- Never co-locate `*.test.ts` inside `src/`.
- Relative `../../src/...` imports — no path aliases.
- **Tests import no drawing library.** Use `HeadlessRenderer` / `HeadlessSurface` /
  `HeadlessCameraBinding`; `Canvas.initWithRenderer(new HeadlessRenderer(), w, h)`
  drives the whole layer / behaviour / state pipeline with no GPU and no DOM.
- `pnpm check-types` covers `src/**` and `tests/**`; `pnpm test` (vitest) discovers
  `tests/**/*.test.ts`.

> Root rule 10 forbids tests in this package **except** the headless coverage
> granted for the renderer split (G6): spec projection, layout output, bounds and
> camera semantics. Picking and spec-geometry tests moved to
> `packages/canvas-store/tests/` along with the code they cover.

See repo-root [CLAUDE.md](../../CLAUDE.md).
