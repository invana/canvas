---
id: feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed
type: feat
title: An analysis on the canvas can be written as JSON steps, played, stepped back through, and attributed to who made each change
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/graph-layout-d3-force, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: supersedes, object: "rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone#D2" }
  - { predicate: relates-to, object: rfc:feat-2026-09-29-commands-stop-at-saved-control-panels }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state }
  - { predicate: relates-to, object: doc:docs/canvas-state-plan.md }
  - { predicate: relates-to, object: doc:docs/graph-canvas-operations.md }
  - { predicate: relates-to, object: doc:docs/per-element-visibility-plan.md }
  - { predicate: manifests-in, object: story:graph/Layer/Streaming }
---

# An analysis on the canvas can be written as JSON steps, played, stepped back through, and attributed

| | |
|---|---|
| **Motivation** | An analyst and the Invana assistant build a visualisation together: load, narrow, focus, work the data, expand, zoom out. Nothing records that as steps. Data writes mostly bypass history. Two undo stacks can't undo a step that touches data and view. Nobody can tell the user's changes from the engine's. A live feed makes the layout restart and the camera jump every tick |
| **Design** | **Playbook = script**: `canvas.playbook` is a list of JSON steps and a position. `addStep` only appends; `next` / `previous` / `goTo` play steps by calling the ordinary canvas methods. **History = record**: one operation log, written only by the canvas, with a free-text `actor` on every entry. **One data door**: the existing `GraphStore.applyDelta`, extended. The canvas has no filter (lens): the engine decides the data and answers in the step format |
| **Design discussion** | Seven revisions with the maintainer, published as the "Canvas Playbooks" design doc (claude.ai artifact `FctDKaBeSwNxqmkFhWQY41`, revision 7). Settled decisions are copied into §7 |
| **Row status** | proposed 0 · accepted 3 · implemented 3 · landed 13 · deferred 7 · rejected 0 · superseded 0 |
| **Open decisions** | None. D-16 to D-20 accepted as recommended when PR 2 started; D-15 amended (F13 moves into PR 2) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Two undo stacks. View history records only `edit:*` definition patches, and graph history is separate. `history.undo` picks whichever top is newer | `file:packages/canvas/src/engine/Canvas.ts#L361-L391`, `sym:GraphHistory`, `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` D2 | A step that removes nodes **and** changes focus undoes in two presses, in an order decided by timestamps |
| M2 | Most data writes are not recorded | `file:packages/graph/src/store/GraphStore.ts#L877-L1475` | Only writes through `sym:GraphHistory.transaction` or `push` enter history. `addNode`, `addData`, `applyDelta`, `setData`, `hideNodes` and about 15 outside callers write directly |
| M3 | Many doors for data, so the same change can take different shapes | about 30 public `GraphStore` writers, `sym:GraphLayer.setData` / `importData` / `clear` (`file:packages/graph/src/layer/GraphLayer.ts#L742-L829`), about 15 callers (clipboard, erase, create node, draw edge, `useEntityEditor`, the style editors, five behaviours) | Recording at every door would record the same intent as 1 entry or 10 |
| M4 | Behaviours write derived data through the same public methods as content | EntranceBehaviour, NodeCentralityBehaviour, CollapseExpandBehaviour, ParallelEdgeBehaviour, NodeResizeBehaviour | If content writes were recorded, undo would revert a badge and the behaviour would recompute it: the two fight |
| M5 | History is capped | `createHistory` `limit ?? 100` (`file:packages/canvas-store/src/port/createHistory.ts#L80`, `#L117`); `GraphHistory` `DEFAULT_LIMIT = 100` (`file:packages/graph/src/history/GraphHistory.ts#L32`) | A long session loses its beginning |
| M6 | No record of who made a change | none | The engine can't tell the user's deletes and style edits from its own writes, so it can't keep its copy of the state in sync |
| M7 | No way to express an analysis step as data | none | An assistant answer can't be sent as one serialisable unit that the canvas plays, validates and can take back |
| M8 | `interaction.focus` is written but nothing draws it | `file:packages/canvas-core/src/state/view/createActions.ts#L298-L299` (writers); only `file:packages/canvas/src/io/stateExport.ts#L204` reads it | "Highlight these and fade the rest" has store state but no visual |
| M9 | Selection flows only from the behaviour to the store | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L678` | Writing `interaction.selection` (from a step or the assistant) changes nothing on screen |
| M10 | Which node's properties are open lives only in the behaviour | `sym:ClickViewBehaviour` keeps a private `target` | A step can't open or close a node's properties |
| M11 | Hiding nodes doesn't reflow the layout | `file:packages/graph/src/canvas/GraphCanvas.ts#L247-L249` re-runs only on `addedNodes` / `removedNodes`; layouts already skip hidden nodes (`file:packages/graph/src/layout/OneShotPositionLayout.ts#L161`, `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L437`) | Hidden nodes leave gaps until something else triggers a layout |
| M12 | A feed thrashes layout and camera | `file:packages/graph/src/canvas/GraphCanvas.ts#L247-L249` (no throttle, no `preserveCamera`); `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L157` (a new simulation per run at full heat); auto-fit `file:packages/canvas/src/engine/Canvas.ts#L744` | At one batch per second the graph never settles and the camera re-frames every tick |
| M13 | No React hook for incremental writes | `sym:GraphLayer` React wrapper replaces all data when `data` changes (`file:packages/canvas-react/src/layers/GraphLayer.tsx#L54-L58`) | Streaming consumers reach the store through `onReady` + `layers.get` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A lens / filter slice (`view.lens`) and a `FilterBehaviour` in the canvas | **Rejected** (design revision 4) | The canvas is a visualizer. Queries and filters belong to the Invana engine, which sends the result as data |
| R2 | A separate `@invana/canvas-playbook` package | **Rejected** (revision 3) | Every piece has a home in an existing package, and none needs a new third-party library |
| R3 | A step builder that takes code (`canvas.step(title, fn)`, `playbook.step(fn)`, `apply`, `mark`) | **Rejected** (revisions 5–7) | A second way to change the canvas. The playbook takes and returns JSON only |
| R4 | Playbook and history as one thing (`history.addStep`) | **Rejected** (revision 7) | History would cause the change it records. Script (what should happen) and record (what did happen) are different directions |
| R5 | History and playbook as two subclasses of one base class | **Rejected** | Two instances means two logs, which is the drift the merge removes |
| R6 | Commands as the step's action vocabulary | **Mostly rejected** | Steps set state and behaviours react. `do` keeps a small slot for verbs that leave no state (export, redraw) |
| R7 | Recording at every public write method | **Rejected** | M3 and M4: inconsistent entry shapes, and behaviours fighting undo. One door instead |
| R8 | A new data shape for the door (`{ add, remove, update }`) | **Rejected** | `applyDelta` already exists with `{ added, updated, removed }`, used by `story:graph/Layer/Streaming`. Extend it rather than replace it |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | **One operation log** (`sym:createOperationLog`, internal to `pkg:@invana/canvas-store`) replaces `createHistory` and `GraphHistory`'s own stacks. One entry can hold view patches and graph ops | M1 | A step undoes as one entry |
| G2 | Every entry carries `actor` (free text, defaulting to the session actor set on `Canvas`), and optionally `title` and `stepId` | M6; precedent: `GraphStore` state methods already take `{ actor }` (`file:packages/graph/src/store/GraphStore.ts#L1159`) | `history.entries({ actor })`, and later engine sync through `onEntry` filtered by actor |
| G3 | **`applyDelta` is the only recorded data write.** Its existing shape gains `hidden`, `shown`, `pinned`, plus an options argument `{ actor }`. Every other public writer becomes a one-line wrapper over it | M2, M3, R8 | The same change always makes the same entry. Existing callers keep working |
| G4 | **Derived writes go through `store.internal.*`** and are never recorded; behaviours recompute after undo | M4; the rule in memory "behaviours may write presentation" | Undo never fights a behaviour |
| G5 | View changes are classified: definition patches are undoable; selection, focus, inspect and camera intent are recorded but skipped by plain undo; camera frames, hover and layout progress are not recorded | today's `edit:` filter at `file:packages/canvas/src/engine/Canvas.ts#L362` | Ctrl+Z behaves as today, while steps keep their view |
| G6 | **No limit.** Branches are kept when a change follows undo | M5 | Growth tracks edits, not activity |
| G7 | `canvas.history` becomes a view of the log: today's `History` surface (undo / redo / subscribe), plus `entries`, `onEntry`, `atLatest` and `sinceLastStep` | `file:packages/canvas/src/engine/Canvas.ts#L247` | Same property, larger type. Nobody writes to it |
| G8 | **`canvas.playbook`**: `steps`, `current`, `addStep(json)` (append only), `next`, `previous`, `goTo`, `toJSON`, `load` | R3, R4 | The script. Playing a step validates it, then calls `applyDelta` / `canvas.update` / store actions as one log entry tagged with the step's `actor` and `stepId`, then waits for the canvas to settle |
| G9 | A step is `StepSpec`: `data` (exactly a `Delta`), `settings` (exactly a `canvas.update` patch), `view` (select / focus / inspect / camera intent), `do`, `actor`, `title`, `narration`, `meta` | M7 | The engine answers prompts in this format |
| G10 | Behaviours follow store state: `ClickSelectBehaviour` follows `interaction.selection`, the new `FocusBehaviour` draws `interaction.focus` and frames it, and `ClickViewBehaviour` follows the new `interaction.inspect` | M8–M10 | A step, the assistant or a panel can point at nodes |
| G11 | Layout: re-run on hide / show, throttle data-triggered re-runs, and keep the camera on data-triggered re-runs | M11, M12 | Narrowing by hide reflows; a feed doesn't thrash |
| G12 | Streamed writes (`applyDelta(…, { coalesce: true })`, D-14) merge into one open entry, where an add and a later remove of the same id cancel; plain undo skips them. Hosts hold feed ticks while `!history.atLatest()` | M12 | 3,600 ticks an hour become a handful of entries |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read `sym:GraphStore.applyDelta` (`file:packages/graph/src/store/GraphStore.ts#L1377`) | One batch: remove edges, remove nodes (cascading), upsert nodes, upsert edges, updates; unknown ids skipped | Already the right shape and order for the door. Only the new fields and recording are missing |
| T2 | Read `sym:GraphCanvas` active-layout wiring (`file:packages/graph/src/canvas/GraphCanvas.ts#L247-L249`) | `runLayout(activeId)` on `addedNodes \|\| removedNodes`, with no throttle and no options | M11 and M12 have one site to fix |
| T3 | Search for readers of `interaction.focus` | Only `exportCanvasState` / `importCanvasState` | M8 confirmed: `FocusBehaviour` is the first reader |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` | superseded in part (D2) | landed | The `edit:` convention, the baseline write, and the reconciler on undo (`file:packages/canvas/src/engine/Canvas.ts#L369`) all stay. Only D2 ("two stacks") is superseded by G1 |
| `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels` | relates-to | accepted, phases A–E implemented on `feat/commands-phases-a-b-c` | Phase C (`GraphCanvas` owns history + clipboard) is where `GraphHistory` now lives. F4 builds on that ownership |
| `doc:docs/canvas-state-plan.md` §6.2 | relates-to | design of record for the kernel | "Macros / transactions / replay are the same idea (compose ops + tap the stream)". G1 is that tap |
| `doc:docs/graph-canvas-operations.md` | relates-to | concept | Query → primitive → composite. Queries stay in the engine (R1) |
| `doc:docs/per-element-visibility-plan.md` | relates-to | implemented | Per-element hide/show already respected by layout, bounds and hit-test; G3 records it, G11 re-runs layout on it |
| `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` | relates-to | proposed | `exportCanvasState` is the keyframe format for the deferred F21 |
| `story:graph/Layer/Streaming` | manifests-in | shipped | The reference streaming pattern (`applyDelta` on a timer). It must keep working unchanged (V13) |
| Canvas Playbooks design doc, revision 7 | design discussion | settled 2026-09-28 | All of §2 and §7 |

