# `packages/canvas-store/src` — file and folder structure

16 folders / 51 files → **14 folders / 51 files**.

The kernel is in far better shape than `@invana/canvas` was — every folder already names a real concern. This is a light touch: three folders merge, one file is renamed because its name lies, and one duplicated folder is resolved in favour of this package.

---

## Now

```
packages/canvas-store/src/
├── index.ts
├── CanvasStore.ts
├── actions/
│   └── createActions.ts
├── adapters/
│   └── zustand/
│       └── createReactiveStore.ts
├── data/
│   ├── ColumnStore.ts
│   ├── DataSource.ts
│   ├── DirtyBatcher.ts
│   ├── LayerData.ts
│   └── flush.ts
├── events/
│   ├── CanvasEvent.ts
│   ├── CanvasEventBus.ts
│   ├── EventEmitter.ts
│   └── SourceEmitter.ts
├── geom/
│   └── types.ts
├── history/
│   └── createHistory.ts
├── hit/
│   ├── HitIndex.ts
│   └── PickingIndex.ts
├── perf/
│   └── frame.ts
├── port/
│   ├── createMemoryStore.ts
│   ├── patch.ts
│   ├── select.ts
│   ├── store-core.ts
│   └── types.ts
├── renderer/
│   ├── IRenderer.ts
│   └── RendererInitOptions.ts
├── specs/
│   ├── index.ts
│   ├── SpecStore.ts
│   ├── badge.ts
│   ├── connector.ts
│   ├── decoration.ts
│   ├── decorationStyle.ts
│   ├── elementEvents.ts
│   ├── geometry.ts
│   ├── hit.ts
│   ├── label.ts
│   ├── plane.ts
│   ├── shape.ts
│   ├── stats.ts
│   ├── style.ts
│   └── shapeGeometry/
│       ├── index.ts
│       ├── bounds.ts
│       ├── contains.ts
│       ├── polygonMath.ts
│       └── tabbedRect.ts
├── telemetry/
│   ├── config.ts
│   ├── logging.ts
│   ├── metrics.ts
│   ├── tracing.ts
│   └── withTelemetry.ts
├── theme/
│   ├── CanvasThemeState.ts
│   └── types.ts
└── view/
    └── CanvasView.ts
```

---

## Target

```
packages/canvas-store/src/
├── index.ts
├── CanvasStore.ts                        the { view, data, events } facade
│
├── port/                                 the ReactiveStore abstraction
│   ├── types.ts
│   ├── store-core.ts
│   ├── patch.ts
│   ├── select.ts
│   └── createMemoryStore.ts              dep-free reference adapter
│
├── adapters/                             implementations of the port
│   └── zustand/
│       └── createReactiveStore.ts        the only zustand importer in the repo
│
├── view/                                 what the view store holds, and how it changes
│   ├── CanvasView.ts
│   ├── createActions.ts                  ← actions/
│   └── createHistory.ts                  ← history/
│
├── data/                                 bulk / machine-rate state
│   ├── ColumnStore.ts
│   ├── DataSource.ts
│   ├── DirtyBatcher.ts
│   ├── LayerData.ts
│   └── flush.ts
│
├── events/
│   ├── CanvasEvent.ts
│   ├── CanvasEventBus.ts
│   ├── EventEmitter.ts
│   └── SourceEmitter.ts
│
├── specs/                                the spec vocabulary — what to draw
│   ├── index.ts
│   ├── SpecStore.ts
│   ├── badge.ts
│   ├── connector.ts
│   ├── decoration.ts
│   ├── decorationStyle.ts
│   ├── elementEvents.ts
│   ├── geometry.ts
│   ├── hit.ts
│   ├── label.ts
│   ├── plane.ts
│   ├── shape.ts
│   ├── stats.ts
│   ├── style.ts
│   └── shapeGeometry/                    pure geometry over a shape spec
│       ├── index.ts
│       ├── bounds.ts
│       ├── contains.ts
│       ├── polygonMath.ts
│       └── tabbedRect.ts
│
├── hit/                                  picking
│   ├── HitIndex.ts
│   └── PickingIndex.ts
│
├── telemetry/
│   ├── config.ts
│   ├── logging.ts
│   ├── metrics.ts
│   ├── tracing.ts
│   └── withTelemetry.ts
│
├── theme/                                canonical — @invana/canvas re-exports this
│   ├── CanvasThemeState.ts
│   └── types.ts
│
├── renderer/                             the kernel's half of the renderer seam
│   ├── backend.ts                        ← renderer/IRenderer.ts (renamed)
│   └── RendererInitOptions.ts
│
├── geom/
│   └── types.ts                          Point, Rect
│
└── perf/
    └── frame.ts                          FrameTick, FrameStats
```

---

## Changes

| Now | Target | Why |
|---|---|---|
| `actions/createActions.ts` | `view/createActions.ts` | Operates on the view store; has no meaning apart from it |
| `history/createHistory.ts` | `view/createHistory.ts` | Same — undo/redo over the view store's patch stream |
| `renderer/IRenderer.ts` | `renderer/backend.ts` | **The filename lies.** The file declares one thing — `RendererBackend` — and 33 of its 34 lines are a comment explaining that `IRenderer` deliberately lives in `@invana/canvas` instead. A reader greping for the renderer contract lands here and finds a note saying it isn't here |
| `theme/` | unchanged, but becomes **canonical** | See below |
| everything else | unchanged | Each folder already names a real kernel concern |

## The duplicated `theme/`

`canvas-store/src/theme/` and `canvas/src/theme/` both declare `ResolvedTheme`, `ThemeState` and `CanvasThemeState`. They are near-copies, not variants — the kernel's is the fuller one (it adds `ThemeKind` and `ThemeMode`).

| | `canvas-store` | `canvas` |
|---|---|---|
| `types.ts` | 37 lines — adds `ThemeKind`, `ThemeMode` | 48 lines — comments only, no extra types |
| `CanvasThemeState.ts` | 24 lines | 25 lines |
| `theme:change` emit | `emit(…, theme, { kind: 'store', id: 'theme' })` | `emit(…, theme)` — **no source metadata** |

**Keep the kernel's, delete `canvas/src/theme/`, re-export from the root barrel** — the same pattern canvas already uses for events and the store port.

One behavioural difference to carry over deliberately, not by accident: the canvas copy emits `theme:change` without the source descriptor, so anything filtering bus events by source sees kernel-published and engine-published theme changes differently today. Adopting the kernel version makes them uniform — desirable, but it is a change, not a no-op.

## Rules

| # | Rule |
|---|---|
| 1 | One folder per kernel concern, named after the concern |
| 2 | `port/` is the only typed store surface; `adapters/` are interchangeable implementations of it |
| 3 | Zero `@invana` dependencies, and no drawing library — this is the bottom of the graph |
| 4 | A state library (`zustand`, `immer`) may be imported only under `adapters/` — enforced by `scripts/check-renderer-boundary.mjs` |
| 5 | Barrels only for a tsup entry (`src/index.ts`, `src/specs/index.ts`) or a fan-out of ≥3 sibling files |
| 6 | Where a type exists in both the kernel and a package above it, **the kernel's is canonical** and the package above re-exports |
