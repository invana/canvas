# CLAUDE.md — packages/canvas-core (`@invana/canvas-core`)

**The dependency-free floor of the stack.** Everything the rest of the repo
programs against is *defined* here: the visual vocabulary, the renderer
contract, the extension abstracts, and the state-port contract. The store
machinery (`@invana/canvas-store`), the orchestrator (`@invana/canvas`) and the
backends all build **on** this package — never the reverse.

## The one rule that defines this package

> **This package imports nothing.** No workspace package, no third-party
> library — not `@invana/canvas-store`, not `zustand`/`immer`/`rbush`, not a
> drawing library, not even at the type level (immer's `Patch` is redeclared
> structurally in `port/types.ts`).

Enforced by the `core-purity` row of `pnpm check-boundaries`
(`scripts/check-renderer-boundary.mjs`), and checkable by hand:
`grep -rn "from '@invana" packages/canvas-core/src` → 0 hits. If core seems to
need a type from above, the type is in the wrong package — move the contract
down (the pattern behind `CanvasStore`, `Patch`, and `ctx.createStateStore`).

## Who consumes what

| Consumer | Uses |
|---|---|
| A rendering backend (`@invana/renderer-pixijs`, future `renderer-threejs`) | **implements** `contracts/`; reuses `specs/` + `geometry/` + `svg/` verbatim |
| An extension package (`@invana/graph`, `graph-layout-*`, `graph-layer-*`) | **extends** `abstracts/` (`Layer` · `Behaviour` · `Layout`), programs against `CanvasContext`, extends the data primitives (`GraphStore extends ColumnStore`) |
| `@invana/canvas-store` | **implements** the `ReactiveStore` port + the `CanvasStore` interface; instantiates the bus/theme; indexes the spec geometry for picking |
| `@invana/canvas` (the orchestrator) | builds the concrete `CanvasContext` (incl. the `createStateStore` factory), drives `SpecProjector`, ships built-ins + io on top |

## Layout — six folders, one concern each

| Folder | Contents |
|---|---|
| `specs/` | **the visual vocabulary** — shape/connector/decoration/effect/label/badge specs as plain data, `geom.ts` (`Point`/`Vec2`/`Size`/`Rect`/`CameraTransform`), the pure geometry over specs (`shapeGeometry/`), and `SpecStore`. Exposed as the `./specs` subpath; `canvas-store` and `canvas` star-re-export it |
| `state/` | **the state *language*** (the machinery lives in `canvas-store`): `CanvasStore.ts` (the store **interface**), `frame.ts` (`FrameTick`/`FrameStats`), `port/` (the `ReactiveStore` contract incl. structural `Patch` + `select`), `view/` (`CanvasView` + `createActions`), `data/` (`ColumnStore` · `LayerData` · `DirtyBatcher` · flush · `DataSource`), `events/` (bus + emitter classes; instances are store-owned), `theme/` |
| `contracts/` | the renderer seam: `IRenderer`, `ISurface`, `IElementRenderer`, `IOverlayDevice`, `ICameraBinding`, `SpecProjector`, `RendererBackend`, `RendererInitOptions` |
| `abstracts/` | the extension-facing surface — everything reachable via `ctx`: `Layer` / `Behaviour` / `Layout` bases, `CanvasContext` (interface; incl. `createStateStore` — the engine injects the reactive-store factory, since core cannot construct one), `GestureArbiter` + `DefaultGestureArbiter`, `Camera.ts`, `registries/` |
| `lib/` | pure helpers — spec in → path/markup/number out: `geometry/` (connectors + badges), `svg/` (serialisers), `animation/` (`Tween`, easings, `animatePositions`) |
| `headless/` | the reference implementation of `contracts/` — a test double |

## Layer.state — created at mount, not in the constructor

The base `Layer` cannot build a reactive store (the engine is immer-backed and
lives above this package), so `mount(ctx)` creates it via
`ctx.createStateStore(this.createState())` on **first** mount and keeps it
across remounts. Pre-mount access throws. The factory seam is also what makes
the store backend swappable per-canvas (a collaborative canvas injects a
Yjs-backed factory).

## Tests

`tests/` mirrors `src/`. Core tests may not import `@invana/canvas-store`
(dev-dep cycle + purity) — use `tests/helpers/makeContext.ts`: `fakeStateStore`
(minimal port impl) and `fakeCanvasStore` (assembled from core's own classes).

## Barrels + the pinned surface

The specs vocabulary is the **only** `export *` in any barrel (root rule 16), and a name
reaches a barrel by exactly one route — the geometry types (`Point`/`Rect`/…) come via the
specs star, never also explicitly. The public surface of this package (root + `./specs`),
`canvas-store`, and `canvas` is snapshot-pinned in `api/*.surface.txt` by
`pnpm check-api-surface` — adding an export (even through the star) fails `lint` until the
snapshot is regenerated with `--write`.

## Build

`tsup` → ESM + `.d.ts` + sourcemaps. Entries: `src/index.ts` + `src/specs/index.ts`
(the `./specs` subpath). No dependencies of any kind.
