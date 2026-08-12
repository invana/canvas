---
id: feat-2026-08-12-engine-package-structure
type: feat
title: One target file-tree for the engine packages — abstracts in the new canvas-core, orchestration in canvas
status: landed
opened: 2026-08-12
decided: 2026-08-12
landed: 2026-08-12
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/canvas-store, pkg:@invana/renderer-pixijs]
design_of_record: null
relations:
  - { predicate: supersedes, object: rfc:feat-2026-08-11-canvas-src-layout-hides-the-backend-seam }
  - { predicate: supersedes, object: rfc:feat-2026-08-11-canvas-store-structure }
  - { predicate: relates-to, object: rfc:feat-2026-08-11-canvas-core-structure }
  - { predicate: relates-to, object: doc:docs/renderer-split-design.md }
---

# Engine package structure — canvas · canvas-store · renderer-pixijs

One combined restructure of the engine packages, presented as **one consolidated target tree**
(§4.0 — no before-trees; git and the superseded RFCs carry those). Two goals:
**(1)** kill the one-file folders and loose root files; **(2)** the multi-renderer future —
every abstract a backend, layer, behaviour or layout package extends collects in the **new
package `pkg:@invana/canvas-core`** (D-8: created directly, no staging inside canvas), and
`pkg:@invana/canvas` becomes the **orchestrator** of layers, behaviours, layouts and the store.

| | |
|---|---|
| Problem | 14 one-file folders across three packages; 10 loose root files in renderer-pixijs; the abstracts a `renderer-threejs` / layout / layer package must extend are scattered across 6 canvas folders |
| Scope | `pkg:@invana/canvas` 16 top-level folders → **4 + index** with `core/` born as the real `pkg:@invana/canvas-core` (D-8) · `pkg:@invana/canvas-store` 16 folders → **11** (zero one-file, one deliberate exception) · `pkg:@invana/renderer-pixijs` 14 folders + 10 root files → **3 groups + 3 root files** |
| Supersedes | `rfc:feat-2026-08-11-canvas-src-layout-hides-the-backend-seam` · `rfc:feat-2026-08-11-canvas-store-structure` (Now-trees and most rationale survive; targets revised) |
| Not superseded | `rfc:feat-2026-08-11-canvas-core-structure` — still the extraction endpoint; its `src/` gains `abstracts/` per this RFC |
| Row status | change rows: **landed 33** · rejected 1 (C3) · verification: **pass 7** · decisions: accepted 6 · open 1 (D-4, D-5 subsumed by the landing; D-7 executed as recommended) |

---

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | 6 one-file folders in the kernel | `pkg:@invana/canvas-store` | `actions/` `history/` `geom/` `perf/` `view/` `adapters/zustand/` each hold 1 file |
| M2 | 4 one-file folders in the engine | `pkg:@invana/canvas` | `context/` `events/` `input/` `specs/` each hold 1 file |
| M3 | 4 one-file folders + 10 loose root files in the backend | `pkg:@invana/renderer-pixijs` | `connectors/` `fonts/` `markers/` `textures/`; root holds `PixiRenderer` … `sharedTexturePool` unsorted |
| M4 | Multi-renderer is the committed direction (pixi now, three.js later) but the surface a second backend implements is spread over `renderer/`, `camera/`, `connectors/`, `badges/`, `animation/` | `pkg:@invana/canvas` | `doc:docs/renderer-split-design.md` §5; 57 symbols reached by `pkg:@invana/renderer-pixijs` |
| M5 | The abstracts extension packages extend (`sym:Layer`, `sym:Behaviour`, `sym:Layout`) sit beside their built-ins, so a layout/layer package must depend on the whole engine | `pkg:@invana/canvas` | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L9` imports `Layout` + `animatePositions` from the root |
| M6 | A subpath re-exports a re-export | `pkg:@invana/canvas` | `file:packages/canvas/src/specs/index.ts` is `export * from '@invana/canvas-store/specs'`, already also re-exported by the root barrel |

## 2 Design

Target dependency layering (with D-8: `canvas-core` is a real package from day one):

```
@invana/canvas-store   kernel: store + events + specs + picking + telemetry
        ▲
@invana/canvas-core    contracts (IRenderer/ISurface/…, SpecProjector) + ABSTRACTS
        ▲              (Layer/Behaviour/Layout, CanvasContext, GestureArbiter) + Camera
        │              + registries + pure geometry + svg + animation + headless double.
        │              Never imports @invana/canvas.
        │
