---
id: feat-2026-08-12-canvas-core-depends-on-the-kernel
type: feat
title: Invert the bottom of the stack — canvas-core becomes dependency-free; canvas-store depends on it
status: landed
opened: 2026-08-12
decided: 2026-08-12
landed: 2026-08-12
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/renderer-pixijs, pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-08-12-engine-package-structure }
  - { predicate: relates-to, object: rfc:feat-2026-08-11-canvas-core-structure }
  - { predicate: relates-to, object: doc:docs/canvas-state-plan.md }
---

# canvas-core depends on the kernel — invert it

The 2026-08-12 landing put the kernel at the bottom and `canvas-core` above it. The maintainer's
model is the conventional one: **core is the floor** — types, contracts, abstracts and pure utils
that *everything* (the store included) builds on — and it **depends on nothing**. This RFC moves
the vocabulary and every dependency-free primitive down into `canvas-core`, leaving
`canvas-store` as pure state machinery (the three third-party libs live there and only there).

| | |
|---|---|
| Problem | `pkg:@invana/canvas-core` imports `pkg:@invana/canvas-store` — a package named "core" that is the *second* floor; and the shape/decoration *definitions* sit in the store package, which makes the backend look more authoritative than it is |
| Target | `canvas-core` = **zero dependencies** (workspace or third-party): specs + geometry + contracts + abstracts + events/theme classes + data primitives + port *types*. `canvas-store` = the state **machinery**: immer patch engine + adapters, history/actions, picking (rbush), telemetry wiring, the `CanvasStore` facade — and it depends **on** core |
| Measured constraint | Third-party imports touch exactly **7 kernel files**: `port/{types,patch,store-core}.ts` + `view/createHistory.ts` + `telemetry/withTelemetry.ts` (immer) · `adapters/zustand.ts` (zustand) · `hit/HitIndex.ts` (rbush). Everything else in the kernel is runtime-dependency-free |
| Hard problems | H1 `Layer.state` construction (the base class calls the immer-backed factory) · H2 `CanvasContext.store` / `Camera` are typed against the concrete `CanvasStore` · H3 `port/types.ts` imports immer's `Patch` type |
| Row status | change rows: **landed 12** · design rows: **landed 3** · verification: **pass 8** · decisions: **accepted 4** |

---

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | "core" is not the bottom — it imports the kernel | `pkg:@invana/canvas-core` | `package.json` dependency on `@invana/canvas-store`; every contract/abstract imports kernel types |
| M2 | The visual **vocabulary** (shape/connector/decoration/effect specs) lives in the *store* package | `file:packages/canvas-store/src/specs/` | maintainer: "defining shapes, connectors, badges … is canvas's responsibility; the renderer just renders" — true today in substance, wrong in address |
| M3 | Only 7 kernel files actually need a third-party library | `pkg:@invana/canvas-store` | grep 2026-08-12: immer ×5 (`port/types` · `port/patch` · `port/store-core` · `view/createHistory` · `telemetry/withTelemetry`), zustand ×1 (`adapters/zustand.ts`), rbush ×1 (`hit/HitIndex.ts`) |
| M4 | The "dep-free" memory store is **not** immer-free | `file:packages/canvas-store/src/port/createMemoryStore.ts` | it calls `createStoreFromCell` → `patch.ts` → `produceWithPatches` (immer, runtime). Only zustand-free. So no store *factory* can live in a dep-free core — this forces H1's injection design |

## 2 Design

