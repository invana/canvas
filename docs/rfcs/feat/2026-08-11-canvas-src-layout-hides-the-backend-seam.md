# `packages/canvas/src` — file and folder structure

16 top-level folders / 76 files → **6 top-level folders / 79 files**.

Companions: [`canvas-store` structure](./2026-08-11-canvas-store-structure.md) · [`canvas-core` structure](./2026-08-11-canvas-core-structure.md).

---

## Now

```
packages/canvas/src/
├── index.ts
├── animation/
│   ├── index.ts
│   ├── Tween.ts
│   └── easings.ts
├── badges/
│   ├── index.ts
│   ├── connectorPlacement.ts
│   ├── placement.ts
│   └── types.ts
├── behaviours/
│   ├── Behaviour.ts
│   ├── DragPanBehaviour.ts
│   ├── DragShapeBehaviour.ts
│   ├── ElementScaleLODBehaviour.ts
│   ├── KeyboardCameraInputBehaviour.ts
│   ├── PinchZoomBehaviour.ts
│   └── WheelZoomBehaviour.ts
├── camera/
│   ├── Camera.ts
│   ├── HeadlessCameraBinding.ts
│   └── ICameraBinding.ts
├── connectors/
│   ├── index.ts
│   ├── pathSampling.ts
│   ├── anchors/
│   │   ├── boundary.ts
│   │   ├── center.ts
│   │   ├── edgePort.ts
│   │   ├── perpendicular.ts
│   │   └── silhouettePort.ts
│   ├── pathStyles/
│   │   ├── bezier.ts
│   │   ├── bumpHorizontal.ts
│   │   ├── bumpRadial.ts
│   │   ├── bundle.ts
│   │   ├── loopCurve.ts
│   │   ├── loopPolyline.ts
│   │   ├── normal.ts
│   │   ├── quadratic.ts
│   │   ├── rounded.ts
│   │   ├── smooth.ts
│   │   └── stepRadial.ts
│   └── routers/
│       ├── _aStar.ts
│       ├── _obstacleGrid.ts
│       ├── er.ts
│       ├── manhattan.ts
│       ├── metro.ts
│       ├── oneSide.ts
│       ├── orth.ts
│       └── straight.ts
├── context/
│   └── CanvasContext.ts
├── engine/
│   ├── Canvas.ts
│   ├── CanvasConfig.ts
│   ├── FrameMeter.ts
│   └── InteractionTracker.ts
├── events/
│   └── assertSerialisable.ts
├── export/
│   ├── imageExport.ts
│   ├── shared.ts
│   ├── stateExport.ts
│   └── svgExport.ts
├── input/
│   └── GestureArbiter.ts
├── layers/
│   ├── BackgroundLayer.ts
│   ├── DevInfoLayer.ts
│   ├── Layer.ts
│   ├── LayersPanelLayer.ts
│   ├── ScreenLayer.ts
│   └── WorldLayer.ts
├── layouts/
│   ├── Layout.ts
│   └── animatePositions.ts
├── registries/
│   ├── BehaviourRegistry.ts
│   ├── LayerRegistry.ts
│   └── LayoutRegistry.ts
├── renderer/
│   ├── HeadlessRenderer.ts
│   ├── IElementRenderer.ts
│   ├── IOverlayDevice.ts
│   ├── IRenderer.ts
│   ├── ISurface.ts
│   └── SpecProjector.ts
├── specs/
│   └── index.ts
└── theme/
    ├── index.ts
    ├── CanvasThemeState.ts
    └── types.ts
```

---

## Target

