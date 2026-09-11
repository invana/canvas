---
id: fix-2026-09-11-per-surface-pointer-routers-swallow-picking
type: fix
title: Every surface installs its own always-true pointer router, so the topmost one swallows all picking
status: landed
opened: 2026-09-11
decided: 2026-09-11
landed: 2026-09-11
packages: [pkg:@invana/renderer-pixijs, pkg:@invana/canvas, pkg:@invana/canvas-core]
design_of_record: doc:docs/renderer-split-design.md
relations:
  - { predicate: caused-by, object: file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1883 }
  - { predicate: manifests-in, object: story:canvas-ui/apps/AppLayoutV2 }
  - { predicate: manifests-in, object: sym:MiniMapLayer }
  - { predicate: relates-to, object: doc:docs/renderer-split-design.md }
---

# Per-surface pointer routers swallow picking

`sym:PrimitivesRenderer.installPointerRouter` makes its container an **unconditional** Pixi hit
target. Before the renderer split there was exactly one `PrimitivesRenderer` in the engine, so that
was harmless. The split gave **every layer** a surface, and every surface a router — so the topmost
container wins every press, and the ones on top are HUD layers that never draw into their surface at
all. Mount a `sym:MiniMapLayer` and node drag, click-select and node right-click go dead.

| | |
|---|---|
| Problem | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1883` sets `hitArea = { contains: () => true }` on **every** surface root, not on one dispatcher |
| Regression point | commit `ec3c22fe` ("split the drawing backend out of the engine"), phase P6 — "layers take a surface from the renderer" |
| What still works | Pan, wheel-zoom (DOM / camera plugins) and hover (`globalpointermove` ignores the hit) — which is why it reads as "only drag is broken" |
| Worst offenders | `sym:DevInfoLayer` (`zIndex 9999`), `sym:LayersPanelLayer` (`9998`), `sym:MiniMapLayer` / `sym:GraphLegendLayer` (`1000`) — none of them draw a single spec into the surface they are given |
| Standing cost | N rAF-coalesced `pickHover` passes per frame where one is needed — 3 in a default `sym:GraphCanvasApp` with a minimap, 2 of them against empty indexes |
| Non-goal | Changing what `hitTest` resolves, the picking index itself, spec geometry, or any behaviour's event contract |
| Row status | rows: **landed 4** · verification: **pass 8** · decisions: **accepted 4** |

## 1 Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Node drag does nothing, from first paint | `story:canvas-ui/apps/AppLayoutV2` | The story mounts a minimap by default (`minimapOn = useState(true)`) inside every board |
| S2 | Hover highlighting still works in the same story — **maintainer-confirmed 2026-09-11**: neighbour highlighting works while drag and right-click do not | same | Hover rides `globalpointermove`, which Pixi delivers to every `static` listener regardless of the resolved hit — `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1902` |
| S3 | Pan and wheel-zoom still work | same | `sym:DragPanBehaviour` listens on `ctx.canvasElement` directly (`file:packages/canvas/src/behaviours/DragPanBehaviour.ts#L118`); zoom is a camera plugin. Neither goes through Pixi picking |
| S4 | Node right-click is dead too — **predicted before it was reported, then maintainer-confirmed 2026-09-11**. Click-select shares the channel and is expected dead with it | same | Both ride `shape:click` / `routePointerUp` — `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L336`, `file:packages/graph/src/behaviours/ContextMenuBehaviour.ts#L154` |
| S5 | It worked before the renderer split, minimap and all | maintainer report | Confirmed by T4 below |
| S6 | Four of the six `sym:ScreenLayer` subclasses never touch the surface they are handed | `sym:MiniMapLayer` paints via `ctx.createOverlay` (`file:packages/graph/src/layer/MiniMapLayer.ts#L243-L245`); `sym:DevInfoLayer` paints into a DOM node (`file:packages/canvas/src/layers/DevInfoLayer.ts#L254`) | The swallowing container is not just wrong, it is **empty** |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `drag-node` is not enabled in the story | **No** | `sym:graphCanvasAppBaseConfig` sets `'drag-node': { enabled: true }`; the story's per-board `config` only patches `behaviours.color`, and `sym:Canvas.update` applies `enabled` authoritatively (`file:packages/canvas/src/engine/Canvas.ts#L668-L670`) |
| R2 | `keepMounted` page stacking breaks pointer coordinates | **No** | Inactive pages are `pointerEvents: 'none'`, all pages are `absolute inset-0` at full size — `file:packages/canvas-ui/src/view-panels/canvas-pages/CanvasPagesViewPanel.tsx#L429-L446` |
| R3 | The always-true `hitArea` is itself the regression | **No** | It predates the split — introduced by `8204bb6f perf(canvas): single-dispatcher hit-test pipeline`. What regressed is that it stopped being **unique** |
| R4 | `sym:MiniMapLayer`'s own DOM `pointerdown` listener steals the press | **No** | It returns early outside its box (`file:packages/graph/src/layer/MiniMapLayer.ts#L747-L751`) and is a DOM listener, which cannot suppress Pixi's federated dispatch anyway |
| R5 | The `sym:GestureArbiter` refuses the claim to `drag-node` | **No** | `beginDrag` is never reached — the claim is downstream of a `shape:pointerdown` that is never emitted |
| R6 | It only bites screen-space layers | **Partly** | Today yes, because the only stacked world surfaces (`sym:BackgroundLayer` is screen at `-1000`; contour / bubble-set layers mount below `sym:GraphLayer`) sort under the graph. But any content-bearing surface above the graph would swallow identically — F1 is what makes that structurally impossible |

