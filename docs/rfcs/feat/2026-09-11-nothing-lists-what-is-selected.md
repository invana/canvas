---
id: feat-2026-09-11-nothing-lists-what-is-selected
type: feat
title: The selection is a count in the status bar and a set of ids in the store — nothing lists what is actually selected
status: accepted
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: doc:docs/canvas-state-plan.md
relations:
  - { predicate: relates-to, object: doc:docs/ui-consolidation-plan.md }
  - { predicate: relates-to, object: rfc:feat-2026-09-02-focus-does-not-mark-the-target }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-selected-element-properties-are-invisible }
---

# Nothing lists what is selected

Add `sym:SelectionViewPanel` to `pkg:@invana/canvas-ui` — a docked view panel that lists the
**current selection**, split into a **Nodes** section and an **Edges** section, read from the
**kernel store** (`view.interaction.selection`, D11) rather than from a behaviour. Per row:
**focus**, **deselect**; in the header: **clear all**, **hide selected**.

| | |
|---|---|
| Gap | The selection exists in two places a user cannot inspect: a bare count in `sym:GraphStatusBar` (`file:packages/canvas-ui/src/components/GraphStatusBar.tsx#L152`) and a `ReadonlySet<string>` in `view.interaction.selection`. Select 40 nodes with a lasso and the only feedback is "40" |
| Shape | A sibling of `sym:FindInCanvasViewPanel` / `sym:CanvasFiltersViewPanel`: takes a live `canvas` prop, renders rows with a swatch + display name + id, docks into `sym:GraphCanvasApp`'s `right` region |
| Source | `canvas.store.view` → `interaction.selection` via `sym:useStore` (D-1). The set is **flat ids**; node-vs-edge is resolved by `sym:GraphStore.getNode` / `sym:GraphStore.getEdge` (both O(1), `file:packages/graph/src/store/GraphStore.ts#L251-L262`) |
| Write path | Selection **writes** go through `sym:ClickSelectBehaviour` (`deselect` / `clearSelection`), never `store.actions.selection.*` directly — the behaviour owns the selection *visuals* and the raise set, so a direct store write would leave a selected-looking element that is no longer selected (D-2) |
| Non-goal | A new selection mechanism, selection persistence, multi-canvas selection, editing element data from the panel, or a Storybook story (rule 11 — D-5) |
| Row status | rows: **implemented 10** (F1–F10) · verification: **pass 1** (V1) · **pending 9** (V2–V10 are browser checks the implementing session can't run) · decisions: **accepted 7** (D-1 … D-7) · **open 0** |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | The only UI for the selection is a count | `file:packages/canvas-ui/src/components/GraphStatusBar.tsx#L43-L152` | `useSelection(...)` → `{selectionCount > 0 && …}`. No ids, no names, no per-element action |
| S2 | The kernel already owns a semantic selection set, and no UI reads it | `file:packages/canvas-core/src/state/view/CanvasView.ts#L41` | `selection: ReadonlySet<string>` — "the semantic selection set (D11 — owned here, not in a behaviour)". Zero readers in `pkg:@invana/canvas-ui` |
| S3 | After a lasso/brush over a dense graph there is no way to see *which* elements were caught, or to drop one without re-doing the gesture | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L431` | `deselect(id)` exists on the behaviour and is reachable from no UI surface |
| S4 | Every neighbouring panel already solves a *different* list problem — hidden elements, search results, layers — so the missing one is conspicuous | `file:packages/canvas-ui/src/view-panels/` | `canvas-filters/`, `find-in-canvas/`, `layers/`, `schema/`, `styling/` — and an **empty `selection/` folder**, placed but never filled |
| S5 | `sym:ClickSelectBehaviour.selection:change` carries a snapshot already split into `shapeIds` / `connectorIds`, but consuming it couples a panel to a behaviour instance | `file:packages/canvas-react/src/hooks/useSelection.ts#L37-L52` | `behaviours.get<ClickSelectBehaviour>(clickSelectId)` — the hook returns empty and `clear` no-ops when that id is absent |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `sym:useSelection` is enough — just render its two arrays | **No, but it is the fallback** | It reads a behaviour, not the kernel (S5), and the ask is explicitly "from store". It stays the right tool for `sym:GraphStatusBar`'s count |
| R2 | The store set can be rendered directly, without the graph store | **No** | It is a flat `Set<string>` with no kind and no label — `view` is domain-free by design (`file:packages/canvas-core/src/state/view/CanvasView.ts#L14-L17`). The split and the names come from `sym:GraphStore` |
| R3 | The store set is reliably populated by every selection mode | **Yes for click/brush/lasso, no in general** | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L594-L598` mirrors on every `applySelection`, and lasso/brush delegate there. But with **no `sym:ClickSelectBehaviour` registered** nothing writes the set — the panel is then correctly empty, and must say why (F7) |
| R4 | `useStore` can be called with a possibly-null canvas | **No** | Hooks cannot be conditional. `sym:CanvasSettingsEditorPanel` already solved this with a shell + `*Content` split (`file:packages/canvas-ui/src/editor-panels/canvas-settings/CanvasSettingsEditorPanel.tsx#L296-L329`) — F2 copies it verbatim |
| R5 | The panel needs its own subscription to `selection:change` as well | **No** | The store slice identity changes on every `actions.selection.set(...)` (a fresh `Set`), so `Object.is` re-renders correctly with a module-scope selector. A second subscription would be a second source of truth |
| R6 | A selected element is always in the graph store | **No** | `snapshot.shapeIds` includes ids expanded by `degree` hops, and a node can be removed while selected. Unresolvable ids get an "unknown" row rather than being dropped silently (F3) |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | The panel is a **view panel**, not an editor: `packages/canvas-ui/src/view-panels/selection/` (the empty folder from S4), `canvas: GraphCanvas \| null` prop, `layerId = 'graph'` | `sym:FindInCanvasViewPanel` / `sym:CanvasFiltersViewPanel` have exactly this signature | Docks into `sym:GraphCanvasApp`'s `right` region via `sym:useSidePanels` with no context gate — the region hands the live engine to `render(canvas)` |
| G2 | **Read** = `useStore(canvas.store.view, selectSelection)` with a **module-scope** selector `(s) => s.interaction.selection` | `file:packages/canvas-react/src/hooks/useStore.ts#L12-L17` (R4 stability rule); slice identity is swapped per write (`file:packages/canvas-core/src/state/view/createActions.ts#L174`) | Re-renders exactly on selection change, on nothing else. Survives the zustand→Yjs backend swap |
| G3 | **Classify** the flat id set per render: `store.getNode(id)` → node row, else `store.getEdge(id)` → edge row, else an unresolved row | `file:packages/graph/src/store/GraphStore.ts#L251-L262` — two `Map` lookups | O(n) over the selection, not over the graph. A 10k-node graph with 3 selected costs 6 lookups |
| G4 | **Stay live under data change**: a frame-coalesced snapshot bump on the store's `node:update` / `node:remove` / `edge:update` / `edge:remove` stream, so a renamed or deleted selected element updates its row | `sym:FindInCanvasViewPanel` uses this exact pattern (`file:packages/canvas-ui/src/view-panels/find-in-canvas/FindInCanvasViewPanel.tsx#L303-L330`) | Only `add` is dropped from the subscription — an id cannot be selected before it exists |
| G5 | **Write** through `sym:ClickSelectBehaviour`, resolved by `selectBehaviourId = 'click-select'` like every sibling panel | `deselect` `#L431`, `clearSelection` `#L469`, and the raise reconciliation at `#L670-L675` | The visuals, the raise set, and the store set all move together. Writing `store.actions.selection.clear()` instead would clear the set and leave the highlight painted (D-2) |
| G6 | **Focus** reuses the layer's own API — `layer.focusNode(id, { zoom, includeHidden: true })` / `layer.focusEdges([id])` | `file:packages/graph/src/layer/GraphLayer.ts#L1380-L1399`; same call pair as `sym:FindInCanvasViewPanel#L386-L392` | Identical framing behaviour to search results and the parked-elements panel — one focus semantic across the app |
| G7 | **Hide selected** reuses `layer.hideNode` / `layer.hideEdge` | `file:packages/graph/src/layer/GraphLayer.ts#L1174-L1209` | Hidden elements land in `sym:CanvasFiltersViewPanel`'s parked list — the two panels compose instead of each inventing a visibility store |
| G8 | Rows render with `pkg:@invana/ui` chrome + Tailwind tokens only, mirroring the result rows of `sym:FindInCanvasViewPanel` | Root rule 13 | No `CSSProperties`; the one dynamic `style` is the computed swatch colour |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `ls packages/canvas-ui/src/view-panels/selection` | empty directory | S4 confirmed — the slot was reserved and never filled; no prior implementation to supersede |
| T2 | `grep -rn "interaction.selection" packages/canvas-ui packages/canvas-react` | no hits | S2 confirmed — the kernel selection set has no UI reader today |
| T3 | Read `sym:CanvasSettingsEditorPanel#L296-L329` | shell returns a placeholder `Card` when `canvas == null`, body takes `canvas: GraphCanvas` | R4 confirmed — the null-gate pattern exists in-package and needs no invention |
| T4 | Read `sym:ClickSelectBehaviour.applySelection#L580-L598` | emits `selection:change`, **then** mirrors to the store | R3/R5 confirmed — one write per change, store is downstream of the behaviour |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/canvas-state-plan.md` §3.1 | design-of-record | current | D11: selection is owned by `view.interaction`, not a behaviour. This RFC is the first consumer of that decision |
| `doc:docs/ui-consolidation-plan.md` | relates-to | in progress | View panels live in `pkg:@invana/canvas-ui`; canvas-react stays headless. The panel goes to canvas-ui |
| `file:packages/canvas-ui/src/view-panels/find-in-canvas/FindInCanvasViewPanel.tsx` | pattern source | shipped | Row layout, swatch resolution, label precedence, focus+select call pair, frame-coalesced store subscription |
| `file:apps/storybook/CLAUDE.md` | constrains | current | The reference template rule: view-panel stories dock into `right` via `useSidePanels`. Relevant only if D-5 is approved |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/view-panels/selection/SelectionViewPanel.tsx` (new) | `sym:SelectionViewPanel` + `sym:SelectionViewPanelProps` (`canvas`, `layerId='graph'`, `selectBehaviourId='click-select'`, `focusZoom=2`) | The panel exists | low | — |
| F2 | defect | implemented | same file | Shell/`Content` split: shell renders the "no canvas yet" `Card`, body takes `canvas: GraphCanvas` and calls `useStore(canvas.store.view, selectSelection)` | Reads the kernel selection reactively, no conditional hook | low | F1 |
| F3 | defect | implemented | same file | Classify ids → `{ nodes, edges, unresolved }` via `getNode`/`getEdge`; unresolved ids render a muted "not in layer" row | Node/edge split from a flat set, honestly (R6) | low | F2 |
| F4 | defect | implemented | same file | Frame-coalesced re-snapshot on `node:update` / `node:remove` / `edge:update` / `edge:remove` | Rows track renames and deletions | low | F3 |
| F5 | defect | implemented | same file | **Nodes (n)** / **Edges (m)** sections; each row = swatch + display name + id + type badge; header shows the total | The panel's actual job | low | F3 |
| F6 | defect | implemented | same file | Row click → `layer.focusNode` / `layer.focusEdges` (`includeHidden: true`) | Locate a selected element | low | F5 |
| F7 | defect | implemented | same file | Per-row ✕ → `select.deselect(id)`; header **Clear** → `select.clearSelection()`; when no `sym:ClickSelectBehaviour` resolves, both controls are absent and the empty state says the selection is read-only | Prune a selection without re-doing the gesture; honest degradation (R3) | low | F5 |
| F8 | defect | implemented | same file | Header **Hide selected** → `layer.hideNode` / `layer.hideEdge` over the selection, then `clearSelection()` | Selection → parked list, composing with `sym:CanvasFiltersViewPanel` | **medium** — mutates canvas visibility, and the clear-after is a judgement call (D-3) | F5, F7 |
| F9 | defect | implemented | `file:packages/canvas-ui/src/index.ts` | Export `sym:SelectionViewPanel` + props type, next to the other `view-panels/*` exports (`#L792-L883`) | Public surface | low | F1 |
| F10 | dressing | implemented | `file:packages/canvas-ui/src/view-panels/element-display.ts` (new) + `file:packages/canvas-ui/src/view-panels/selection/SelectionViewPanel.tsx` | Extract the duplicated display helpers (`labelOfNode` / `labelOfEdge` / `displayNameOf` / `nodeSwatchColor` / `hexColor` / `solidColorOf`) into one internal module shared with `sym:SelectionViewPanel` and `sym:ElementInspectorViewPanel` | Removes 55 duplicated lines from `sym:SelectionViewPanel`; and — the reason that matters more than the line count — a row and its detail card can no longer disagree about an element's name | **medium** — touches a shipped panel; mitigated by V9 | F5, `rfc:feat-2026-09-11-selected-element-properties-are-invisible` |

## 5 Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CanvasView.interaction.selection` | The read path | A kind-aware selection set later (`Set<{id,kind}>`) would delete F3 — a simplification, not a break |
| U2 | `sym:ClickSelectBehaviour` (`deselect` / `clearSelection` / the store mirror at `#L598`) | The write path, and the *only* writer of the store set | If selection writes move into the kernel actions (the D11 end state), F7 rewires to `store.actions.selection.*` and F2/F3/F5 are untouched |
| U3 | `sym:GraphStore.getNode` / `getEdge` + the `node:*` / `edge:*` event names | Classification and liveness | A renamed event silently freezes the rows — V6 covers it |
| U4 | `sym:GraphLayer.focusNode` / `focusEdges` / `hideNode` / `hideEdge` | Actions | Shared with two shipped panels; a change breaks them first, not this one |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `pkg:@invana/canvas-ui` public API | new export | Two new names (`sym:SelectionViewPanel`, `sym:SelectionViewPanelProps`) | None — additive; canvas-ui is **not** covered by `pnpm check-api-surface` (`file:scripts/check-api-surface.mjs#L41-L54` pins only canvas-core / canvas-store / canvas), so no snapshot to regenerate |
| D2 | `sym:GraphCanvasApp` consumers using `sym:useSidePanels` | opt-in | Can add a `{ id: 'selection', … }` descriptor | None until someone opts in |
| D3 | `sym:CanvasFiltersViewPanel` | behavioural | F8 pushes elements into its parked list | None — that is the intended composition (G7) |
| D4 | `sym:GraphStatusBar` | none | Keeps `sym:useSelection`; the count and the list can disagree only if a non-`click-select` behaviour id is in play | None |
| D5 | `file:packages/canvas-ui/src/view-panels/find-in-canvas/FindInCanvasViewPanel.tsx` | none | F10 landed **without** touching it — the extraction took the helpers out of `sym:SelectionViewPanel` only; this panel keeps its own copies until it too needs them | None — re-verify V9 regardless, it is the control |
| D6 | Serialised state / `sym:exportCanvasState` | none | The panel writes no `view.definition` | None |
| D7 | `story:canvas-ui/apps/AppLayoutV2` | wiring | Its right inspector gains an eighth tab, **Selection**, between Find and Filters — `<SelectionViewPanel canvas={activeCanvas} />`. No new story file (rule 11) | V10 |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm --filter @invana/canvas-ui check-types` + `lint` + `pnpm check-boundaries` | repo | clean — `tsc` silent, eslint 0 errors (6 pre-existing warnings, none in the new file), boundaries intact | F1–F9 |
| V2 | pending | Click one node with `sym:ClickSelectBehaviour` enabled | panel | One row under **Nodes (1)**, **Edges (0)** hidden or shown empty | F3, F5 |
| V3 | pending | Lasso ~20 mixed elements | panel | Both sections populated; the totals match `sym:GraphStatusBar`'s count | F3, F5 |
| V4 | pending | Click a row | canvas | Camera frames that element (node zooms to `focusZoom`) | F6 |
| V5 | pending | ✕ one row, then **Clear** | canvas + panel | The element loses its selection *visual* and leaves the list; Clear empties both | F7 |
| V6 | pending | Rename a selected node's label property, then delete a selected node | panel | Row text updates; deleted row becomes the unresolved row or disappears — never a stale name | F4, F3 |
| V7 | pending | **Hide selected** with 3 nodes selected | canvas + `sym:CanvasFiltersViewPanel` | The 3 vanish from the canvas and appear in the parked list; the selection clears | F8 |
| V8 | pending | Mount with **no** `sym:ClickSelectBehaviour` registered | panel | Empty list, no ✕ / Clear / Hide controls, an explanatory empty state — not a crash | F7 |
| V10 | pending | Open `story:canvas-ui/apps/AppLayoutV2` → rail **Inspector** → **Selection** tab; select on the board | panel | The tab lists the selection and follows the active board when the main strip switches tabs | F1–F9, D7 |
| V9 | pending | **Control (now load-bearing — F10 landed):** `sym:FindInCanvasViewPanel` search → click a result | canvas | Still focuses **and** selects exactly as today — and the new panel now lists that selection | F10, regression |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Which store is the selection read from? | kernel `view.interaction.selection` · `sym:useSelection` (behaviour) · both | **Kernel store** — D11's intent, one source of truth, backend-swappable. The node/edge split is derived (G3) | **accepted** (asked 2026-09-11) |
| D-2 | Do deselect/clear write the store directly, or through the behaviour? | `store.actions.selection.*` · `sym:ClickSelectBehaviour` | **Through the behaviour** — it owns the selection visuals and the raise set (`#L670-L675`); a direct store write would clear the set and leave the highlight painted. Read from the kernel, write through the behaviour, until selection writes move into the kernel (U2) | **accepted** |
| D-3 | What happens to the selection after **Hide selected**? | clear it · keep it (rows now point at hidden elements) | **Clear it** — a hidden element you cannot see is a confusing thing to have selected, and it is already listed in `sym:CanvasFiltersViewPanel` | **accepted** |
| D-4 | Sections vs grouped-by-type | two flat sections · collapsible type groups · flat + kind toggle | **Two sections (Nodes / Edges)** — matches the ask and the sibling panels; type grouping is a later row if selections get large | **accepted** (asked 2026-09-11) |
| D-5 | Which action rows land? | The answer ticked **Focus**, **Deselect/Clear**, **Hide selected** *and* **Read-only for now** — mutually exclusive | All three action sets confirmed 2026-09-11 ("Deselect/Clear, Hide selected"): **F1–F9 land**, read-only cut dropped | **accepted** |
| D-6 | A Storybook story? | none (rule 11) · one under `story:canvas-ui/view-panels/SelectionViewPanel` | **No new story file.** Instead the panel is wired into the existing `story:canvas-ui/apps/AppLayoutV2` right inspector (D7), which is where the other six engine-bound panels are already demonstrated | **accepted** |
| D-7 | Extract the shared display helpers (F10)? | now · later · never | **Later** — duplicating ~50 lines costs less than a refactor of a shipped panel inside a feature RFC. **Unblocked 2026-09-11**: `rfc:feat-2026-09-11-selected-element-properties-are-invisible` is the third panel D-7 named as the trigger, so F10 landed with it | **accepted**, then **unblocked** (F10 `deferred` → `implemented`, same day) |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened after "write SelectionViewPanel … get the selection data from store" | proposed | D-1 / D-4 answered before drafting; D-5's answer was internally contradictory and is carried as an open decision |
| 2026-09-11 | D-5 answered ("Deselect/Clear, Hide selected") — every action row approved; F1–F9 implemented, F10 deferred per D-7 | accepted | V1 green. V2–V9 are browser checks; the RFC stays `accepted` until they pass in Storybook. Implementation notes below |
| 2026-09-11 | Wired into `story:canvas-ui/apps/AppLayoutV2`'s right inspector as the **Selection** tab (D-6 answered: no new story file) | accepted | `pnpm --filter @canvas/storybook check-types` green; V10 added |
| 2026-09-11 | F10 unblocked and landed alongside `rfc:feat-2026-09-11-selected-element-properties-are-invisible` — the third panel D-7 named as its trigger | accepted | Helpers now in `file:packages/canvas-ui/src/view-panels/element-display.ts`; `sym:SelectionViewPanel` imports them and lost 55 lines. `check-types` + `lint` + `check-boundaries` green. **V9 is now a real regression check, not a formality** — the control panel was refactored |

### What the implementation taught us

| ID | Note |
|---|---|
| N1 | G3's classification cannot live in a plain `useMemo([selection, store])` — `sym:GraphStore` is **mutable**, so a rename changes no dependency and the memo never re-runs. The frame-coalesced subscription (F4) had to become a **revision counter** in the dep array, not just a re-render trigger |
| N2 | F6's focus is **focus-only**, deliberately diverging from `sym:FindInCanvasViewPanel#L386-L392`, which pairs `focusNode` with `select.select(id, 'shape')`. In a *selection* panel that pairing would **replace** the whole selection with the row you clicked to look at — the opposite of the panel's job |
| N3 | Unresolved ids (R6) needed a third section, not a dropped row — and their ✕ still works, since `deselect` is by id and needs no layer lookup. That is the only way to clear a selected id whose element no longer exists |
| N4 | `sym:SelectionViewPanelProps.selectBehaviourId` genuinely degrades: with no behaviour resolved the list still renders from the store, and Hide / Clear / ✕ are **absent** rather than inert, with the empty state saying why (V8) |