```
@invana/canvas-core    THE FLOOR — depends on NOTHING (no workspace, no third-party):
   ▲                   geom · frame · specs (vocabulary + shapeGeometry + SpecStore) ·
   │                   events (EventEmitter/SourceEmitter/CanvasEvent/CanvasEventBus) ·
   │                   theme · data primitives (ColumnStore/LayerData/DirtyBatcher/flush) ·
   │                   port TYPES (ReactiveStore interface, structural Patch) + select ·
   │                   contracts (IRenderer/…/SpecProjector/RendererBackend) ·
   │                   abstracts (Layer/Behaviour/Layout/CanvasContext/GestureArbiter) ·
   │                   Camera · registries · geometry/{connectors,badges} · animation ·
   │                   svg · headless
   │
@invana/canvas-store   STATE MACHINERY (deps: zustand, immer, rbush; workspace dep: canvas-core):
   ▲                   port engine (patch.ts, store-core.ts, createMemoryStore) ·
   │                   adapters/zustand.ts · view/ (CanvasView? → D-3, createActions,
   │                   createHistory) · hit/ (rbush picking) · telemetry/ ·
   │                   CanvasStore facade (instantiates the bus, owns view/data/events)
   │
@invana/canvas         orchestrator (unchanged shape; deps: canvas-core, canvas-store)
   ▲
   ├── renderer-pixijs · graph · graph-layout-* · graph-layer-* (unchanged; import via @invana/canvas)
```

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | **Partition rule:** a module moves to core iff it is runtime-dependency-free AND is vocabulary, contract, abstract, pure function, or a primitive an abstract constructs | M3 | `SourceEmitter` + `DirtyBatcher` (constructed by `sym:Layer`), `EventEmitter` (constructed by `sym:Layout`) must move; the immer/zustand/rbush 7 must stay |
| G2 | Class *definition* location ≠ runtime *ownership* | `sym:CanvasStore` still instantiates the bus and owns `{view, data, events}` | "the store owns events" (doc:docs/canvas-state-plan.md) survives — the bus class is core vocabulary, its instance is store-owned |
| G3 | The bus's typed event map references `SpecFlush` / `LayerFlush` / `FrameTick` / `ResolvedTheme` | `file:packages/canvas-store/src/events/CanvasEventBus.ts#L1-L4` | moving the bus drags `SpecStore`, `LayerData` (+`ColumnStore`, `flush`), `frame`, `theme` — all dep-free, all listed in the move table |
| G4 | Consumers keep importing from `@invana/canvas` | root barrel already re-exports everything | zero import changes outside the four packages; `pkg:@invana/graph`'s `GraphStore extends ColumnStore` unaffected |
| G5 | Core's dep-freedom becomes **enforced**, not prose | `file:scripts/check-renderer-boundary.mjs` | new boundary row: `@invana/canvas-store` (and zustand/immer/rbush) may not be imported under `packages/canvas-core/src` (X2) |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-08-12-engine-package-structure` | relates-to (this amends its layering) | landed | Everything except the direction of the core↔store edge; the four-package shape, the canvas/pixi trees, the `./specs` deletion all stand |
| `doc:docs/canvas-state-plan.md` | relates-to | design of record | `CanvasStore { view, data, events }` ownership unchanged (G2); "storage physics internal to each member" unchanged |
| `doc:docs/reactive-state-store-plan.md` | relates-to | design of record | The `ReactiveStore` port contract unchanged; only the *type's address* moves |

## 4 The change

### 4.1 Moves (kernel → core)

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| M-1 | move | **landed** | `canvas-store/src/{geom,frame}.ts` → `canvas-core/src/` | root vocabulary files | `Point`/`Rect`/`FrameTick` defined on the floor | low | — |
| M-2 | move | **landed** | `canvas-store/src/specs/` (whole tree incl. `shapeGeometry/`, `SpecStore.ts`) → `canvas-core/src/specs/` | **the vocabulary moves to core** — resolves M2 | shape/connector/decoration/effect definitions live where the maintainer expects them | medium — `@invana/canvas-store/specs` subpath (D-2) + kernel tests move | M-1, M-4 |
| M-3 | move | **landed** | `canvas-store/src/events/` (4 files) → `canvas-core/src/events/` | bus + emitters are dep-free classes | `ctx.events` typed core-natively; H2 shrinks | medium — G3 type web | M-1, M-2, M-4, M-5 |
| M-4 | move | **landed** | `canvas-store/src/data/{ColumnStore,LayerData,DirtyBatcher,flush,DataSource}.ts` → `canvas-core/src/data/` | dep-free data primitives (typed-array container, record model, batcher, flush scheduler, source contract) | `Layer` constructs `DirtyBatcher` from its own package; `GraphStore extends ColumnStore` unaffected via root re-export | medium — conceptually "data" now spans two packages (primitive vs machinery) | — |
| M-5 | move | **landed** | `canvas-store/src/theme/` → `canvas-core/src/theme/` | dep-free signal class + types | context's `ThemeState` core-native | low | M-3 (bus type) |
| M-6 | move | **landed** | `canvas-store/src/renderer/{backend,RendererInitOptions}.ts` → `canvas-core/src/contracts/` | the kernel's half of the renderer seam joins the other half | one `contracts/` folder holds the whole seam; store's `renderer/` folder dies | low | — |
| M-7 | move | **landed** | `canvas-store/src/port/types.ts` (as interfaces) + `port/select.ts` → `canvas-core/src/port/` | the `ReactiveStore` **contract** moves; `select` is pure | abstracts/Camera type against core | medium — H3 (`Patch` type) | H3 |
| M-8 | none | **landed** | stays in store: `port/{patch,store-core,createMemoryStore}.ts`, `adapters/zustand.ts`, `view/{createActions,createHistory}.ts`, `hit/`, `telemetry/`, `CanvasStore.ts` | the machinery floor | canvas-store = "implementations of core's port + state services" | low | — |

