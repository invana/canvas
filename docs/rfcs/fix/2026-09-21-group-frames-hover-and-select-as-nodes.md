---
id: fix-2026-09-21-group-frames-hover-and-select-as-nodes
type: fix
title: An expanded group frame is picked like an ordinary node, so grazing its padding hovers and selects it
status: accepted
opened: 2026-09-21
decided: 2026-09-21
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: caused-by, object: file:packages/graph/src/layer/types.ts#L872-L876 }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/code-explainability/CodeExplainability }
  - { predicate: relates-to, object: rfc:fix-2026-08-05-group-frame-occludes-edges }
---

## Summary

| | |
|---|---|
| **What breaks** | Moving the pointer across a package frame's padding or header hovers the *frame* — it lights up and, with `inactiveState`, dims all 42 cards at once. Clicking it selects it. |
| **Root cause** | `sym:GraphLayer.nodeSpec` emits a group frame as an ordinary shape spec; nothing in the spec or the picking index marks it unpickable. `file:packages/graph/src/layer/types.ts#L872-L876` documents the opposite ("non-hittable"), and that promise was never implemented. |
| **Defect rows** | `F1` `F2` (serialisable exclusion on the two behaviours) · `F3` `F4` (their editors) · `F8` (the edge-type half) · `F6` (the story) — **landed** |
| **Dressing rows** | `F7` — the story-local `enable` predicate, landed 2026-09-21 and **superseded** by `F6` the same day |
| **Still open** | `F5` — the two false contracts in `file:packages/graph/src/layer/types.ts` are untouched and now contradict the TSDoc added by `F1` |
| **Open decisions** | `D2` (brush / lasso) — deliberately out of scope, they have their own selection paths |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 6 · deferred 1 · superseded 1 |

**How it went, 2026-09-21.** Approved in two steps. First the story alone, which could
only be done with the pre-existing `enable` callback (`F7`) — that shipped, then the
maintainer reopened the engine change asking for the serialisable option on **both node
and edge types**. `F1`–`F4` + `F8` landed and `F6` replaced the callback with JSON. `F5`
was never approved and is the one thing left: `file:packages/graph/src/layer/types.ts#L872-L876`
still claims an expanded frame is non-hittable, and `#L186-L190` still declares a
`disabled` state nothing honours.

