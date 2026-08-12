# CLAUDE.md — packages/canvas-core (`@invana/canvas-core`)

**The contracts + abstracts of the canvas engine.** A rendering backend or an
extension package depends on this small package, not on the whole engine.
`@invana/canvas` (the orchestrator) depends on this package and re-exports its
entire surface — consumers keep importing everything from `@invana/canvas`.

## The one rule that defines this package

> **Nothing here may import `@invana/canvas`** — the dependency points the other
> way, permanently. And like the engine: no drawing library, no third-party
> library at all. Its only dependency is `@invana/canvas-store` (the kernel).

`grep "@invana/canvas'" packages/canvas-core/src` must return 0 hits — that is
the acceptance test from `docs/rfcs/feat/2026-08-11-canvas-core-structure.md`.

## Who consumes what

| Consumer | Uses |
|---|---|
| A rendering backend (`@invana/renderer-pixijs`, future `renderer-threejs`) | **implements** `contracts/` (`IRenderer` · `ISurface` · `IElementRenderer` · `IOverlayDevice` · `ICameraBinding`), reuses `geometry/` + `svg/` verbatim |
| An extension package (`@invana/graph`, `graph-layout-*`, `graph-layer-*`) | **extends** `abstracts/` (`Layer` · `Behaviour` · `Layout`), programs against `CanvasContext`, calls `animatePositions` / geometry helpers |
| `@invana/canvas` (the orchestrator) | builds the concrete `CanvasContext`, drives `SpecProjector`, owns the built-in layers/behaviours and io on top |

## Layout

| Folder | Contents |
|---|---|
| `contracts/` | the renderer seam: `IRenderer`, `ISurface`, `IElementRenderer`, `IOverlayDevice`, `ICameraBinding`, plus `SpecProjector` (drives a renderer from a `SpecStore`; its `SpecProjectionTarget` type is part of the contract) |
| `abstracts/` | `Layer` / `Behaviour` / `Layout` base classes, the `CanvasContext` interface (the engine builds the concrete object), `GestureArbiter` (interface + `DefaultGestureArbiter` — dep-free, so the default lives beside its contract) |
| `Camera.ts` | pan/zoom/projection **semantics** over `ICameraBinding` — clamping, anchored zoom, fit, bus + store sync. Renderer-free; the binding realises it |
| `registries/` | `LayerRegistry` / `BehaviourRegistry` / `LayoutRegistry` — referenced by `CanvasContext`, so they live below the engine |
| `geometry/` | `connectors/` (anchors, routers, path styles, `pathSampling`) + `badges/` (placement maths). Spec in → path/point out; a second backend reuses these verbatim |
| `svg/` | pure spec → markup serialisers (`shapeSpecToSvg`, `connectorToSvg`, `pathToSvgD` + markup/paint helpers). Document assembly (`exportSVG`) stays in `@invana/canvas` — it walks a live `Canvas` |
| `animation/` | `Tween`, easings, `animatePositions` (consumed by layout packages) |
| `headless/` | `HeadlessRenderer` + `HeadlessCameraBinding` — the reference implementation of `contracts/`; a test double, not a product renderer |

## What does *not* live here

- **The orchestrator** — `Canvas`, `CanvasConfig`, the concrete context object,
  `FrameMeter`, `InteractionTracker`, io (export/import): `@invana/canvas`.
- **Built-in layers/behaviours** (`BackgroundLayer`, `DragPanBehaviour`, …) —
  implementations belong to `@invana/canvas`; only the bases live here.
- **Drawing** — shapes, decorations, effects, textures: the backend packages.
- **The spec vocabulary, picking, events, state** — `@invana/canvas-store`.

## Tests

`tests/` mirrors `src/` (relative `../src/…` imports, no aliases); everything is
renderer-free and DOM-free so vitest runs in the plain node environment.

## Build

`tsup` → ESM + `.d.ts` + sourcemaps. Single entry (`src/index.ts`), no subpaths.
`@invana/canvas-store` is a normal dependency (the kernel below).