```
packages/canvas/src/
├── index.ts                                  the single public barrel
│
├── core/                                     ← lifts out as @invana/canvas-core
│   ├── index.ts                              ★ staging barrel = future package entry
│   │
│   ├── contracts/                            what a rendering backend implements
│   │   ├── index.ts                          ★
│   │   ├── ICamera.ts                        ★ narrow face of Camera for IRenderer
│   │   ├── ICameraBinding.ts                 ← camera/
│   │   ├── IElementRenderer.ts               ← renderer/
│   │   ├── IOverlayDevice.ts                 ← renderer/
│   │   ├── IRenderer.ts                      ← renderer/
│   │   └── ISurface.ts                       ← renderer/
│   │
│   ├── geometry/                             spec in → path/point out
│   │   ├── connectors/                       ← connectors/
│   │   │   ├── index.ts
│   │   │   ├── pathSampling.ts
│   │   │   ├── anchors/
│   │   │   │   ├── boundary.ts
│   │   │   │   ├── center.ts
│   │   │   │   ├── edgePort.ts
│   │   │   │   ├── perpendicular.ts
│   │   │   │   └── silhouettePort.ts
│   │   │   ├── pathStyles/
│   │   │   │   ├── bezier.ts
│   │   │   │   ├── bumpHorizontal.ts
│   │   │   │   ├── bumpRadial.ts
│   │   │   │   ├── bundle.ts
│   │   │   │   ├── loopCurve.ts
│   │   │   │   ├── loopPolyline.ts
│   │   │   │   ├── normal.ts
│   │   │   │   ├── quadratic.ts
│   │   │   │   ├── rounded.ts
│   │   │   │   ├── smooth.ts
│   │   │   │   └── stepRadial.ts
│   │   │   └── routers/
│   │   │       ├── _aStar.ts
│   │   │       ├── _obstacleGrid.ts
│   │   │       ├── er.ts
│   │   │       ├── manhattan.ts
│   │   │       ├── metro.ts
│   │   │       ├── oneSide.ts
│   │   │       ├── orth.ts
│   │   │       └── straight.ts
│   │   └── badges/                           ← badges/
│   │       ├── index.ts
│   │       ├── connectorPlacement.ts
│   │       ├── placement.ts
│   │       └── types.ts
│   │
│   ├── svg/                                  pure spec → markup serialisers
│   │   ├── index.ts                          ★
│   │   ├── connectorToSvg.ts                 ★ split out of export/svgExport.ts
│   │   ├── pathToSvgD.ts                     ★ split out of export/svgExport.ts
│   │   └── shapeSpecToSvg.ts                 ★ split out of export/svgExport.ts
│   │
│   ├── animation/                            ← animation/
│   │   ├── index.ts
│   │   ├── Tween.ts
│   │   └── easings.ts
│   │
│   └── headless/                             reference implementation of contracts/
│       ├── HeadlessCameraBinding.ts          ← camera/
│       └── HeadlessRenderer.ts               ← renderer/
│
├── engine/                                   the orchestrator
│   ├── Canvas.ts
│   ├── CanvasConfig.ts
│   ├── CanvasContext.ts                      ← context/
│   ├── FrameMeter.ts
│   ├── InteractionTracker.ts
│   ├── SpecProjector.ts                      ← renderer/
│   ├── assertSerialisable.ts                 ← events/
│   ├── camera/
│   │   └── Camera.ts                         ← camera/
│   ├── input/
│   │   └── GestureArbiter.ts                 ← input/
│   └── registries/                           ← registries/
│       ├── BehaviourRegistry.ts
│       ├── LayerRegistry.ts
│       └── LayoutRegistry.ts
│
├── layers/                                   base classes + built-ins together
│   ├── Layer.ts
│   ├── WorldLayer.ts
│   ├── ScreenLayer.ts
│   ├── BackgroundLayer.ts
│   ├── DevInfoLayer.ts
│   └── LayersPanelLayer.ts
│
├── behaviours/
│   ├── Behaviour.ts
│   ├── DragPanBehaviour.ts
│   ├── DragShapeBehaviour.ts
│   ├── ElementScaleLODBehaviour.ts
│   ├── KeyboardCameraInputBehaviour.ts
│   ├── PinchZoomBehaviour.ts
│   └── WheelZoomBehaviour.ts
│
├── layouts/
│   ├── Layout.ts
│   └── animatePositions.ts
│
└── io/                                       ← export/  (holds import too)
    ├── imageExport.ts
    ├── stateExport.ts
    ├── svgExport.ts                          orchestrator only
    └── shared.ts
```

`★` = new file. `←` = moved from.

`specs/` is **deleted** — see below.

---

## Folder moves