### 4.2 Design rows (the hard problems)

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| H1 | design | **landed** | `sym:Layer` (`canvas-core/src/abstracts/Layer.ts`) | **state creation moves out of the constructor.** The base class currently calls `createReactiveStore` (immer-backed, M4 — cannot live in core). Recommended: `CanvasContext` gains `createStateStore<T>(initial: T): ReactiveStore<T>` (implemented by `Canvas` with the kernel factory); `Layer.state` becomes a lazily-bound readonly created in `mount()`, with a pre-mount access throw. Alternative: `LayerOptions.state?: ReactiveStore<T>` injection with mount-time default | layers stay patch-emitting through the same port; the Yjs backend swap gets *easier* (the factory is already injected) | **high — behavioural**: any pre-mount `this.state` access breaks. Audit (V6) found none in the built-ins; domain layers (`sym:GraphLayer`) must be audited before landing | M-7 |
| H2 | design | **landed** | `canvas-core/src/abstracts/CanvasContext.ts`, `canvas-core/src/Camera.ts` | both are typed against the concrete `sym:CanvasStore`. Core defines a **structural `ICanvasStore`** (only the members context consumers + Camera actually use: `view: ReactiveStore<CanvasView>` · `events: CanvasEventBus` · `data` registry surface · `history`); store's `CanvasStore` implements it. Requires `CanvasView`'s *type* to be reachable from core → D-3 | the facade stays in store; core holds its shape | medium — public type surface | M-3, M-7, D-3 |
| H3 | design | **landed** | `canvas-core/src/port/types.ts` | `StoreChange` references immer's `Patch` **type**. Core declares a structural `Patch` (`{ op; path; value }` — immer's is structurally identical), so core has zero deps even at the type level; store's engine keeps using immer's and they unify structurally | `ReactiveStore` contract is genuinely dependency-free | low — types only, structurally compatible; verified by `tsc` across both packages | — |

### 4.3 Cross-cutting

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| X1 | sweep | **landed** | `canvas-store` internals + tests | repoint moved-module imports to `@invana/canvas-core`; move the tests that cover moved modules (`events/`, `specs/`, `theme/`, `data/` primitives) to `canvas-core/tests/` | tests live with their code | medium — large mechanical sweep | M-1…M-7 |
| X2 | pin | **landed** | `file:scripts/check-renderer-boundary.mjs` + ESLint mirror | new boundary row: nothing under `packages/canvas-core/src` may import `@invana/canvas-store`, `zustand`, `immer`, or `rbush` | "core depends on nothing" is build-enforced | low | — |
| X3 | build | **landed** | both `package.json`s + tsup configs | core loses its `@invana/canvas-store` dependency (gains none); store gains `@invana/canvas-store` → `@invana/canvas-core` (normal dep); `exports` per D-2 | the inverted edge is real | low | D-2 |
| X4 | docs | **landed** | root `CLAUDE.md`, both package `CLAUDE.md`s, `doc:docs/canvas-state-plan.md` pointer notes, memory | layering diagrams + "kernel" language: canvas-store is no longer the bottom — core is | docs match the floor | low | all |

