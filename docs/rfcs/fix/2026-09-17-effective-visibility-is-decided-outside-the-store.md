---
id: fix-2026-09-17-effective-visibility-is-decided-outside-the-store
type: fix
title: Effective visibility is decided in three places, and only one of them is the store
status: accepted
opened: 2026-09-17
decided: 2026-09-17
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas]
design_of_record: doc:docs/canvas-state-plan.md
relations:
  - { predicate: relates-to, object: "rfc:fix-2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load" }
  - { predicate: caused-by, object: "file:packages/graph/src/store/GraphStore.ts#L570-L572" }
  - { predicate: caused-by, object: "file:packages/graph/src/layer/GraphLayer.ts#L1499-L1500" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/tasks-panel/RunFlow" }
  - { predicate: manifests-in, object: "story:graph/Layer/MiniMapLayer" }
---

## Summary

| | |
|---|---|
| **The rule** | **The store is the single source of truth.** If an element is not visible, every consumer subscribed to the store — canvas, minimap, legend, behaviours — must agree, because they all ask the same question of the same object (maintainer, 2026-09-17) |
| **What breaks it** | Effective visibility is computed in **three** places. The store knows about the explicit `hidden` flag. `sym:GraphLayer` separately knows about **collapsed groups**. Nobody knows about **placement**. Consumers then split: the same four behaviours ask the store about *edges* and read the raw flag for *nodes* |
| **Defect 1 — live today** | A child of a **collapsed group** is culled from the canvas but `store.isNodeVisible` returns `true`. Verified. So `sym:MiniMapLayer` draws it, and lasso / brush / click-select can select it — the user selects nodes they cannot see |
| **Defect 2 — the presenting symptom** | Nodes paint at the store origin for ~150 ms before the layout places them (recorded as M6 of `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load`). Same shape: a visibility term that lives nowhere, or in the wrong place |
| **Root cause** | `sym:GraphStore.isNodeVisible` is one term wide — `!isNodeHidden(id)`. Every other reason an element should not be seen was added *beside* it instead of *in* it |
| **Why it stayed hidden** | While the rule has exactly one term, reading `node.hidden` directly and calling `isNodeVisible()` return the same answer. The two only diverge the moment a second term is added — which is exactly what fixing M6 does. **Fixing M6 the obvious way would have silently broken the minimap** |
| **Defect rows** | F1 · F2 (placement) · F5 · F5a (collapse) · F6 (converge the readers) |
| **Dressing rows** | F3 (canvas curtain) · F4 (let the entrance mask it) — both **rejected** |
| **Open decisions** | D1 · D2 · D3 · D4 · D5 · D7 (scope: all four rows, or M6 only) |
| **Row status** | **landed 4** · implemented 1 · rejected 2 — 7 rows. The RFC is **not landed**, and the reason has narrowed: F6's two *story* checks (V2 · V3) are still the only outstanding evidence. Every engine-level check now passes (V6 · V7 · V8 · V9 driven headlessly, 2026-09-18) |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | A single card floats mid-viewport on load, vanishes, and the real diagram appears framed elsewhere | `story:usecases/by-casestudies/tasks-panel/RunFlow` | CDP screencast, identical frames collapsed: state `4ba31d61` first at **386 ms**, held **151 ms**. It is all eight cards coincident at the origin, `announce` on top |
| S2 | Reproducible; not a timing fluke | 4 runs | Present in both entrance-off runs (386 ms warm, 1519 ms cold); **absent** in both entrance-on runs, because the entrance zeroes alpha for its own reasons |
| S3 | **A collapsed group's children are hidden on the canvas and visible to the store** | headless probe, `file:/scratch/collapse-leak.mjs` | `spec.visible === false` · `store.isNodeVisible('child') === true` · `node.hidden === false` · `collapsedAncestor('child') === 'g'`. **LEAK CONFIRMED** |
| S4 | Therefore the minimap draws nodes the canvas does not | `sym:MiniMapLayer` | `file:packages/graph/src/layer/MiniMapLayer.ts#L520` and `#L660` filter on `node.hidden === true` only; the file contains **zero** references to collapse |
| S5 | Therefore lasso / brush / click-select can select invisible nodes | four behaviours | `LassoSelectBehaviour#L373` · `BrushSelectBehaviour#L435` · `ClickSelectBehaviour#L485` · `LabelCollisionBehaviour#L318` all read `node.hidden` directly, and none mentions collapse |
| S6 | The inconsistency is **inside single functions** | same four files | Each asks `store.isEdgeVisible(edge.id)` for edges a few lines after reading `node.hidden` for nodes (`Lasso#L373` → `#L381`) |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | S1 is the auto-fitter framing a degenerate box | **No** | `rfc:fix-2026-09-17-auto-fit-frames-…` F1 already stops that. The stack paints at the *default* camera — the cards are normal size, not 9× |
| R2 | S1 is the position glide | **No** | That RFC's F7 snaps never-placed nodes. The stack is **static** for 151 ms — one held frame, not a run of distinct ones |
| R3 | S1 is a slow ELK solve | **It is the window, not the cause** | The solve sets the duration; the defect is that we paint during it. A faster solver shortens the flash without removing it |
| R4 | The entrance introduced S1 | **No — inverted** | Present with the entrance off, absent with it on. It masks it (F4) |
| R5 | S3 is by design — collapse is "a rendering concern" | **No** | Then `sym:MiniMapLayer` — a renderer of the same data — would still need to know, and it does not. "Rendering concern" is not a property the store can hide behind when two renderers disagree |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | The store's rule is **one term wide** | `file:packages/graph/src/store/GraphStore.ts#L570-L572` — `isNodeVisible = nodeMap.has(id) && !isNodeHidden(id)` | Any other reason to withhold an element has nowhere to go *inside* the store |
| D-2 | So collapse was added **beside** it, in the layer | `file:packages/graph/src/layer/GraphLayer.ts#L1499-L1500` — `culled = hiddenByGroup \|\| node.hidden === true`, where `hiddenByGroup` comes from `sym:GraphLayer.collapsedAncestor` | The canvas culls the child; the store never hears about it (S3) |
| D-3 | `syncGroupCollapse` only **re-renders** descendants so their spec carries `visible: false` — it writes nothing to the store | `file:packages/graph/src/layer/GraphLayer.ts#L2500-L2506` | Collapse is a *projection*, not a fact. Nothing subscribed to the store can observe it |
| D-4 | The store has **most** of what the rule needs — `parentId`, the children index, `COLLAPSED_STATE` as a node state — but **not** whether a node is a *group*: `sym:GraphLayer.isGroupNode` reads `resolveNodeStyle(node).group`, and style resolution merges the **layer template**, which the store does not hold | `file:packages/graph/src/layer/GraphLayer.ts#L2407-L2410` | The store cannot compute the collapse term alone. It can own the **rule**; the layer must supply the **fact** — the same split D5 proposes for placement |
| D-4a | Collapse hides **nodes** but **re-routes edges**: an edge crossing into a collapsed group attaches to the group frame and stays visible; only a collapse-induced *self-loop* is culled | `file:packages/graph/src/layer/GraphLayer.ts#L1684-L1692` | `isEdgeVisible` must **not** inherit the collapse term. Folding it in would delete every edge into a collapsed group — a regression far louder than the defect being fixed |
| D-4b | **Placement is the opposite**: an unplaced endpoint has nowhere to re-route *to*, so a connector anchored to it collapses to a degenerate stub at the origin | measured — see T6 | `isEdgeVisible` **must** inherit the placement term. The two derived terms are asymmetric, and for different reasons: collapse has a substitute anchor, placement has none |
| D-5 | Placement has **no** term anywhere, although the store can answer it (`FLAG_PLACED` / `sym:GraphStore.hasPosition`, added as F6 of the auto-fit RFC) | `file:packages/graph/src/store/GraphStore.ts#L431-L434`; one caller, and it is not the renderer | Unplaced nodes paint at the origin (S1) |
| D-6 | Consumers then split along no principle at all | S6 | Edges ask the store; nodes read the flag. Both are right today and one is about to be wrong |

**Why this stayed invisible:** while the rule has exactly one term, `!node.hidden` and `isNodeVisible(id)` are the same answer, so nine call sites disagreeing about *which to call* produces no observable defect. Collapse broke that for its own term and nobody noticed, because the minimap is small and a collapsed group is rare. **The trap is that fixing M6 alone would add a second term and silently break the minimap** — the graph would go blank on load while the minimap showed the stack.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Collapse identical frames across four screencasts, entrance on and off | `4ba31d61` held 132–151 ms in both off-runs; absent in both on-runs | S1 is real and reproducible; alpha suppresses it |
| T2 | Headless: build a group + child, collapse it, ask both authorities | canvas `visible: false`, store `isNodeVisible: true` | **S3.** The two disagree, which is the whole defect |
| T3 | `grep -c "layout:run"` in `sym:GraphLayer` | **0** | The layer cannot currently know placement is pending — F1 must add the subscription |
| T4 | `grep -c collapsedAncestor` in `sym:GraphStore` | **0** | Collapse is unknown to the store (D-3) |
| T5 | Count direct `node.hidden` readers outside the store | **9** (8 logic + 1 legitimate display in `sym:ElementInspectorViewPanel`, which *shows the flag's value*) | The converge list for F6 |
| T6 | Screencast after gating **nodes** only | The stack is gone, but a **stray arrowhead** sits at the canvas centre through the window | D-4b. The first draft of F5a reasoned that an edge to an unplaced node "is hidden anyway, because the shape is withheld" — it is not: the connector still anchors to the withheld shape's origin bounds and paints its marker |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/canvas-state-plan.md` | design of record | current | "The store is the hub the engine writes to *and* subscribes from"; the renderer is a **pure projection** of state. S3 is a projection that invented a fact |
| `rfc:fix-2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs` | same load sequence | landed | **F6 is the enabler** — `FLAG_PLACED` / `hasPosition` already answer "never placed". F1's "wait for the layout to report" and F2's grace floor are the precedents this copies |
| `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` | found S1; masks it | landed | Its M6 row is S1's first record, with the explicit caveat that masking is not fixing |
| `doc:packages/graph/CLAUDE.md` — "decoration sugar mutates state, never the renderer directly" | vocabulary | current | The same instinct one level up: the store is where a change is *recorded*, the renderer is where it is *seen* |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F5 | defect | **landed** | `file:packages/graph/src/store/GraphStore.ts#L570` + `sym:GraphLayer` | **Move the collapse term into the store's rule** — but as a *pushed fact*, not a store-side computation (D-4): the layer, which owns style resolution, recomputes the collapse-hidden id set whenever a group flips and pushes it to the store; `isNodeVisible` consults it. Derived, so it is **not** serialised — collapse already round-trips as `COLLAPSED_STATE` | Fixes S3/S4/S5: minimap, lasso, brush, click-select and label collision stop disagreeing with the screen | Medium — an O(N) walk per collapse toggle (a user gesture, not a hot path), and a second visibility input the store must invalidate on | D-4 |
| F5a | defect | **landed** | `file:packages/graph/src/store/GraphStore.ts#L639` | **Split the two derived terms at the edge rule**, with the reason in the code: `isEdgeVisible` **excludes** collapse (D-4a — the edge re-routes to the frame) and **includes** placement (D-4b — there is nowhere to re-route to, and the stub paints a stray arrowhead). Endpoint checks use the explicit `isNodeHidden` plus a shared `isPlacementWithheld` | Edges into a collapsed group keep re-routing; edges to unplaced nodes are withheld with their endpoints | Low, but only because it is written down — the "converge every reader" instinct breaks the first half, and the "it's hidden anyway" instinct breaks the second | F5, D-4a, D-4b |
| F1 | defect | **landed** | `sym:GraphStore` + `sym:GraphLayer` | **Add the placement term to the same rule.** A store-level `placementPending` bit (set by the layer, which is what sees `layout:run:*`) combined with the existing per-node `hasPosition`: an unplaced node is not visible while a layout owns placement and has not reported a run | Fixes S1: the first painted frame of a laid-out graph is the laid-out one. A node with an authored `position` still paints immediately | Medium — `nodeSpec` is the hot path, and a gate that never lifts is a blank canvas | F5, F2, D-5 |
| F2 | defect | **landed** | same | **Grace floor** (`PLACEMENT_GRACE_MS` ≈ 1200 ms, matching the auto-fitter's): lift the placement term unconditionally when it expires. Not optional — a declared-but-never-running layout would otherwise leave the graph permanently invisible, turning a 150 ms blemish into a blank canvas | A layout that never runs degrades to today's behaviour, not to nothing | Low | F1 |
| F6 | defect | **implemented** *(V2/V3 — the minimap and lasso **stories** — still not driven)* | 8 call sites — `sym:MiniMapLayer` ×2, `sym:GraphLayer.getBounds`, `sym:GraphLayer.nodeSpec`, `sym:LassoSelectBehaviour`, `sym:BrushSelectBehaviour`, `sym:ClickSelectBehaviour`, `sym:LabelCollisionBehaviour` | **Converge every node-side reader onto `store.isNodeVisible(id)`**, the way they already ask `isEdgeVisible` for edges (S6). `sym:ElementInspectorViewPanel#L429` is excluded — it displays the raw flag's value, which is legitimate | Without this, F1/F5 change the rule and eight consumers keep reading the old one. **This is what makes the other rows safe** | Low individually; the risk is *missing* one | F5 |
| F3 | defect | **rejected** | `sym:Canvas` + `sym:ISurface.setAlpha` | Canvas-level "curtain": hold every world surface at alpha 0 until the active layout reports a run | Would fix S1 for any layer type and reuses machinery that just shipped | **Rejected**: it blanks content that *is* placed — a `pkg:@invana/graph-layer-maplibre` basemap or a second graph layer with authored positions goes dark because an unrelated layer waits on a solver. It also leaves the store still lying about what is visible, so S3 survives untouched |
| F4 | dressing | **rejected** | — | Do nothing: `sym:EntranceBehaviour` / `CanvasConfig.entrance` already hide S1 | Zero code | **Rejected**, and this is the row that matters. It works on exactly one canvas in the repo, by coincidence, and papers over the frame rather than removing the cause. A masked defect is a defect plus a dependency |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphStore.hasPosition` / `FLAG_PLACED` | F1's per-node term | Covered by `file:packages/graph/tests/store/GraphStorePlacement.test.ts` (9 cases, all four write paths) |
| U2 | `layout:run:end` reaching the layer | Lifts the placement term. `sym:GraphLayer` has **zero** `layout:run` subscriptions today (T3) — F1 adds one | A run that ends `'stopped'` / `'cancelled'` must lift it too, or a superseded first run strands the graph behind F2's floor |
| U3 | `sym:CanvasView.definition.activeLayout`, read at render time | Decides whether a layout owns placement | Applied late by a React root — the ordering that forced "defer one frame" in the auto-fit RFC. Re-read it; do not latch at mount |
| U4 | `parentId` + `COLLAPSED_STATE` in the store | F5's term | Both already store-owned (D-4) |
| U5 | `sym:GraphStore` flush / event cadence | F5 and F1 make `isNodeVisible` answer change **without** a `node:visibility` event, which today only fires on the explicit flag | Consumers that cache visibility need an invalidation signal — see X6 |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `sym:MiniMapLayer` | package | **Behaviour change, and the point of F5**: stops drawing collapsed-group children. Also stops drawing unplaced nodes under F1 | Confirm against `story:graph/Layer/MiniMapLayer` with a collapsed group |
| X2 | `sym:LassoSelectBehaviour` · `sym:BrushSelectBehaviour` · `sym:ClickSelectBehaviour` | package | Stop selecting invisible nodes. A consumer relying on "lasso grabs collapsed children" (unlikely, undocumented) would see a change | — |
| X3 | `sym:LabelCollisionBehaviour` | package | Stops reserving label space for invisible nodes — labels of *visible* nodes may now win slots they previously lost | Visual check on a dense story with a collapsed group |
| X4 | 77 story files referencing `activeLayout`, with nodes lacking `position` | stories | First painted frame becomes blank-then-laid-out instead of stack-then-laid-out. Strictly less to look at; nothing settles differently | Spot-check one per layout family |
| X5 | Canvases with authored positions | package | **None** — every node satisfies `hasPosition`, so F1's term never engages | — |
| X6 | Anything caching `isNodeVisible` across a frame | package | F5/F1 change the answer without a `node:visibility` event | Decide the signal: reuse `data:changed`, or emit `node:visibility` on collapse and on the placement flip (D6) |
| X7 | `sym:GraphLayer.getBounds` | package | Under F6 it asks the store, so unplaced nodes leave the bounds union — which is *better* (the box stops containing the origin) but changes `fitView()` during the window | D3 |
| X8 | `sym:OneShotPositionLayout#L144` (`node.hidden !== true`) | package | A layout deciding which nodes to place. If it asked `isNodeVisible` under F1 it would **refuse to place unplaced nodes** — a deadlock | **Excluded from F6 by construction.** Placement input must read the raw flag; call it out in the code |
| X9 | Published API surface | api | `isNodeVisible` keeps its signature; `placementPending` is a new store member | `pnpm check-api-surface` — members don't move the snapshot; a new *export* would |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | Re-run the headless collapse probe | `file:/scratch/collapse-leak.mjs` | `spec.visible === false` **and** `store.isNodeVisible('child') === false` — store and canvas agree. Was the "LEAK CONFIRMED" case | F5 |
| V2 | **pending** | Minimap with a collapsed group | `story:graph/Layer/MiniMapLayer` | The collapsed children vanish from the minimap too | F5, F6, X1 — **not run.** `sym:MiniMapLayer` now calls `isNodeVisible` (code fact) and that rule is unit-tested, but the rendered minimap was not exercised |
| V3 | **pending** | Lasso across a collapsed group | `story:graph/Behaviours/LassoSelect` | Invisible children are not selected | F5, F6, X2 — **not run**, same scope as V2 |
| V4 | **pass** | CDP screencast, identical frames collapsed, entrance **off** | `story:usecases/by-casestudies/tasks-panel/RunFlow` | Stack hash `4ba31d61` **absent**. The window it occupied is now a clean empty canvas — **0 of 1,296,000 pixels** differ from the alpha-0 frame of the entrance-on run | F1, F5a |
| V5 | **pass** | Settled frame vs today's | same | Settles to hash `2e257dd9` — the same frame as before the fix, in every run | F1, F5 |
| V6 | **control** · **pass** | A graph carrying **both** an authored-position node and a never-placed one, mid-solve | headless scratch harness (`file:/scratch/checks2.mjs`) against the built dist | During the solve: authored node `isNodeVisible === true`, never-placed node `false`. The term is per-node, not per-canvas — one unplaced node does not blank its placed siblings | F1, X5 |
| V7 | **control** · **pass** | No `activeLayout` at all, a node with no `position` | headless scratch harness (`file:/scratch/checks2.mjs`) | `placementPending === false` and the node is visible — without a layout, `(0, 0)` is the honest position (D4), so the term never engages | F1 |
| V8 | **pass** | `activeLayout: 'ghost'` — an id with no registered layout | headless scratch harness (`file:/scratch/checks.mjs`) | Withheld at 700 ms, painted after the 1200 ms floor. F2 is load-bearing exactly as written: without it this canvas is blank for its whole life. (The auto-fitter's own fallback frames the same case at `zoom 37×` — see V3 of `rfc:fix-2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs`) | F2 |
| V9 | **pass** | A first run cancelled mid-solve, so it ends `'stopped'` rather than `'settled'` | headless scratch harness (`file:/scratch/checks.mjs`) | Withheld during the run, visible ~80 ms after the stop — the gate lifts on the *run ending*, not on it succeeding, so a superseded run does not strand the graph behind the 1200 ms floor. This is why `liftGate` subscribes to `layout:run:end` without filtering on `reason`, unlike the auto-fitter and the entrance, which both require `'settled'` | F2, U2 |
| V10 | **pass** | Grep for surviving direct `node.hidden` logic readers | repo | Six converged onto `isNodeVisible`; the two documented exceptions remain — `sym:ElementInspectorViewPanel` (displays the flag's value) and `sym:OneShotPositionLayout` (placement input, X8) | F6, T5 |
| V11 | **pass** | Entrance **on**, after the fix | `story:usecases/by-casestudies/tasks-panel/RunFlow` | 41 visible states, settles to `2e257dd9`, no stack, no blank canvas — the placement gate and the entrance compose | X6 |
| V12 | **pass** | `pnpm build` · `check-types` · `lint` · `check-boundaries` · `check-api-surface` · tests | repo | build 20/20 · check-types 19/19 · lint 19/19 · boundaries · surfaces intact · `@invana/graph` **152** · `@invana/canvas-core` 143 | all |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does effective visibility live? | (a) the store, one rule, every term; (b) the layer, as today; (c) split by term | **(a)** — maintainer, 2026-09-17: "if something is marked hidden in store, it should be hidden in canvas and minimap or any layer subscribed to the store". (b) is what produced S3 | **accepted (a)** |
| D2 | What lifts the placement term? | (a) the active layout's first `layout:run:*`, with a grace floor; (b) a fixed timer; (c) the first position write | **(a)** — the layout is the authority on placement. (b) is the guessing `doc:docs/autofit-bounds-rfc.md` §7 warns against; (c) fires per node and would flicker a graph mid-solve | open |
| D3 | Does `sym:GraphLayer.getBounds` follow the rule? | (a) yes — it is a consumer like any other (F6); (b) no — bounds answer "where is the data" | **(a)** for collapse (it already excludes collapsed nodes by hand). For placement it is also right: an unplaced node has no meaningful box. The engine's fitter already waits for the layout, so nothing reads the difference | open |
| D4 | Does the placement term apply with **no** `activeLayout`? | (a) no — paint immediately; (b) yes | **(a)** — with nobody owning placement, `(0,0)` is the node's real position; withholding it would hide a legitimate graph forever | open |
| D8 | Does the collapse term reach edges? | (a) no — nodes only; edges keep re-routing (D-4a); (b) yes, for symmetry | **(a)** — collapse is a *re-parenting* of the edge's endpoint, not a hiding of the edge. Symmetry here would delete edges users expect to see terminating on the collapsed frame | **accepted (a)** — forced by the code, not a preference |
| D5 | Is `placementPending` per-layer or per-store? | (a) a store-level bit set by the owning layer; (b) per-node; (c) derived in the store from `activeLayout` | **(a)** — the store owns the *rule*, the layer supplies the *fact* (it is what sees canvas events). (c) would make the domain store read canvas view state, which inverts the layering | open |
| D6 | How do consumers learn the answer changed? | (a) emit `node:visibility` on collapse and on the placement flip; (b) rely on `data:changed`; (c) no signal — recompute per frame | **(a)** — it is the event that already means "visibility changed", and X6 needs *some* signal. (b) is coarse but cheap | open |
| D7 | **Scope.** | (a) all four rows — one rule, converged readers; (b) F1+F2 only (M6, as asked) and file the collapse leak separately; (c) F5+F6 only (the live bug) and defer M6 | **(a)** — F1 alone adds a second term to a rule eight consumers bypass, which breaks the minimap in a new way. F5+F6 are what make F1 safe. But this is a bigger change than "fix M6", so it is yours to scope | **open — needs your call** |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-17 | Opened as "nodes paint at the origin before the layout places them" — M6 of `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load`, with a per-node paint gate in `sym:GraphLayer.nodeSpec` as the fix | proposed | The obvious fix, in the place the existing collapse term already lived |
| 2026-09-17 | **Re-scoped on maintainer direction**: "store is the single source of truth — if something is marked hidden in store, it should be hidden in canvas and minimap or any layer subscribed to the store". The gate moves from the layer's spec projection into `sym:GraphStore.isNodeVisible` | proposed | The correction turned a one-row cosmetic fix into a structural one, and the structural one is right: the original design would have put a *second* visibility rule in the layer, beside the collapse rule that is already there |
| 2026-09-17 | **Investigating that principle found a live defect (S3).** A collapsed group's children are culled by the canvas while `store.isNodeVisible` still reports `true` — verified headlessly. `sym:MiniMapLayer` draws them; lasso / brush / click-select select them | proposed | Nobody had noticed because the store's rule is one term wide, so `!node.hidden` and `isNodeVisible()` agree everywhere — they diverge only when a second term appears. **The M6 fix as originally written would have been that second term, and would have broken the minimap on load** |
| 2026-09-17 | Counted the split: 8 logic sites read `node.hidden` directly, and four of them call `isEdgeVisible` for edges in the same function | proposed | The inconsistency is not between files but inside single functions — which is why it reads as an accident rather than a design |
| 2026-09-17 | **A third claim was wrong, and only a screenshot caught it.** F5a's first draft excluded *both* derived terms from `isEdgeVisible`, reasoning that an edge to an unplaced node "is hidden anyway, because the shape is withheld and the connector has nothing to anchor to". The screencast after that change showed the stack gone and a **stray arrowhead** left at the canvas centre: the connector still anchors to the withheld shape's origin bounds and paints its marker. Split the terms — collapse out, placement in (D-4b) | landed | Two of the three corrections in this document came from running the thing rather than reading it. The tell was a ~15 px artefact on an otherwise empty frame, which no unit test I would have thought to write was looking for |
| 2026-09-17 | Implemented D7 (a): the store's rule gained both terms, the layer publishes the collapse set and drives the placement gate, and six consumers converged onto `isNodeVisible`. Measured: stack frame gone, settled frame unchanged, entrance unaffected | landed (4 rows) | F6 stays `implemented` rather than `landed` — its story checks (minimap, lasso) were not run, and the rule that a row lands only when its checks pass is not one to bend for a row that is "obviously fine" |
| 2026-09-17 | **Two claims in this document were wrong, found while implementing.** (1) D-4 said the store holds everything the collapse term needs — it does not: group-ness comes from `resolveNodeStyle`, which merges the layer template the store never sees. F5 becomes a *pushed fact* instead of a store-side computation. (2) Nothing said what collapse does to **edges**: it re-routes them to the group frame rather than hiding them, so folding the term into `isEdgeVisible` would delete every edge into a collapsed group. Added as D-4a / F5a / D8 | proposed | Both were found by reading the code the rows name, before writing any. The second is the dangerous one: "make every consumer ask the store" is the right principle, and applying it uniformly to edges would have caused a louder regression than the defect |
| 2026-09-17 | F3 (canvas curtain) rejected before implementation | rejected | Reuses freshly-shipped `setAlpha`, which made it tempting; blanks an unrelated map basemap, and leaves the store still lying |
| 2026-09-17 | F4 (rely on the entrance) rejected | rejected | The dressing row: masking works on one canvas, by coincidence, and turns a cosmetic defect into a dependency on an opt-in feature |
| 2026-09-18 | **Reconciled against the shipped tree.** All five implemented rows verified present in `d43b6f88`; the four engine-level checks left pending (V6 · V7 · V8 · V9) driven headlessly against the built dist and all four pass. `status` moves `proposed` → `accepted`: the decisions are taken and the code is in, but the RFC still is not `landed` | accepted | The outstanding evidence has narrowed from "six checks" to "two story checks". Worth stating precisely, because "pending" covered two very different things — checks nobody had got to, and a check that needs a human driving a UI |
| 2026-09-18 | **F6 deliberately left `implemented`.** Its two remaining checks (V2 minimap, V3 lasso) both need a *rendered* story driven interactively — collapse a group, then look at the minimap / drag a lasso. The rule is converged (`sym:GraphStore.isNodeVisible`), the readers are converged (V10's grep), and the rule is unit-tested — but none of that is the same as watching the minimap stop drawing a node the canvas has hidden | accepted | This is the same call the entrance RFC made about its own C9, and for the same reason: the cheap evidence is about the *code*, and the claim is about the *picture*. Marking it landed would make the RFC say something it has not checked |
| 2026-09-18 | **V9 turned out to document a real asymmetry, not just pass.** The gate lifts on `layout:run:end` regardless of `reason`, where the auto-fitter (F1 of the fit RFC) and `sym:EntranceBehaviour` both require `'settled'`. That is correct and deliberate — a cancelled run leaves the nodes wherever they are, and withholding them until a settle that will never come is the blank-canvas failure F2 exists to prevent — but it means the three consumers of the same event disagree about what counts as "the layout has spoken" | accepted | Three subscribers, three different predicates on one event. None of them is wrong; the risk is that the next subscriber copies whichever one it happens to read first |
