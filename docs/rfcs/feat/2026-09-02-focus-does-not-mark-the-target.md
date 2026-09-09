---
id: feat-2026-09-02-focus-does-not-mark-the-target
type: feat
title: Focusing a node or edge also highlights it
status: proposed
opened: 2026-09-02
decided: null
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/per-element-visibility-plan.md }
  - { predicate: relates-to, object: doc:docs/canvas-state-plan.md }
---

**Summary:** `GraphLayer.focusNode` / `focusNodes` / `focusEdges` move the camera and nothing
else, so after a context-menu **Focus** the target sits at screen centre with no visual mark.
Focus gains an opt-out `highlight` that applies the canonical `highlighted` runtime state to
the target through the layer's store, tracked so the next focus (or `clearFocus()`) removes it.

Row status: proposed 5 · accepted 0 · landed 0 · deferred 1 · rejected 1 · superseded 0

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | Focus is camera-only by design: it pans (and optionally zooms) and never touches element state | `file:packages/graph/src/layer/GraphLayer.ts#L1356-L1386` | TSDoc: "Camera-only: it moves the view, nothing else. Selecting / highlighting the node is a separate, opt-in concern" |
| M2 | The context-menu **Focus** item calls `focusNode` alone, so the focused node is indistinguishable from its neighbours once centred | `file:packages/canvas-ui/src/menus/GraphContextMenu.tsx#L73-L78` | `onClick: () => layer?.focusNode(ctx.id, { zoom: focusZoom })`; the **Select** item is a separate entry |
| M3 | The three view panels work around M1 by pairing focus with `ClickSelectBehaviour.select`, and label the action "Focus & select" | `file:packages/canvas-ui/src/view-panels/find-in-canvas/FindInCanvasViewPanel.tsx#L386-L392` · `file:packages/canvas-ui/src/view-panels/canvas-filters/CanvasFiltersViewPanel.tsx#L111-L117` · `file:packages/canvas-ui/src/view-panels/layers/LayersViewPanel.tsx#L610-L623` | Each calls `layer.focusNode(...)` then `select?.select(id, 'shape')`; the mark comes from selection, not focus |
| M4 | A canonical `highlighted` state already exists, auto-merged into every `GraphLayer`, and is unused by any built-in action except `highlightNeighbourhood` | `file:packages/graph/src/layer/types.ts#L1313-L1317` · `file:packages/graph/src/layer/GraphLayer.ts#L930-L941` | `DEFAULT_NODE_STATES.highlighted` = ring `0xfde68a` gap 5; `DEFAULT_EDGE_STATES.highlighted` = stroke `0xfde68a` width 2 |
| M5 | Per-element runtime state is the store's presence compartment, batched into one flush | `file:packages/graph/src/store/GraphStore.ts#L1001-L1051` | `addNodeState` / `removeNodeState` / `addEdgeState` / `removeEdgeState`; `removeNodeState` is a no-op when the state is absent or the id unknown |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | The `view.interaction.focus` slot on `CanvasView` already drives a highlight, and focus just fails to write it | Rejected | `file:packages/canvas-core/src/state/view/CanvasView.ts#L66-L71` declares `focus: { ids, dim } \| null`; the only readers are `file:packages/canvas/src/io/stateExport.ts#L202-L203` and `#L285-L286` (round-trip). No layer or renderer projects it. It is the §7.1B *focal-emphasis* slot (hover neighbourhood dimming), a different concept |
| R2 | The renderer drops the `highlighted` state | Rejected | `HoverActivateBehaviour` and `highlightNeighbourhood` render it today through the same `addNodeState` path (M4, M5) |
| R3 | A behaviour is the right owner (a `FocusBehaviour`) | Rejected | Focus is an imperative action invoked from UI, not a pointer-driven mode; the layer already owns the camera sugar and the store write is one line. A behaviour would need registering + enabling (root rule 7) just to make a menu item work |

---

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D1 | `focusNode` / `focusNodes` / `focusEdges` accept `highlight?: boolean \| string` — `true` (default) applies the runtime state `'highlighted'`; a string names a different state; `false` keeps today's camera-only behaviour | `file:packages/graph/src/layer/GraphLayer.ts#L1356-L1410` | Every existing caller gets the mark without a code change; callers that already select (M3) can opt out or let both compose (D-2) |
| D2 | The layer remembers the focused ids + state it applied (`focusedNodeIds`, `focusedEdgeIds`, `focusedState`); the next focus call removes the previous mark before applying the new one, inside one `store.batch` | M5 | Exactly one focus mark exists per layer; re-focusing a moved target never leaves a stale ring |
| D3 | `clearFocus()` removes the mark and empties the tracked set; `onUnmount` calls it | `file:packages/graph/src/layer/GraphLayer.ts#L617` | No mark survives a remount; no leak into a store reused by another layer |
| D4 | The mark is removed by `removeNodeState(id, state)` on the tracked ids only — never `clearNodeState(state)` | `file:packages/graph/src/store/GraphStore.ts#L1051` | `clearNodeState` wipes the state on *every* node, which would erase a `HoverActivateBehaviour` or `highlightNeighbourhood` using the same state name |
| D5 | Hidden / unknown ids: `removeNodeState` no-ops on unknown ids, and the store already clears a node's runtime states on hide (`applyNodeHidden`) | `file:packages/graph/src/store/GraphStore.ts#L654-L676` · `#L1019-L1022` | Hiding or removing the focused element needs no extra bookkeeping; the tracked set is pruned on the next focus / clear |
| D6 | The store's `raised` projection is untouched — the mark is a state overlay only | `file:packages/canvas-core/src/state/view/CanvasView.ts#L62` | A focused node can still be painted over by a neighbour; lifting is `ClickSelectBehaviour.raiseActive`'s job, not focus's (D-3) |

