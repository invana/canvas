---
id: feat-2026-10-20-an-unsaved-change-looks-saved
type: feat
title: An unsaved change looks saved — the board marks what is new, edited and deleted until the host saves it
status: implemented
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-10-20-the-board-shows-every-tool-at-once }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed }
  - { predicate: verified-by, object: story:canvas-demos/tools/CanvasExplorer }
---

| | |
|---|---|
| Motivation | A node drawn in Edit looks exactly like one loaded from the backend; nothing says it is not saved yet |
| Design | Unsaved = the net of the operation log's data ops between the entry the host last saved at and now. The board marks those elements with runtime states, draws deletions as ghosts, and the rail's **Changes** button counts them on a badge; its panel lists them, each revertible, with Discard all and Save |
| Rows | F1–F11 implemented; F12 deferred |
| Open decisions | none — D1–D5 accepted in review |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | An added node or relationship is drawn like a saved one | `story:canvas-demos/tools/CanvasExplorer` (Edit) | the Add tool, Connect, *Add a node here* |
| M2 | An edit to an existing element leaves no trace on the board | `sym:PropertiesViewPanel` Apply | the element redraws with its new values |
| M3 | A deleted element vanishes, so a deletion is the easiest change to save by accident | `graph.erase` | — |
| M4 | Nothing on the board says the work differs from the backend, or offers to save it | the board chrome | — |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | The tracker reads the store's operation log (`store.operationLog`): every content write is a `HistoryOp` in a data part, and `status(entryId)` says applied or undone | `file:packages/graph/src/store/GraphStore.ts` (recording), `file:packages/canvas-core/src/state/log/types.ts` | no second recorder; undo / redo move the unsaved set for free |
| 2 | **Unsaved** = the net of the applied entries after the save mark, plus the inverse of entries before it that were undone. Folded per element: added · edited (first `before` vs latest value, no-op edits dropped) · removed (its last record kept) | new `sym:UnsavedChangesBehaviour` | an edit undone back to its saved value stops being unsaved |
| 3 | What counts: `type`, `data`, `style`, an edge's ends. What does not: position, pin, hidden, runtime states | — | a drag or a layout never makes the board unsaved |
| 4 | New and edited elements carry runtime states `unsaved-new` / `unsaved-edited`; the behaviour registers their overlays with `layer.setStateConfigs` | `sym:GraphLayer.setStateConfigs`, `store.setNodeState` | runtime states are never recorded, saved or exported |
| 5 | A removed element is drawn as a **ghost** on its own layer under the graph — its last record, faded and dashed, not pickable | new `sym:UnsavedGhostLayer` | the deletion stays visible until saved (D1) |
| 6 | `markSaved()` moves the mark to the newest entry; `discard()` reverts the log to the mark; `changes()` returns the net `Delta` for the host's save | new API | the host owns the backend call; a failed save keeps the marks |
| 7 | The rail's **Changes** button carries the count (`unsaved.count`) as a badge; its panel lists Added · Edited · Deleted on the kit's `DiffList`, a row framing its element and reverting on its own, and ends *Discard all · Save n changes*. It is Edit's, and every work mode's while something is unsaved | `ChangesViewPanel`, `BoardPanelSpec.badge` / `alsoWhen`, `ControlToggleItemSpec.badge` | one place to see and save (D3) |
| 8 | The mark colour is the document's `--color-warning`, resolved by the browser (a probe's computed `color`), so any token format works; `markColor` overrides it | `file:packages/graph/src/behaviours/UnsavedChangesBehaviour.ts` | read when tracking turns on — a theme switch keeps the old colour until it turns on again |
| 9 | A write is logged before the store applies it, so the log and the store's flush only mark the fold stale; a read folds quietly, and the marks and `change` go out from a queued pass | same | a React render that reads the count never updates another component mid-render |

**How each state looks** (D2):

| State | Node | Relationship |
|---|---|---|
| New | dashed outline in the mark colour (`bgStrokeDashArray`, `bgStrokeColor`), the shape at 60% (`bgAlpha`) | dashed line (`strokeDashArray`) |
| Edited | as saved, plus a dot badge in `unsaved` | as saved, plus the dot at its midpoint |
| Deleted | ghost: 25%, dashed outline | ghost: faint, dashed |