Design constraint set by the maintainer, and the reason `D1` resolves the way it does:
**everything that is a setting is JSON in the story's config.** No callback options, no
group-specific code path in a behaviour.

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Hovering a package frame (its padding, its header band, any gap between cards) highlights the frame itself | `story:usecases/by-casestudies/code-explainability/CodeExplainability` | Reported by the maintainer, 2026-09-21 |
| S2 | The same hover dims **every** card, because the package node has no edges, so `degree: 1` expansion adds nothing and `inactiveState: 'dimmed'` covers the rest of the graph | same | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx#L322` — `hover: { degree: 1, inactiveState: 'dimmed' }` |
| S3 | Clicking the same empty area selects the frame | same | `'click-select': { enabled: true, multiple: true }`, same config block |
| S4 | The documented contract says this cannot happen | `file:packages/graph/src/layer/types.ts#L872-L876` | *"is **non-hittable** — pointer events pass through the frame to the canvas background. The frame is a pure drawing, not an interactive node."* |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `plane: 'backdrop'` was supposed to remove the frame from picking | **No** — visual only, by design | `file:packages/canvas-core/src/specs/shape.ts#L22-L25`: *"Purely visual — hit resolution still reads `zIndex` recorded at insert, so a backdrop shape is picked exactly as it was before."* |
| R2 | `zIndex = -1` sinks the frame below its cards, so a card always wins | **True but insufficient** | `sym:PickingIndex.pickHover` ranks by `zIndex` among shapes that *contain* the point (`file:packages/canvas-store/src/hit/PickingIndex.ts#L497`). Over a gap no card contains the point, so the frame is the only candidate and wins unopposed |
| R3 | The frame is hovered because `degree` expansion reached it through an edge | **No** | Package nodes in `dataset:canvasDataflow` carry no edges; `S2` is a consequence of the frame being the *focal* element, not a neighbour |
| R4 | A hover-only heuristic (incidence bias / hysteresis) is pulling the pick onto the frame | **No** | Both refine a raw winner; with no competing candidate the raw winner is already the frame (`file:packages/canvas-store/src/hit/PickingIndex.ts#L436-L455`) |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | The story marks package nodes as groups with `autoFit: true`, so each frame grows to its children's bbox + `padding: 28` + `headerHeight: 26` | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx#L227` | A large rect whose area is mostly *not* covered by cards |
| D-2 | `sym:GraphLayer.nodeSpec` builds the frame as a normal shape spec; for an expanded group it only sets `zIndex -= 1` and `plane: 'backdrop'` | `file:packages/graph/src/layer/GraphLayer.ts#L1621-L1625` | Nothing distinguishes the frame from a node downstream |
| D-3 | `sym:BaseShapeSpec` has no `hittable` / `pickable` channel — the spec vocabulary cannot express "drawn but not picked" | `file:packages/canvas-core/src/specs/shape.ts#L11-L45` | `D-2` could not opt out even if it wanted to |
| D-4 | `sym:PickingIndex.insertShape` indexes every shape's AABB unconditionally | `file:packages/canvas-store/src/hit/PickingIndex.ts#L280-L283` | The whole frame is a pick target |
| D-5 | Over a gap, the frame is the only shape containing the point, so `pickHover` returns it and the renderer emits `shape:pointerover` for the frame id | `file:packages/canvas-store/src/hit/PickingIndex.ts#L494-L499` | → `S1` |
| D-6 | `sym:HoverActivateBehaviour.handlePointerOver` gates on `type === 'connector' && !hoverEdges` and on the `enable` predicate — neither of which can express "not this kind of node" in JSON | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L486-L497` | The frame activates; with no edges to expand into, `inactiveState` dims everything else → `S2` |
| D-7 | `sym:ClickSelectBehaviour` has the identical gate at `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L528` | same shape of code | → `S3` |
| D-8 | The `types.ts` prose was written against an intended design, and no row of code ever enforced it | `file:packages/graph/src/layer/types.ts#L872-L876` vs `D-3` | → `S4`: the docs are the spec and the code never met it |

**Why exactly this symptom, and not another.** If the frame were merely mis-ordered, a
card would still win where a card is drawn — and it does: hovering a card behaves
correctly. The defect appears *only* over the frame's uncovered area, which is precisely
where `zIndex` ranking has nothing to rank against. That is the fingerprint of an
unconditional index insert (`D-4`), not of a z-order bug.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Hover a card, then slide onto the gap beside it inside the same frame | Highlight jumps from the card to the whole frame; the other 41 cards dim | `D-5` + `D-6` confirmed |
| T2 | Hover the canvas background outside every frame | Hover clears normally | The frame, not the background, is the pick winner — rules out a general hover-clearing bug |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-08-05-group-frame-occludes-edges` | relates-to | landed | Introduced `plane: 'backdrop'` for the frame's *paint* order. Explicitly left picking alone — this RFC is the picking half of the same story |
| `doc:docs/group-frame-paint-band-plan.md` | relates-to | superseded | Its diagnosis (a frame is scenery, not content) is the same intuition this RFC applies to input |
| `file:packages/graph/src/layer/types.ts#L872-L876` | caused-by | stale | The intended contract, unimplemented. `F5` corrects it rather than pretending it held |

## 4. The fix

