---
id: feat-2026-09-24-toggling-a-group-leaves-the-layout-stale
type: feat
title: Toggling a group frame leaves the layout stale — collapse leaves a hole, expand can overlap
status: accepted
opened: 2026-09-24
decided: 2026-09-25
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/graph-layout-elkjs, pkg:@invana/graph-layout-d3-force, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: depends-on, object: "rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
---

## Summary

| | |
|---|---|
| **What's missing** | A collapse/expand only swaps the frame's geometry; nothing re-lays the graph. Collapsing leaves the frame's old footprint as empty space; neighbours never close up. |
| **Proposal** | Opt-in `relayoutOnToggle` on `sym:CollapseExpandBehaviour`: after the frame re-projects, re-run the **active** layout with its existing glide, **anchored** on the toggled group (it stays where the user clicked; everything else moves around it) and with the **camera left alone** (no fit). |
| **Already there** | ELK lays a collapsed group out as one node · one-shot layouts glide placed nodes (`sym:animatePositions`) · d3-force reheats from current positions |
| **New seams** | A run-options object through `Layout.apply` / `Canvas.runLayout` (`anchorNodeId`, `preserveCamera`) · a way for a behaviour to run the active layout (`ctx.runActiveLayout`) · both fitters honour `preserveCamera` |
| **Maintainer calls** | Q1 default **off**, on in GlobalModel · Q2 **anchor** the toggled group · Q3 / D3 ELK stability — **F10 approved with the rest** ("approve all", 2026-09-25) |
| **Row status** | proposed 0 · accepted 0 · implemented 14 · landed 0 · deferred 0 · rejected 0 · superseded 0 |
| **Open** | Nothing in the change table. Residual: under ELK the collapsed tab lands ≈ 20 px (screen, 36 % zoom) off the old frame's centre after the re-flow — see V4 results |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Collapsing AirRoutes shrinks a 255×175 px frame to a ~40 px tab; the frame's footprint stays empty | `story:usecases/by-casestudies/global-model/GlobalModel` | probe screenshots in `rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` S3 |
| M2 | Nothing re-runs the layout on a toggle — only topology changes do | `file:packages/graph/src/canvas/GraphCanvas.ts#L79-L82` | `addedNodes > 0 \|\| removedNodes > 0` only |
| M3 | If a layout ever runs while a group is collapsed (Detail / Layout switcher), expanding it later **overlaps** its neighbours — members re-appear at frozen positions inside space the layout gave away | `file:packages/graph-layout-elkjs/src/types.ts#L85-L99` ("members keep their frozen positions") | by construction |
| M4 | Every layout run already re-fits the camera: the React wrappers on `end`, and the engine auto-fitter when `fitOnLoad` is armed. A naive re-run on toggle would bring back the camera jump the fix RFC removed | `file:packages/canvas-react/src/layouts/ElkLayout.tsx#L80-L98` · `file:packages/canvas-react/src/layouts/D3ForceLayout.tsx#L80-L95` · `file:packages/canvas/src/engine/Canvas.ts#L573-L600` | read |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Toggle writes `collapsed`; the behaviour's one-shot `data:changed` fires after the group drain (existing timing) | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L288-L298` | New geometry is known |
| 2 | With `relayoutOnToggle`, the behaviour calls `ctx.runActiveLayout({ anchorNodeId: groupId, preserveCamera: true })` | new seam `F2` | The same layout the canvas is showing re-runs — no layout choice in the behaviour |
| 3 | ELK lays the collapsed group out as one node / the expanded one as a container (existing) | `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L150-L196` | Correct packing |
| 4 | Before committing targets, the layout shifts **all** targets by `(anchor's current centre − anchor's computed centre)` | new, `F5` | The toggled group does not move; the rest re-flows around it |
| 5 | The one-shot glide animates from current positions to the shifted targets (existing default transition) | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L239-L300` | "Gentle animation" is the existing layout transition |
| 6 | `preserveCamera` rides the run's `start`/`end` events; both fitters skip such runs | `F1` `F3` `F4` | Camera untouched — consistent with `centerOnToggle: false` |

### Why anchoring, not camera-follow (Q2)

| Option | Screen effect | Verdict |
|---|---|---|
| Anchor the toggled group (translate targets) | The thing the user just clicked stays under the pointer; only the rest moves | **chosen** |
| Let the layout place it anywhere, camera follows | Everything moves *and* the camera moves — two motions, the "dancing" again | rejected |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` | depends-on | implemented | Camera stays put on toggle (F6 there); a user gesture cancels camera glides (F5 there). This RFC must not re-introduce camera motion |
| `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` | relates-to | landed | Its D9 (does `fitOnLoad` stop re-fitting once the user panned?) is still open; `preserveCamera` answers it for toggle runs only, not in general |
| `doc:docs/canvas-state-plan.md` | relates-to | current | Positions are layout-derived and never synced — re-running a layout on toggle is consistent with that |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | implemented | `file:packages/canvas-core/src/abstracts/Layout.ts#L72-L140` | New exported type `LayoutRunOptions { anchorNodeId?: string; preserveCamera?: boolean }`. `apply(layer, run?: LayoutRunOptions)` — optional 2nd param on the abstract; implementations record it on a new public `Layout.runOptions` so an `end` listener can see what kind of run finished. (As built: the layout's own `start`/`end` payloads are unchanged — the flag rides `runOptions` and the canvas bus events, see F3) | One vocabulary for "how this run should behave", carried to whoever listens | **Medium**: abstract signature + public type in the floor; every layout subclass (5 packages) compiles against it — additive/optional, but the API-surface snapshot gains a name |  — |
| F2 | feature | implemented | `file:packages/canvas-core/src/abstracts/CanvasContext.ts` · `file:packages/canvas/src/engine/Canvas.ts` | `CanvasContext.runActiveLayout?(run?: LayoutRunOptions): Promise<void>` (optional member so test doubles don't break). `Canvas` implements it: resolve `definition.activeLayout`, `runLayout(id, run)`; no-op when none | A behaviour can re-run *whatever layout is active* without knowing layouts | Low–medium: new context capability | F1 |
| F3 | feature | implemented | `file:packages/canvas/src/engine/Canvas.ts#L987-L1030` (`runLayout`) + `#L573-L700` (auto-fitter) | `runLayout(id, run?)` forwards `run` to `apply`, adds `preserveCamera` to `layout:run:start` / `:tick` / `:end`. The `fitOnLoad` auto-fitter ignores runs with `preserveCamera` | Engine fitter leaves toggle runs alone | Medium: auto-fit sequencing is delicate (`doc:` memory *canvas-autofit-sequencing*) — only a skip is added | F1 |
| F4 | feature | implemented | `file:packages/canvas-react/src/layouts/{ElkLayout,D3ForceLayout,D3SankeyLayout}.tsx` — the three wrappers that fit on `end` (hierarchy / geometric wrappers never fit; the original "five" was wrong) | The `end → fitContent / fitView` handler returns early when `layout.runOptions.preserveCamera` | React fitters leave toggle runs alone | Low; three near-identical edits | F1 |
| F5 | feature | implemented | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L168-L300` | When `run.anchorNodeId` is set and both the anchor's current box (renderer world bounds) and its computed box are known, translate every target by the centre delta before the glide | ELK / hierarchy / geometric anchor for free (they extend `OneShotPositionLayout`). **Correction:** `D3SankeyLayout` extends `Layout` directly — it records the run options but does not anchor | Medium: group positions are top-left with derived frames — the delta must be taken on **centres of boxes**, not stored positions (same trap `centerAfterReproject` documents) | F1 |
| F6 | feature | implemented | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L145-L360` | With `anchorNodeId`: capture the anchor's centre before the reheat and, on each tick, translate the whole sim by `(captured − current anchor centre)` before writing positions | Force re-settles around a fixed toggled group | **Medium–high**: a live sim; a per-tick translation must not fight pins / dragged nodes. Force already starts from current positions, so it is usable without this row — F6 can slip independently | F1 |
| F7 | feature | implemented | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts` | Option `relayoutOnToggle?: boolean` (default `false`). In the post-reproject callback: `ctx.runActiveLayout?.({ anchorNodeId, preserveCamera: true })`. If `centerOnToggle` is also on, centre **after** the run resolves | The opt-in itself | Low | F2 |
| F8 | feature | implemented | `file:packages/canvas-ui/src/editors/behaviours/collapse-expand/{fields,mapping,types}.ts` | Boolean field "Re-layout on toggle", default off | Rule 12 | Low | F7 |
| F9 | feature | implemented | `file:apps/storybook/stories/usecases/by-casestudies/global-model/settings.json` (`behaviours["collapse-expand"]`) | `"relayoutOnToggle": true` | GlobalModel re-flows on toggle; the story's own `fitView(60)` after the Detail/Layout switchers is **unchanged** (it is not a toggle run) | Low — story edit agreed in chat (Q1) | F7 |
| F10 | feature | implemented | `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L150-L200` | For runs with `anchorNodeId`, feed ELK the nodes' **current positions** (today children carry no `x`/`y`) and set `elk.layered.layering.strategy: INTERACTIVE` + `elk.layered.crossingMinimization.strategy: INTERACTIVE`, so ELK keeps the existing order instead of re-solving from scratch | Unrelated frames don't swap places when one collapses | **High**: interactive strategies trade layout quality for stability and behave differently with compound (`INCLUDE_CHILDREN`) graphs — needs a spike before commitment | F1, F5 |
| F11 | defect | implemented | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L332` (static) · `#L466` (live) | Build the sim's links with `sym:collectLayoutEdges` (what ELK and `SubgraphPositionLayout` use) instead of `store.edges()`, so an edge into a collapsed group's members is re-pointed at the frame instead of dropped | A collapsed frame keeps its links, stays near its neighbours, and anchoring on it holds the picture instead of dragging it. Pre-existing, independent of this RFC — also why a collapsed frame under force drifts off-screen with `relayoutOnToggle` off once any force run happens | Medium: changes force output for every graph with collapsed groups (the fix, but visible); merged duplicate edges become one link | F6 |
| F12 | defect | implemented | `sym:GraphLayer` collapse path (`file:packages/graph/src/layer/GraphLayer.ts#L536-L547`, `syncGroupCollapse`) | When a group collapses, place the group node at the **centre of the frame it was** (renderer world bounds) before the tab is drawn | The tab appears where the frame was — under force it currently appears at the group's own sim point, near the old frame's top edge, and F5/F6 then anchor it there. ELK is barely affected (its group point is the container centre) | Medium: writes a position on collapse — every layout / story with collapsible groups sees the tab land differently; must not fire for a document-authored `states: ['collapsed']` on load | — |
| F13 | feature | implemented | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts` (`runLive` / `configureSimulation`, `#L809`) | For an anchored run (a re-flow), start the live sim at a low α — `reheatAlpha` (default 0.5), or `REHEAT_ALPHA` (0.3) — instead of d3's default 1. Today `reheatAlpha` is documented as `animate: false` only | The re-flow eases the graph into place instead of a full-energy restart that briefly compacts and overlaps cards | Low–medium: re-flow runs only; ordinary runs unchanged | F6 |
| F14 | defect | implemented | `sym:GraphLayer` expand path (`file:packages/graph/src/layer/GraphLayer.ts`, the `node:state` handler next to `centreCollapsedFrame`) | Mirror of F12 for **expand**: when a group opens, translate its (hidden, frozen) members rigidly so the **expanded frame** — measured from the group's own spec, which is already the open frame around the members' current positions (padding, header and declared size floor included) — is centred on the collapsed tab being replaced, before the frame re-projects (`GraphLayer.centreOpeningMembers`) | The frame opens where the user double-clicked, even if a layout ran while it was closed (Detail / Layout switch) — so the anchored re-flow holds it there instead of dragging the graph to stale positions. Also fixes the non-re-layout case, where the frame opens far away | Medium: writes member positions on expand; skipped when members have never been placed | F12 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `data:changed` after the group drain | The trigger timing (F7) | Unchanged |
| U2 | `definition.activeLayout` | F2 resolves the layout from it | A canvas with no active layout: toggle re-lays nothing (documented no-op) |
| U3 | One-shot transition default (`transition: true`) | F5's "gentle" is this glide | A layout configured `transition: false` snaps — respected, not overridden |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `pkg:@invana/graph-layout-{elkjs,d3-hierarchy,d3-sankey,geometric}` (extend `OneShotPositionLayout`) | subclasses | Inherit anchoring; signatures unchanged | none |
| C2 | `pkg:@invana/graph-layout-d3-force` (`D3ForceLayout extends Layout`) | subclass | `apply` gains optional param | F6 or a pass-through |
| C3 | `api/canvas-core.surface.txt` · `api/canvas.surface.txt` | API snapshot | `LayoutRunOptions` added | regenerate with `--write` |
| C4 | `layout:run:start` / `layout:run:end` listeners (toolbars reading `runtime.layout`, telemetry) | bus events | Optional field added | none |
| C5 | `story:graph/Behaviours/CollapseExpand` + 7 `story:graph/Groups/*` | stories | Default off → unchanged | none |
| C6 | `story:usecases/by-casestudies/global-model/GlobalModel` | story | Re-flows on toggle (F9) | visual check |
| C7 | Serialised `CanvasConfig` `behaviours["collapse-expand"]` | persisted state | Additive optional key | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | rAF viewport probe across a toggle with `relayoutOnToggle` | GlobalModel, ELK | **1** distinct camera transform (camera untouched) | F3, F4, F7 |
| V2 | pass | Track the toggled frame's screen box across the run | GlobalModel, collapse AirRoutes | Its centre moves ≤ 2 px; neighbouring frames glide into the freed space over the transition | F5, F7 |
| V3 | pass | Expand after a collapse-time re-layout | GlobalModel | No member overlaps a neighbour frame; neighbours glide out | F5, F7 |
| V4 | pass | Same with Layout → Force | GlobalModel, d3-force, collapse Deals at (700, 121) | Anchor drift ≤ 5 px during settle; rest of the graph stays in view | F6, F11 |
| V5 | pending | **Control**: default (`relayoutOnToggle` off) | `story:graph/Behaviours/CollapseExpand`, GlobalModel with option off | Positions of non-member nodes unchanged by a toggle — today's behaviour | F7 |
| V6 | pass | **Control**: Detail / Layout switchers still fit | GlobalModel | `fitView(60)` still frames after a switch | F3, F4 |
| V7 | pending | Editor toggles it live | GlobalModel settings → Collapse / Expand | Next toggle re-lays / doesn't | F8 |
| V8 | pass | `pnpm check-types` · `pnpm lint` (boundaries + API surface) · `pnpm build` · package tests | repo | green | F1–F9 |
| V9 | pass (with a caveat) | Spike: ELK interactive on GlobalModel | GlobalModel | Frame order preserved across collapse/expand; quality acceptable | F10 |

### Results, 2026-09-25

| Check | Measured |
|---|---|
| V1 · ELK collapse + expand of AirRoutes | 1 camera transform across both toggles — camera untouched |
| V2 · ELK collapse | The AirRoutes tab holds its place (≈ (1255, 479) before and after); Deals / Twitter / NewsArticles glide right to close the freed space |
| V3 · ELK expand | AirRoutes re-opens where its members were; neighbours make room, no overlap |
| V6 · switch Layout ELK → Force | The switcher still fits (zoom 36 % → 48 %) — its runs carry no `preserveCamera` |
| V8 | build · `check-types` · boundaries · canvas-core (143) + graph (193) tests green; API snapshots gain exactly `LayoutRunOptions` (`api/canvas-core.surface.txt`, `api/canvas.surface.txt`) |
| V9 · F10 on vs off (temporarily disabled for the comparison, then restored) | **Off:** collapse re-solves from scratch — Twitter and Deals swap top/bottom and NewsArticles' cards reorder completely; expand then returns exactly to the original. **On:** collapse keeps every frame and card in order; but the collapse→expand round trip drifts (Twitter lands lower, its cards staggered) because INTERACTIVE layering re-reads the seeds each time. Order preservation wins on the step the user watches; drift accumulates over repeated toggles |
| V4 after F11–F13 · force, collapse Deals at (300, 131) | **Pass.** Camera untouched. The Deals tab appears at ≈ (300, 176) — the old frame's centre was ≈ (301, 182) — and stays there through the settle. At +120 ms the graph is drifting up toward the freed space with no compaction or overlap (before F13 it was squeezed with cards overlapping); settled by ~2 s |
| F12 · ELK, collapse AirRoutes | Tab centre ≈ 20 px from the old frame's centre after the re-flow (≈ 45 px before F12). Not chased further |
| F12 control · `story:graph/Behaviours/CollapseExpand` (circle group, no re-layout) | Collapsed circle stays centred on the frame, (365, 450); camera untouched |
| V4 after F11 only · force, collapse Deals at (300, 131) | **Pass, with two open issues.** Camera untouched (1 transform). The graph now moves *with* the tab — neighbours are pulled up toward it, nothing is dragged off-screen. Open: the tab appears at the top edge of the old frame, not its centre (`F12`); and at +120 ms the restarted sim has compacted the graph with cards overlapping, settling by ~2 s (`F13`) |
| V4 before F11 · force, collapse Deals | **Fail.** With anchoring, the Deals tab stays put and the rest of the graph slides ~770 px down, mostly off-screen. With anchoring disabled (comparison, then restored), the graph stays but the tab flies off the top. Cause: the sim drops every edge whose endpoint is not in it, and a collapsed group's members are not — so the tab has **no links**, feels only repulsion, and drifts; anchoring on it moves everything else instead. Fix: `F11` |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Default of `relayoutOnToggle` | off · on | **off**, on in GlobalModel — it moves nodes a user may have hand-placed | accepted (2026-09-24) |
| D2 | What stays fixed during the re-flow | anchor the toggled group · camera follows | **anchor** | accepted (2026-09-24) |
| D3 | ELK stability (F10) now or later | with this RFC · after a spike | **after a spike** — land F1–F9 first; anchoring already removes the worst of it | accepted — with the rest ("approve all"); V9 records the round-trip drift |
| D4 | Should a toggle re-layout honour nodes the user has **dragged** (pinned)? | re-place them · keep them | **keep pinned nodes where they are** if the layout already supports pins; otherwise out of scope | accepted — d3-force already honours `pinned` (anchoring is skipped when a run has pins); ELK has no pin support, out of scope |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-24 | Opened | proposed | Maintainer asked whether to re-run the layout on toggle "with gentle animation", then agreed to the proposal (off by default / on in GlobalModel; anchor the toggled group). Found while scoping: every layout run re-fits the camera (M4), so `preserveCamera` is required, not optional |
| 2026-09-25 | All rows approved | accepted | Maintainer: "approve all" (incl. F10, D3, D4) |
| 2026-09-25 | F1–F10 implemented | implemented | V1–V3, V6, V8, V9 pass. Corrections: F4 touches three wrappers, not five; sankey records but does not anchor. V4 fails on force — root cause is pre-existing (collapsed frames lose their edges in d3-force); `F11` proposed |
| 2026-09-25 | F11 approved and implemented | implemented | Maintainer: "yes". `collectLayoutEdges` in both force paths (static `snapshotStatic`, live `runLive`). V4 passes on linkage; types, graph tests (193), boundaries, API surface green. Note: F11 also changes force output on graphs with **no** collapsed group — parallel edges now count once (GlobalModel's force framing went 48 % → 58 %). Found while verifying: `F12`, `F13` |
| 2026-09-25 | F12, F13 approved and implemented | implemented | Maintainer: "ok". F13: an anchored live run starts at `reheatAlpha ?? 0.3` (doc on `reheatAlpha` extended to the live re-flow). F12: `GraphLayer.centreCollapsedFrame` on the runtime `node:state` collapse — measures the drawn frame and the tab's own spec box, moves the group node so the tab is centred on the frame. Types, canvas-core (143) + graph (193) tests, boundaries, API surface green. Every row now `implemented`; `landed` waits on merge to `main` |
| 2026-09-25 | F14 proposed | proposed | Found while verifying `rfc:feat-2026-09-25-collapsed-count-is-a-centred-label-not-a-badge`: collapse AirRoutes (Medium) → Detail → High → expand. The members kept their Medium positions (M3); the frame re-opened around them far off-screen and the anchor (F5) held it there, sliding the whole graph out of view with the camera unchanged |
| 2026-09-25 | F14 approved and implemented | implemented | Maintainer: "yes". First two versions centred the members' box (then members + `groupInsets`) and left the re-opened frame ~19 px low in `story:graph/Groups/NestedGroups` — the frame also honours a declared size floor. Measuring the group's own expanded spec fixed it: collapse → expand now returns NestedGroups to its exact starting picture. GlobalModel: collapse (Medium) → Detail High → expand opens AirRoutes where its tab was, graph stays in view; a plain collapse → expand returns to the original. Types, graph tests (193), boundaries, API surface green |