@invana/canvas         the ORCHESTRATOR: Canvas + built-in layers/behaviours + io.
        ▲              deps: { canvas-core, canvas-store } (both normal deps);
        │              root barrel re-exports the whole canvas-core surface.
        │
        ├── @invana/renderer-pixijs   implements canvas-core contracts (template for renderer-threejs)
        └── @invana/graph, graph-layout-*, graph-layer-*   extend canvas-core abstracts
```

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | Everything a **non-canvas package** implements or extends goes in `core/` | M4, M5 | `core/` = contracts + abstracts + the pure helpers they need (`animatePositions`, connector geometry, badges, svg serialisers, tweens, headless reference) |
| G2 | Abstracts program against **interfaces**, not engine classes | `sym:Behaviour.attach` takes `CanvasContext`; `sym:Behaviour` imports `GestureClaimOptions` from `file:packages/canvas/src/input/GestureArbiter.ts` | `ICanvasContext` + gesture types split into `core/abstracts/`; concrete `CanvasContext` / `DefaultGestureArbiter` stay in `engine/` |
| G3 | This **reverses** the superseded RFC's rule 2 ("a base class stays with its concrete siblings") | maintainer decision D-2 | `layers/` `behaviours/` hold built-ins only; `layouts/` in canvas disappears (both its files were core material) |
| G4 | Root barrel re-exports everything `core/` moves | all externals import from `@invana/canvas` root (checked: `pkg:@invana/graph` uses no deep path but `./specs`) | zero import changes outside the three packages except X-rows below |
| G5 | `core/` may depend on `pkg:@invana/canvas-store` | `sym:Layer.state` is a `ReactiveStore`; bus types are kernel types | layering stays acyclic: store → core → everything else |
| G6 | Folder rule everywhere: a folder exists only for ≥2 files or an enforced boundary/planned sibling | M1–M3 | the one allowed one-file folder is `canvas-store/src/adapters/` (future `yjs.ts` sibling, boundary-pinned) |

### 2.1 Verified by trial implementation (2026-08-12, discarded on request)

The full restructure of `canvas` + the `canvas-core` extraction was **implemented once end-to-end,
verified, and then reverted** (maintainer chose to stay in planning). Everything below is
measured fact, not conjecture — the plan is de-risked accordingly.

| ID | Finding | Evidence | Consequence for the plan |
|---|---|---|---|
| T1 | `sym:CanvasContext` is **already an interface** — `Canvas` builds an object literal satisfying it | `file:packages/canvas/src/context/CanvasContext.ts#L26` | C5 is a plain move, not a split; no `ICanvasContext` file needed; external `CanvasContext` type name unchanged → D-6 resolved |
| T2 | `file:packages/canvas/src/input/GestureArbiter.ts` already holds the `GestureArbiter` interface + the dep-free `DefaultGestureArbiter` | whole file imports nothing | C6 is a whole-file move, not a split |
| T3 | `sym:Camera` imports only `pkg:@invana/canvas-store` + `ICameraBinding` | import block, 465-line class | the **whole class** moves to core (as root-level `Camera.ts`); the `ICamera` narrow face (C3) is unnecessary — C3 `rejected` |
| T4 | `sym:SpecProjector` is contract machinery: `IElementRenderer` imports its `SpecProjectionTarget`, and `sym:GraphLayer` constructs it | `file:packages/canvas/src/renderer/IElementRenderer.ts#L33` · `file:packages/graph/src/layer/GraphLayer.ts` | `SpecProjector` → `core/contracts/`, **not** `engine/` — the superseded RFC's placement was wrong (C17) |
| T5 | `CanvasContext` references the `LayerRegistry` / `BehaviourRegistry` **classes**; all three registries import only kernel + abstracts | registry import blocks | registries move to `core/registries/` (C16) — they sit below the engine |
| T6 | `sym:animatePositions` is consumed by `file:packages/graph/src/layout/OneShotPositionLayout.ts` | import grep | it is core material (`core/animation/`); canvas's `layouts/` folder **disappears entirely** — canvas top-level ends at **4 folders + index** (`engine/` `layers/` `behaviours/` `io/`) |
| T7 | `@invana/canvas/specs` importers number **19 files**, including one in `pkg:@invana/renderer-pixijs` | repo grep | X1 count corrected (the superseded RFC missed the pixi one) |
| T8 | The whole pipeline passed in the trial: turbo build 20/20 (incl. Storybook static), repo `check-types` 19/19, `check-boundaries` ✓, canvas-core tests 57/57 + canvas 31/31, `grep "@invana/canvas'" packages/canvas-core/src` → 0 | trial run 2026-08-12 | V1–V7 are all demonstrably passable; the only failure seen (`graph-layout-d3-hierarchy` `pnpm test`) is pre-existing — the package has a test script but zero test files |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-08-11-canvas-src-layout-hides-the-backend-seam` | superseded-by this | superseded | Now-tree, `core/` staging idea, `./specs` deletion case, `theme/` dedup, new-file list — its rule 2 is reversed (G3), `engine/camera|input` subfolders flattened, `abstracts/` added |
| `rfc:feat-2026-08-11-canvas-store-structure` | superseded-by this | superseded | `view/` absorption, `backend.ts` rename, canonical `theme/` — extended by S4–S6 (it still kept 3 one-file folders) |
| `rfc:feat-2026-08-11-canvas-core-structure` | relates-to | proposed | Still the extraction endpoint; gains `abstracts/` when this lands |
| `doc:docs/renderer-split-design.md` | relates-to | design of record | The renderer contract + three.js second-backend design this tree serves |
| `doc:docs/canvas-state-plan.md` | relates-to | design of record | Kernel compartments (`view`/`data`/`events`) — unchanged by this RFC |

---

## 4 The change

### 4.0 Target structure — all four packages, one tree

The complete target layout (`★` = file that does not exist today; everything else moves in
unchanged or with import-path fixes only). The before-state is not reproduced here — git and
the superseded RFCs carry it; the per-package move tables below give every source path.

```
packages/
│
├── canvas-store/src/                      the renderer-free KERNEL
│   ├── index.ts
│   ├── CanvasStore.ts                     the { view, data, events } facade
│   ├── geom.ts                            Point, Vec2, Size, Rect, CameraTransform
│   ├── frame.ts                           FrameTick, FrameStats, InteractionKind
│   ├── port/                              the ReactiveStore abstraction
│   │   ├── types.ts · store-core.ts · patch.ts · select.ts
│   │   └── createMemoryStore.ts           dep-free reference adapter
│   ├── adapters/
│   │   └── zustand.ts                     the repo's only zustand importer;
│   │                                      folder kept for the planned yjs.ts sibling
│   ├── view/                              the view store + how it changes
│   │   ├── CanvasView.ts
│   │   ├── createActions.ts
│   │   └── createHistory.ts
│   ├── data/                              bulk / machine-rate state
│   │   ├── ColumnStore.ts · DataSource.ts · DirtyBatcher.ts
│   │   └── LayerData.ts · flush.ts
│   ├── events/
│   │   ├── CanvasEvent.ts · CanvasEventBus.ts
│   │   └── EventEmitter.ts · SourceEmitter.ts
│   ├── specs/                             the spec vocabulary — what to draw
│   │   ├── index.ts · SpecStore.ts
│   │   ├── badge.ts · connector.ts · decoration.ts · decorationStyle.ts
│   │   ├── elementEvents.ts · geometry.ts · hit.ts · label.ts
│   │   ├── plane.ts · shape.ts · stats.ts · style.ts
│   │   └── shapeGeometry/
│   │       ├── index.ts · bounds.ts · contains.ts
│   │       └── polygonMath.ts · tabbedRect.ts
│   ├── hit/                               picking
│   │   └── HitIndex.ts · PickingIndex.ts
│   ├── telemetry/
│   │   ├── config.ts · logging.ts · metrics.ts
│   │   └── tracing.ts · withTelemetry.ts
│   ├── theme/                             canonical — canvas re-exports this
│   │   └── CanvasThemeState.ts · types.ts
│   └── renderer/                          the kernel's half of the renderer seam
│       ├── backend.ts                     (renamed: declares RendererBackend, not IRenderer)
│       └── RendererInitOptions.ts
│
├── canvas-core/src/                       ★ NEW PACKAGE — contracts + abstracts
│   ├── index.ts                           ★ single entry, no subpaths
│   ├── Camera.ts                          pan/zoom/fit semantics over ICameraBinding
│   ├── contracts/                         what a rendering BACKEND implements
│   │   ├── IRenderer.ts · ISurface.ts · IElementRenderer.ts
│   │   ├── IOverlayDevice.ts · ICameraBinding.ts
│   │   └── SpecProjector.ts               drives a renderer from a SpecStore
│   ├── abstracts/                         what an EXTENSION package extends
│   │   ├── Layer.ts · Behaviour.ts · Layout.ts
│   │   ├── CanvasContext.ts               the shared service interface (T1)
│   │   └── GestureArbiter.ts              interface + DefaultGestureArbiter (T2)
│   ├── registries/                        referenced by CanvasContext (T5)
│   │   └── LayerRegistry.ts · BehaviourRegistry.ts · LayoutRegistry.ts
│   ├── geometry/                          spec in → path/point out
│   │   ├── connectors/
│   │   │   ├── index.ts · pathSampling.ts
│   │   │   ├── anchors/      boundary · center · edgePort
│   │   │   │                 · perpendicular · silhouettePort
│   │   │   ├── pathStyles/   bezier · bumpHorizontal · bumpRadial · bundle
│   │   │   │                 · loopCurve · loopPolyline · normal · quadratic
│   │   │   │                 · rounded · smooth · stepRadial
│   │   │   └── routers/      _aStar · _obstacleGrid · er · manhattan
│   │   │                     · metro · oneSide · orth · straight
│   │   └── badges/
│   │       └── index.ts · placement.ts · connectorPlacement.ts · types.ts
│   ├── svg/                               pure spec → markup serialisers
│   │   ├── index.ts ★ · markup.ts ★ · paint.ts ★
│   │   └── pathToSvgD.ts ★ · shapeSpecToSvg.ts ★ · connectorToSvg.ts ★
│   │                                      (all six split out of canvas's svgExport.ts)
│   ├── animation/
│   │   ├── index.ts · Tween.ts · easings.ts
│   │   └── animatePositions.ts            consumed by layout packages (T6)
│   └── headless/                          reference implementation of contracts/
│       └── HeadlessRenderer.ts · HeadlessCameraBinding.ts
│
├── canvas/src/                            the ORCHESTRATOR
│   ├── index.ts                           re-exports the whole canvas-core surface
│   │                                      + the kernel's specs/picking/theme/events
│   ├── engine/
│   │   ├── Canvas.ts                      builds the concrete CanvasContext object
│   │   ├── CanvasConfig.ts · FrameMeter.ts · InteractionTracker.ts
│   │   └── assertSerialisable.ts
│   ├── layers/                            built-ins only (bases live in canvas-core)
│   │   ├── WorldLayer.ts · ScreenLayer.ts
│   │   └── BackgroundLayer.ts · DevInfoLayer.ts · LayersPanelLayer.ts
│   ├── behaviours/                        built-ins only
│   │   ├── DragPanBehaviour.ts · DragShapeBehaviour.ts
│   │   ├── WheelZoomBehaviour.ts · PinchZoomBehaviour.ts
│   │   └── KeyboardCameraInputBehaviour.ts · ElementScaleLODBehaviour.ts
│   └── io/                                export/import (holds import too)
│       ├── imageExport.ts · stateExport.ts
│       └── svgExport.ts (document assembly only) · shared.ts
│
└── renderer-pixijs/src/                   the pixi BACKEND (template for renderer-threejs)
    ├── index.ts · types.ts
    ├── createDefaultRenderer.ts           the engine's lazy-import target
    ├── renderer/                          the contract implementation
    │   ├── PixiRenderer.ts                (IRenderer)
    │   ├── PixiSurface.ts                 (ISurface)
    │   ├── PixiOverlayDevice.ts           (IOverlayDevice)
    │   ├── PixiViewportBinding.ts         (ICameraBinding)
    │   ├── PrimitivesRenderer.ts          (IElementRenderer)
    │   ├── rendererSupport.ts             WebGPU/WebGL capability probing
    │   └── mounted/
    │       └── ShapeInstance.ts · ConnectorInstance.ts
    ├── primitives/                        everything that draws
    │   ├── base/                          7 primitive/decoration/effect bases
    │   ├── shapes/                        10 shape renderers (Circle … Composite)
    │   ├── paint/                         applyFillStroke · dashedStroke · insetContentLayer
    │   │                                  · labelBackground · labelContent
    │   ├── connectors/
    │   │   └── Connector.ts · ArrowMarker.ts
    │   ├── decorations/
    │   │   ├── shape/                     9 shape decorations
    │   │   └── connector/                 8 connector decorations
    │   └── effects/                       4 files, flat (names disambiguate)
    └── assets/                            loaded resources
        └── TextureRegistry.ts · sharedTexturePool.ts · loadIconFont.ts
```

### 4.1 `pkg:@invana/canvas` — 16 top-level folders / 76 files → **4 folders + index** (with D-8, `core/` is born as `packages/canvas-core/src/`)

> **D-8 (accepted):** the `core/` subtree below is created directly as the real package
> `packages/canvas-core/src/` — same internal layout, no staging period. `canvas` then keeps
> only `engine/` · `layers/` · `behaviours/` · `io/` + `index.ts`, with `engine/camera|input`
> flattened into `engine/` and `layouts/` gone (T6). The canvas root barrel re-exports the
> **whole** canvas-core surface so the split is invisible at every import site (verified, T8).

`layouts/`, `theme/`, `specs/`, `camera/`, `context/`, `events/`, `input/`, `registries/`, `renderer/`, `connectors/`, `badges/`, `animation/` cease to exist in this package — their contents land in `canvas-core` or `engine/` per the rows below.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| C1 | move | **landed** | `file:packages/canvas/src/renderer/I*.ts` → `core/contracts/` | 4 contract files move | backend surface in one place | low | — |
| C2 | move | **landed** | `file:packages/canvas/src/camera/ICameraBinding.ts` → `core/contracts/` | contract joins its siblings | — | low | — |
| C3 | new | **rejected** | ~~`core/contracts/ICamera.ts`~~ | narrow interface for `sym:IRenderer.attachCamera` | unnecessary — T3: `Camera` itself is kernel-clean and moves to core whole, so the contract can keep taking `Camera` | — | — |
| C4 | move | **landed** | `sym:Layer`, `sym:Behaviour`, `sym:Layout` → `core/abstracts/` | base classes leave their built-ins | extension packages will depend on `canvas-core` only | medium — internal import churn in every built-in + `pkg:@invana/graph` unaffected via root barrel | C5, C6 |
| C5 | move | **landed** | `file:packages/canvas/src/context/CanvasContext.ts` → `core/abstracts/CanvasContext.ts` | **already an interface** (T1) — moves as-is; `ThemeState` import repoints to the kernel; the engine keeps building the concrete object literal | context contract crosses the package boundary with zero renames | low | C13, C16 |
| C6 | move | **landed** | `file:packages/canvas/src/input/GestureArbiter.ts` → `core/abstracts/GestureArbiter.ts` | whole file (T2): interface + `GestureClaimOptions` + the dep-free `DefaultGestureArbiter` together | `sym:Behaviour` imports a sibling | low | — |
| C7 | move | **landed** | `connectors/` → `core/geometry/connectors/`, `badges/` → `core/geometry/badges/` | subtree unchanged internally | 27+6 seam symbols inside `core/` | low | — |
| C8 | split | **landed** | `file:packages/canvas/src/export/svgExport.ts` → `core/svg/{shapeSpecToSvg,connectorToSvg,pathToSvgD}.ts` + orchestrator stays in `io/` | pure serialisers separate from the export orchestration | backend can call serialisers without `io/` | medium — behaviour-preserving split of working code | — |
| C9 | move | **landed** | `animation/` + `file:packages/canvas/src/layouts/animatePositions.ts` → `core/animation/` | `animatePositions` is consumed by `file:packages/graph/src/layout/OneShotPositionLayout.ts` — core material | `layouts/` folder empties and is deleted | low | C4 |
| C10 | move | **landed** | `renderer/HeadlessRenderer.ts`, `camera/HeadlessCameraBinding.ts` → `core/headless/` | reference impl travels with its contracts | — | low | C1 |
| C11 | move | **landed** | `events/assertSerialisable.ts` → `engine/` | orchestrator internals in one folder (T1/T2/T3/T4 moved the rest of this row's original contents into core instead) | the last one-file folder dies | low | C5, C6 |
| C16 | move | **landed** | `registries/{Layer,Behaviour,Layout}Registry.ts` → `core/registries/` | `CanvasContext` references the registry classes and all three are kernel+abstracts-clean (T5) | context typing needs no interface indirection | low | C4, C5 |
| C17 | move | **landed** | `renderer/SpecProjector.ts` → `core/contracts/SpecProjector.ts` | contract machinery (T4): `IElementRenderer` imports its types, `sym:GraphLayer` constructs it | corrects the superseded RFC's `engine/` placement | low | C1 |
| C18 | move | **landed** | `camera/Camera.ts` → `core/Camera.ts` (root-level file) | whole class, kernel-clean (T3) | `ctx.camera` and `IRenderer.attachCamera` type unchanged | low | C2 |
| C12 | move | **landed** | `export/` → `io/` | holds `sym:importCanvasState` too, so `export` was a lie | — | low | C8 |
| C13 | delete | **landed** | `theme/` (3 files) | duplicate of `file:packages/canvas-store/src/theme/`; kernel's is canonical (adds `ThemeKind`, `ThemeMode`); root barrel re-exports | one definition of `ResolvedTheme`/`ThemeState`/`CanvasThemeState` | medium — kernel emits `theme:change` **with** source descriptor `{ kind: 'store', id: 'theme' }`, canvas copy without; adopting kernel's is a uniformity change, not a no-op | — |
| C14 | delete | **landed** | `specs/index.ts` + `exports["./specs"]` + tsup entry | third path to one vocabulary removed (M6); `@invana/canvas-store/specs` and the `@invana/canvas` root both remain | 19 files repoint (X1) | medium — cross-package import sweep, no dependency changes | — |
| C15 | new | **landed** | `core/index.ts`, `core/contracts/index.ts`, `core/abstracts/index.ts`, `core/svg/index.ts` | staging barrel + ≥3-file fan-outs | `core/` lifts out by moving a folder | low | C1–C10 |

### 4.2 `pkg:@invana/canvas-store` — 16 folders / 52 files → **11 / 52**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| S1 | move | **landed** | `actions/createActions.ts` → `view/` | operates on the view store; no meaning apart from it | `actions/` dies | low | — |
| S2 | move | **landed** | `history/createHistory.ts` → `view/` | undo/redo over the view store's patch stream | `history/` dies | low | — |
| S3 | rename | **landed** | `file:packages/canvas-store/src/renderer/IRenderer.ts` → `renderer/backend.ts` | the filename lies — it declares only `sym:RendererBackend`; 33 of 34 lines explain that `IRenderer` lives in `pkg:@invana/canvas` | grep for the contract stops landing on a "not here" note | low | — |
| S4 | move | **landed** | `geom/types.ts` → `src/geom.ts` | flatten to root file (importers: `index.ts`, `file:packages/canvas-store/src/specs/geometry.ts`, `file:packages/canvas-store/src/view/CanvasView.ts`) | `geom/` dies | low | — |
| S5 | move | **landed** | `perf/frame.ts` → `src/frame.ts` | flatten to root file (importers: `index.ts`, `file:packages/canvas-store/src/telemetry/metrics.ts`, `file:packages/canvas-store/src/events/CanvasEventBus.ts`) | `perf/` dies | low | — |
| S6 | move | **landed** | `adapters/zustand/createReactiveStore.ts` → `adapters/zustand.ts` | flatten one level; `adapters/` kept as the one allowed one-file folder — `yjs.ts` is its planned sibling (deferred per standing decision) | nested one-file chain dies | medium — the enforced boundary pin moves (X2) | X2 |
| S7 | none | **landed** | `theme/` | unchanged, becomes **canonical** — `pkg:@invana/canvas` deletes its copy (C13) and re-exports | one theme vocabulary | low | C13 |

### 4.3 `pkg:@invana/renderer-pixijs` — 14 folders + 10 root files / 59 files → **3 groups + 3 root files / 59**

This shape is the **layout template for `renderer-threejs`**: same three groups, `Pixi*` swapped for `Three*`.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| P1 | move | **landed** | 6 root `Pixi*`/`PrimitivesRenderer`/`rendererSupport` files + `mounted/` → `renderer/` | one folder per contract implementation | root shrinks to 3 files | low | — |
| P2 | move | **landed** | `base/`, `shapes/`, `paint/`, `decorations/` → `primitives/` | subtrees unchanged internally | matches the package `CLAUDE.md`'s own "all of `primitives/`" vocabulary | low | — |
| P3 | move | **landed** | `connectors/Connector.ts` + `markers/ArrowMarker.ts` → `primitives/connectors/` | markers only ever decorate connectors | 2 one-file folders die | low | P2 |
| P4 | move | **landed** | `effects/shape/*` + `effects/connector/*` → `primitives/effects/` (flat, 4 files) | class names already disambiguate (`BreathingEffect` vs `BreathingConnectorEffect`) | 2 two-file subfolders die | low | P2 |
| P5 | move | **landed** | `textures/TextureRegistry.ts`, `sharedTexturePool.ts`, `fonts/loadIconFont.ts` → `assets/` | loaded-resource concern in one folder | 2 one-file folders die | low | — |

### 4.4 Cross-cutting

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| X1 | sweep | **landed** | 19 files importing `@invana/canvas/specs` | repoint to the `@invana/canvas` root (already re-exports the vocabulary) — `pkg:@invana/graph` 7 · `pkg:@canvas/storybook` 7 · `pkg:@invana/graph-layer-d3-contour` 3 · `pkg:@invana/graph-layer-bubble-sets` 1 · `pkg:@invana/renderer-pixijs` 1 | `./specs` subpath deletable (C14) | low — type-only imports, no dependency changes | C14 |
| X2 | pin | **landed** | `file:scripts/check-renderer-boundary.mjs#L63` + the ESLint `no-restricted-imports` mirror | tighten the zustand `allowed` prefix `packages/canvas-store/src/adapters/zustand` to the exact file `…/adapters/zustand.ts` (the old prefix would still match, but keep the pin exact) | boundary survives S6 | low | S6 |
| X3 | docs | **landed** | root `CLAUDE.md`, `file:packages/canvas/CLAUDE.md`, `file:packages/renderer-pixijs/CLAUDE.md`, `file:packages/canvas-store/CLAUDE.md` | update the named paths: zustand adapter path, "renderer contract in `packages/canvas/src/renderer/IRenderer.ts`" → `core/contracts/`, pixi folder map | docs stop pointing at dead paths | low | all |
| X4 | build | **landed** | `file:packages/canvas/tsup.config.ts`, `file:packages/canvas/package.json` | drop the `src/specs/index.ts` entry + `exports["./specs"]`; canvas-store's `./specs` subpath **stays** (its `specs/` folder is untouched) | — | low | C14 |

## 5 Blast radius

Upstream (what this depends on):

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | tsup path-based entries | `dist/` layout follows `src/` — entry lists must move with files | build breaks loudly, not silently |
| U2 | `file:scripts/check-renderer-boundary.mjs` prefix matching | zustand pin is a path prefix (X2); pixi pin is the package-src prefix — unaffected by internal moves | boundary silently widens if forgotten |

Downstream (who could break):

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| B1 | `pkg:@invana/graph` | package | 7 files on `./specs` subpath; base classes via root barrel — safe | X1 repoint only |
| B2 | `pkg:@canvas/storybook` | app | 7 files on `./specs`; everything else via roots | X1 repoint only |
| B3 | `pkg:@invana/graph-layer-d3-contour` · `pkg:@invana/graph-layer-bubble-sets` | packages | 3 + 1 files on `./specs` | X1 repoint only |
| B4 | `pkg:@invana/renderer-pixijs` | package | 1 file on `./specs`; implements the contracts that move to `core/contracts/` — imports via `@invana/canvas` root, safe | X1 repoint only |
| B5 | `pkg:@invana/canvas-react` · `pkg:@invana/canvas-ui` · `pkg:@invana/canvas-designer` | packages | import from package roots only | none |
| B6 | Serialised state / published API | contract | no runtime rename except C13's `theme:change` source-descriptor uniformity (called out, deliberate) | note in CHANGELOG |
| B7 | `doc:docs/canvas-state-plan.md` + kernel plan docs | docs | reference `adapters/zustand/` and kernel folder names | X3 sweep |
| B8 | External npm consumers of `@invana/canvas/specs` | registry | 120 downloads/month, `0.0.x` pins exactly — CI/mirrors, not a consumer base (analysis inherited from the superseded RFC) | CHANGELOG line |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm check-boundaries` | repo | pass — zustand pin holds at new path; no pixi leak | S6, X2, all moves |
| V2 | **pass** | `pnpm check-types` | repo | pass | all |
| V3 | **pass** | `pnpm build` | repo | pass — tsup entries follow moved files | U1, C14, X4 |
| V4 | **pass** | Storybook smoke (`pnpm --filter @canvas/storybook dev`) | existing stories | render unchanged — **control**: stories work today and must keep working | all |
| V5 | **pass** | `find packages/{canvas,canvas-store,renderer-pixijs}/src -type d` audit | trees | zero one-file folders except `canvas-store/src/adapters/` | C11, S1–S6, P1–P5 |
| V6 | **pass** | `grep -rl "from 'pixi" packages/*/src` | repo | only `renderer-pixijs` — **control** | P1–P5 |
| V7 | **pass** | `grep -rn "@invana/canvas/specs"` | repo | zero hits | C14, X1 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | One combined doc vs per-package RFCs | combined / keep 2026-08-11 pair + add pixi | combined; supersede the pair | **accepted** (maintainer, 2026-08-12) |
| D-2 | Where do the `Layer`/`Behaviour`/`Layout` abstracts live? | beside built-ins (old rule 2) / `core/abstracts/` | `core/abstracts/` — extension packages should depend on a small frozen package; canvas is the orchestrator | **accepted** (maintainer, 2026-08-12) |
| D-3 | renderer-pixijs regrouping depth | light touch / deep (`renderer/`+`primitives/`+`assets/`) | deep — doubles as the `renderer-threejs` template | **accepted** (maintainer, 2026-08-12) |
| D-4 | Extra canvas-store flattening beyond the superseded RFC (S4–S6) | keep `geom/` `perf/` `adapters/zustand/` / flatten | flatten — they were the goal of this exercise | open |
| D-5 | Delete the `./specs` subpath now (C14/X1) | delete / deprecation cycle | delete — pre-1.0, `0.0.x` pins exactly, root re-export covers everyone | open |
| D-6 | `ICanvasContext` naming/exposure (C5) | keep exporting concrete `CanvasContext` as today's name + add interface / rename everywhere | moot — T1: `CanvasContext` is already an interface and moves as-is, name unchanged | **accepted** (resolved by T1) |
| D-7 | Land order | per-package (store → canvas → pixi) / one sweep | per-package: canvas-core extraction + canvas first (trial-proven, T8), then store (S-rows), pixi last (pure internal) | open |
| D-8 | Stage `core/` inside canvas, or create `packages/canvas-core` immediately? | staging subtree / real package now | real package now — no staging period; `canvas` deps become `{canvas-core, canvas-store}` (both normal deps, the foundational pattern); canvas-core scaffolding mirrors canvas-store (tsup ESM, single entry, no subpaths, vitest node env) | **accepted** (maintainer, 2026-08-12) |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-12 | Opened; supersedes the two 2026-08-11 structure RFCs | proposed | D-1..D-3 decided in session; abstracts-into-core charter widened by maintainer mid-session |
| 2026-08-12 | D-8 accepted (create `packages/canvas-core` now, no staging); trial implementation of C-rows + X1/X4 executed end-to-end — all verifications passed (T8) — then **discarded at the maintainer's request** to stay in planning | proposed | Findings folded back as §2.1 (T1–T8): C3 rejected, C5/C6 simplified to plain moves, C11 corrected, C16–C18 added, D-6 resolved. Working tree returned to pre-trial state; `dist/` restored from turbo cache |
| 2026-08-12 | Maintainer approved the consolidated tree (§4.0) — **implemented in full**: C-rows, S-rows, P-rows, X-rows all landed | **landed** | Verified: turbo build 20/20 (incl. Storybook static) · repo `check-types` 19/19 · `check-boundaries` ✓ · 256 tests pass (canvas-core 57, canvas 31, canvas-store 168) · zero one-file folders except `canvas-store/src/adapters/` · pixi confined to its backend · `canvas-core`→`canvas` import grep = 0 · `./specs` importers = 0. **Storybook verified live in-browser**: graph AllShapes, connector anchors, flow-particles decoration, d3-force 200-node collision sim, and the full GraphVisualiser (Les Misérables, minimap, hover picking, node click) — all render with zero console errors. CLAUDE.mds updated (root · canvas · new canvas-core · renderer-pixijs) |