The axis is **node `type`**, not "group" — `sym:GraphNode.type` is required on every record
(`file:packages/graph/src/store/types.ts#L47`), so a string array is a complete,
serialisable way to say "these are scenery". No behaviour learns what a group is.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts` | Add `excludeNodeTypes?: string[]` (default `[]`) to the options + `ResolvedOptions` + `resolveOptions`; gate in `handlePointerOver` beside the existing `hoverEdges` gate. Clears an active hover when the type is added mid-hover, mirroring `hoverEdges` at `#L406` | A node whose `type` is listed never becomes the focal hover, and never dims the rest | low — additive, default is today's behaviour | — |
| F2 | defect | landed | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts` | Same option, same default, gate at `#L528` | Listed types are unselectable by click | low — additive | — |
| F3 | defect | landed | `file:packages/canvas-ui/src/editors/behaviours/hover-activate/` | `excludeNodeTypes` through `types.ts` + `fields.ts` + `mapping.ts` as a string-list field | Root rule 12: the new setting is editable in `sym:CanvasSettingsEditorPanel` | low | F1 |
| F4 | defect | landed | `file:packages/canvas-ui/src/editors/behaviours/click-select/` | Same | Same | low | F2 |
| F5 | defect | deferred | `file:packages/graph/src/layer/types.ts#L872-L876` | Rewrite the "non-hittable" paragraph to state what is true: an expanded frame **is** picked like any node (which is what makes drag / resize / double-click-collapse work), and scenery opts out per-behaviour via `excludeNodeTypes` | The documented contract stops being a lie | low | F1, F2 |
| F6 | defect | landed | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx` | `excludeNodeTypes: ['package']` in **both** `CARD_CONFIG` and `DOT_CONFIG` under `hover` and `click-select` — four JSON lines, no code | The reported symptom is gone in the story that reported it | low | F1, F2 |

| F7 | **dressing** | superseded by `F6` | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx` | A `notAFrame` predicate passed as `enable` to `hover` and `click-select` in **both** `CARD_CONFIG` and `DOT_CONFIG`. Keys off `data.symbol !== 'package'` — the callback receives `{ id, type, data }` with `data = node.data`, so `sym:GraphNode.type` is out of scope (`file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L825-L834`) | The reported symptom is gone in this story | low in blast radius, **high in honesty cost** — it is a callback where the maintainer asked for JSON, it is duplicated across two configs, and it leaves `S4` (the false contract) standing | — |