## 4. The fix

Rows are ordered so a partial landing still makes sense: F1–F6 (the log and the door) stand alone and are useful without playbooks.

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `pkg:@invana/canvas-core` `src/state/log/` (new) | Types: `LogPart`, `LogEntry` (`actor`, `title?`, `stepId?`), `Delta` (existing shape + `hidden` / `shown` / `pinned`), `StepSpec`, `PlaybookSpec`, `OperationLog`, `HistoryView`, `Playbook`, `DataOpAdapter` | The vocabulary, dependency-free | Low. Types only, but the API surface snapshot changes (F17) | — |
| F2 | defect | landed | `pkg:@invana/canvas-store` `src/log/createOperationLog.ts` (new); `file:packages/canvas-store/src/port/createHistory.ts` | One log: record, group, undo / redo with G5 classification, `revertTo` / `replayTo`, branches, no limit, `actor` per entry, `stepId`. `createHistory` becomes a deprecated wrapper | G1, G2, G5, G6 | **High.** Replaces the undo engine every Studio edit uses | F1 |
| F3 | defect | landed | `file:packages/canvas/src/engine/Canvas.ts#L247` `#L361-L391` | `canvas.history = historyView(log)`. The `edit:` filter moves into G5's classification. The reconciler at `#L369` and the baseline write at `#L1120` are kept. New `actor` option on `Canvas` (default `'user'`) | Same property; one log behind it | **High.** `canvas.history`'s type widens (public API) | F2 |
| F4 | defect | landed | `sym:GraphHistory`, `file:packages/graph/src/canvas/GraphCanvas.ts`, `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx`, the `history.undo` / `history.redo` overrides | `GraphHistory` keeps its public API (`transaction`, `push`, `undo`, `redo`, `canUndo`) but records into the shared log. The two-stack "newer top" arbitration is removed. `GraphCanvasOptions.history.limit` is deprecated (ignored) | One Undo, one order | **High.** Every graph-edit undo path moves | F2, F3 |
| F5 | defect | landed | `file:packages/graph/src/store/GraphStore.ts#L877-L1475` | `applyDelta(delta, { actor })` becomes the only recorded writer, with `hidden` / `shown` / `pinned` and the existing order (T1). `addNode` / `updateNode` / `removeNode` / `addData` / `hideNodes` / `showNodes` / `setPinned` / `clear` / bulk variants / `GraphLayer.setData` become wrappers. `batch(fn)` becomes one entry. `forward` / `inverse` move here from `GraphHistory` | G3 | **High.** Every data write in the repo passes through it; hot path for large graphs (V10) | F2 |
| F6 | defect | implemented | `GraphStore.internal`; EntranceBehaviour, NodeCentralityBehaviour, CollapseExpandBehaviour, ParallelEdgeBehaviour, NodeResizeBehaviour; layout position writes (`setPositionsBulk`) | Derived writes move to `store.internal.*` (unrecorded) | G4 | Medium. Five behaviours change write path; visuals must not change (V6) | F5 |
| F7 | defect | landed | `file:packages/graph/src/canvas/GraphCanvas.ts#L247-L249`; `pkg:@invana/graph` `data:changed` counters | Re-run the active layout on `hiddenNodes` / `shownNodes` too; `onData: { throttleMs, preserveCamera }` layout options | G11 (M11, M12) | Medium. Changes when layouts run in existing stories | F5 |
| F8 | defect | landed | `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L678` | Subscribe to `interaction.selection`; apply it through the `selectMultiple` path when it differs from the behaviour's own set | G10 (M9) | Medium. Echo loop risk (guarded by the same-set check) | — |
| F9 | defect | landed | `pkg:@invana/graph` `FocusBehaviour` (new, `kind = 'focus'`); `pkg:@invana/canvas-ui` `editors/behaviours/focus/` (rule 12) | Reads `interaction.focus` and `interaction.cameraIntent`: highlight, dim the rest via `store.internal`, and frame after settle when `frame: true` | G10 (M8) | Medium. New public behaviour plus editor | F6, F12 |
| F10 | defect | landed | `pkg:@invana/canvas-core` `CanvasView.interaction` (`inspect`, `cameraIntent`), `createActions`; `sym:ClickViewBehaviour` | New `inspect` and `cameraIntent` slices with actions; `ClickViewBehaviour` follows `inspect`; `Canvas` frames `visible` / `all` intents | G10 (M10) | Medium. `CanvasView` shape change (serialised in `exportCanvasState`) | F1 |
| F11 | defect | landed | `pkg:@invana/canvas` `CommandRegistry` | `commands.runAsync(name, args)`: awaits a command's promise (`layout.run` awaits `runLayout`) | Steps' `do` verbs finish before the next | Low | — |
| F12 | defect | landed | `file:packages/canvas/src/engine/Canvas.ts` (private) + `CanvasContext` | `whenSettled()`: resolves on the first frame with no layout, position transition or camera tween running. Not on the public `Canvas` surface; exposed to behaviours through `CanvasContext` | The playbook and `FocusBehaviour` wait on it | Low | — |
| F13 | defect | landed | `pkg:@invana/canvas-store` `src/log/createPlaybook.ts` (was planned as `src/log/views.ts`); `pkg:@invana/canvas` `validateStepSpec` (`file:packages/canvas/src/engine/playbook.ts`, internal) | `createPlaybook(log, env)`: `addStep` (append only; a step built by `sinceLastStep` links to its already-recorded entries), `next` / `previous` / `goTo` (play new steps, replay or revert recorded ones), `toJSON`, `load`. `validateStepSpec` checks ids, commands and JSON-safe settings before anything is written | G8, G9 (M7) | Medium. New public surface | F2, F3, F5, F10, F11, F12 |
| F14 | defect | accepted | `historyView` | `entries(filter)`, `onEntry(fn)`, `atLatest()`, `sinceLastStep(title)` (net delta, merged settings, final view as a `StepSpec`) | G7; user edits can become a step | Low | F2 |
| F15 | defect | accepted | `createOperationLog` | Merging for streamed writes (G12): writes made with `applyDelta(delta, { actor, coalesce: true })` merge into one open entry per actor, add + remove cancel, undo skips them, and any other entry or a step seals it (D-14) | M12 | Medium | F2, F5 |
| F16 | defect | accepted | `pkg:@invana/canvas-react` hooks | `usePlaybook()`, `useHistoryEntries(filter)`, `useGraphStore(layerId)` | M13 | Low | F13, F14 |
| F17 | defect | implemented | `api/canvas-core.surface.txt`, `api/canvas-store.surface.txt`, `api/canvas.surface.txt` | Regenerate the surface snapshots in the same change (rule 16) | `pnpm check-api-surface` stays green | Low, mechanical | F1–F16 |
| F18 | defect | deferred | `sym:D3ForceLayout` | Incremental live re-run: keep placed nodes, low heat for new ones (reuse `reheatAlpha`, `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts#L377`) | New nodes land among old ones without a full re-solve | Medium | F7. Unblocked by: phase 2 |
| F19 | defect | deferred | `pkg:@invana/canvas-ui` | Playbook panel (steps, next / back) and history panel (entries by actor), built on F16 | Visible authoring and review | Medium | F16. Unblocked by: phase 1 landing |
| F20 | defect | deferred | `pkg:@invana/canvas-ui` | Presenter bar, `narration` display | The analysis becomes a deck | Low | F19 |
| F21 | defect | deferred | `pkg:@invana/canvas-store` | Keyframes every N steps via `exportCanvasState`; recorded positions for stable force layouts | Instant long jumps; identical replays | Medium | F13 |
| F22 | defect | deferred | host / engine contract | Engine sync through `history.onEntry` filtered by actor (D-12) | The engine's copy of the state stays current | Medium | F14. Unblocked by: the engine-side design |
| F23 | defect | deferred | `createOperationLog` | Compaction of old non-step entries / IndexedDB spill | Bounded memory on very long sessions | Low | F2. Unblocked by: a measured need |
| F24 | defect | implemented | `file:packages/canvas-react/src/layers/GraphLayer.tsx#L54-L58`; `sym:GraphLayer` | A React `data` prop loads as the **baseline** through a new `GraphLayer.loadData(data)`: unrecorded, and the log is cleared, because entries recorded against the previous data can't replay over the new one. `setData` called from code stays recorded (D-16) | Ctrl+Z right after a story loads no longer empties the graph | Low. A prop change now clears history | F5 |
| F25 | showcase | landed | `apps/storybook/stories/graph/Playbook/` (new) | Stories that play JSON steps through `canvas.playbook`: highlight, select, inspect, expand, hide + reflow, re-layout, zoom in / out, fit (maintainer request, 2026-09-28) | V11's visible half; the feature is demonstrable | Low. Stories only | F7–F13 |
| F26 | defect | deferred | `sym:DragNodeBehaviour` | Pin-on-drag records the move and the pin as one entry, not two | One Ctrl+Z per drag | Low | F5. Unblocked by: a PR after PR 3 (D-20) |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:ReactiveStore.subscribeChanges` patch + inverse stream | The log taps it exactly as `createHistory` does today | Low. Unchanged contract |
| U2 | immer `applyPatches` (inside `pkg:@invana/canvas-store` only) | Replaying view parts | Low. Stays within the state boundary (`pnpm check-boundaries`) |
| U3 | `GraphStore` frame flush (`file:packages/graph/src/layer/GraphLayer.ts#L332`) | One `applyDelta` = one redraw depends on it | Low |
| U4 | Per-element visibility (`doc:docs/per-element-visibility-plan.md`) | `hidden` / `shown` ops and layouts skipping hidden nodes | Low |
| U5 | The `edit:` convention and baseline write (`file:packages/canvas/src/engine/Canvas.ts#L191`, `#L1120`) | Studio edits must stay undoable and restore real pre-edit values | Medium if F3 drops them. V1 guards it |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `canvas.history` (`sym:Canvas.history`) and `sym:createHistory` | published API | Type widens to `HistoryView`; `createHistory` deprecated | TSDoc; surface snapshots (F17) |
| X2 | `history.undo` / `history.redo` commands (`file:packages/canvas/src/engine/builtinCommands.ts`) and their `GraphCanvas` / `GraphHistoryProvider` overrides | commands | The two-stack arbitration goes | Simplify the overrides to call the one log |
| X3 | `sym:useHistory` (two-stack since `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently`), `file:packages/canvas-react/src/HistoryContext.ts`, `GraphHistoryProvider` | React API | Reads one log | Keep the hook's return shape |
| X4 | `sym:GraphHistory` callers: clipboard (`cutSelection`, paste), `undoNewest` in `@invana/graph`, the drag-capture journaling in `sym:GraphCanvas`, EraseBehaviour, CreateNodeBehaviour, DrawEdgeBehaviour | internal API | Unchanged calls, new recording path | V3 |
| X5 | `GraphCanvasOptions.history.limit` | published option | Ignored (no limit) | Deprecate in TSDoc |
| X6 | Direct `GraphStore` writers: `useEntityEditor` (`pkg:@invana/canvas-react`), the canvas-ui node-style editors (`editor-panels/node-style/*/mapping.ts`), `sym:MapLayer`, the datasets' loaders | internal and published | Now recorded, under the session actor | None, apart from V4 |
| X7 | The five derived-writing behaviours (F6) | internal | Write path changes | V6: visuals unchanged |
| X8 | `CanvasView.interaction` gains `inspect`, `cameraIntent` | serialised state | `exportCanvasState` / `importCanvasState` carry two more fields | Version bump of `CANVAS_STATE_VERSION` only if import rejects unknown fields |
| X9 | `story:graph/Layer/Streaming`, `story:usecases/by-casestudies/microservices/ServiceTopology` | stories | Now recorded as feed / user entries | V13. No story edits (rule 11) |
| X10 | Every story with an active layout and hideable nodes (e.g. collapse/expand group stories) | stories | F7 re-runs the layout on hide / show | V7: check they don't jitter |
| X11 | `pkg:@invana/canvas-ui` Studio undo (`story:canvas-ui/editors/CanvasSettingsEditorPanel`) | UI | Same behaviour through the new log | V1 (control) |
| X12 | `apps/docs` | docs | No API pages (CLAUDE.md). TSDoc carries the surface | None |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | **Control**: a Studio settings edit undoes and redoes as today, and the live instance is reconciled | `story:canvas-ui/editors/CanvasSettingsEditorPanel`; `packages/canvas-store/tests/port/createHistory.test.ts` ported to the log | Same results as today | F2, F3 |
| V2 | pass | One entry holding a graph op and a view patch undoes in one call | `packages/canvas-store/tests/log/createOperationLog.test.ts` (new) | Both reverted, cursor moves by 1 | F2, F4 |
| V3 | pass | **Control**: cut, paste and node drag undo as today | `packages/graph/tests/history/GraphHistory.test.ts` | Unchanged assertions pass | F4, F5 |
| V4 | pass | Every public `GraphStore` writer produces exactly one entry, carrying the given or default actor | `packages/graph/tests/store/applyDelta.test.ts` (new) | One entry per call; `batch` = one entry | F5 |
| V5 | pass | `applyDelta`'s existing order and skip-unknown behaviour hold, and `hidden` / `shown` / `pinned` invert | same file | Existing ordering assertions + round-trips | F5 |
| V6 | pending | Derived writes are not recorded, and after undo the behaviours recompute the same visuals | graph behaviour tests; ColorBy / Centrality / collapse stories in a visible browser tab | No derived ops in the log; same pixels | F6 |
| V7 | pass | Hide reflows the visible nodes; a throttled data re-run keeps the camera | `packages/graph/tests/canvas/` + group collapse stories | One layout run per throttle window; camera unchanged | F7 |
| V8 | pass | Writing `interaction.selection` selects on screen without an echo loop | `packages/graph/tests/behaviours/` | One `selection` write, visuals updated | F8 |
| V9 | pass | `FocusBehaviour` dims non-focus nodes and frames after settle; its editor round-trips options | graph behaviour test; canvas-ui editor test | States set via `internal`; editor patch → `setOptions` | F9, F12 |
| V10 | pass | Loading 20k nodes through `applyDelta` costs no more than today plus recording | `packages/canvas-store/tests/performance.test.ts` pattern, in graph | Within 10% of today's time | F5 |
| V11 | pass | A playbook plays, steps back and replays: `addStep` doesn't change state; `next` validates, applies as one entry with `stepId`; `previous` reverts; a second `next` replays recorded entries | `packages/canvas-store/tests/log/playbook.test.ts` (new) | As described; a bad id writes nothing | F13 |
| V12 | pending | `sinceLastStep` returns the net delta (add + remove cancel), merged settings and final view; adding it links rather than re-runs | same file | As described | F14 |
| V13 | pending | **Control**: the Streaming story runs unchanged; feed entries merge, cancel and are skipped by undo | `story:graph/Layer/Streaming` (visible tab); log test | Same visuals; a handful of entries per minute | F15 |
| V14 | pending | Hooks return live values | `packages/canvas-react` tests if present, else a Storybook check | Re-render on change | F16 |
| V15 | pass | `pnpm lint` (boundaries + API surface), `pnpm check-types`, `pnpm build` | repo | Green | F17, all |
| V16 | pending | A React `data` prop load leaves an empty history; `setData` from code records one entry | `packages/graph/tests/` (layer-level `loadData`) + a GraphCanvasApp story in headless Chromium | `canUndo()` false after load | F24 |
| V17 | pass | The playbook stories play forward and back with no console errors, and each step's visual lands (focus dims, camera frames, hidden nodes reflow) | `story:graph/Playbook/*` in headless Chromium | Screenshots per step; no errors | F25 |
| V18 | pass | `ClickViewBehaviour` follows `interaction.inspect` and writes its own target back; inspect and camera intent are recorded but skipped by plain undo; the engine frames `'all'`; export / import carry both fields, an import doesn't re-frame, an older snapshot imports as `null` | `packages/graph/tests/canvas/playbookPr2.test.ts` | As described | F10 |
| V19 | pass | `commands.runAsync('layout.run')` resolves after the run; a missing command resolves `false`. `whenSettled` gates `FocusBehaviour`'s framing and every playbook move | same file; `packages/canvas-store/tests/log/playbook.test.ts` | As described | F11, F12 |