| Now | Target | Note |
|---|---|---|
| `animation/` | `core/animation/` | 6 seam symbols — a backend dependency, not a layout helper |
| `badges/` | `core/geometry/badges/` | already imports `connectors/pathSampling` |
| `connectors/` | `core/geometry/connectors/` | 27 seam symbols |
| `camera/ICameraBinding.ts` | `core/contracts/` | implemented by the backend |
| `camera/HeadlessCameraBinding.ts` | `core/headless/` | reference implementation |
| `camera/Camera.ts` | `engine/camera/` | concrete engine class |
| `renderer/I*.ts` | `core/contracts/` | 17 seam symbols |
| `renderer/HeadlessRenderer.ts` | `core/headless/` | reference implementation |
| `renderer/SpecProjector.ts` | `engine/` | drives a renderer; the backend never imports it |
| `export/svgExport.ts` | **split** | serialisers → `core/svg/`; `exportSVG` orchestrator stays in `io/` |
| `export/` | `io/` | holds `importCanvasState` + `importCanvasStateFromFile`, so `export` was wrong |
| `context/` | `engine/` | 1 file; only `Canvas` constructs it |
| `events/` | `engine/` | 1 file; the event bus lives in `@invana/canvas-store` |
| `input/` | `engine/` | 1 file |
| `registries/` | `engine/registries/` | serve `Canvas` only |
| `theme/` | **deleted** | duplicate of `canvas-store/src/theme/` — see below |
| `specs/` | **deleted** | see below |
| `layers/` `behaviours/` `layouts/` | unchanged | — |

## Deleting `theme/`

`canvas/src/theme/` and `canvas-store/src/theme/` both declare `ResolvedTheme`, `ThemeState` and `CanvasThemeState`. Near-copies, not variants — and the kernel's is the fuller one (it also has `ThemeKind` and `ThemeMode`).

Keep the kernel's, delete these three files, re-export from the root barrel — the same pattern this package already uses for events and the store port.

One behavioural difference to carry over deliberately rather than by accident: the canvas copy emits `theme:change` **without** a source descriptor, where the kernel's emits `{ kind: 'store', id: 'theme' }`. Anything filtering bus events by source currently sees the two publishers differently. Adopting the kernel version makes them uniform — desirable, but a change, not a no-op.

## Deleting `specs/`

`src/specs/index.ts` is 18 lines: `export * from '@invana/canvas-store/specs'`. Zero logic. The folder exists only because tsup's `entry` is path-based, so the file must sit there to emit `dist/specs/index.js` for the `exports["./specs"]` map.

It creates a third path to one vocabulary, and removing it takes away access to nothing:

| Path | What it is |
|---|---|
| `@invana/canvas-store/specs` | where the vocabulary is defined |
| `@invana/canvas` (root) | re-exports it, via `export * from '@invana/canvas-store/specs'` in `src/index.ts` |
| `@invana/canvas/specs` | re-exports the re-export — **this one goes** |

**Why now rather than a deprecation cycle.** 120 downloads last month, 41 last week, first published 2026-06-07 — that is CI, mirrors and local installs, not a consumer base. And `0.0.x` ranges pin exactly in npm (`^0.0.11` does not float), so anyone installed on 0.0.11 stays there regardless; they meet the change only on a deliberate upgrade, where a CHANGELOG line covers it. Pre-1.0 and pre-open-source is the cheapest this will ever be.

**What it costs.** 22 `import type` statements across 18 files, repointed to the `@invana/canvas` root — so **no dependency changes**, since the root already re-exports the whole vocabulary.

| Package | Files |
|---|---|
| `@invana/graph` | 7 |
| `apps/storybook` | 7 |
| `@invana/graph-layer-d3-contour` | 3 |
| `@invana/graph-layer-bubble-sets` | 1 |

Plus: drop `'src/specs/index.ts'` from `tsup.config.ts` `entry`, and drop `exports["./specs"]` from `package.json`.

## New files

| File | Why |
|---|---|
| `core/index.ts` | the future package entry point |
| `core/contracts/index.ts` | 6-file fan-out |
| `core/contracts/ICamera.ts` | `IRenderer.attachCamera` currently takes the concrete 465-line `Camera` |
| `core/svg/index.ts` | 3-file fan-out |
| `core/svg/shapeSpecToSvg.ts` · `connectorToSvg.ts` · `pathToSvgD.ts` | split out of `export/svgExport.ts`; the backend calls them directly |

## Rules

| # | Rule |
|---|---|
| 1 | `core/` is what a **backend** needs; everything else is what an **app** needs |
| 2 | A base class stays with its concrete siblings — so `layers/` holds `Layer` *and* `BackgroundLayer`, and there is no `builtin/` folder |
| 3 | A contract lives beside its reference implementation unless implemented outside this package |
| 4 | The reference implementation travels with its contract — `core/headless/` sits inside `core/` |
| 5 | Barrels only for a tsup entry, the `core/` staging entry, or a fan-out of ≥3 sibling files |
| 6 | `core/` may not import from `engine/`, `layers/`, `behaviours/`, `layouts/`, `io/` — enforced by `scripts/check-renderer-boundary.mjs` |