## 2 Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | Pre-split, `sym:GraphLayer` constructed the **only** `PrimitivesRenderer` in the engine | `file:packages/graph/src/layer/GraphLayer.ts#L338` at `ec3c22fe^` — the sole `new PrimitivesRenderer` in the whole tree | One dispatcher. Its always-true `hitArea` was a catch-all, not a competitor |
| G2 | Pre-split, `sym:ScreenLayer` made a **plain `Container`** on the stage | `file:packages/canvas/src/layers/ScreenLayer.ts` at `ec3c22fe^` — `new Container()`, no `eventMode`, no `hitArea` | The minimap was invisible to Pixi picking. Drag worked with it mounted |
| G3 | The split moved every layer onto a surface | `file:packages/canvas/src/layers/ScreenLayer.ts#L64`, `file:packages/canvas/src/layers/WorldLayer.ts#L66` — both call `ctx.createSurface` at mount, unconditionally | Every layer now owns a drawing device whether or not it draws |
| G4 | `sym:PixiSurface`'s constructor always builds a `PrimitivesRenderer` | `file:packages/renderer-pixijs/src/renderer/PixiSurface.ts#L58-L66` | One router per layer. N dispatchers where G1 had 1 |
| G5 | Each router claims the entire canvas | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1871` + `#L1883` — `eventMode = 'static'`, `hitArea = { contains: () => true }` | Every surface root is a full-canvas hit target regardless of what it contains |
| G6 | Pixi's `EventBoundary` resolves **one** target per press and propagates along its ancestor chain | Screen surfaces are stage children added after the viewport; `sym:MiniMapLayer` sets `zIndex: 1000` (`file:packages/graph/src/layer/MiniMapLayer.ts#L217`), and `sym:PixiSurface.setZIndex` flips the stage into sorted mode (`file:packages/renderer-pixijs/src/renderer/PixiSurface.ts#L144-L150`) | The minimap's root wins. `sym:GraphLayer`'s router sits in a sibling branch (stage → viewport → graph root) and receives nothing |
| G7 | No `pointerdown` on the graph router ⇒ no `shape:pointerdown` | `routePointerDown` is the sole emitter — `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2011` | `sym:DragNodeBehaviour`'s `onShapeDown` (`file:packages/graph/src/behaviours/DragNodeBehaviour.ts#L238`) never fires ⇒ **S1** |
| G8 | Hover is exempt because `globalpointermove` is dispatch-independent | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1902` — the `global` variant fires on every `static` listener | **S2**: hover survives while press-driven interaction dies. This asymmetry is what makes the diagnosis fit the symptom exactly, and what rules out any "the press never reaches the canvas" theory |
| G9 | Latent second defect in the same method: every router converts through the camera | `routePointerMove` / `routePointerDown` both do `camera.toWorld(e.global…)` — `#L1915`, `#L2005` | Correct for a world surface, **wrong** for a screen surface, whose specs are in screen pixels. No screen layer publishes specs today, so it has never bitten — it would the moment one did |
| G10 | The duplication is also a standing per-frame cost | Each router owns its own rAF-coalesced move handler + `pickHover` — `#L1889-L1902` | A default `sym:GraphCanvasApp` with a minimap runs 3 picks per move frame; 2 index lookups are against empty indexes that can never hit |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `git grep -n "new PrimitivesRenderer" ec3c22fe^ -- packages` | One hit: `sym:GraphLayer` | G1 confirmed — single dispatcher pre-split |
| T2 | `git show ec3c22fe^:packages/canvas/src/layers/ScreenLayer.ts` | `new Container()`, no `eventMode`/`hitArea` | G2 confirmed — the minimap was not a hit target |
| T3 | `git log -S "contains: () => true"` | Oldest reachable: `8204bb6f`, pre-split | R3 confirmed — the catch-all is not the regression, the replication is |
| T4 | Toggle the minimap off in `story:canvas-ui/apps/AppLayoutV2` (rail map button) | Expect drag + click-select to start working immediately | Pending — the decisive in-browser check (V1) |
| T5 | Read every `sym:ScreenLayer` subclass for surface use | Only `sym:BackgroundLayer` uses it, via `setBackdrop`; the other four never touch it | S6 confirmed |
| T6 | Maintainer exercised right-click and hover in the live story (2026-09-11) | Right-click dead, hover highlights neighbours | **Decisive.** Right-click needs `routePointerUp` (dispatch-dependent); hover needs only `globalpointermove` (dispatch-independent). A broken-input or wrong-coordinates theory would kill both. G6–G8 confirmed |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/renderer-split-design.md` | design of record | shipped | The surface-per-layer model stands. Nothing in it says each surface owns an input router — that was an artefact of lifting `PrimitivesRenderer` wholesale out of `sym:GraphLayer` |
| commit `8204bb6f` "perf(canvas): single-dispatcher hit-test pipeline" | caused-by (its invariant was lost) | shipped, invariant broken | Its thesis is exactly F1: **one** dispatcher hit-testing an rbush index, closest-wins. This RFC restores it one level up |
| `file:packages/canvas-core/src/contracts/IRenderer.ts` | reference | shipped | `createSurface` returns an `ISurface`; nothing in the contract obliges a surface to route input. F1 needs no contract change (D-3) |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts`, new `PixiPointerRouter` | One router on the stage. `sym:PixiRenderer` keeps an ordered surface registry (add in `createSurface#L206`, drop in `sym:PixiSurface.destroy#L152`); the router installs a single `globalpointermove` / `pointerdown` / `pointerup` / `pointerupoutside` trio and one legitimate catch-all `hitArea` on the stage | Restores G1's single dispatcher. The topmost *content-bearing* surface wins, not the topmost container | **Medium** — changes input dispatch for every layer in every story; paint-order semantics become picking-order semantics | — |
| F2 | defect | landed | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L1870-L1912` | Delete `installPointerRouter`. Keep `hitTest`, `events`, and the hover/`downHit`/part bookkeeping, and expose them as router-driven entry points (`routeDown` / `routeUp` / `routeMove` / `notifyMiss`) | No surface is a hit target any more; the swallowing is structurally gone. `notifyMiss` is what lets a surface that *lost* the pick clear its own hover | **Medium** — touches the file every interactive behaviour depends on | F1 |
| F3 | defect | landed | the same router | Hand each surface coordinates in **its own space**: world coords to `space: 'world'` surfaces, raw screen coords to `space: 'screen'` ones | Removes G9 before a screen layer publishes its first spec | Low — no screen layer publishes specs today, so nothing observable changes | F1 |
| F4 | defect | landed | `file:packages/canvas/src/layers/ScreenLayer.ts#L60-L67` | Make the surface **lazy**: build it on first `this.surface` access rather than at mount; defer the `setZIndex` / `setVisible` it currently does eagerly | Four of six screen layers stop allocating a `PrimitivesRenderer`, a picking index and an rAF loop they never use (S6). Independent of F1 and a pure allocation win | Low–medium — `mount` order changes for any layer that reads `this.surface` in `onMount`; `sym:BackgroundLayer` does, so it simply builds it there as today | — |

