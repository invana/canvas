---
id: fix-2026-08-10-zustand-imported-outside-canvas-store
type: fix
title: zustand and immer are imported outside the kernel, so layer state escapes the ReactiveStore port
status: landed
opened: 2026-08-10
decided: 2026-08-11
landed: 2026-08-11
packages: [pkg:@invana/canvas, pkg:@invana/canvas-store, pkg:@invana/graph, pkg:@invana/graph-layer-maplibre, pkg:@repo/eslint-config]
design_of_record: doc:docs/canvas-state-plan.md
relations:
  - { predicate: depends-on,   object: doc:docs/canvas-state-plan.md }
  - { predicate: relates-to,   object: doc:docs/reactive-state-store-plan.md }
  - { predicate: caused-by,    object: file:packages/canvas/src/state/Store.ts#L50-L54 }
  - { predicate: manifests-in, object: file:packages/canvas/src/layers/Layer.ts#L156 }
  - { predicate: manifests-in, object: file:packages/graph/src/layer/GraphLegendLayer.ts#L402 }
  - { predicate: manifests-in, object: file:packages/graph-layer-maplibre/src/MapLayer.ts#L251 }
---

# zustand and immer are imported outside the kernel, so layer state escapes the `ReactiveStore` port

| Field | Value |
|---|---|
| **What breaks** | Per-layer state (`layer.state`) is a second, parallel state system — invisible to history, telemetry, and any future Yjs backend |
| **Root cause** | `sym:createLayerStore` in `file:packages/canvas/src/state/Store.ts` builds a raw zustand store instead of going through `sym:ReactiveStore`; `pkg:@invana/canvas` therefore carries its own `zustand` + `immer` deps |
| **Blocked promise** | Root `CLAUDE.md` kernel section: *"No `import … from 'zustand'` outside that adapter — so the backend stays swappable"* |
| **Design owner** | `doc:docs/canvas-state-plan.md` §12 **D2** already decided this — *"supersede `Store.ts`/`createLayerStore` with the port + zustand adapter"*. This RFC scopes the **landing**, not the design |
| **Migration state** | Canvas-store migration M0–M4 landed; D1 landed (`ColumnStore`/`DirtyBatcher` relocated). **D2 is the one unlanded decision** — `file:packages/canvas/src/state/` contains nothing but `Store.ts` |
| **Goal** | `pkg:@invana/canvas` carries **no third-party dependency** — `dependencies` reduces to `@invana/canvas-store` alone |
| **Defect rows** | F1 – F8 (zustand + immer) · F13 – F21 (rbush, via relocation) |
| **Dressing rows** | none |
| **Enforcement rows** | F9 – F10 |
| **Docs rows** | F11 – F12, F22 |
| **Row status** | `landed` 22 · `proposed` 0 · `rejected` 0 — all checks V1–V15 `pass` |
| **Open decisions** | none — D1–D9 all accepted 2026-08-11 (D5 deferred to its own RFC) |
| **Outcome** | `file:packages/canvas/package.json` `dependencies` = `@invana/canvas-store`, and nothing else. Repo-wide, `zustand` / `immer` / `rbush` are imported only inside `pkg:@invana/canvas-store` (plus `pkg:@invana/graph`'s own long-standing `rbush` for `sym:LabelCollisionBehaviour`) |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | `pkg:@invana/canvas` declares `zustand` and `immer` as its own runtime dependencies | `file:packages/canvas/package.json#L36-L38` | User question, 2026-08-10 |
| S2 | Exactly one file in the package needs them | `file:packages/canvas/src/state/Store.ts#L50-L54` | `grep -rn "from 'zustand" packages/canvas/src` → 4 hits, all in that file |
| S3 | Two zustand importers exist repo-wide; the kernel rule permits one | `file:packages/canvas-store/src/adapters/zustand/createReactiveStore.ts#L1`, `file:packages/canvas/src/state/Store.ts#L50` | `grep -rn "from 'zustand" packages apps` |
| S4 | Layer state mutations produce no patches, so they reach neither history nor telemetry | `file:packages/graph/src/layer/GraphLegendLayer.ts#L402` | `sym:createHistory` and `sym:withTelemetry` both hang off `sym:ReactiveStore.subscribeChanges`, which raw zustand does not implement |
| S5 | `file:packages/canvas/src/state/` holds one file — the relocation D1 promised is otherwise complete | `ls packages/canvas/src/state` → `Store.ts` | The directory only still exists because of this defect |

### 1.1 Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | zustand leaked into other packages too (canvas-react, canvas-ui, graph) | **False** | `grep -rn "zustand" --include=package.json packages apps` → only `pkg:@invana/canvas-store` and `pkg:@invana/canvas` |
| R2 | `layer.state` is widely used, so the migration is large | **False** | Two production call sites total: `sym:GraphLegendLayer` (6) and `sym:MapLayer` (1). `sym:DragShapeBehaviour`'s `state` is a plain private field, not a store |
| R3 | The selector-`subscribe` overload (`subscribeWithSelector`) is load-bearing | **False** | `grep -rn "state\.subscribe(" packages apps` → zero hits. Nothing subscribes to a layer store at all |
| R4 | `sym:GraphLayer` / `sym:MiniMapLayer` keep hot per-frame state in `layer.state` | **False** | Both override `createState()` but never call `setState`; their state objects are stubs. No machine-rate writer exists |
| R5 | The port cannot draft `Set` / `Map`, which layer states use | **False** | `file:packages/canvas-store/src/port/patch.ts#L7` already calls `enableMapSet()` and `enablePatches()` |
| R6 | `T extends object` on `sym:createReactiveStore` is tighter than `Layer`'s generic | **False** | `file:packages/canvas/src/layers/Layer.ts#L80` declares `TState extends object = object` — identical constraint |
| R7 | `rbush` is also a kernel dep that leaked into `pkg:@invana/canvas` | **False** | It backs `sym:HitIndex` (`file:packages/canvas/src/hit/HitIndex.ts#L18`) → `sym:PickingIndex`, which imports `sym:boundsOfSpec` / `sym:containsSpec` from `file:packages/canvas/src/specs/shapeGeometry.ts`. `pkg:@invana/canvas-store` has no spatial index and no spec geometry. See §7 D6 |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `sym:createLayerStore` predates `pkg:@invana/canvas-store`; it composes its own stack `devtools → subscribeWithSelector → immer` | `file:packages/canvas/src/state/Store.ts#L167-L175` | The package acquires `zustand` + `immer` as direct deps |
| 2 | The base `Layer` constructor calls it unconditionally, once per layer | `file:packages/canvas/src/layers/Layer.ts#L156` | **Every** layer in the engine gets a raw zustand store, whether it uses one or not |
| 3 | The kernel landed later with `sym:ReactiveStore` as *the* state contract, and `sym:createReactiveStore` as the single sanctioned zustand importer | `file:packages/canvas-store/src/adapters/zustand/createReactiveStore.ts#L6-L11` | Two state systems now coexist; only one is behind the port |
| 4 | `sym:ReactiveStore.subscribeChanges` emits `{action, patches, inverse}` — the seam `sym:createHistory`, `sym:withTelemetry` and a future Yjs adapter all consume | `file:packages/canvas-store/src/port/types.ts#L30-L45` | State that does not flow through the port is structurally invisible to all three |
| 5 | ⇒ A legend type-toggle mutates real, user-visible state that cannot be undone, traced, or replicated | S4, `file:packages/graph/src/layer/GraphLegendLayer.ts#L565` | The defect |

### 2.1 Why this drifted silently

| Factor | State today | Contribution |
|---|---|---|
| The rule is prose-only | Root `CLAUDE.md` states it; nothing checks it | No signal at commit time |
| `pnpm check-boundaries` scope | `file:scripts/check-renderer-boundary.mjs#L28` gates **drawing** libraries only (`pixi.js`, `pixi-viewport`, `three`) | The one gate that could catch it does not look for zustand |
| ESLint `no-restricted-imports` scope | `file:packages/eslint-config/base.js#L45-L62` lists the same three drawing libs | Editor is silent too |
| Migration sequencing | `doc:docs/canvas-state-plan.md` §10.3 rated the row *"Low — one zustand wrapper, not two"* | Correctly scoped as low-risk, then never picked up |

**Conclusion:** one defect with an enforcement gap behind it. Landing F1–F8 without F9–F10 fixes today's instance and leaves tomorrow's unguarded.

### 2.2 Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep -rn "from 'zustand" packages apps --include=*.ts` | 5 hits: 1 in the adapter, 4 in `file:packages/canvas/src/state/Store.ts` | The violation is exactly one file, no hidden second front |
| T2 | `grep -rn "\.state\.setState(\|\.state\.getState()" packages apps` | 12 hits: 7 production (2 files), 5 test | The migration surface is small and fully enumerable |
| T3 | `grep -rn "state\.subscribe(" packages apps` | 0 hits | The only zustand feature without a port equivalent is unused |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/canvas-state-plan.md` §12 **D2** | `depends-on` | Decided, unlanded | The whole decision — *supersede `Store.ts`/`createLayerStore` with the port + zustand adapter*. This RFC adds only the call-site inventory and the gate |
| `doc:docs/canvas-state-plan.md` §10.3 | `relates-to` | Landed except this row | The blast-radius row *"`state/Store.ts` → superseded by port + zustand adapter · replace · Low"* |
| `doc:docs/reactive-state-store-plan.md` §38 | `relates-to` | Superseded by the kernel | Names `createLayerStore` as the pre-port state of the world |
| `doc:docs/renderer-split-design.md` | `relates-to` | Landed | The **enforcement pattern** F9/F10 copy: script gate + ESLint rule, one invariant, two mechanisms |
| `doc:docs/collaborative-state-plan.md` | `blocked-by` this | Deferred | Yjs swap can only be complete once every store is behind the port |

## 4. The fix

Ordered so a partial landing still makes sense: F1–F5 are the migration, F6–F8 the cleanup, F9–F10 the gate, F11–F12 the docs.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/canvas/src/layers/Layer.ts#L33,L98,L156` | `readonly state: ReactiveStore<TState>`, built by `sym:createReactiveStore` from `pkg:@invana/canvas-store` | Every layer store is behind the port; patches flow to history + telemetry | **Med** — touches the base class every layer inherits | — |
| F2 | defect | landed | `file:packages/graph/src/layer/GraphLegendLayer.ts#L402,L473,L481,L565` | `state.setState(r)` → `state.update(r, '<action>')`; `getState()` unchanged at `#L527,L533` | Legend toggles become named, traceable actions | Low | F1 |
| F3 | defect | landed | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L251` | Same rewrite, one call site | — | Low | F1 |
| F4 | defect | landed | `file:packages/canvas/tests/layers/Layer.test.ts#L55`, `file:packages/canvas/tests/engine/Canvas.smoke.test.ts#L51,L58,L333` | Same rewrite in the fixtures | Headless coverage keeps passing | Low | F1 |
| F5 | defect | landed | `file:packages/canvas/src/index.ts#L130-L131` | Drop `createLayerStore`, `Store`, `StoreApi`, `CreateLayerStoreOptions`; re-export `type ReactiveStore` from the kernel instead (mirrors the existing kernel re-export blocks at `#L24,L41,L154`) | Consumers see one state type, not two | **Med** — public API removal, see §5 D-rows | F1 |
| F6 | defect | landed | `file:packages/canvas/src/state/Store.ts` | Delete. The directory `file:packages/canvas/src/state/` goes with it | D1 + D2 both complete: `pkg:@invana/canvas` owns no state module at all | Low | F1–F5 |
| F7 | defect | landed | `file:packages/canvas/tests/state/Store.test.ts` | Delete — coverage is superseded by `file:packages/canvas-store/tests/store-parity.test.ts` and `file:packages/canvas-store/tests/port/` | No orphaned test of a deleted module | Low | F6 |
| F8 | defect | landed | `file:packages/canvas/package.json#L36,L38` | Remove `zustand` and `immer` from `dependencies` | `pkg:@invana/canvas` deps reduce to `@invana/canvas-store` + `rbush` | **Med** — depends on D2 (immer type resolution) | F6 |
| F9 | enforcement | landed | `file:scripts/check-renderer-boundary.mjs` | Generalise from one hard-coded drawing-lib list to a boundary table; add `zustand` (+ `immer`) allowed only under `packages/canvas-store/src/adapters/zustand/` and `packages/canvas-store/src/port|history|telemetry/` | The kernel rule becomes a build gate, not prose | Low | F8 |
| F10 | enforcement | landed | `file:packages/eslint-config/base.js#L45-L62` | Add `zustand` to `no-restricted-imports` with the "program against `ReactiveStore`" message | Editor-time signal, matching the drawing-lib pattern (`only-warn` means it cannot gate — F9 does that) | Low | — |
| F11 | docs | landed | `doc:docs/canvas-state-plan.md` §10.1, §10.3, §12 D2 | Mark D2 landed; correct §10.1's "zustand" row | The plan stops describing a world that no longer exists | Low | F6 |
| F12 | docs | landed | `doc:docs/canvas-engine-types.md#L717`, `doc:docs/architecture-proposal.md#L326`, `file:packages/canvas/src/layers/Layer.ts#L9`, `file:packages/canvas/CLAUDE.md` | Replace `createLayerStore` / `layer.state.set(...)` / "zustand+immer" references with the port vocabulary | Docs and TSDoc describe `update()`, not `setState()` | Low | F1 |

### 4.2 The `rbush` relocation (D6 option (b), chosen 2026-08-11)

Independent of F1–F12 — either half can land alone.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F13 | defect | landed | `file:packages/canvas/src/specs/` → `file:packages/canvas-store/src/specs/` | Move 13 files + `shapeGeometry/` (2353 lines) beside the existing `sym:SpecStore` | The spec vocabulary joins the kernel | **Med** — large move, but §4.3 shows it is import-clean | — |
| F14 | defect | landed | `file:packages/canvas-store/src/geom/types.ts` + relocated `specs/geometry.ts` | Resolve the duplicate `Point`/`Vec2`/`Rect` (see §4.4). `geom/types.ts` becomes the single definition and adopts canvas's `readonly` fields; `specs/geometry.ts` re-exports them and keeps `Endpoint`/`Polyline`/`Path`/`IRouter`/`IPathStyle`/`Obstacle` | Kernel exports one `Rect`, not two — otherwise `index.ts` has a duplicate-export collision | **Med** — `readonly` is a real type-surface change; nothing in the kernel mutates a `Rect` in place (verified), so it is additive-strict | F13 |
| F15 | defect | landed | relocated `specs/elementEvents.ts#L11` | `import type { EventMap } from '@invana/canvas-store'` → relative `../events/EventEmitter` | Removes the only outward import `specs/` has | Low | F13 |
| F16 | defect | landed | `file:packages/canvas/src/hit/` → `file:packages/canvas-store/src/hit/` | Move `HitIndex.ts` + `PickingIndex.ts` (859 lines); add `rbush` + `@types/rbush` to `file:packages/canvas-store/package.json` | The kernel owns the picking index and its dep | **Med** — inverts design D5; see §5 U4 | F13 |
| F17 | defect | landed | `file:packages/canvas-store/src/index.ts` | Export the relocated `specs/` and `hit/` surfaces | Kernel entrypoint carries them | Low | F13, F16 |
| F18 | defect | landed | `file:packages/canvas/src/index.ts#L80-L88`, new `file:packages/canvas/src/specs/index.ts` barrel | Re-export `sym:PickingIndex`, `sym:connectorHitBoxes`, and the whole spec surface from the kernel — **including a barrel that keeps the `./specs` subpath alive** (`file:packages/canvas/package.json#L14-L18` maps it to `./dist/specs/index.js`) | All 586 downstream `@invana/canvas` import lines keep resolving; `@invana/canvas/specs` keeps resolving | **Med** — the subpath export is the easy thing to miss | F17 |
| F19 | defect | landed | `file:packages/canvas/package.json#L37,L43` | Remove `rbush` and `@types/rbush` | **End state: `pkg:@invana/canvas` has one dependency, `@invana/canvas-store`** | Low | F16, F18 |
| F20 | defect | landed | `file:packages/canvas/tests/hit/PickingIndex.test.ts` → `file:packages/canvas-store/tests/hit/` | Move with the code; retarget the relative imports | Coverage follows its subject | Low | F16 |
| F21 | defect | landed | `file:packages/canvas-store/src/specs/SpecStore.ts#L10-L14` | Correct the TSDoc — it currently justifies `SpecStore<T>`'s generic with *"the spec vocabulary lives in `@invana/canvas` … the kernel has zero `@invana` dependencies"*, which F13 makes false | The kernel stops documenting a rationale it no longer has. See §7 D8 on whether to also *type* it | Low | F13 |
| F22 | docs | landed | root `CLAUDE.md` (workspace table + layering), `file:packages/canvas/CLAUDE.md` ("What lives here"), `doc:docs/renderer-split-design.md` | Move `specs/` + `hit/` from canvas's row to canvas-store's; restate design **D5** | The layering docs describe the code | Low | F13, F16 |

### 4.3 Why the move is import-clean

The scope risk was `specs/` dragging half the engine with it. It does not:

| Source | Outward imports (outside its own folder) | Consequence |
|---|---|---|
| `file:packages/canvas/src/specs/` (13 files) | **One** — `specs/elementEvents.ts#L11` → `EventMap` from `pkg:@invana/canvas-store` | Already points *at* the kernel; becomes a relative import (F15) |
| `file:packages/canvas/src/hit/` (2 files) | `rbush`, and 5 type/function imports from `../specs/` | Self-contained once `specs/` moves with it |
| `sym:HitIndex` → rbush API used | `insert` · `remove` · `search` · `clear` · `load` | Nothing exotic; the dep transfers as-is |

### 4.4 The name collision F14 resolves

| Type | `file:packages/canvas/src/specs/geometry.ts` | `file:packages/canvas-store/src/geom/types.ts` | Resolution |
|---|---|---|---|
| `Point`, `Vec2` | `readonly x/y` | mutable `x/y` | Single definition in `geom/types.ts`, adopting `readonly` |
| `Rect` | `readonly x/y/width/height` | mutable | Same |
| `Size`, `CameraTransform` | — | only here | Unchanged |
| `Endpoint`, `Polyline`, `Path`, `PathCommand`, `RouterCtx`, `Obstacle`, `IRouter`, `IPathStyle`, `connectorGeometryKey` | only here | — | Stay in the relocated `specs/geometry.ts` |

Without F14 the kernel's `index.ts` exports `Rect` twice (`geom/types` at `#L30` and `specs/*`) and fails to compile. Only `file:packages/canvas-store/src/view/CanvasView.ts#L1` consumes the kernel's `Rect` today, and no kernel code mutates one in place — so adopting `readonly` is safe.

### 4.1 The API delta, in full

| Before (`sym:Store`) | After (`sym:ReactiveStore`) | Call sites |
|---|---|---|
| `state.setState((s) => { … })` | `state.update((s) => { … }, 'action-name')` | 7 production, 5 test |
| `state.getState()` | `state.getState()` — unchanged | 2 production, 2 test |
| `state.subscribe(sel, fn, opts)` | `state.subscribe((s, prev) => …)` / `sym:select` | **0** — unused |
| — | `state.subscribeChanges`, `state.batch` | new capability |
| `createLayerStore(init, {name, enableDevtools})` | `createReactiveStore(init)` | 1 (`Layer.ts`) |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:createStoreFromCell` (`file:packages/canvas-store/src/port/store-core.ts`) | Becomes the write path for every layer store, not just `view` | Any bug here now surfaces in layers too — mitigated by `file:packages/canvas-store/tests/store-parity.test.ts` |
| U2 | `sym:createReactiveStore` runs `produceWithPatches` per update | Costlier than plain immer `produce` | Only matters if a layer ever writes at machine rate — R4 confirms none does today. See §7 D5 |
| U3 | `immer`'s `Patch` type in the kernel's public `.d.ts` (`file:packages/canvas-store/src/port/types.ts#L1`) | `pkg:@invana/canvas` must still *resolve* immer types after F8 drops the dep | pnpm's isolated store resolves it via the kernel's own `node_modules`; V5 proves it. Fallback: keep `immer` in `devDependencies` only |
| U4 | Design **D5** — *"picking is interaction, not drawing"* (`file:packages/canvas/src/renderer/IRenderer.ts#L41`, `file:packages/canvas/CLAUDE.md`) | F16 relocates picking into the kernel, which the design places in the engine | The decision is **overridden, not deleted** — F22 restates D5 in its new location so the reasoning survives the move |
| U5 | The kernel's stated identity — *"renderer-free … zero `@invana` deps, imports no drawing library"* | Specs are drawing *concepts*; they import no drawing *library*, so the hard rule holds. But the kernel grows from state+events to state+events+vocabulary+picking | `pnpm check-boundaries` stays green (V13). The doctrinal shift is F22's job to record |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `sym:GraphLegendLayer` (`pkg:@invana/graph`) | source | 6 call sites rewritten | F2 |
| D-2 | `sym:MapLayer` (`pkg:@invana/graph-layer-maplibre`) | source | 1 call site rewritten | F3 |
| D-3 | Every `Layer` subclass overriding `createState()` — `sym:GraphLayer`, `sym:MiniMapLayer`, `sym:BackgroundLayer`, `sym:DevInfoLayer`, `sym:LayersPanelLayer`, `sym:DensityContourLayerBase`, `sym:BubbleSetsLayer` | source | **None** — `createState()` is unchanged; only the container type changes | none |
| D-4 | `story:canvas/concepts/Connectors/Routers/OneSide`, `story:canvas/concepts/Connectors/Routers/Manhattan` | story | Inline layers implement `createState()` only | none |
| D-5 | Published API of `pkg:@invana/canvas` | **breaking** | `createLayerStore`, `Store`, `StoreApi`, `CreateLayerStoreOptions` disappear from the entrypoint | F5 + D3 decision |
| D-6 | Redux DevTools | **regression** | Per-layer stores stop appearing (named `<Class>:<id>`) | D1 decision |
| D-7 | `pkg:@invana/canvas-react`, `pkg:@invana/canvas-ui`, `apps/storybook` | consumer | **None** — `grep` finds no `layer.state` usage in any of them | none |
| D-8 | Serialised state | none | `layer.state` was never persisted; `sym:CanvasView` is untouched | none |
| D-9 | `doc:docs/collaborative-state-plan.md` (Yjs, deferred) | doc | Unblocked — after this, *every* store is port-backed and swaps with one adapter change | F11 |
| D-10 | `pkg:@invana/renderer-pixijs` | **source** | Imports ~30 symbols from `pkg:@invana/canvas` on one line (`file:packages/renderer-pixijs/src/PrimitivesRenderer.ts#L35`), constructs `sym:PickingIndex` at `#L358` | **None** if F18's re-exports are complete — that is exactly what V11 checks |
| D-11 | `@invana/canvas/specs` subpath (`file:packages/canvas/package.json#L14-L18`) | **published API** | Maps to `./dist/specs/index.js`; the directory it points at is being moved | F18's barrel must keep it resolving — V10 |
| D-12 | `pkg:@invana/graph`, `pkg:@invana/graph-layer-*` | consumer | Import spec types from `pkg:@invana/canvas` | **None** via F18 re-exports; they never referenced `hit/` or rbush directly except `sym:LabelCollisionBehaviour`'s own rbush dep, which is untouched |
| D-13 | `pkg:@invana/canvas-store` bundle size | consumer | Gains 3212 lines + `rbush` | Every kernel consumer now pulls the spec vocabulary, including `pkg:@invana/canvas-react` which has no use for it |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` | workspace | green | F1–F8 |
| V2 | pass | `pnpm --filter @invana/canvas test` | `file:packages/canvas/tests/` | green; `tests/state/` gone | F4, F7 |
| V3 | pass | `grep -rn "from 'zustand" packages apps --include=*.ts` | workspace | **exactly 1** hit — `file:packages/canvas-store/src/adapters/zustand/createReactiveStore.ts#L1` | F6, F8 |
| V4 | pass | Plant a `import { createStore } from 'zustand'` in `pkg:@invana/graph`, run `pnpm check-boundaries` | `file:scripts/check-renderer-boundary.mjs` | exits **non-zero**, names the file; passes once reverted | F9 |
| V5 | pass | `pnpm --filter @invana/canvas build` with `zustand`/`immer` absent from its `package.json` | tsup + `.d.ts` emit | green — proves U3's transitive type resolution holds | F8 |
| V6 | pass | **Control** — `story:canvas/concepts/Layers/GraphLegendLayer`: click a legend row | rendered canvas | Type still hides/shows, row still strikes through, `type:visibility` still fires | F2 |
| V7 | pass | **Control** — `story:graph-layers/maplibre/Airports` | rendered canvas | Basemap still tracks the camera | F3 |
| V8 | pass | `pnpm check-boundaries` (drawing libs) | workspace | still green — F9's refactor must not weaken the existing gate | F9 |
| V9 | pass | Toggle a legend row with `sym:createHistory` attached | history stack | The toggle now appears as a named action — the capability S4 says is missing | F1, F2 |
| V10 | pass | `import { … } from '@invana/canvas/specs'` from `apps/storybook` | the `./specs` subpath | Still resolves — the published subpath survives the move | F18 |
| V11 | pass | `pnpm --filter @invana/renderer-pixijs build` | `file:packages/renderer-pixijs/src/PrimitivesRenderer.ts#L35` | green — all ~30 re-exported symbols resolve, `sym:PickingIndex` still constructible | F18 |
| V12 | pass | `grep -n "rbush" packages/canvas/package.json` | canvas manifest | **no hits**; `dependencies` is `@invana/canvas-store` alone | F19 |
| V13 | pass | `pnpm check-boundaries` after the move | `pkg:@invana/canvas-store` | green — the relocated `specs/` imports no drawing library | F13, F16 |
| V14 | pass | `pnpm --filter @invana/canvas-store test` | `file:packages/canvas-store/tests/hit/` | green in its new home | F20 |
| V15 | pass | **Control** — `pnpm build` then a graph story: hover, click, lasso a node | rendered canvas | Picking behaves identically; this is the one thing a 3212-line move could silently break | F13–F19 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Redux DevTools per layer is lost (D-6). Accept, or replace? | (a) accept the loss (b) block on a `withDevtools` port decorator (c) land the loss now, decorator as a follow-up RFC | **(c)** — nothing subscribes to these stores, so the debugging value being lost is already low; and a port-level decorator (mirroring `sym:withTelemetry`) would also give `view` devtools, which it does not have today. Do not block F1–F8 on it | accepted |
| D2 | Can `pkg:@invana/canvas` drop `immer` entirely, given the kernel leaks `Patch` in its public types (U3)? | (a) drop both deps (b) drop `zustand`, keep `immer` in `devDependencies` | **(a)**, gated on V5. If V5 fails, fall back to (b) — `immer` stays a dev-only type dep and never ships | accepted |
| D3 | `createLayerStore` / `Store` / `StoreApi` are published exports (D-5). Deprecation shim, or hard removal? | (a) hard removal (b) keep a deprecated re-export for one minor | **(a)** — the repo is `0.0.11` mid-rewrite, and a shim would have to re-import zustand, defeating the entire point | accepted |
| D4 | Where does the zustand gate live? | (a) extend `file:scripts/check-renderer-boundary.mjs` into a general boundary table (b) a second `check-state-boundary.mjs` | **(a)** — one command (`pnpm check-boundaries`), one place to add the next invariant. The script's own header already says "if you change one, change the other" about the ESLint pairing | accepted |
| D5 | Should `layer.state` exist at all, or fold into `view.layers[<id>]` in the kernel? | (a) keep layer-local, port-backed (this RFC) (b) fold into `sym:CanvasView` | **(a)** for now. (b) is arguably right — a legend's `hiddenNodeTypes` is view state a collaborator should see — but it changes ownership, serialisation, and `sym:Canvas.update` semantics. Out of scope; **worth its own RFC**, and this RFC is a prerequisite for it either way | accepted |
| D6 | Should `rbush` move to `pkg:@invana/canvas-store` alongside `zustand`/`immer`? | (a) keep it in `pkg:@invana/canvas` (b) relocate `file:packages/canvas/src/hit/` + `specs/` into the kernel (c) drop `rbush`, in-house index in canvas | Recommended **(a)** on R7 — it is a *direct* dep of the engine's picking index, not a leaked kernel dep. **Maintainer chose (b), 2026-08-11**, overriding the recommendation: the goal is `pkg:@invana/canvas` carrying no third-party dependency at all. Rows F13–F22 implement (b) | **accepted (b)** |
| D7 | How is the duplicate `Point`/`Vec2`/`Rect` resolved (§4.4)? | (a) `geom/types.ts` is the single home, adopting canvas's `readonly`; `specs/geometry.ts` re-exports (b) keep both, rename one (c) `geom/types.ts` re-exports from `specs/geometry.ts` | **(a)** — one definition, and `readonly` is the stricter of the two. Only `sym:CanvasView` consumes the kernel's `Rect`, and no kernel code mutates one in place, so it is a safe tightening. (b) leaves two `Rect`s in one package, which is the confusion the move was meant to remove | accepted |
| D8 | F21 corrects `sym:SpecStore`'s TSDoc. Should `SpecStore<T>` also become concretely typed, now that the vocabulary is local? | (a) keep it generic, fix only the prose (b) type it as `SpecStore<BaseShapeSpec \| BaseConnectorSpec>` | **(a)** — the generic costs nothing and (b) is churn in `sym:SpecProjector` and `sym:GraphLayer` for no capability. The *option* is the move's genuine upside; take it in a later RFC if a second spec kind appears | accepted |
| D9 | Does `pkg:@invana/canvas` keep the `./specs` subpath export after the vocabulary leaves? | (a) keep it as a re-export barrel (b) drop it, consumers import from the kernel | **(a)** — it is published API (D-11), and dropping it is a breaking change unrelated to the dependency goal. Revisit once consumers migrate | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-10 | Opened. Traced from a question about `pkg:@invana/canvas`'s `zustand`/`immer` deps; found `doc:docs/canvas-state-plan.md` D2 already decided the design in the canvas-store migration and left it unlanded | `proposed` | 12 rows, 5 open decisions |
| 2026-08-10 | `rbush` raised as a third candidate for relocation. Ruled out (R7) and recorded as D6 — it backs `sym:PickingIndex` over canvas's own spec geometry, which the kernel does not have | `proposed` | 12 rows, 6 open decisions |
| 2026-08-11 | **D6 decided (b)** — maintainer overrode the (a) recommendation after it was put a second time; the goal is a `pkg:@invana/canvas` with zero third-party deps. R7 and the (a) reasoning are kept above as the record | `proposed` | Rows F13–F22 added |
| 2026-08-11 | Scoping the move surfaced two things the RFC did not know: `specs/` has exactly **one** outward import so it relocates cleanly (§4.3), and the kernel already defines a conflicting `Point`/`Vec2`/`Rect` in `geom/types.ts` (§4.4) that F14/D7 must reconcile before it will compile | `proposed` | 22 rows, 8 open decisions |
| 2026-08-11 | Noted that `sym:SpecStore`'s TSDoc explicitly justifies its generic with *"the spec vocabulary lives in `@invana/canvas`"* — F13 falsifies that rationale; F21 corrects it, D8 decides whether to also type the store | `proposed` | — |
| 2026-08-11 | **Implemented and verified.** All 22 rows `landed`, V1–V15 `pass`. `pnpm build` 19/19, `pnpm check-types` 18/18, `pnpm lint` 0 errors, `pnpm check-boundaries` green | `landed` | See §8.1 for what the implementation taught |

### 8.1 What the implementation taught

Six things the document did not anticipate. None changed a decision; all changed the work.

| ID | Row | What the RFC assumed | What was true | Resolution |
|---|---|---|---|---|
| L1 | F18 | Only `pkg:@invana/canvas` needed a `./specs` barrel | `export *` from the kernel root would have re-exported the *whole kernel* through the `/specs` subpath — `ReactiveStore`, `CanvasStore`, everything | Gave `pkg:@invana/canvas-store` its own `./specs` subpath (`package.json` exports + a second tsup entry); canvas's barrel re-exports precisely that |
| L2 | F20 | One test file moved (`PickingIndex.test.ts`) | `tests/specs/contains.test.ts` (33 tests) covers the relocated spec geometry too | Moved both. Counts reconcile exactly: canvas 140 → 88, canvas-store 116 → 168 |
| L3 | F10 | The ESLint entry alone was enough | The rule is repo-wide, so it would flag the kernel's own legitimate adapter/port imports | Added a **scoped** override in `file:packages/canvas-store/eslint.config.js` — off for `adapters/zustand`, `port`, `history`, `telemetry` only; the drawing-library ban still applies there in full |
| L4 | F14 | Three types collided (`Point`/`Vec2`/`Rect`) | `Size` lives only in `geom/types.ts` but belongs to the same vocabulary | Made `Size` `readonly` with the others and re-exported it alongside |
| L5 | F1 | Only `sym:createLayerStore` disappears | `LayerOptions.devtoolsName` existed solely to name the devtools store — dead once D1 dropped devtools, and set by nothing | Removed the option. A published-type removal, same class as D-5 |
| L6 | — | — | A stale `packages/canvas/dist/` produced a misleading `TS7006 's' implicitly has an 'any' type` in `pkg:@invana/graph` — the recipe *looked* like a contextual-typing failure in the port | Rebuild the dependency before believing a downstream type error. Cost ~15 minutes chasing a non-existent `Update<T>` union problem |

**Unrelated pre-existing failures seen during verification:** `pkg:@invana/graph-layout-elkjs` and `pkg:@invana/graph-datasets` both fail `test` with *"No test files found"* — they declare a `test` script but ship no tests. Present before this work, untouched by it.