### Composition with existing states

| Case | Result | Note |
|------|--------|------|
| Focus only (context menu) | `highlighted` ring (`0xfde68a`, gap 5) | The new default |
| Focus + select (view panels, M3) | `highlighted` ring + `selected` ring (gap 7) + halo | Distinct decoration ids (`canonical-hover-ring` vs `canonical-select-ring`) — both draw. Rings overlap by ~1px in similar yellows; see D-2 for the opt-out |
| Focused node then hovered | Hover ring replaces the highlight ring while hovered | `hovered` and `highlighted` share decoration id `canonical-hover-ring`; later state wins (`file:packages/graph/src/layer/types.ts#L1297-L1317`). Pre-existing, deliberate slot sharing |
| `HoverActivateBehaviour` configured with `state: 'highlighted'` | Un-hover removes the focus mark from the focused node if it was in the hovered neighbourhood | `file:packages/graph/src/behaviours/HoverActivateBehaviour.ts#L444-L453`. Pre-existing hazard of sharing a state name; documented on the option, not fixed here |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| `doc:docs/per-element-visibility-plan.md` | relates-to | landed | `focus*` skip hidden elements by default (`includeHidden`); unchanged by this RFC |
| `doc:docs/canvas-state-plan.md` §7.1B | relates-to | design, not wired | The `view.interaction.focus` set+mode slot for O(1) neighbourhood emphasis. Out of scope here (R1, F5); this RFC uses the per-element runtime state because it marks one target, not N |
| `file:packages/graph/src/layer/GraphLayer.ts#L930-L941` (`highlightNeighbourhood`) | relates-to | shipped | Same mechanism (state via store batch); focus applies it to the target only and adds tracking so the mark can be replaced |
| commit `aead1a8b` | supersedes (in part) | shipped | "focus stays orthogonal to selection" still holds — focus never writes `selected`. The "camera-only" sentence in the TSDoc is retired (F1) |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | proposed | `file:packages/graph/src/layer/GraphLayer.ts#L1356-L1386` (`sym:GraphLayer.focusNode`, `sym:GraphLayer.focusNodes`) | Add `highlight?: boolean \| string` (default `true`) to both option bags. After resolving positions, remove the previous mark (D2) and `addNodeState` the new targets with the resolved state name in one `store.batch`. Rewrite the TSDoc: focus = locate + mark; selection stays separate | Focused nodes get the `highlighted` ring | **medium** — changes how every existing focus call looks (context menu, three panels, any consumer calling `focusNode`). Public option surface grows; no barrel export changes, so `api/*.surface.txt` is untouched | — |
| F2 | defect | proposed | `file:packages/graph/src/layer/GraphLayer.ts#L1399-L1410` (`sym:GraphLayer.focusEdges`) | Same `highlight` option; `addEdgeState` on the resolved edge ids | Focused edges get the `highlighted` stroke | medium — same reach as F1 for edges | F1 (shared tracking) |
| F3 | defect | proposed | `file:packages/graph/src/layer/GraphLayer.ts` (new `sym:GraphLayer.clearFocus`, hook in `onUnmount` `#L617`) | Track `focusedNodeIds` / `focusedEdgeIds` / `focusedState`; `clearFocus()` removes the mark via `removeNodeState` / `removeEdgeState` on tracked ids only (D4) and resets the set; called from `onUnmount` | A consumer can drop the mark without knowing the state name; remount never leaks it | low | F1 |
| F4 | dressing | proposed | `file:packages/canvas-ui/src/menus/GraphContextMenu.tsx#L37`, `#L73-L78` · the three panels in M3 | TSDoc / tooltip wording only: **Focus** "frames and highlights"; panels keep "Focus & select". No behavioural change — they inherit F1's default | Docs match behaviour | low | F1 |
| F5 | defect | rejected | `file:packages/canvas-core/src/state/view/CanvasView.ts#L71` (`view.interaction.focus`) | Write the focused id into the §7.1B focal-emphasis slot and have `GraphLayer` project it | Would make focus observable on the kernel store | — | Rejected for this RFC: nothing reads the slot (R1); wiring it is the §7.1B neighbourhood-emphasis feature and deserves its own RFC. Marking one element through the existing runtime-state path is the smaller, already-rendered mechanism |
| F6 | dressing | deferred | `sym:GraphLayer.focusNode` option `highlightMs?: number` | Auto-remove the mark after a delay (a "locate" pulse) | Mark fades instead of sticking | low, but puts a timer in the layer | Deferred pending D-1. Unblocked by choosing a timed lifetime |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | `sym:GraphStore.addNodeState` / `removeNodeState` / `addEdgeState` / `removeEdgeState` / `batch` | The only write path F1–F3 use | Stable, tested (`file:packages/graph/tests/store/GraphStore.test.ts`) |
| U2 | `DEFAULT_NODE_STATES.highlighted` / `DEFAULT_EDGE_STATES.highlighted` (`file:packages/graph/src/layer/types.ts#L1313-L1335`) | The default look of the mark | A layer built with `useDefaultStates: false` and no `highlighted` overlay renders no mark — the state is applied but styles nothing. Documented on the option |
| U3 | `sym:Camera.centerOn` / `setZoom` | Unchanged; focus still frames first | — |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| C1 | `file:packages/canvas-ui/src/menus/GraphContextMenu.tsx` **Focus** item | UI | Gains the mark by default — the visible change the RFC exists for | F4 wording only |
| C2 | `FindInCanvasViewPanel` · `CanvasFiltersViewPanel` · `LayersViewPanel` (M3) | UI | Focus + select now show both rings (composition table) | None if D-2 keeps the default; pass `highlight: false` if D-2 chooses selection-only |
| C3 | `story:graph/Behaviours/ContextMenu/ContextMenu` · `story:FindInCanvasViewPanel` · `story:CanvasFiltersViewPanel` · `story:LayersViewPanel` · `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` | Stories | Look changes after a Focus action; no code edit (root rule 11) | Smoke-test only (V4) |
| C4 | Any external consumer calling `layer.focusNode(...)` | Published API | Now marks the target; `highlight: false` restores the old behaviour. Return type and existing option names unchanged | Release note |
| C5 | `HoverActivateBehaviour` users with `state: 'highlighted'` | Behaviour | Un-hover can strip the focus mark (composition table, last row) | Documented on the `highlight` option; no code change |
| C6 | `api/canvas.surface.txt` etc. | Surface snapshot | No new barrel exports (options are inline types) | None; V5 confirms |
| C7 | `pkg:@invana/canvas-ui` editors (root rule 12) | Editors | Not applicable — no new Behaviour / Layer / Layout | None |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pending | Unit (`file:packages/graph/tests/layer/`, new `GraphLayerFocus.test.ts`) | `focusNode('a')` then `store.hasNodeState('a','highlighted')` | `true`; `focusNode('b')` → `a` false, `b` true; `clearFocus()` → both false | F1, F3 |
| V2 | pending | Unit | `focusNode('a', { highlight: false })` | No runtime state on `a`; camera still moves (control for the opt-out) | F1 |
| V3 | pending | Unit | `focusEdges(['e1'])` then `focusEdges(['e2'])` | `e1` unmarked, `e2` marked; `focusNode('a', { highlight: 'custom' })` applies `custom` | F2, F1 |
| V4 | pending | Storybook smoke (visible tab) | `story:graph/Behaviours/ContextMenu/ContextMenu` → right-click a node → **Focus** | Camera centres and the node shows the pale-yellow ring; **Focus** on another node moves the ring | F1, F4 |
| V5 | pending | `pnpm lint` (`check-api-surface`, `check-boundaries`) + `pnpm check-types` | repo | Green with no snapshot regeneration | F1–F3 |
| V6 | pending | Control — Storybook | `story:FindInCanvasViewPanel` → click a result | Still frames + selects (selected ring + halo present, as today) | C2 |
| V7 | pending | Control — unit | `highlightNeighbourhood('a')` then `focusNode('b')` then `clearFocus()` | `a` and its neighbours keep `highlighted` (D4: tracked ids only) | F3 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D-1 | Mark lifetime | (a) sticky until next focus / `clearFocus()` · (b) timed pulse via `highlightMs` (F6) · (c) cleared on next pointer interaction | **(a)** — no timers or input listeners in a layer, deterministic, one line to clear. (b) stays available as F6 if the sticky ring proves annoying | open |
| D-2 | View panels that already select: keep the default mark (both rings) or pass `highlight: false`? | keep default · opt out | **Keep default** — one meaning of "focused" regardless of entry point; the two rings are distinct slots and the selected halo dominates. Revisit if the overlap reads badly in V6 | open |
| D-3 | Should focus also raise the target (`view.interaction.raised`) so neighbours can't paint over it? | yes · no | **No** — lifting is `ClickSelectBehaviour.raiseActive`'s concern; keeping focus a pure state overlay avoids a second raise source | open |
| D-4 | Default state name | `'highlighted'` · new `'focused'` canonical state | **`'highlighted'`** — already in the catalogue with a rendered default for nodes and edges; a new canonical state would touch `CanonicalStateName`, both default tables, and every editor listing states | open |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-09-02 | Opened | proposed | Triggered by: "focus on node should also highlight it". F5 rejected at open (no reader for `view.interaction.focus`); F6 deferred on D-1 |