Not a row, stated so it is on the record: gating the existing `hitArea` on `shapeInstances.size > 0` was the stopgap discussed in chat. It is **dressing** — it hides the minimap case while leaving G5 (a router per surface, each claiming the whole canvas) in place — so it is deliberately not carried here. F4 is the honest cheap row: it removes the phantom surface rather than making it lie about its hit area.

## 5 Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | Pixi v8 `EventBoundary` single-target dispatch | The whole diagnosis rests on "one target per press, propagation along its ancestors" | A Pixi upgrade that changed this would invalidate F1's design, not just its code |
| U2 | `sym:PixiSurface.setZIndex` flipping the parent into sorted mode | F1's top-down walk must use the **same** order Pixi paints in, or picking and painting disagree | Any change to surface ordering is now a picking change too — it must stay one function |
| U3 | `sym:PickingIndex` (`pkg:@invana/canvas-store`) | F1 calls `hitTest` per surface instead of once | Unchanged API; the call count per frame goes *down* (G10) |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `sym:DragNodeBehaviour`, `sym:ClickSelectBehaviour`, `sym:HoverActivateBehaviour`, `sym:ContextMenuBehaviour`, `sym:DrawEdgeBehaviour`, `sym:CollapseExpandBehaviour`, `sym:DragShapeBehaviour` | engine behaviours | All subscribe via `layer.getRenderer().events`. F1 keeps emitting on the winning **surface's** emitter, so every subscription is untouched | None — but each is a verification target |
| D2 | `background:contextmenu` | public renderer event | Emitted today by whichever router catches a no-hit right-click, which is in practice the graph surface. Centrally it fires once and must still reach `sym:ContextMenuBehaviour` (`file:packages/graph/src/behaviours/ContextMenuBehaviour.ts#L154`) | D-2 decides the fan-out rule |
| D3 | `sym:MiniMapLayer`, `sym:DevInfoLayer`, `sym:LayersPanelLayer`, `sym:GraphLegendLayer` | screen layers | F4 changes when their surface exists. None of them use it, so none should notice | Smoke each in Storybook |
| D4 | `sym:BackgroundLayer` | screen layer that *does* use its surface | F4's laziness must not break `setBackdrop` (`file:packages/canvas/src/layers/BackgroundLayer.ts#L357`), and it must stay non-swallowing at `zIndex -1000` | V6 |
| D5 | `sym:HeadlessRenderer` (`file:packages/canvas-core/src/headless/HeadlessRenderer.ts#L237`) | test double | Has no pointer router; if F1 puts routing on the renderer rather than the surface, the double may need a no-op registry | Check `pnpm check-types` + the canvas-core tests |
| D6 | `pkg:@invana/graph-layer-d3-contour`, `pkg:@invana/graph-layer-bubble-sets` | world overlay layers with content | Today they are below the graph and lose the reverse-order race by accident. Under F1 they lose it **by rule** (z-order), which is the intended semantics | Smoke both stories for hover/drag |
| D7 | Published API surface | `api/*.surface.txt` | F1/F2 may add a router type to `pkg:@invana/renderer-pixijs`'s barrel | **None** — the router is module-internal and never reached a barrel; `check-api-surface` reports all three pinned surfaces unchanged |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Toggle the minimap off, then on, in a visible browser tab | `story:canvas-ui/apps/AppLayoutV2` | **Before the fix:** drag works only with the minimap off. **After:** drag works in both states | F1, F2 |
| V2 | pass | Drag a node, click-select one, shift-click a second, right-click a node | `story:canvas-ui/apps/AppLayoutV2` with the minimap on | All four gestures work | F1, F2 |
| V3 | pass | **Control** — pan, wheel-zoom and hover highlighting | same story, minimap on | Keep working exactly as today. These work *now*, and a regression here means F1 broke more than it fixed | F1, F2 |
| V4 | pass | Right-click empty canvas | `story:graph/Behaviours/ContextMenu/ContextMenu` | Background menu still opens | F1, D2 |
| V5 | pass | Hover a node with a contour / bubble-set layer mounted | `story:graph-layers/d3-contour/DensityContourFillLayer`, `story:graph-layers/bubble-sets/BubbleSetsLayer` | Node hover + drag work; the overlay layer does not steal the pick | F1 |
| V6 | pass | Theme flip and resize with the background layer mounted | any `sym:GraphCanvasApp` story | Backdrop still repaints; no deferred-surface crash | F4 |
| V7 | pass | `pnpm check-types && pnpm lint && pnpm check-boundaries && pnpm check-api-surface` | repo | Green; surface snapshot regenerated in the same change if it moved | F1, F2, F3, F4 |
| V8 | pass | `pnpm --filter @invana/renderer-pixijs test` — 7 cases pinning **paint order == pick order** | `file:packages/renderer-pixijs/tests/renderer/PixiPointerRouter.test.ts` | Insertion order with no zIndex; zIndex order once sorted; the real stage shape (background −1000 · viewport 0 · minimap 1000, world surfaces nested); a deep surface under a shallow one; zIndex ties by insertion, in both sorted states | F1 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Where does the single router live? | (a) inline on `sym:PixiRenderer`; (b) a dedicated `PixiPointerRouter` owned by it | **(b)** — `sym:PixiRenderer` is already the lifecycle owner; a separate class keeps the surface registry, the z-order walk and the hover/miss bookkeeping in one readable unit and out of the renderer's init path | accepted |
| D-2 | Who receives `background:contextmenu` on a total miss? | (a) fan out to every registered surface's emitter; (b) designate the lowest world surface; (c) promote it to `ctx.events` | **(a)** — right-click is rare, the fan-out is free, and every existing per-layer subscription (`sym:ContextMenuBehaviour`) keeps working with no change. (c) is the cleaner long-term home but is an API move, not a fix | accepted |
| D-3 | Does F3's per-space coordinate handling need an `ISurface` contract change? | (a) no — `sym:PixiSurface` already knows its `space`; (b) yes — surface the space on the contract | **(a)** — the router is backend-side and reads `surface.space` directly. `pkg:@invana/canvas-core` stays untouched, which keeps this a one-package fix | accepted |
| D-4 | Land F4 (lazy surface) with F1, or drop it once F1 makes it harmless? | (a) land both; (b) F1 only | **(a)** — F1 makes the empty surface harmless for *correctness*, but it is still a `PrimitivesRenderer`, a picking index and an rAF loop per HUD layer. F4 is the performance half of "permanent and performant" | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened after node drag was reported dead in `story:canvas-ui/apps/AppLayoutV2` | proposed | Diagnosis traced to the renderer split via `git log -S` / `git show ec3c22fe^`; R3 records that the always-true `hitArea` itself is not the regression |
| 2026-09-11 | Maintainer confirmed right-click dead + hover working in the live story (T6) | proposed | Independent confirmation of the dispatch-dependent / dispatch-independent split predicted by G6–G8. No change to the fix table |
| 2026-09-11 | Approved whole; D-1…D-4 taken as recommended | accepted | All four fix rows approved together |
| 2026-09-11 | F1–F4 implemented; V7 green | accepted | New `file:packages/renderer-pixijs/src/renderer/PixiPointerRouter.ts`; `installPointerRouter` deleted from `sym:PrimitivesRenderer` in favour of `dispatchMove` / `dispatchDown` / `dispatchUp` / `clearDown` / `pickHoverAt` / `emitBackgroundContextMenu`; `sym:ScreenLayer`'s surface now lazy. `pnpm check-types` + `lint` + `check-boundaries` + `check-api-surface` green, 369 unit tests pass. Rows stay `implemented` until V1–V6 are exercised in a browser |
| 2026-09-11 | Implementation note: cursor ownership moved to the router | accepted | Not anticipated by the RFC. Two surfaces both writing `canvasElement.style.cursor` race on who paints last, so `applyHoverCursor` and `PrimitivesRendererOptions.canvasElement` were removed and the single router owns the cursor, memoised so an unchanged value never reaches the DOM |
| 2026-09-11 | V8 added: `pkg:@invana/renderer-pixijs` gained vitest and a test for the ordering rule | accepted | The RFC's verification plan was browser-only, which left the riskiest new logic — paint order == pick order — unpinned. `sym:orderByPaintOrderTopFirst` was extracted as a pure function so it could be tested without an `Application` |
| 2026-09-11 | Implementation note: pixi v8 auto-enables sorting on any non-zero `zIndex` | accepted | Found by a failing test that asserted the opposite. `Container`'s `zIndex` setter calls `depthOfChildModified`, which sets `parent.sortableChildren = true` — so one layer asking for a zIndex re-orders **all** its siblings. The ordering key follows that, and the test now pins the real behaviour rather than the assumed one |
| 2026-09-11 | Implementation note: the viewport, not the stage, usually wins the press | accepted | `pixi-viewport` sets its own `eventMode: 'static'` + visible-world `hitArea`, so it stays the resolved target and its pan plugin keeps working unchanged; the router's stage listeners fire by bubbling. The stage's own catch-all only matters where nothing else is a target |
| 2026-09-11 | Maintainer verified `story:canvas-ui/apps/AppLayoutV2` in the browser — V1, V2, V3 pass | accepted | Node drag, click-select and right-click all work with the minimap mounted, and the control (pan / wheel-zoom / hover) is unchanged |
| 2026-09-11 | Maintainer verified the remaining stories — V4, V5, V6 pass | landed | Background right-click, the contour / bubble-set overlays and the lazy background surface all behave. Every verification row is green, so F1–F4 move to `landed` |
| 2026-09-11 | Committed on branch `feat/styling-view-panel-applies` | landed | Not yet merged to `main`; the branch carries unrelated in-flight work that was deliberately left out of this commit |
