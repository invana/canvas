---
id: feat-2026-09-11-selected-element-properties-are-invisible
type: feat
title: You can see which elements are selected, but not what any one of them actually holds
status: proposed
opened: 2026-09-11
decided: null
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: doc:docs/canvas-state-plan.md
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-11-nothing-lists-what-is-selected }
  - { predicate: relates-to, object: doc:docs/ui-consolidation-plan.md }
---

# Selected element properties are invisible

Add `sym:ElementInspectorViewPanel` to `pkg:@invana/canvas-ui` — a docked, **read-only** detail
panel for **one element at a time**, node or edge, driven by **`sym:ClickInspectBehaviour`** —
the element the user **clicked**, not the selection (D-8). Identity, endpoints (edges), `data`
properties, element state. The *detail* companion to `sym:SelectionViewPanel`, which answers the
other question: what is *selected*.

| | |
|---|---|
| Gap | `sym:SelectionViewPanel` answers "which elements", never "what is in this one". The only surface that renders `data` at all is an **editor** — `sym:InspectorPanel` → `sym:PropertiesEditor` — which needs `sym:ClickInspectBehaviour`, wants a `GraphHistoryProvider` for undoable commits, and floats in a corner rather than docking (S2, S3) |
| Shape | A sibling of `sym:SelectionViewPanel` / `sym:FindInCanvasViewPanel`: live `canvas` prop, `layerId='graph'`, single scrolling body (no internal tabs — D-3), docks into `sym:GraphCanvasApp`'s `right` region |
| Source | `sym:ClickInspectBehaviour`'s `inspect:change` (D-8) — **not** the selection. The behaviour hands back `{kind,id}`; name, `data` and style come from `sym:GraphStore.getNode` / `getEdge` |
| Write path | **None.** The panel is read-only (D-2): it never writes `data`, never writes the selection. Its one canvas effect is the camera, via `sym:GraphLayer.focusNode` / `focusEdges` |
| Non-goal | Editing element data (that is `sym:InspectorPanel` + `sym:PropertiesEditor`), deprecating `sym:InspectorPanel`, style overrides, a per-element history/provenance store, multi-element diffing, or a Storybook story (rule 11 — D-6) |
| Row status | rows: **implemented 15** (F1–F2, F4–F16) · **superseded 1** (F3) · verification: **pass 1** (V1) · **pending 12** (V2–V3, V7–V16 are browser checks the implementing session can't run) · **superseded 3** (V4–V6) · decisions: **accepted 7**, **1 reversed** (D-1 by D-8) · **open 0** |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | The selection panel that just landed shows **name + id + type label** per row and stops there — no properties, no endpoints, no position | `file:packages/canvas-ui/src/view-panels/selection/SelectionViewPanel.tsx#L300-L330` | The node row renders `displayNameOf(n)`, `n.id`, `labelOfNode(n)`. `n.data` is never read |
| S2 | The only surface in the repo that renders an element's `data` is an **editor**, not a view | `file:packages/canvas-ui/src/toolbars/InspectorPanel.tsx#L43-L88` | `useEntityEditor(...)` → `<PropertiesEditor defaults={{label, type, data}} onSubmit={target.commit}/>`. To *look* at a value you open a form that can overwrite it |
| S3 | That inspector is a floating corner `sym:Panel`, so it cannot join the docked side-panel set | `file:packages/canvas-ui/src/toolbars/InspectorPanel.tsx#L80-L88` | `<Panel position={position} orientation="vertical">`, default `'top-right'`. `sym:useSidePanels` composes `*ViewPanel` surfaces into the activity bar — a `Panel` is not one |
| S4 | An edge's `source` / `target` are displayed **nowhere** read-only | `file:packages/graph/src/store/types.ts#L106-L135` | `GraphEdge.source` / `.target` are required fields; `sym:SelectionViewPanel` shows them only as an inline `a → b` fragment on the row, unlinked and untruncatable |
| S5 | The data is already reachable from canvas-ui — one panel walks every element's `data` keys and throws the values away | `file:packages/canvas-ui/src/view-panels/find-in-canvas/FindInCanvasViewPanel.tsx#L330-L340` | `for (const k of Object.keys(el.data)) keys.add(k)` — keys become dropdown options; values are matched against and never rendered |
| S6 | A downstream product has already hand-rolled this panel, against its own types rather than the engine's | `file:../invana/studio/src/pages/graphs-detail/features/explorer/InspectorPanel.tsx` | `InspectorPanel({selected, allItems, …})` over `QueryResultItem` — type badge, id, endpoints, properties. The engine-level surface it should have composed does not exist |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Give `sym:InspectorPanel` a `readOnly` flag instead | **No** | It would still be a `sym:PropertiesEditor` form with disabled inputs, still floating (S3), and still targeted by `sym:ClickInspectBehaviour` rather than the selection (D-1). Different source, different chrome, different folder (`toolbars/` vs `view-panels/`) — a flag would fuse two surfaces that disagree on all three |
| R2 | Expand a `sym:SelectionViewPanel` row in place | **No** | That panel's job is the **set** — its header counts, clears and hides the whole selection. Per-element detail inside an accordion row makes a list that is sometimes a list. Master/detail as two composable panels is the shape the sibling panels already use |
| R3 | The kernel store can supply the properties directly | **No** | `interaction.selection` is `ReadonlySet<string>` (`file:packages/canvas-core/src/state/view/CanvasView.ts#L41`) and `view` is domain-free by design. `data` lives only on `sym:GraphStore`; the panel must resolve ids against the layer (G3) |
| R4 | The pager can hold a numeric index into the selection | **No — this is the trap** | The mirror rebuilds the set on every change as `[...snapshot.shapeIds, ...snapshot.connectorIds]` (`file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L598`), so deselecting an element **shifts every later index**. Index 2 would silently become a different element. The pager pins the **id** and derives the index (G5) |
| R5 | `useStore` can be called with a possibly-null canvas | **No** | Hooks cannot be conditional; `sym:CanvasSettingsEditorPanel` (`file:packages/canvas-ui/src/editor-panels/canvas-settings/CanvasSettingsEditorPanel.tsx#L296-L329`) and `sym:SelectionViewPanel` both use a shell + `*Content` split. F2 copies it |
| R6 | A selected id always resolves to an element in the layer | **No** | Same as `rfc:feat-2026-09-11-nothing-lists-what-is-selected` R6 — a node can be removed while selected, and `degree`-expanded ids may belong elsewhere. The panel reports the id as unresolved rather than rendering blank (F4) |
| R7 | `String(value)` is good enough for a property value | **No** | `sym:GraphNode.data` is `unknown` user payload (`file:packages/graph/src/store/types.ts#L48-L49`); an object renders as `[object Object]` — exactly what S6's reference does. Non-primitives need `JSON.stringify` with a length cap (F6) |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | A **view panel**: `packages/canvas-ui/src/view-panels/element-inspector/`, props `{ canvas: GraphCanvas \| null, layerId='graph', focusZoom=2, elementId?, className? }` | `sym:SelectionViewPanel` / `sym:FindInCanvasViewPanel` have this exact signature | Docks into `sym:GraphCanvasApp`'s `right` region through `sym:useSidePanels`, which hands the live engine to `render(canvas)` — no context gate |
| G2 | **Read** the selection with a **module-scope** selector: `useStore(canvas.store.view, (s) => s.interaction.selection)` | `file:packages/canvas-react/src/hooks/useStore.ts#L12-L17`; slice identity swaps per write | Re-renders on selection change and nothing else; survives the zustand→Yjs swap |
| G3 | **Resolve** the inspected id: `store.getNode(id)` → node, else `store.getEdge(id)` → edge, else unresolved | `file:packages/graph/src/store/GraphStore.ts#L251-L262` — two `Map` lookups | O(1) per render regardless of graph size. Unlike the list panel this resolves **one** id, not the whole set |
| G4 | **Order** = `[...selection]`, i.e. the mirror's nodes-then-edges insertion order | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L598` | The pager's "2 of 7" is stable and explicable; it is the same order `sym:SelectionViewPanel` lists in |
| G5 | **The pager pins an id, not an index.** Local `inspectedId` state; the index is `order.indexOf(inspectedId)`. When that id leaves the selection, fall to the same **position** (clamped), else the first | R4 | Deselecting element 1 leaves you looking at the element you were looking at, not at its neighbour |
| G6 | `elementId` prop **overrides** the selection when given (controlled mode); uncontrolled otherwise | Mirrors S6's `selected` prop | A host can drive the panel from its own list (search result, table row) without a selection write |
| G7 | **Liveness**: a frame-coalesced revision counter on `node:update` / `node:remove` / `edge:update` / `edge:remove`, in the memo's dep array | `sym:GraphStore` is **mutable** — N1 of `rfc:feat-2026-09-11-nothing-lists-what-is-selected`. `file:.../FindInCanvasViewPanel.tsx#L298-L326` is the pattern | An edited property updates in place; a deleted element becomes the unresolved state rather than a stale card |
| G8 | **Body** = four stacked sections, one scroll: **Identity** (kind badge · swatch · display name · id) → **Endpoints** (edges only: `source` / `target`, each a button that focuses that node) → **Properties** (`data` rows) → **State** (`type`, `hidden`, `pinned`, `position` for nodes; `hidden` for edges) | S6's order, minus its app-specific provenance block; `file:packages/graph/src/store/types.ts#L38-L135` names the state fields | Provenance-before-content (S6's stated principle) is preserved as the D-5 slot rather than as a dataset dependency canvas-ui cannot take |
| G9 | **Value formatting**: primitives verbatim; `null`/`undefined` as a muted `—`; objects/arrays `JSON.stringify`d and capped, full value in `title` | R7 | No `[object Object]`, no 40 KB blob wedging the panel |
| G10 | Chrome is `pkg:@invana/ui` only — `Badge`, `Separator`, `Button`, `PropertyList` / `PropertyRow` for the rows — plus Tailwind tokens | Root rule 13; `PropertyRow` (`label` + `mono`) exists in the kit and aligns every value on one x | One dynamic `style`: the computed swatch colour, as in `sym:SelectionViewPanel` |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep -rn "\.data" packages/canvas-ui/src/view-panels/` | only `FindInCanvasViewPanel` (key harvesting), never a rendered value | S1/S5 confirmed — no read-only property surface exists |
| T2 | Read `file:packages/canvas-ui/src/toolbars/InspectorPanel.tsx` | 88 lines, `useEntityEditor` + `PropertiesEditor` + `Panel` | S2/S3 confirmed; R1's three-way mismatch is real |
| T3 | Read `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L590-L598` | set rebuilt from `[...shapeIds, ...connectorIds]` on every `applySelection` | R4 confirmed — index paging is unsound, id pinning is required |
| T4 | grep the `pkg:@invana/ui` built `.d.ts` export list for the row primitives | `PropertyList`, `PropertyRow`, `Badge`, `TabbedPanel`, `TabConfig` all exported | G10 needs no new primitive; D-3's tabbed alternative was genuinely available and was declined on consistency grounds, not availability |

## 3 Prior art

| Doc / file | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-nothing-lists-what-is-selected` | relates-to (master/detail sibling) | accepted | The whole read path: shell/`Content` split, module-scope selector, revision-counter liveness (N1), unresolved-id honesty (R6), and the display helpers |
| `file:../invana/studio/src/pages/graphs-detail/features/explorer/InspectorPanel.tsx` | reference implementation | shipped downstream | Section order, the node/edge badge, endpoints block, id in mono. **Not** carried over: `QueryResultItem`, `ProvenanceBlock`, the dataset link, the "Design — coming soon" tab, `String(val)` |
| `file:packages/canvas-ui/src/toolbars/InspectorPanel.tsx` | coexists-with | shipped | Stays exactly as is — the **edit** path. This RFC adds the **look** path; R1 records why they don't merge |
| `file:packages/canvas-ui/src/view-panels/preview-cards.tsx` | pattern source | shipped | `PreviewCardRow` label/value/mono row shape, and `NodePreviewCard`'s tag + divider rhythm |
| `doc:docs/canvas-state-plan.md` §3.1 | design-of-record | current | D11 — the selection is owned by `view.interaction`. Second consumer after the selection panel |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/view-panels/element-inspector/ElementInspectorViewPanel.tsx` (new) | `sym:ElementInspectorViewPanel` + `sym:ElementInspectorViewPanelProps` (`canvas`, `layerId='graph'`, `elementId?`, `focusZoom=2`, `renderExtra?`, `className?`) | The panel exists | low | — |
| F2 | defect | implemented (amended by F13) | same file | Shell/`Content` split — shell renders the "no canvas" `Card`, body takes `canvas: GraphCanvas` and calls `useStore` | Reactive read, no conditional hook (R5) | low | F1 |
| F3 | defect | **superseded by F13** | same file | ~~`inspectedId` state pinned by **id**, resolved against `[...selection]`; clamped fallback on removal; `elementId` overrides (G5, G6)~~ — removed: with one clicked element there is no set to page | A stable pager (no longer needed) | **medium** — the one piece of genuine state in the panel; R4 is the failure it exists to prevent | F2 |
| F4 | defect | implemented | same file | Resolve to node \| edge \| unresolved; unresolved renders "no longer in this layer" with the id, not a blank body | Honest about a deleted-while-selected element (R6) | low | F3 |
| F5 | defect | implemented | same file | **Identity** + **Endpoints** sections: kind `Badge`, swatch (reusing `nodeSwatchColor` over `layer.resolveNodeStyle`), display name, mono id; for edges `source` / `target` rows that focus that node on click | The header of the card, and the first read-only view of an edge's endpoints (S4) | low | F4 |
| F6 | defect | implemented | same file | **Properties** section — `data` top-level keys as `PropertyRow`s, values formatted per G9, empty state when `data` is absent or empty | The panel's actual job | low | F5 |
| F7 | defect | implemented | same file | Copy-to-clipboard on the id and on each property value (hover-revealed icon button, `navigator.clipboard.writeText`) | An id you can read is an id you can paste into a query | low — guarded for absent `navigator.clipboard` | F6 |
| F8 | defect | implemented | same file | **State** section — `type`, `hidden`, `pinned`, `position` (nodes) / `hidden` (edges), plus a header **Focus** button (`layer.focusNode` / `focusEdges`, `includeHidden: true`) | Explains why a selected element isn't on screen, and puts it there | low | F5 |
| F9 | defect | implemented | same file | Frame-coalesced revision counter on `node:update` / `node:remove` / `edge:update` / `edge:remove` (G7) | Values track live edits and deletions | low | F4 |
| F10 | defect | implemented | `file:packages/canvas-ui/src/index.ts` | Export `sym:ElementInspectorViewPanel` + props type beside `sym:SelectionViewPanel` (`#L820-L821`) | Public surface | low | F1 |
| F11 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Add an **Element** tab to the right inspector's `TabbedPanel`, beside **Selection**, holding `<ElementInspectorViewPanel canvas={activeCanvas}/>` | The master/detail pair is demonstrable, and V2–V10 become runnable at all | low | F1, F10 |
| F12 | defect | implemented | same file | **Reveal on select**: subscribe to `activeCanvas.store.view` and, on the selection's **empty → non-empty** transition, `setRightTab('element')` + `setRightOpen(true)` | Clicking a node or edge surfaces the inspector instead of leaving it behind a closed rail | **medium** — auto-opening a panel is a camera-adjacent UX judgement; the edge-transition guard is what keeps it from fighting the user (D-7) | F11 |
| F13 | defect | implemented | `file:packages/canvas-ui/src/view-panels/element-inspector/ElementInspectorViewPanel.tsx` | Replace the selection source with `sym:ClickInspectBehaviour`: new `inspectBehaviourId='click-inspect'` prop, an internal `useInspectedTarget` hook subscribing to `inspect:change`; **delete** the `useStore` read, the order array, the pinned id, the fallback index and the pager UI | The panel shows the element you clicked, not one arbitrarily chosen from the selection | **medium** — reverses D-1; the panel now needs a behaviour that is not in any default bundle | D-8 |
| F14 | defect | implemented | same file | Two distinct empty states: *no click yet* vs *no `sym:ClickInspectBehaviour` registered* (naming the id it looked for) | A host who forgot to register the behaviour is told, instead of debugging a blank panel | low | F13 |
| F15 | defect | implemented | same file + `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Both the panel's hook and the story's reveal effect re-attach on `scene:behaviour:register` | The behaviour is registered *inside* the canvas subtree while both consumers live outside it and learn of the engine via `onReady`; a one-shot lookup silently never arms | **medium** — an ordering bug that would have looked like "the inspector just doesn't work sometimes" | F13 |
| F16 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Mount `<ClickInspectBehaviour targetLayerId="graph"/>` per board; retarget the reveal from the selection to `inspect:change` | The story supplies what the panel now requires; a background click no longer opens the rail | low | F13 |

**Separating the defect from the dressing:** every row above is the feature itself. The known
*dressing* — extracting `labelOfNode` / `labelOfEdge` / `displayNameOf` / `nodeSwatchColor` /
`hexColor`, now duplicated in a **third** panel — is deliberately **not** a row here. It is
`F10` of `rfc:feat-2026-09-11-nothing-lists-what-is-selected`, deferred there under D-7 with the
explicit unblock condition "a third panel needing them". This RFC **is** that third panel, so
D-5 below asks whether to unblock it — as a row in *that* RFC, not a silent tidy inside this one.

## 5 Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CanvasView.interaction.selection` | The read path | A kind-aware set (`Set<{id,kind}>`) would simplify F4 away; not a break |
| U2 | `sym:ClickSelectBehaviour`'s store mirror (`#L598`) and its `[...shapeIds, ...connectorIds]` order | The pager's order (G4) and its instability (R4) | A different flattening reorders the pager but, because F3 pins ids, never shows the wrong element |
| U3 | `sym:GraphStore.getNode` / `getEdge`, and the `node:*` / `edge:*` event names | Resolution and liveness | A renamed event silently freezes the values — V7 covers it |
| U4 | `sym:GraphNode.data` / `sym:GraphEdge.data` as `unknown` | What F6 renders | Typed payloads later would let F6 render better, not worse |
| U5 | `pkg:@invana/ui` `PropertyList` / `PropertyRow` / `Badge` | Row chrome | Kit-level; shared with any panel that adopts them |
| U6 | `sym:GraphLayer.resolveNodeStyle` (`#L980`) / `focusNode` (`#L1380`) / `focusEdges` (`#L1399`) | Swatch + focus | Shared with two shipped panels; they break first |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `pkg:@invana/canvas-ui` public API | new export | Two additive names | None — canvas-ui is not covered by `pnpm check-api-surface` (`file:scripts/check-api-surface.mjs#L41-L54` pins canvas-core / canvas-store / canvas only), so no snapshot to regenerate |
| D2 | `sym:GraphCanvasApp` consumers using `sym:useSidePanels` | opt-in | A `{ id: 'inspector', … }` descriptor becomes available | None until someone opts in |
| D3 | `sym:InspectorPanel` (`toolbars/`) + `sym:ClickInspectBehaviour` + `sym:useEntityEditor` | none | Untouched and not deprecated; two inspectors now exist with different jobs | **Doc**: one line in `file:packages/canvas-ui/CLAUDE.md` saying which is which, or the next reader merges them by accident |
| D4 | `sym:SelectionViewPanel` | behavioural pairing | Becomes the master to this detail | None — no code change unless D-5 unblocks the shared-helper extraction |
| D5 | `story:usecases/tools/GraphModeller` and `story:canvas-ui/apps/GraphCanvasApp/RightInspector` | none | Both use the **toolbar** `sym:InspectorPanel`; unaffected | None — but they are the regression control (V10) |
| D6 | Serialised state / `sym:exportCanvasState` | none | The panel writes no `view.definition` and no element data | None |
| D7 | The studio's own `InspectorPanel` (S6) | opt-in replacement | Could compose this instead, injecting provenance via D-5's slot | None in this repo; it is a separate repo and a later decision |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm --filter @invana/canvas-ui check-types` + `lint` + `pnpm check-boundaries` | repo | clean — `tsc` silent (canvas-ui **and** `pkg:@canvas/storybook`), eslint **0 errors**, boundaries intact, `check-api-surface` unchanged. Warning counts: canvas-ui 6 pre-existing (none in the new files); AppLayoutV2 16 → 17, the added one being the same `rules-of-hooks` warning every hook in that story's inline `render` component already carries | F1–F10 |
| V2 | pending | Click one node | panel | Identity + Properties + State populated from that node's `data`; no pager | F4, F5, F6, F8 |
| V3 | pending | Click one edge | panel | Endpoints section shows `source` / `target`; clicking either frames that **node** | F5 |
| V4 | **superseded by F13** | Lasso 7 mixed elements | panel | "1 of 7"; ‹ › walks all seven in the order `sym:SelectionViewPanel` lists them | F3, G4 |
| V5 | **superseded by F13** | At "3 of 7", deselect element 1 in `sym:SelectionViewPanel` | panel | Still showing the **same element**, now labelled "2 of 6" — never a jump to a different element | F3 (R4 — the core regression) |
| V6 | **superseded by F13** | Deselect the element currently being inspected | panel | Falls to the element now at that position; at the end, to the last; at zero, the empty state | F3 |
| V7 | pending | Edit a displayed property, then delete the inspected node | panel | Value updates in place; then the unresolved state, never a stale card | F9, F4 |
| V8 | pending | Inspect a node whose `data` holds an object, an array, `null`, and a 5 KB string | panel | JSON for the first two, muted `—` for `null`, truncated string with the full value on hover — no `[object Object]`, no layout blow-out | F6, G9 |
| V9 | pending | Mount with **no** `sym:ClickSelectBehaviour` registered, then pass `elementId` explicitly | panel | Empty state first (nothing writes the selection), then the named element renders | F2, F6, G6 |
| V10 | pending | **Control:** `story:usecases/tools/GraphModeller` — click a node with the Select tool | canvas | The **toolbar** `sym:InspectorPanel` still opens and still commits edits, exactly as today | D3, D5 |
| V11 | pending | Click a node, then an edge, with the right rail **closed** | shell | The rail opens on the **Element** tab showing that element; a second click on another element updates it **without** re-yanking the tab | F11, F12 |
| V12 | pending | With elements selected, switch to the **Styling** tab, then click another element | shell | The tab switches to Element (a new selection is a new intent) — but closing the rail entirely while elements stay selected must **not** immediately re-open it | F12 |
| V13 | pending | Click node A, then node B, then the background | panel | A, then B, then the *no click yet* empty state — the background click clears it | F13, F16 |
| V14 | pending | Lasso 20 elements **without** clicking one | panel | Stays on the previously clicked element (or empty) — a selection is **not** an inspection; `sym:SelectionViewPanel` is what lists the 20 | F13 |
| V15 | pending | **Drag** a node rather than clicking it | panel | The synthetic end-of-drag click does **not** change the inspected element (the behaviour suppresses it) | F13 |
| V16 | pending | Open the story on a cold load and click an element immediately | shell | The rail reveals — i.e. the register-event re-attach actually armed | F15 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | What does the panel inspect? | kernel selection · `sym:ClickInspectBehaviour` target · both | **Kernel selection**, with `elementId` as a controlled override (G6). One source of truth, works for click/brush/lasso/programmatic alike | **accepted**, then **REVERSED** 2026-09-11 by D-8 — see F13 |
| D-2 | Read-only, or editable? | read-only · editable · read-only + an Edit affordance | **Read-only.** Editing already exists as `sym:InspectorPanel` + `sym:PropertiesEditor` + `sym:useEntityEditor`; a `*ViewPanel` is presentational (`file:packages/canvas-ui/CLAUDE.md`). Looking must not risk overwriting | **accepted** (asked 2026-09-11) |
| D-3 | Internal tabs? | single scroll · `TabbedPanel` (Properties / Style) | **Single scroll.** No sibling view panel has internal tabs, and the region chrome already supplies the title. `TabbedPanel` exists (T4) if a Style tab is ever wanted | **accepted** (asked 2026-09-11) |
| D-4 | With N selected? | pager · most-recent-only · defer to the list | **Pager**, pinned by id (G5, R4). Nothing is hidden, and it composes with the master list rather than repeating it | **accepted** (asked 2026-09-11) |
| D-5 | An extension slot, and the shared-helper extraction? | (a) add `renderExtra?: (el, kind) => ReactNode` so a host injects app-specific blocks (S6's provenance) without canvas-ui learning about datasets · (b) also unblock `F10` of `rfc:feat-2026-09-11-nothing-lists-what-is-selected` now that a third panel duplicates the helpers · (c) neither | **Both.** (a) is one prop and keeps the dataset dependency out of the kit; (b) is the exact unblock condition that RFC's D-7 named, and it lands as a row **there** with its own re-verification, not as an untracked tidy here | **accepted** — `renderExtra` shipped in F1/G8; the helpers now live in `file:packages/canvas-ui/src/view-panels/element-display.ts` and `rfc:feat-2026-09-11-nothing-lists-what-is-selected` F10 moved `deferred` → `implemented` |
| D-6 | A Storybook story? | none (rule 11) · one under `story:canvas-ui/view-panels/ElementInspectorViewPanel` | **None unless asked.** If asked: `sym:GraphCanvasApp` + `sym:useSidePanels` docking both this and `sym:SelectionViewPanel` into `right`, so the master/detail pairing is what the story demonstrates | **accepted**, then **reopened and answered** 2026-09-11: no new story *file*, but the panel is wired into the existing `story:canvas-ui/apps/AppLayoutV2` as a ninth tab (F11) — the same call D-6 of `rfc:feat-2026-09-11-nothing-lists-what-is-selected` made for the Selection tab |
| D-7 | How does a click reveal the panel — a new behaviour, or the existing selection? | mount a second `sym:ClickInspectBehaviour` and drive the panel's `elementId` · react to the **kernel selection** the existing `click-select` already writes | **React to the selection.** A second click behaviour would put two handlers on one click and split the story's notion of "the current element" in two; reacting to the selection also covers **brush and lasso** for free, and keeps the pager meaningful (a second source would pin the panel to one element and make "2 of 7" a lie) | **accepted** |
| D-8 | Selection, or the clicked element? | follow `view.interaction.selection` (D-1) · follow `sym:ClickInspectBehaviour` | **The clicked element.** "Show me this one" and "here are the forty I selected" are different questions; an inspector has room for one answer, and picking one element out of a lasso of forty is an arbitrary choice dressed as an answer. `sym:ClickInspectBehaviour` exists for exactly this and already handles clear-on-background and end-of-drag suppression. Cost: it is not in any default bundle, so a host must register it (F14 makes that failure legible) | **accepted** (directed 2026-09-11) — supersedes D-1, D-7 and the pager |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened after "based on studio's `InspectorPanel.tsx`, write an `ElementInspectorViewPanel` that covers both node and edges" | proposed | D-1 … D-4 answered before drafting. D-5 and D-6 open, blocking nothing structural |
| 2026-09-11 | Approved whole; F1–F10 implemented, D-5 taken in both halves, D-6 resolved as "no story" | accepted | V1 green. V2–V10 are browser checks; the RFC stays `accepted` until they pass in Storybook. Implementation notes below |
| 2026-09-11 | Follow-up ask: dock the panel and reveal it on click. D-6 reopened, D-7 added and answered; F11–F12 implemented | accepted | The panel now has a home (`story:canvas-ui/apps/AppLayoutV2`, ninth tab) and a trigger. **Every check V2–V12 is still pending** — this is what makes them runnable, not what runs them |
| 2026-09-11 | Directed: "Inspector should only show the clicked element, not all the selected elements". D-1 reversed by D-8; F3 and V4–V6 superseded; F13–F16 implemented | accepted | The panel is simpler for it — the pager, the order array and the id-pinning all existed only to choose one element out of a set, a choice it no longer has to make. F15 was found while making the change, not asked for |

### What the implementation taught us

| ID | Note |
|---|---|
| N1 | The pager's re-pin **must** be an effect, not render-phase state — and both writes (`setLastIndex`, `setPinnedId`) must be idempotent, or the "selection changed under us" path re-renders forever. It settles in exactly one extra render because `index` is derived, not stored |
| N2 | `pkg:@invana/ui` already ships `PropertyList` / `PropertyRow`, documented verbatim as "the inspector's body … a `<dl>` because that is what this is — pairs". G10 needed no bespoke row markup, and the fixed `labelWidth` is what stops the value column going ragged |
| N3 | TypeScript will not narrow `element` from `resolved` being truthy. Rather than scatter `!` assertions, the unresolved branch tests `!resolved \|\| !element` — the guard is then real narrowing, and a future refactor that decouples the two can't silently produce a blank card |
| N4 | `renderExtra` landed **between endpoints and properties**, which is exactly where S6 puts provenance ("where it came from, before what it says") — the placement carries S6's principle without canvas-ui taking S6's dataset dependency |
| N5 | `CopyButton` renders `null` when `navigator.clipboard` is absent (a non-secure origin), so F7 degrades to plain selectable text rather than to a button that silently does nothing |