No tests are added under `pkg:@invana/canvas` (rule 10). The playbook and log logic lives in `pkg:@invana/canvas-store` so it can be tested there.

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Merge the two history stacks? | A: keep two · B: one log | B. Supersedes D2 of `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` | accepted |
| D-2 | A lens / filter in the canvas? | A: `view.lens` + `FilterBehaviour` · B: none; the engine filters | B (R1) | accepted |
| D-3 | Narrow by remove or hide? | remove · hide · both | Both: remove for query-driven narrowing, hide for temporary toggles; F7 makes hide reflow | accepted |
| D-4 | Is the camera part of a step? | pixels · intent | Intent: `focus` / `visible` / `all` | accepted |
| D-5 | Where does new data come from? | the canvas fetches · the engine sends | The engine answers in the step format; feeds call `applyDelta` | accepted |
| D-6 | How many ways can data get in? | many · one | One: `applyDelta`, the existing shape extended (R8) | accepted |
| D-7 | Playbook and history: one thing? | one · two | Two: playbook = script, history = record (R4) | accepted |
| D-8 | Does `addStep` change the canvas? | yes · no | No. Moving to a step plays it | accepted |
| D-9 | Who owns an operation? | fixed user/engine enum · free text | Free-text `actor`, defaulting to the session actor | accepted |
| D-10 | Undo across actors? | linear · selective | Linear | accepted |
| D-11 | The first data load: step 1, or the starting state? | step · baseline | Step 1; the config is the baseline | accepted |
| D-12 | How does the engine get the user's changes back? | `onEntry` filtered by actor · a separate API | `onEntry` filtered by actor; detailed design deferred (F22) | accepted |
| D-13 | Does a presenter show manual entries? | all entries · steps only | Steps only; manual work joins through `sinceLastStep` | accepted |
| D-14 | How do feed writes opt into merging (F15)? | A: by actor prefix (`actor: 'feed:…'`) · B: an explicit option (`applyDelta(delta, { actor, coalesce: true })`) | **B.** A magic prefix makes the actor string carry behaviour; an explicit flag is visible at the call site and lets any actor stream | accepted |
| D-15 | How does this land? | one PR · a sequence | **A sequence**: (1) F1–F6 + F17 (log and door; useful alone) · (2) F7–F13 + F24 + F25 · (3) F14–F16. Each stays green on its own. *Amended 2026-09-28:* F13 moved into PR 2 so the playbook stories (F25) can drive the real `canvas.playbook` | accepted |
| D-16 | Is a load through a React root's `data` prop (`<GraphLayer data>`, `GraphCanvasApp data`) recorded? Today (PR 1) it is: Ctrl+Z right after a story loads empties the graph | A: recorded, as any `setData` (D-11 read literally) · B: the `data` prop loads as the baseline, like `options.initData`; `setData` called from code stays recorded | **B.** A prop is configuration, like `initData`; D-11's "first load is step 1" is about a playbook's first step, which arrives through `applyDelta` | accepted (F24) |
| D-17 | What do the `'visible'` and `'all'` camera intents frame? | — | `'visible'`: every visible element (`fitView`); `'all'`: all content including hidden nodes (`getBounds({ includeHidden: true })`). `'focus'` is framed by `FocusBehaviour` | accepted |
| D-18 | Which statistic judges V10's 10 % budget? | mean · median | **Median of paired runs** (≈ 3 %). The mean is dominated by a GC tail on the recorded side. F5 → `landed` | accepted |
| D-19 | Does F7's hide / show re-run count collapse? | explicit + collapse · explicit only | **Explicit hide / show only.** `CollapseExpandBehaviour.afterReproject` (`file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts#L446`) already runs its own anchored, camera-preserving re-layout; counting collapse would run the layout twice and drop the anchor | accepted |
| D-20 | Pin-on-drag's two entries (move, pin) | fix in PR 2 · defer | Defer (F26) | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened | proposed | Written after seven design revisions with the maintainer (Canvas Playbooks design doc). D-1 to D-13 were settled in that discussion and are recorded here as accepted. D-14 and D-15 are new at RFC time |
| 2026-09-28 | Accepted | accepted | The maintainer approved the plan as a whole: F1–F17 accepted, F18–F23 stay deferred. D-14 accepted as recommended: streamed writes opt into merging with an explicit `coalesce: true`, not an actor prefix (F15 and G12 reworded). D-15 accepted: land as three PRs, (1) F1–F6 + F17, (2) F7–F12, (3) F13–F16 |
| 2026-09-28 | PR 1 implemented (branch `feat/operation-log-pr1`) | accepted | F1–F4 `landed` (V1, V2, V3, V15 pass); F5, F6, F17 `implemented`. **Checks:** V1 pass — `createHistory`'s tests pass unchanged through the log, `packages/graph/tests/canvas/definitionHistory.test.ts` passes, and in `story:canvas-ui/editors/CanvasSettingsEditorPanel` and `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` (headless Chromium) an `edit:` toggle of the `theme` behaviour undoes and redoes on the live instance; V2 in `packages/canvas-store/tests/log/createOperationLog.test.ts` (16 tests); V3 `GraphHistory.test.ts` unchanged; V4 + V5 in `packages/graph/tests/store/applyDelta.test.ts` (31 tests: every writer snapshots back exactly on undo and forward on redo); V6 log half in `packages/graph/tests/behaviours/derivedWritesUnrecorded.test.ts` (fails when a behaviour is put back on the recorded path), pixel half still pending — the NodeCentrality / CollapseExpand / ParallelEdge stories render with no console errors, but no before / after pixel compare was made; **V10 fail, marginal** — paired runs of the old store vs the new one with a log: median ratio 0.86–1.12 (about 1.03); the `GraphStore.bench.ts` case added for it: mean 1.11–1.24×, min +4%, the recorded side with a GC-shaped tail. **What the code taught:** (1) Recording lives at the store's write methods rather than each writer being rewritten as an `applyDelta` call: one call is still one entry, a `batch` one entry, the same change the same ops, and it keeps each writer's throw and event behaviour exactly (`addNode` duplicate, `removeNode({ cascade: false })`, parent cycles). `applyDelta` stays the documented door and the only writer that names an actor. (2) Positions are derived: `setPosition` / `setPositionsBulk` are not recorded (layouts, drag frames); a drag records once through `GraphStore.recordApplied` (what `GraphHistory.push` now calls); `NodeResizeBehaviour` now journals one `'resize'` entry on release — **resize was never undoable before**. (3) F6 grew: `EdgeLODBehaviour` (its hide / show thinning), `GraphLayer.applyTheme`'s group style, and the `pkg:@invana/graph-layout-d3-hierarchy` / `-elkjs` / `-d3-sankey` style and waypoint writes also go through `store.internal`; `options.initData` loads unrecorded (configuration = baseline, D-11). (4) Record-only entries (selection, focus) join the applied side without cutting the redo tail, and undo moves the entry it reverts past them, so clicking a node after an undo keeps the redo. (5) Bulk adds in one batch collect into `addNodes` / `addEdges` ops, and recorded adds hold the caller's record by reference, not a clone (the design's "references, not clones"); that is what brought V10 from ~1.2 to ~1.03. (6) Setup writes are now recorded: tests that asserted an empty history after loading fixtures call `canvas.history.clear()` as their baseline; "each layer has its own history" became "one log across layers, Undo takes the newest"; a `GraphHistory` sees definition edits; `graph.clear` with no graph history is now undoable. (7) Deprecated, ignored: `GraphHistoryOptions.limit`, `GraphCanvasOptions.history.limit`, `GraphHistoryProvider`'s `limit`; `maxDepth` is `Infinity`, `setLimit` a no-op; `GraphHistory`'s `change` payload reports `redoDepth` as 0 / 1. (8) Refinements to F1's shapes: `Delta.pinned` is `{ id, pinned?, x?, y? }` (so it can unpin); `OperationLog.recordData` takes an ops array; `HistoryView` in PR 1 has no `sinceLastStep` (F14) and `DeltaOptions` no `coalesce` (F15) — both arrive with PR 3; no `toJSON` (H6 has no row). `CanvasContext.log` is how a data layer reaches the log. `packages/canvas-store/eslint.config.js` allows immer in `src/log/`. **Not caused by this change, found while running V13:** `story:graph/Layer/Streaming` throws `GraphStore.addEdge: unknown endpoint` whenever a tick adds an edge to a node it removes in the same delta — the old store throws identically (checked). **Open for the maintainer:** a `data` prop / `setData` load is recorded (D-11: the first load is step 1), so Ctrl+Z right after a story loads empties the graph and redo brings it back; and `DragNodeBehaviour`'s pin-on-drag makes two entries (move, pin) |
| 2026-09-28 | PR 2 started (branch `feat/operation-log-pr2`, stacked on `feat/operation-log-pr1`) | accepted | The maintainer accepted the recommendations raised by PR 1: D-16 → B (new row F24), D-17 (`'visible'` / `'all'` meaning), D-18 (V10 judged on the median → V10 pass, F5 `landed`), D-19 (F7 counts explicit hide / show only), D-20 (pin-on-drag deferred, F26). The maintainer asked for playbook stories (F25); to make them drive the real API, F13 moved from PR 3 into PR 2 (D-15 amended). New checks V16, V17 |
| 2026-09-28 | PR 2 implemented (branch `feat/operation-log-pr2`) | accepted | F7–F13 and F25 `landed`; F24 `implemented`. **Checks:** V7, V8, V9 (graph half), V18, V19 and the engine half of V11 in `packages/graph/tests/canvas/playbookPr2.test.ts` (17 tests); V11 logic in `packages/canvas-store/tests/log/playbook.test.ts` (8 tests); V9 editor half: the `focus` editor's `optionsToForm` / `formToOptions` round-trip every option (a scratch vitest run, since `pkg:@invana/canvas-ui` has no test runner); V17: `story:graph/Playbook/{Walkthrough,FocusAndFrame,HideAndReflow,CameraSteps,ExpandAndRelayout}` stepped forward, back and replayed in headless Chromium with a screenshot per step, no console errors; V15 green (build, check-types, lint incl. boundaries + API surface). **V16 stays pending**: the layer-level half passes (`loadData` leaves nothing to undo, `setData` records one entry), but the React `data`-prop path was not checked in a browser, so F24 stays `implemented`. V6's pixel half is still pending. **What the code taught:** (1) The store's `interaction.selection` is canvas-wide, but each `ClickSelectBehaviour` mirrored its whole set into it; once F8 made behaviours follow the store, a second layer's selection cleared the first's. Each behaviour now replaces only its own layer's ids (`sym:ClickSelectBehaviour`, `packages/graph/tests/canvas/graphCommands.test.ts` caught it). (2) F13 needed the log to reach a source's data door without the canvas knowing the graph domain: `DataOpAdapter` gains optional `applyDelta` / `hasElement`, `OperationLog` gains `source(id)` and `status(entryId)` (`'applied' \| 'pending' \| 'unknown'`), so a step that was stepped back over is replayed from its entries, and re-played only when a later change cut them off. `Playbook` gains `title` and `index`. `StepSpec.data` is `Delta<DeltaRecord>` (open JSON records): the `{ id }`-only default rejected a step's `type` / `data` / `source` fields. (3) `FocusBehaviour` frames with store-derived boxes (`GraphLayer.getBounds({ ids })`, new), not renderer bounds, so a layout that just settled is framed where it put the nodes. (4) `Layout.onData` is a mutable field read on each data change, set at construction or by assignment; it is serialised by `serializeDefinition` but not reachable through `setOptions` / `canvas.update`, and no layout editor exposes it yet. (5) `whenSettled` resolves anyway after 15 s, so a live simulation can't hold a playbook forever. (6) `CanvasCommand.run` may return a promise (`void \| Promise<void>`); `layout.run` / `layout.activate` return `runLayout`'s. (7) Undoing a playbook's `settings` step needed no new wiring: the engine's `edit:` reconciler already re-applies `activeLayout` through `update()`. A subscription added for it made the layout run twice and was removed. (8) `ClickViewBehaviour` and `ClickSelectBehaviour` both claim `pointer+click`; the Walkthrough story gives the viewer `shortcuts: []` so it only follows `inspect`. (9) Added beyond the rows: a `<FocusBehaviour>` wrapper in `pkg:@invana/canvas-react` (the package has one per behaviour). **Seen, not ours:** stories that mount a `BackgroundLayer` and a lil-gui panel show an undrawn rectangle in the bottom-right corner (`story:graph/Groups/RelayoutOnToggle` shows it too) |
