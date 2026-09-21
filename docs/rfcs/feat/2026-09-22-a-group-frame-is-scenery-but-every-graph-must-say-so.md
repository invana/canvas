---
id: feat-2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so
type: feat
title: Hover and click-select skip an expanded group frame by default, without the graph naming its types
status: accepted
opened: 2026-09-22
decided: 2026-09-22
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes }
  - { predicate: supersedes, object: rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/invana-architecture/EndToEnd }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/agent-harness/Architecture }
---

## Summary

| | |
|---|---|
| **What is asked** | Group node types are excluded from hover and click interactions **by default** — a graph should not have to enumerate its frame types to stop grazing them |
| **What exists** | `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes` landed `excludeNodeTypes` / `excludeEdgeTypes` on both behaviours yesterday. They default to `[]`, so every graph re-declares its own scenery by type string |
| **The seam** | `sym:GraphLayer.getGroupRole` already exists and returns `'none' \| 'expanded' \| 'collapsed'`, documented as *"Public predicate behaviours can use to filter group nodes out of their own hit pipeline"*. **It has zero callers** (`file:packages/graph/src/layer/GraphLayer.ts#L2521`) |
| **The reversal** | This revisits `D1` of that RFC, where option (b) *"a group-specific `hoverGroups: false` boolean"* was rejected under the constraint **"no group-specific code path in a behaviour"**. `D1` here asks for that constraint to be lifted, for groups only |
| **Feature rows** | `F1` `F2` (the option + default on both behaviours) · `F3` `F4` (their editors) · `F5` (the layer contract prose) · `F6` `F7` (the two stories the default changes) · `F8` (redundant story config) · `F9` (the story that keeps `excludeNodeTypes` demonstrated) |
| **Open decisions** | None — `D1`–`D6` all accepted at the recommendation, 2026-09-22 |
| **Row status** | proposed 0 · accepted 0 · implemented 9 · landed 0 · deferred 0 · superseded 0 — `F1`–`F9` implemented and building. Rows reach `landed` when `V1`–`V10` are checked in a browser |