| F8 | defect | landed | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts` · `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts` | `excludeEdgeTypes?: string[]`, the `GraphEdge.type` sibling of `F1`/`F2`. Scope added by the maintainer after `F1` was accepted; a shared private `isExcluded(id, type)` reads whichever list matches the render kind | Edge types can be scenery too — a `contains` / `layout-hint` predicate that shouldn't own the hover | low — same guard, same default `[]` | F1, F2 |

**Why `F7` is dressing, not the fix.** It vetoes the *reaction* to a pick that should
arguably never have resolved to the frame. `D-3` and `D-4` are unchanged: the frame is
still indexed, still wins the pick over its own padding, and still does this in every
other story. The RFC stays open on that account.

**Not doing, and why it matters.** A `hittable: false` channel on `sym:BaseShapeSpec`
would remove the frame from picking wholesale — and take `sym:DragNodeBehaviour`'s
group-drag (`file:packages/graph/src/behaviours/DragNodeBehaviour.ts#L70`),
`sym:NodeResizeBehaviour`'s handles, and `sym:CollapseExpandBehaviour`'s double-click with
it. Per-behaviour exclusion keeps all three.

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphNode.type` is required and free-form | The whole exclusion axis is this field | None today — it is already required on every record |
| U2 | `sym:PickingIndex` ranking | Unchanged by this RFC; the frame stays indexed | None — no pick semantics move |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | Every mounted `sym:HoverActivateBehaviour` / `sym:ClickSelectBehaviour` | runtime | Default `[]` = today's behaviour exactly | None |
| C2 | `story:graph/Groups/*` (RectGroup · CircleGroup · NestedGroups · CircleNestedGroups · FixedSizeGroup · GroupVisibility · GroupWithEdges · AllOptions · HackerStyle) | story | Unchanged — they keep hovering frames | None, unless `D2` widens |
| C3 | `story:graph/Behaviours/CollapseExpand` · `story:graph/Behaviours/GroupResize` · `story:graph/Behaviours/DragNode` | story | Depend on the frame being pickable; untouched by a hover/select-only exclusion | None |
| C4 | API surface snapshots | published API | **No snapshot exists** for `pkg:@invana/graph` or `pkg:@invana/canvas-ui` — `api/` pins only canvas-core / canvas-store / canvas. Nothing to regenerate (verified: `check-api-surface` clean) | None |
| C5 | `sym:HoverActivateBehaviourOptions` · `sym:ClickSelectBehaviourOptions` | published API | Two optional fields each. Additive; no existing caller changes | None |
| C6 | Serialised `sym:CanvasConfig` JSON | state | Additive optional key; old configs load unchanged | None |
| C7 | `sym:CanvasSettingsEditorPanel` | UI | Two new text rows in each of the Hover and Click-select sections, everywhere the panel is mounted | None |
| C8 | `story:usecases/by-casestudies/code-explainability/CodeExplainability` | story | Both look configs carry `excludeNodeTypes: ['package']` on hover + click-select | Landed with `F6` |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Hover the gap inside a package frame | `story:usecases/by-casestudies/code-explainability/CodeExplainability`, Cards | Nothing highlights, nothing dims | F1, F6 |
| V2 | pending | Click the same gap | same | Selection unchanged — `isExcluded` returns before any selection path, so a frame click is inert rather than clearing | F2, F6 |
| V3 | pending | **Control** — hover a symbol card | same | Card highlights, 1-hop neighbours highlight, the rest dims, exactly as today | F1 |
| V4 | pending | **Control** — double-click a package frame, then drag it | same (`collapse-expand` + `drag-node` are enabled) | Collapses; the collapsed node drags | F1, F2 — proves the veto is input-scoped, not a pick removal |
| V5 | pending | **Control** — `story:graph/Groups/RectGroup`, which sets no exclusion | that story | Frame still hovers as it does today (default `[]`) | F1 |
| V6 | pending | Open Settings → Hover, edit "Exclude node types"; then clear it | `story:…/CodeExplainability` | Live effect both ways. Adding a type releases an in-flight hover on it (the `setOptions` guard); clearing restores frame hover | F3, F4 |
| V7 | **pass** | `pnpm check-types` (19 tasks) · `pnpm build` on the two packages | repo | pass, 2026-09-21 | F1–F4, F6, F8 |
| V8 | **pass** | `pnpm lint` — incl. `check-boundaries` and `check-api-surface` | repo | pass, 0 errors. Surfaces unchanged: `api/` pins only canvas-core / canvas-store / canvas, none of which this touches | C4, C5 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | What is the exclusion keyed on? | (a) `excludeNodeTypes: string[]` · (b) a group-specific `hoverGroups: false` boolean · (c) a per-node `interactive` channel on `sym:NodeStyle` + `sym:BaseShapeSpec` | **(a)**, and it stands as the design for whenever `F1` is reopened. Deferred with it — `F7` shipped the pre-existing `enable` callback first; `F1`/`F2` then landed (a) and `F6` replaced the callback with it | accepted |
| D2 | Which behaviours get the option? | (a) hover + click-select only · (b) also `sym:BrushSelectBehaviour` / `sym:LassoSelectBehaviour` | **(a)** landed. Brush / lasso select by geometry through their own paths and were not asked for; the same two keys drop in when wanted. Both are disarmed in the motivating story | accepted |
| D3 | Does the exclusion cover a **collapsed** frame too? | (a) yes — `type` is `type`, a listed type is never hovered · (b) no — a collapsed frame is an ordinary node standing in for its contents, so keep it hoverable | **(a)**. `F7` already behaves as (a): `data.symbol` is `'package'` open or closed, so a collapsed package frame is unhoverable too. If that reads wrong in use, it is the first evidence for (b) | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-21 | Symptom reported against the code-explainability story | proposed | Hovering a package frame highlights it and dims the graph |
| 2026-09-21 | Diagnosed to `D-3`/`D-4`; `S4` found — the documented contract was never implemented | proposed | — |
| 2026-09-21 | Maintainer constraint recorded: settings are JSON in the story, no group-specific methods | proposed | Resolved `D1` toward (a) |
| 2026-09-21 | Maintainer approved the **story change only** — engine untouched | accepted | `F1`–`F6` → `deferred`; `F7` added as `dressing` and landed |
| 2026-09-21 | `F7` implemented; `tsc --noEmit` on `pkg:@canvas/storybook` clean | accepted | `V1`–`V5` await a visual pass in Storybook |
| 2026-09-21 | Maintainer reopened the engine change, asking for **node *and* edge** type lists on both behaviours | accepted | `F1`–`F4` un-deferred; `F8` opened for the edge half |
| 2026-09-21 | `F1`–`F4`, `F8` implemented; `F6` replaced the `F7` callback with `excludeNodeTypes: ['package']` | accepted | `F7` → `superseded`. `V7` + `V8` pass (build · check-types · lint · boundaries · api-surface) |
| 2026-09-21 | `F5` left unapproved and open | accepted | The RFC cannot reach `landed` until it is resolved one way or the other |

## 9. What the implementation taught

| ID | Lesson | Evidence |
|---|---|---|
| L1 | The story-only route **cannot** be JSON. `excludeNodeTypes` was the serialisable form and it lives in `pkg:@invana/graph`; with the engine off-limits the sole existing lever is the `enable` callback, which predates this RFC | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L63-L66` |
| L2 | The predicate must key off `data.symbol`, **not** `sym:GraphNode.type`. `sym:HoverableElement` / `sym:SelectableElement` carry only `{ id, type, data }`, and their `type` is `'shape' \| 'connector'` — the render kind, not the node's domain type | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L825-L834` |
| L3 | That makes `F7` dataset-coupled in a way `F1` would not have been: it depends on `dataset:canvasDataflow` tagging packages with `symbol: 'package'` in the payload. A dataset that carried the distinction only on `node.type` could not be fixed story-locally at all | `file:packages/graph-datasets/src/canvas-dataflow/data.ts#L116` |
| L4 | A function option is invisible to `sym:CanvasSettingsEditorPanel` — the editors mirror only the serialisable subset. That was the decisive argument for replacing `F7` with `F1`; it is also why the new option is a list of strings and not a richer match object | `file:packages/canvas-ui/src/editors/behaviours/hover-activate/types.ts#L18-L22` |
| L5 | **`C4` was wrong.** There is no API-surface snapshot for `pkg:@invana/graph` or `pkg:@invana/canvas-ui`; `api/` pins only canvas-core, canvas-store and canvas. The estimate assumed every package is pinned | `ls api/` → 3 files; `check-api-surface` clean with no regeneration |
| L6 | The forms generator has no list field type, so both editors encode `string[]` as comma-separated text. `file:packages/canvas-ui/src/editors/behaviours/color-by/mapping.ts#L5-L12` had already set that precedent for number arrays — the new `parseTypeList` is its string twin, duplicated in both editor folders rather than hoisted, matching how `color-by` keeps its parser local | `file:packages/canvas-ui/src/editors/behaviours/hover-activate/mapping.ts` |
| L7 | The exclusion could not read `sym:GraphNode.type` off the element payload — `sym:HoverableElement.type` is the *render* kind (`'shape'` / `'connector'`). `isExcluded` takes the raw id and goes to the store, which is also why it is cheap: it returns on an empty list before any lookup | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts` |