## 5 Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| B1 | `pkg:@invana/canvas` | package | imports everything from the two packages it already depends on; barrel re-export sources change addresses | X1-style repoint inside the barrel only |
| B2 | `pkg:@invana/graph` (incl. `GraphStore extends ColumnStore`), `graph-layout-*`, `graph-layer-*`, `canvas-react`, `canvas-ui` | packages | import via `@invana/canvas` / `@invana/canvas-store` roots — both keep re-exporting | none, unless D-2 removes the store's `./specs` subpath |
| B3 | `pkg:@invana/renderer-pixijs` | package | via `@invana/canvas` root | none |
| B4 | `@invana/canvas-store/specs` subpath | published API | the definition site moves to core | D-2: re-export shim vs deletion |
| B5 | Every `Layer` subclass (built-ins + graph + layer packages) | classes | H1 changes *when* `state` exists | audit + compile (V6); behaviour-preserving for post-mount users |
| B6 | Serialised state / bus events | contract | none — no runtime renames; class identities preserved | — |
| B7 | Kernel test suite (168 tests) | tests | ~half cover moving modules | X1 relocation |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm check-boundaries` | repo | pass, incl. the new X2 row | X2, M-* |
| V2 | **pass** | `grep -rn "@invana/canvas-store\|from 'zustand\|from 'immer\|from 'rbush'" packages/canvas-core/src` | core | **0 hits** — the RFC's headline invariant | all |
| V3 | **pass** | `pnpm build` + `pnpm check-types` | repo | pass | all |
| V4 | **pass** | full vitest (canvas-core / canvas / canvas-store) | repo | ≥256 tests pass after relocation | X1, H1 |
| V5 | **pass** | Storybook live smoke (same 5-story set as the previous RFC, incl. GraphVisualiser) — **control** | app | renders, zero console errors | all |
| V6 | **pass** | pre-mount `this.state` access audit across every `Layer` subclass in the repo | graph + built-ins + layer packages | zero sites, or each one migrated | H1 |
| V7 | **pass** | `tsc` structural-`Patch` unification (a `StoreChange` from the store engine assigns to core's type) | types | pass | H3 |
| V8 | **pass** | published-surface diff of `@invana/canvas` root exports before/after | API | identical names | B1, B2 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | How far down does the data lane go? | primitives only (`ColumnStore`/`LayerData`/`DirtyBatcher`/`flush` → core, per G1/G3) / keep all data in store and type the bus loosely | primitives to core — the bus's event map needs their types, and they're dep-free containers, not state services | **accepted** |
| D-2 | `@invana/canvas-store/specs` subpath after M-2 | keep as re-export shim from core / delete (consumers: the `@invana/canvas` barrel; audit externals) / move subpath to `@invana/canvas-core/specs` | delete, same 0.0.x-pins-exactly argument as the previous RFC — but audit first | **accepted** |
| D-3 | Where does the `CanvasView` *type* live? | stays in store (H2 goes generic) / type+defaults move to core (`view` machinery `createActions`/`createHistory` stays in store) | move type+defaults to core — H2's `ICanvasStore` then types `view: ReactiveStore<CanvasView>` precisely | **accepted** |
| D-4 | H1 injection shape | `ctx.createStateStore` factory + mount-time binding / `LayerOptions.state` / static default factory | `ctx.createStateStore` — no consumer-facing option, no global, and it pre-wires the Yjs swap | **accepted** |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-12 | Opened after the engine-package-structure landing, from maintainer review: "core should not depend on anything; defining shapes/connectors/badges is canvas's responsibility" | proposed | Dep-audit measured: exactly 7 kernel files touch a third-party lib; `port/types.ts` immer coupling (H3) and the non-immer-free memory store (M4→H1) identified before design |
| 2026-08-12 | **Implemented in full** — all M/H/X rows landed, D-1..D-4 accepted as recommended | **landed** | Implementation notes vs the plan: **(a)** H2 simplified — `CanvasStore` was *already an interface* (the factory builds an object literal), so the whole interface moved to `core/CanvasStore.ts` verbatim; no structural subset needed. **(b)** D-3 extended: `createActions` proved dep-free (it programs against core types only), so the *entire* named-command API moved to `core/view/` beside `CanvasView` — `CanvasActions` types with it; `createHistory` (immer) went to the store's `port/`. **(c)** Core gained a `./specs` subpath (tsup entry) so the store and canvas barrels can star-re-export the vocabulary without dragging the rest of core's surface; the store's `./specs` subpath died with the folder (D-2 — its only importer was the canvas barrel). **(d)** X2 landed as a `core-purity` BOUNDARIES row (allowlist model → the other package roots enumerated) restricting `@invana/canvas-store`, `@invana/canvas` *and* `rbush` under `packages/canvas-core/src`. **(e)** Core's tests got dep-free doubles (`tests/helpers/makeContext.ts`: `fakeStateStore` + `fakeCanvasStore` assembled from core's own classes) — a core test may not import the store (dev-dep cycle). Verified: build 20/20 · check-types 19/19 · boundaries (incl. core-purity) · V2 grep = 0 · tests 258 (core 136 / store 91 / canvas 31) · Storybook live smoke incl. GraphVisualiser end-to-end. **Verification incident worth recording:** the first App smoke ran in a *background* Chrome tab where `requestAnimationFrame` is suspended — the frame-flush pipeline froze (specs stuck at origin while the d3 sim, which is not rAF-bound, completed in the store) and mimicked a regression; a foreground tab showed everything correct. Pre-existing behaviour, unchanged by this RFC — but a trap for any future automated smoke: **test in a visible tab** |