The dash is the signal and the colour only backs it, so it reads without colour and in both themes.

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed` | relates-to | landed | the operation log, `HistoryOp`, `status`, `revertTo` |
| `rfc:feat-2026-10-20-the-board-shows-every-tool-at-once` | relates-to | implemented | modes, the footer, the History panel, Undo · Redo in Edit |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph/src/behaviours/UnsavedChangesBehaviour.ts`; `GraphStore.operationLogSourceId` | the tracker: save mark, net fold, `changes()` · `count` · `markSaved()` · `discard()` · `events`; `savedActors` (default `engine`) | M1–M4 | a log cleared on load resets the mark | — |
| F2 | defect | implemented | same + `file:packages/graph/src/layer/types.ts` | `unsaved-new` / `unsaved-edited` runtime states and their overlays | M1, M2 | a consumer overlay of the same name wins | F1 |
| F3 | defect | implemented | `file:packages/graph/src/behaviours/UnsavedChangesBehaviour.ts` | the mark colour from `--color-warning` (no palette role) | the dot and the new outline | theme switch (step 8) | — |
| F4 | defect | implemented | `file:packages/canvas-react/src/…/UnsavedGhostLayer.tsx` | ghosts of removed elements, under the graph | M3 | an edge to a live node needs that node's position | F1 |
| F5 | defect | implemented | `file:packages/canvas-react/src/hooks/useUnsavedChanges.ts` | count + changes + acts for React | — | — | F1 |
| F6 | defect | implemented | `file:packages/canvas-ui/src/view-panels/changes/ChangesViewPanel.tsx` | `ChangesViewPanel` + `ChangesCount`: Added · Edited · Deleted (`DiffList`), a row frames its element and reverts it, Discard all · Save; Save runs the host's `unsaved.save` (`UNSAVED_SAVE_COMMAND`), a throw keeps the changes; `saveDisabledReason` for a member who cannot write | M4 | — | F5, F9 |
| F9 | defect | implemented | `file:packages/graph/src/behaviours/UnsavedChangesBehaviour.ts` | `unsaved.count` command (`UNSAVED_COUNT_COMMAND`); `before(kind, id)`; `revert(kind, id)` — one undoable entry, a node with what hangs on it | per-row revert, the badge | — | F1 |
| F10 | defect | implemented | `file:packages/canvas-core/src/state/view/controlPanels.ts`, `canvas-ui` `ControlItems` · `ToolbarItems` · `board/BoardPanels.tsx` | a toggle item's `badge` (a command's value on its icon); `BoardPanelSpec.badge` and `alsoWhen` | the rail badge; Changes outside Edit while unsaved | — | — |
| F11 | dressing | implemented | `file:packages/canvas-ui/src/control-panels/icons.ts` | `connect` is lucide Spline; `changes` is Diff | — | — | — |
| F12 | defect | deferred | composite (card) nodes | a dashed card, the edited value in amber on the card, a ghost card — drawn on the review canvas; needs dashed strokes on rect / composite shapes in the renderer | — | renderer change | F8 |
| F8 | defect | implemented | `file:packages/renderer-pixijs/src/primitives/shapes/CircleShape.ts` | a node's own dashed stroke no longer drops its fill (a decoration's dash stays outline-only) | the new node and its ghost read as nodes | ellipse, polygon, arc, path and tabbed-rect still drop it; rect has no dash | — |
| F7 | dressing | implemented | `story:canvas-demos/tools/CanvasExplorer` | tracker on, the bar in the footer, a stand-in save | — | — | F1–F6 |
| F13 | defect | implemented | `file:packages/canvas-ui/src/view-panels/changes/ChangesViewPanel.tsx`, `pkg:@invana/ui` `DiffRow` | the panel as reviewed: rows on the kit's `DiffRow marker="chip"` (+ ✎ − in an amber square, muted for a deletion), a line under the name (*New airport*, `runways 2 → 3`, *Deleted with MUC*), the picked row marked, revert kept out of the row's button and hidden while saving; banners with an icon, *Try again* inside the failure; *Saved just now* after a save; a new element without a type says *Needs a type* and Save waits for it | — | kit not released | F9 |

## 5. Blast radius

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `store.operationLog` entries, `status`, `revertTo` | F1 reads and reverts through them | a log without a store source records nothing to track |

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | boards without the behaviour | — | none | — |
| X2 | Studio | app | needs a backend write for graph data to call on Save | a feature in the invana repo (D5) |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | unit | `UnsavedChangesBehaviour` | add → new; edit → edited; edit back → clean; undo past the mark → unsaved; `markSaved` → clean; `discard` → back at the mark | F1, F2 |
| V2 | pass | Playwright walk | `story:canvas-demos/tools/CanvasExplorer` | add, connect, edit, delete each mark; the bar counts; Save clears; Discard restores | F1–F7 |
| V3 | pass | `check-types` + `build`; `pnpm lint` (+ boundaries, api surface, node-import); graph (386) and renderer-pixijs (12) tests | graph, canvas-react, canvas-ui, renderer-pixijs, storybook | clean, 0 lint errors | F1–F8 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | A deleted element until saved | vanish, counted in the bar · a ghost in place | a ghost — a deletion you cannot see is the easiest to save by accident | accepted |
| D2 | Mark edits to existing elements too? | new only · new and edited | both — an edited value is as unsaved as a new node | accepted |
| D3 | Where is Save? | the row · a footer bar · a rail panel | a rail panel, **Changes**, its count a badge on the rail — reviewed on the Explorer Board Changes canvas; the footer bar is retired | accepted |
| D4 | What is unsaved? | a separate recorder · the operation log since a mark | the log since a mark — undo and redo stay consistent with it | accepted |
| D5 | Who writes to the backend? | the canvas · the host | the host, through `onSave(changes)`; the engine write is a feature of its own in the invana repo | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened from review of the Explorer board's Edit mode | accepted | D1–D5 accepted |
| 2026-10-20 | F1–F8 built; V1–V3 pass | implemented | not committed |
| 2026-10-20 | The footer bar became the rail's Changes panel (D3) after review of the Explorer Board Changes canvas; F9–F11 built, F12 deferred | implemented | Invana Products EX-20 |
| 2026-10-20 | F13: the Changes panel brought to the reviewed design | implemented | not committed |