**This is a breaking default.** Every row below is additive code, but `F1`/`F2` change
what a mounted behaviour *does* with no config change — which is the point of the request
and also the reason `C1`–`C3` are not low risk.

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | A frame is scenery in **every** graph that draws one, yet each graph must name its own frame types twice (hover + click-select) to say so | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L113` · `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L109` | Both default `[]` |
| M2 | The exclusion axis is `sym:GraphNode.type` — a domain string — but the property that makes a frame scenery is structural (`style.group`), and the two are unrelated. A graph whose frames share a type with content nodes cannot express the exclusion at all | `file:packages/graph/src/layer/GraphLayer.ts#L2488` (`isGroupNode` reads resolved `style.group`) | `L3` of `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes` records the same coupling from the other side |
| M3 | The engine already has the structural predicate, written for this exact purpose, and nothing calls it | `file:packages/graph/src/layer/GraphLayer.ts#L2505-L2527` | *"Hover / select / drag should typically skip groups when the group is expanded (the frame is interaction-less) but treat a collapsed group as a regular node"* |
| M4 | The default's cost is concentrated: `autoFit` frames are mostly uncovered area, so the larger the frame the more of the canvas is a dead hover that also dims everything when `inactiveState` is set | `S2` of the prior RFC | — |
| M5 | Only three stories in the repo both draw frames and mount hover/click-select; two of them would change behaviour, and one of those changes documented behaviour | see `C1`–`C3` | grep of `style.group` × `HoverActivateBehaviour`/`ClickSelectBehaviour` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The landed `excludeNodeTypes` already covers this — the graph just lists its frame types | **Insufficient, not wrong.** It works per graph, by domain type, restated per behaviour. `M2` is the case it cannot express | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L891-L902` matches on `node.type` only |
| R2 | Make the frame unpickable instead (`hittable: false` on `sym:BaseShapeSpec`) | **No** — already rejected, and still right | *"Not doing, and why it matters"* in the prior RFC: it would take `sym:DragNodeBehaviour`'s group-drag, `sym:NodeResizeBehaviour`'s handles and `sym:CollapseExpandBehaviour`'s double-click with it |
| R3 | A new default breaks the collapse toggle, since collapse claims `pointer+click` | **No** | `sym:CollapseExpandBehaviour` binds native DOM `pointerdown` / `dblclick` on the canvas element, not the renderer's shape channel — independent of click-select (`file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L126-L131`) |
| R4 | The nine `story:graph/Groups/*` stories will change | **No** | None of them mounts `sym:HoverActivateBehaviour` or `sym:ClickSelectBehaviour` — verified by grep. The prior RFC's `C2` assumed they did |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | Both behaviours already funnel every focal candidate through one private `isExcluded(id, type)` before any state is applied | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L891` · `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L751` | One insertion point each; no new gate, no new call site |
| D-2 | `isExcluded` already goes to the store for the record rather than trusting the element payload (whose `type` is the *render* kind) | `L7` of the prior RFC | It is already in the right place to ask the layer a structural question |
| D-3 | Add `excludeGroups` to both option bags, resolved in `resolveOptions` like every other field, and consult `layer.getGroupRole(id)` inside `isExcluded` for `type === 'shape'` | `file:packages/graph/src/layer/GraphLayer.ts#L2521` | A frame is vetoed by what it *is*, not by what it is called |
| D-4 | Default it to the value that skips an **expanded** frame and leaves a **collapsed** one interactive | `M3` — the predicate's own documented intent | A collapsed frame is the only visible stand-in for its hidden members; making it unhoverable would leave a collapsed group with no interaction at all |
| D-5 | `getGroupRole` calls `isGroupNode` → `resolveNodeStyle`, one merge per call | `file:packages/graph/src/layer/GraphLayer.ts#L2488-L2492` | Cost is one style merge per `pointerover` / click, not per frame — but it is on the hover path, so `F1` returns on the cheap checks first |
| D-6 | The veto stays **focal-only**, exactly like the type lists: a frame reached by `degree` expansion still highlights as a neighbour | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L100-L104` | "Don't hover *at* me", not "never show me as related" — unchanged |

**Why a default and not a recipe.** The alternative is to leave `[]` and document
"list your frame types". That is what shipped yesterday, and `M1`/`M2` are the report
that it does not hold up: the property is structural, the declaration is per-graph, and
the engine already knows the answer.

**What the default costs, stated plainly.** `sym:HoverActivateBehaviour.collectRaiseTargets`
(`file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L741-L761`) exists *only*
to handle a hovered expanded frame — it lifts the frame's members and their internal
edges instead of the frame. Under the new default that path is unreachable unless the
consumer opts back in. It is a documented, deliberate feature (`D5` decides its fate).

### Confirming test

| Test | Action | Result today | Inference |
|---|---|---|---|
| T1 | Hover the tinted padding of a stage frame in `story:usecases/by-casestudies/invana-architecture/EndToEnd` | The frame's members and internal edges lift above the neighbouring stages | `collectRaiseTargets` is live and load-bearing in a shipped story → `D5` is a real decision, not a formality |
| T2 | Hover the same padding in `story:usecases/by-casestudies/agent-harness/Architecture` | The frame highlights and, with `degree: 1` and no edges on the frame, nothing else does | The prior RFC's `S1`/`S2` reproduce in a second story that never declared an exclusion → `M1` |
| T3 | Hover a package frame's gap in `story:usecases/by-casestudies/code-explainability/CodeExplainability` | Nothing happens | The per-graph opt-out works — `R1`'s "not wrong" half |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes` | supersedes | accepted | Everything except `D1`'s rejection of a group-aware option. `F1`–`F4`/`F8` (the type lists) stay and remain the escape hatch for non-group scenery; `F5`'s corrected prose needs one more sentence (`F5` here). Its `D3` (collapsed frames) is re-asked here as `D3` because the answer changes when the axis stops being `type` |
| `rfc:fix-2026-08-05-group-frame-occludes-edges` | relates-to | landed | `plane: 'backdrop'` — the *paint* half of "a frame is scenery". This is the input half, finished |
| `file:packages/graph/src/layer/types.ts#L872-L876` | relates-to | current | Rewritten by the prior RFC's `F5` to say the frame **is** picked and scenery opts out per behaviour. `F5` below updates it again: opting out is now the default |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts` | Add `excludeGroups?: GroupExclusion` to the options + `ResolvedOptions` + `resolveOptions`, **defaulting to `'expanded'`**; consult it in `isExcluded` (`#L891`) via `layer.getGroupRole(id)` for `type === 'shape'`, after the cheap type-list check. Mirror the mid-hover release already done for `excludeNodeTypes` at `#L460` | An expanded frame never becomes the focal hover in any graph, with no config | **not low** — changes behaviour of every mounted instance with no opt-in | D1, D2, D3 |
| F2 | defect | implemented | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts` | Same option, same default, same insertion point (`#L751`); a click on a frame stays a no-op that leaves the selection intact rather than clearing it, as `excludeNodeTypes` already does | An expanded frame is unselectable by click in any graph | **not low** — same reason | D1, D2, D3 |
| F3 | defect | implemented | `file:packages/canvas-ui/src/editors/behaviours/hover-activate/` | `excludeGroups` through `types.ts` + `fields.ts` + `mapping.ts` as a `type: 'select'` row (the `direction` field at `fields.ts#L59` is the precedent) | Root rule 12: the new setting is editable in `sym:CanvasSettingsEditorPanel` | low | F1, D2 |
| F4 | defect | implemented | `file:packages/canvas-ui/src/editors/behaviours/click-select/` | Same | Same | low | F2, D2 |
| F5 | defect | implemented | `file:packages/graph/src/layer/types.ts#L872-L876` | Extend the expanded-group paragraph: the frame is still picked (drag / resize / collapse depend on it), but hover and click-select now **decline it by default**, and `excludeGroups: 'never'` opts back in | The contract states the new default instead of the old opt-in | low | F1, F2 |
| F6 | defect | implemented | `file:apps/storybook/stories/usecases/by-casestudies/invana-architecture/EndToEnd.stories.tsx` | Set `hover: { excludeGroups: 'never' }` to **keep** the documented stage-raise, and rewrite the docblock paragraph that explains it to say it is now opt-in | The story that uses frame-hover as a feature keeps working and says why it is explicit | low, but it is a doc change in a story just rewritten | F1, D5 |
| F7 | defect | implemented | `file:apps/storybook/stories/usecases/by-casestudies/agent-harness/Architecture.stories.tsx` | Nothing — the default fixes it. Docblock line noting frames are inert | `T2`'s symptom disappears with no config | low | F1 |
| F8 | dressing | implemented | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx` | Remove `excludeNodeTypes: ['package']` from `hover` and `click-select` in both `CARD_CONFIG` and `DOT_CONFIG` — four lines the default now covers | The story stops carrying a workaround for an engine default | low — but it **deletes the only in-repo demonstration of the type-list option**, so do it only if a `story:graph/Behaviours/*` demo replaces it | F1, F2 |

| F9 | defect | implemented | `file:apps/storybook/stories/graph/Behaviours/ExcludeNodeTypes.stories.ts` | New story: a service topology plus a **legend** (`type: 'legend'`) and a `watermark`, drawn as ordinary nodes in world space. No node carries `style.group`, so `excludeGroups` never fires and the type lists are the only lever. lil-gui toggles both lists, plus `excludeGroups` across all three values to show it does nothing here | `excludeNodeTypes` / `excludeEdgeTypes` keep a worked example after `F8` deletes their only in-repo use | low | F8 |

**Why `F8` needed `F9` first.** `F8` deletes the only four lines in the repo that set
`excludeNodeTypes`, leaving a public option on two behaviours and two editors with no
worked example — which is how an option comes to read as dead weight. `F9` is the
unblocker named when `F8` was deferred on 2026-09-22, and it carries the case
`excludeGroups` structurally cannot: **scenery that is not a frame**. Landed together.

**Why `F8` is dressing.** It removes no cause and fixes no symptom; it tidies a config
that the default makes redundant. It is listed separately so it can be rejected without
touching `F1`–`F7`.

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.getGroupRole` | The entire veto is this call | Low — it exists, is public, and is documented for exactly this. This RFC is its first caller |
| U2 | `sym:GraphLayer.isGroupNode` → `sym:GraphLayer.resolveNodeStyle` | One style merge per hover/click event | Low; if `resolveNodeStyle` ever becomes expensive, the veto is on the hover hot path |
| U3 | The behaviours hold `this.layer` as `GraphLayer \| null` | `isExcluded` already returns `false` when the layer is absent | None |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:usecases/by-casestudies/invana-architecture/EndToEnd` | story | **Documented behaviour changes.** Its docblock teaches frame-hover-raises-contents; the default kills it | `F6` — opt back in with `excludeGroups: 'never'` |
| C2 | `story:usecases/by-casestudies/agent-harness/Architecture` | story | Frames stop hovering. This is the wanted outcome | `F7` (doc only) |
| C3 | `story:usecases/by-casestudies/code-explainability/CodeExplainability` | story | No visible change — already excluded by type; the default now also covers it | `F8`, optional |
| C4 | `story:graph/Groups/*` (9), `story:graph/Behaviours/{CollapseExpand,DragNode,GroupResize}` | story | **None** — none mounts hover or click-select (`R4`) | None |
| C5 | `sym:CollapseExpandBehaviour` | runtime | None — native DOM listeners, not the renderer's shape channel (`R3`) | None |
| C6 | `sym:DragNodeBehaviour` · `sym:NodeResizeBehaviour` · `sym:ContextMenuBehaviour` · `sym:HoverElementPreviewBehaviour` · `sym:ClickInspectBehaviour` · `sym:ClickViewBehaviour` | runtime | Untouched — `D4` scopes this to the two behaviours named. Dragging and resizing a frame must keep working, so they are deliberately out | None, unless `D4` widens |
| C7 | `sym:HoverActivateBehaviourOptions` · `sym:ClickSelectBehaviourOptions` | published API | One optional field each, plus an exported `GroupExclusion` union. Additive to the type; **not** additive to behaviour | None for compilation; consumers relying on frame hover must set `'never'` |
| C8 | Serialised `sym:CanvasConfig` JSON | state | Additive optional key. **A saved config written before this lands silently changes behaviour on load** — it has no `excludeGroups`, so it takes the new default | None mechanical; it is the migration cost of `D1` |
| C9 | `sym:CanvasSettingsEditorPanel` | UI | One new select row in each of the Hover and Click-select sections, everywhere the panel is mounted — including the three panels added to `story:…/EndToEnd` on 2026-09-22 | `F3`, `F4` |
| C12 | `story:graph/Behaviours/ExcludeNodeTypes` | story | New; the repo's only demonstration of the type-list axis after `F8` | `F9` |
| C10 | `api/*.surface.txt` | published API | No snapshot exists for `pkg:@invana/graph` or `pkg:@invana/canvas-ui` — `api/` pins canvas-core / canvas-store / canvas only (`L5` of the prior RFC) | None |
| C11 | `sym:HoverActivateBehaviour.collectRaiseTargets` + its two doc blocks | runtime | Unreachable under the default; reachable only via `excludeGroups: 'never'` | `D5` |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Hover a stage frame's tinted padding | `story:usecases/by-casestudies/agent-harness/Architecture` | Nothing highlights, nothing dims — with no config in the story | F1, F7 |
| V2 | pending | Click the same padding | same | Selection unchanged (not cleared) | F2 |
| V3 | pending | **Control** — hover a box *inside* a frame | same | Highlights, 1-hop neighbours highlight, as today | F1 |
| V4 | pending | **Control** — collapse a stage, then hover and click the collapsed frame | `story:usecases/by-casestudies/invana-architecture/EndToEnd` | Both work: a collapsed frame is an ordinary node under the `'expanded'` default | F1, F2, D3 |
| V5 | pending | **Control** — drag a frame, resize it, double-click to collapse | same | All three unchanged — the veto is input-scoped to two behaviours, not a pick removal | C5, C6 |
| V6 | pending | With `F6` applied, hover a stage frame | same | Members + internal edges lift, exactly as documented today | F6, D5 |
| V7 | pending | Settings → Hover → "Exclude groups" → `Never`, then back to `Expanded`, in the panel docked in that story | same | Live both ways; switching to `Expanded` releases an in-flight frame hover | F3, F4 |
| V8 | pending | **Control** — a graph with no group nodes at all | `story:canvas-ui/view-panels/StylingViewPanel` (microservices, no frames) | Hover and select unchanged; `getGroupRole` returns `'none'` | F1, F2 |
| V9 | **pass** | `pnpm check-types` · `pnpm build` · `pnpm lint` (incl. `check-boundaries`, `check-api-surface`) | repo | pass | F1–F9 |
| V10 | pending | Toggle "exclude scenery nodes" off, then sweep the pointer across the legend | `story:graph/Behaviours/ExcludeNodeTypes` | Each legend node becomes the focal hover and `inactiveState: 'dimmed'` greys all eleven services; toggling back on makes them inert | F9 |
| V11 | pending | **Control** — with the exclusion **on**, drag a legend node | same | It drags. The veto is input-scoped, not a pick removal | F9 |
| V12 | pending | **Control** — cycle `excludeGroups` through `expanded` / `always` / `never` | same | Nothing changes — no node here is a group | F9, F1 |
| V13 | pending | **Control** — hover a package frame's gap | `story:usecases/by-casestudies/code-explainability/CodeExplainability`, both looks | Still inert after `F8` removed the type lists — now by the engine default | F8 |

`V1`–`V8` are pointer-position checks against a WebGL canvas; there is no browser
automation in this repo, so they are a manual pass in a **visible** Storybook tab.

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Lift yesterday's constraint *"no group-specific code path in a behaviour"*? | (a) yes, for groups only — a behaviour may ask `sym:GraphLayer.getGroupRole` · (b) no — keep `type` as the only axis and accept `M1`/`M2` | **(a)**. The constraint was set to keep settings serialisable and editor-visible; `excludeGroups` is a JSON enum and appears in the panel, so the letter of it holds. What changes is that the behaviour learns one structural fact the layer already exposes for this purpose | accepted |
| D2 | Option shape and name | (a) `excludeGroups?: 'expanded' \| 'always' \| 'never'`, default `'expanded'` · (b) `excludeGroups?: boolean`, default `true`, meaning expanded-only · (c) `interactiveGroups?: boolean` (inverted sense) | **(a)**. It names all three states the seam already distinguishes, renders as a `select` row with the existing generator, and leaves room without a breaking rename. (b) cannot express `'always'`; (c) inverts the sense of its `excludeNodeTypes` sibling | accepted |
| D3 | Does the default cover a **collapsed** frame? | (a) no — expanded only (`'expanded'`) · (b) yes — every frame (`'always'`) | **(a)**. A collapsed frame is the only visible stand-in for its hidden members, so it must stay hoverable and selectable. Note this **differs from the prior RFC's `D3`**, which answered (b) — correctly, because there the axis was `type`, and a type is the same string open or closed | accepted |
| D4 | Which behaviours get the default? | (a) `sym:HoverActivateBehaviour` + `sym:ClickSelectBehaviour` only · (b) also `sym:ContextMenuBehaviour` / `sym:HoverElementPreviewBehaviour` / `sym:ClickInspectBehaviour` / `sym:ClickViewBehaviour` · (c) also brush / lasso | **(a)** — the two the request names, and the two that already carry the type-list option. (b) is a reasonable follow-up: a right-click menu on a frame is arguably scenery too, but it is also how a "collapse this group" menu would be reached. (c) stays refused, per the prior RFC's `D2` | accepted |
| D5 | What happens to hover's group-raise path (`C11`)? | (a) keep it, reachable via `excludeGroups: 'never'`, and `F6` uses it · (b) delete it as dead code · (c) keep the code but stop documenting it | **(a)**. It is ~20 lines, it is the correct behaviour *when* a frame is hoverable, and `story:…/EndToEnd` is a live consumer. Deleting it would make `'never'` a worse experience than today | accepted |
| D6 | Is a per-**layer** default needed (e.g. `GraphLayerOptions.groupsAreScenery`)? | (a) no — per behaviour is enough · (b) yes — one place per graph | **(a)** for now. Two behaviours × one enum is a small surface; a layer-level default adds a third precedence tier to explain, and nothing has asked for it | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-21 | `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes` lands `excludeNodeTypes` / `excludeEdgeTypes`; `D1` there rejects a group-aware option | — | Constraint recorded: no group-specific code path in a behaviour |
| 2026-09-22 | Maintainer asks for group node types to be excluded from hover and click **by default** | proposed | Reopens that `D1`; this RFC written, no code |
| 2026-09-22 | Approved whole; `D1`–`D6` accepted at their recommendations | accepted | `D1` lifted for groups only — a behaviour may ask `sym:GraphLayer.getGroupRole`, which this RFC makes its first caller |
| 2026-09-22 | `F1`–`F7` implemented; `F8` deferred | accepted | `V9` **pass** — `pnpm check-types` (19 tasks) · `pnpm build` (20) · `pnpm lint` 0 errors, boundaries + api-surface + node-import intact. `V1`–`V8` await a manual pass in a visible Storybook tab |
| 2026-09-22 | Maintainer asked whether `excludeNodeTypes` is now useless; answer: no — different axis (non-group scenery, per-type control of collapsed frames, and the whole edge half), but every *use* in the repo had become redundant | accepted | The option was real and undemonstrated — the actual risk `F8`'s deferral was protecting against |
| 2026-09-22 | `F9` opened and implemented, `F8` un-deferred; both landed together | accepted | `V10`–`V13` pending, `V9` re-run and still **pass** |

## 9. What the implementation taught

| ID | Lesson | Evidence |
|---|---|---|
| L1 | `sym:GraphLayer.getGroupRole`'s three-state return was worth the design it was given — `excludeGroups` maps onto it with no adaptation, and `'always'` costs one extra comparison. A boolean seam would have needed widening on the first request for `'always'` | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts` `isExcluded` |
| L2 | The structural veto has to run **before** the type-list check, not after. The type lists default to `[]` and return early on `length === 0`; putting the group check second would have made the early return unreachable and paid a `resolveNodeStyle` merge on every pointerover in graphs with no frames at all | both `isExcluded` bodies |
| L3 | No new mid-hover release wiring was needed. `setOptions` already re-runs `isExcluded(this.current…)` after resolving the patch (`file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L460`), so switching the setting in the panel releases a live frame hover for free — that guard was written for the type lists and generalised without being touched | `V7` |
| L4 | `GroupExclusion` is declared in `HoverActivateBehaviour` and imported by `ClickSelectBehaviour`, following the `sym:HoverDirection` precedent — but **not** re-aliased the way `SelectDirection` is. "Hover direction" reads wrong for a selection; "group exclusion" reads right for both, so the alias would have been noise | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L34` |
| L5 | The editor barrels export neither `HoverDirection` nor `ClickSelectDirection`, so the two new enums follow suit and stay reachable structurally through the `*Options` types. That is also why `check-api-surface` stayed clean without regeneration | `file:packages/canvas-ui/src/editors/behaviours/hover-activate/index.ts` |
| L6 | `R4` was the useful correction to the prior RFC: its `C2` listed nine `story:graph/Groups/*` stories as affected consumers, and none of them mounts either behaviour. The real blast radius was three usecase stories — two of which needed a line each | grep of `style.group` × the two behaviour class names |
