---
id: feat-2026-09-28-canvas-definition-edits-cannot-be-undone
type: feat
title: Edits to the canvas definition (settings, control panels) can be undone alongside graph edits
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/canvas-state-plan.md
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio }
  - { predicate: manifests-in, object: story:canvas-ui/editors/CanvasSettingsEditorPanel }
---

# Edits to the canvas definition (settings, control panels) can be undone alongside graph edits

| | |
|---|---|
| **Motivation** | The Studio editors (`CanvasSettingsEditorPanel`, `ControlPanelsEditor`) write `view.definition`. No view history exists, so an applied edit cannot be undone, and **Undo** (`history.undo`) only covers graph data. D4 of `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` deferred this to its own kernel-wide RFC. |
| **Design** | (1) Record only **named user edits**: `canvas.update(patch, action)` with an `edit:*` action, filtered to `definition` paths. (2) A **reconciler** in `Canvas`: undo and redo also re-apply the reverted definition slices to the live instances. (3) **One Undo button, two stacks**: `history.*` undoes whichever stack's top entry is newer. |
| **Row status** | proposed 0 · accepted 0 · implemented 8 · landed 0 · deferred 1 · rejected 0 · superseded 0 |
| **Open decisions** | none — D1, D2 as recommended; D3 superseded by the baseline write (§8) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | `createHistory` exists and taps the patch + inverse stream, but only tests and one playground story call it | `file:packages/canvas-store/src/port/createHistory.ts#L30`, `file:apps/storybook/stories/canvas-store/Playground.stories.tsx#L226` | grep |
| M2 | `history.undo` / `history.redo` are `GraphHistory`, which journals graph data ops only | `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L120-L139`, `file:packages/graph/src/history/types.ts#L26-L33` | entry kinds: node / edge add, remove, update, move |
| M3 | TSDoc still promises undo that doesn't exist | `file:packages/canvas-ui/src/editor-panels/control-panels/ControlPanelsEditor.tsx#L67` ("so it undoes…"), `file:packages/canvas/src/engine/Canvas.ts#L200` (store "owns history") | read |
| M4 | The design of record expects history to come from the patch stream | `doc:docs/canvas-state-plan.md` C12 (L56), §6.3 (L290-306) | "`const history = createHistory(state.view)`" |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Wire `createHistory(store.view)` as-is | rejected | It records every change. Camera writes happen on every gesture frame (`file:packages/canvas-core/src/abstracts/Camera.ts#L160-L187`), and hover, raise and layout progress are written too (`sym:createActions`), so the stack would fill with noise. `doc:docs/collaborative-state-plan.md` L30-35 keeps viewport and selection out of history. |
| R2 | Undo by reverting only the store | rejected | `sym:Canvas.update` is imperative and one-way (`file:packages/canvas/src/engine/Canvas.ts#L1047-L1109`): it pushes options to instances and *then* mirrors them into the store. Nothing subscribes to `definition.{layers,behaviours,layouts}`, so a reverted store would leave live instances on the new options. Only `controlPanels` would appear to work, because its renderer reads the store. |
| R3 | Record every `canvas:update` | rejected | The React roots call `canvas.update(config)` on mount and on every config-prop change, and `<ControlPanel>` writes on mount/unmount (`file:packages/canvas-react/src/control-panels/ControlPanel.tsx#L56-L59`). The first Undo would then un-configure the canvas instead of undoing the user's edit. |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `createHistory(store, { limit, filter })`: `filter(change) → boolean` chooses which changes are recorded. A `subscribe` listener fires on stack changes, and `peek()` returns the top entry's `at` timestamp | `file:packages/canvas-store/src/port/createHistory.ts#L36-L41` | history is scoped without forking the op |
| 2 | `Canvas.update(patch, action = 'canvas:update')`: an optional action name is passed through to `store.view.update` | `file:packages/canvas/src/engine/Canvas.ts#L1073` | callers can mark a write as a user edit |
| 3 | `canvas.history` is a view history over `store.view`. It records changes whose action starts with `edit:` and strips any patch outside `definition/*` | step 1 | programmatic config, mounts and interaction are never recorded (R1, R3) |
| 4 | **Reconciler**: `canvas.history` undo and redo diff the definition before and after, then push each changed `layers` / `behaviours` / `layouts` slice back through the same instance path `update` uses (`setOptions`, `behaviours.setEnabled`, `setModes`) | `file:packages/canvas/src/engine/Canvas.ts#L1048-L1068` | instances follow the store (R2) |
| 5 | Editors apply with `edit:*` actions: `edit:control-panels`, `edit:settings:<kind>`; `useGraphCanvasUpdate().update(patch, action?)` | `file:packages/canvas-react/src/hooks/useGraphCanvasUpdate.ts#L14-L16`, `file:packages/canvas-ui/src/editor-panels/control-panels/ControlPanelsEditor.tsx#L87-L89` | Studio edits become undoable |
| 6 | `history.undo` / `history.redo` are built-in commands over `canvas.history`. `GraphHistoryProvider` overrides them with a version that undoes whichever stack's top is newer (`GraphHistory` entries gain `at`) | `sym:CommandRegistry` stacking, `file:packages/graph/src/history/GraphHistory.ts#L99` | one Undo button covers both stacks (D2) |
| 7 | `importState` clears `canvas.history` | `file:packages/canvas/src/io/stateExport.ts#L271-L295` | an import can't be half-undone |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/canvas-state-plan.md` §6.3 | design of record | accepted | history taps the patch stream, and under Yjs it delegates to `UndoManager` with the same API. This RFC adds the filter and reconciler, which §6.3 didn't cover |
| `doc:docs/collaborative-state-plan.md` L30-35 | relates-to | accepted | viewport and selection are awareness, not document state, so they stay out of history |
| `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` | relates-to | accepted | its D4 / E7 opened this RFC |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| H1 | defect | implemented | `sym:createHistory` (`pkg:@invana/canvas-store`) | `filter` option; `subscribe(listener)`; `peek()` returning the top step's `at`; each recorded step stamped with `at` | scoped, observable history | low — additive; existing tests keep passing | — |
| H2 | defect | implemented | `sym:Canvas.update` | optional second arg `action` (default `'canvas:update'`) | writes can be named | low — additive signature | — |
| H3 | defect | implemented | `pkg:@invana/canvas` `Canvas` | `canvas.history: History`, filtered to `edit:*` actions and `definition/*` paths, and disposed with the canvas | a view history exists | medium — a new public field, so the API surface snapshot changes | H1, H2 |
| H4 | defect | implemented | `pkg:@invana/canvas` `Canvas` | reconciler on undo and redo (step 4); the `interaction.viewMode` seed is not affected | undo changes what's drawn, not just the store | **medium-high** — it re-drives `setOptions` on live layers and behaviours; D3 decides how removed keys are handled | H3 |
| H5 | defect | implemented | `pkg:@invana/canvas` builtins + `sym:GraphHistoryProvider` + `sym:GraphHistory` | built-in `history.undo` / `history.redo` over `canvas.history`; the provider's override picks the newer top across both stacks; `GraphHistory` entries get `at` | one Undo button | medium — changes Undo order for apps that edit both the graph and the settings | H3 |
| H6 | defect | implemented | `sym:ControlPanelsEditor`, `sym:CanvasSettingsEditorPanel`, `sym:useGraphCanvasUpdate` | apply with `edit:*` actions | Studio edits are recorded | low | H2 |
| H7 | defect | implemented | `sym:importCanvasState` | `canvas.history.clear()` after an import | no stale steps | low | H3 |
| H8 | defect | implemented | TSDoc at M3; `file:packages/canvas-core/src/state/view/controlPanels.ts#L7-L9` | state what is actually undone: `edit:*` definition changes | docs match behaviour | low | H3 |
| H9 | defect | deferred | `sym:useHistory` / `HistoryContext` | expose the combined timeline to React (`canUndo` across both stacks) | toolbars' enabled state reflects view edits | medium — `useHistory` returns `GraphHistory` today, so this is an API change. Deferred until H5 proves the arbitration | H5 |

## 5. Blast radius

Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:ReactiveStore.subscribeChanges` + immer patches (`file:packages/canvas-store/src/port/patch.ts#L7-L8`) | H1 records from it | the Yjs backend must keep `action` and `inverse` on changes (the design of record already requires this) |
| U2 | `Behaviour.setOptions` overrides that skip `super` | H4 reuses `update`'s explicit `setEnabled` / `setModes` routing | if a behaviour ignores an option, undo can't restore it either — the same limit `update` already has |

Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `api/canvas.surface.txt`, `api/canvas-store.surface.txt` | published API | additions (`history`, `update` arg, `createHistory` options) | regenerate the snapshot |
| X2 | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:usecases/tools/GraphModeller` (Undo in the header) | story | Undo now also covers settings edits | none; checked by V4 |
| X3 | `sym:useHistory` consumers (`HistoryToolbar`, `GraphControlsToolbar` history section) | canvas-ui | their enabled state still follows `GraphHistory` only, until H9 | none now; H9 |
| X4 | serialised state | persistence | none — history is not exported | none |
| X5 | `pkg:@invana/canvas-designer` | package | none — it keeps its own undo | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build`, `check-types`, `lint` (surface regenerated), `test` | repo | green | all |
| V2 | pass | canvas-store tests: `filter` drops non-matching changes; `peek`, `subscribe`, `at` | `packages/canvas-store/tests/port/createHistory.test.ts` | pass | H1 |
| V3 | pass | headless Chromium: in `story:canvas-ui/editors/CanvasSettingsEditorPanel`, change a background colour, Apply, run `history.undo` | story | the colour reverts on screen, not just in the store | H3, H4, H6 |
| V4 | pass | headless Chromium: in `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, add a node, edit a setting, Undo ×2 | story | the setting reverts first, then the node | H5 |
| V5 | pass | **control**: pan, zoom, hover, select and run a layout, then Undo | FullFeatured | none of these are undone; graph undo behaves as before | H3 |
| V6 | pass | import a state file, then Undo | `story:canvas-ui/apps/GraphCanvasApp/ExportState` | nothing to undo | H7 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | What gets recorded | A: every `canvas:update` · B: only `edit:*`-named updates · C: every `definition/*` path change | **B** — the caller says "this was a user edit". A and C record the React roots' initial config (R3) | accepted |
| D2 | One timeline or two | A: two stacks, `history.*` undoes the newer top (by `at`) · B: one shared `CanvasHistory` timeline that both feed | **A** — `GraphHistory` stays as-is and only its entries gain `at`; B is a larger refactor of `GraphHistory`, its events and `useHistory` | accepted |
| D3 | An undo that must *remove* an option key the edit added (`setOptions` merges) | A: reconciler sends the full reverted slice and accepts that added keys persist on the instance · B: reconciler sends `undefined` for each removed key · C: re-create the instance | **B** — the reconciler knows the removed keys from the inverse patches; most `setOptions` treat `undefined` as "back to default". Behaviours where that doesn't hold get noted in §8 during the implementation | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened from D4 of `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio`, after the control-panel branch merged | proposed | awaiting approval |
| 2026-09-28 | Approved whole ("impleemnt all in this branch"); every decision as recommended | accepted | |
| 2026-09-28 | H1–H8 implemented on `feat/view-history` | accepted | V1: build, check-types, lint (surfaces regenerated: `History*` types, `ControlPanelPlacement`, `CommandArg*`), tests (canvas-store +4, graph +7 in `tests/canvas/definitionHistory.test.ts`, +1 `GraphHistory` peek). V3: headless Chromium, `CanvasSettingsEditorPanel` — an `edit:` background colour turns the canvas red, `history.undo` returns it to the grid on screen, and the header Undo / Redo buttons follow. V4: `FullFeatured` — lasso-select edit then `graph.clear`; Undo → 77 nodes back (lasso still on), Undo → lasso off; Redo → lasso on, Redo → cleared. V5: zoom / pan commands and `select.mode` switches leave `canUndo` false (hover and layout progress are filtered by the same `edit:` prefix; not driven separately). V6: `importCanvasState` on `FullFeatured` + a graph test leave nothing to undo (driven through the API, not the ExportState story's file picker). **Learned — the RFC was wrong or short in four places:** (1) D3's option B (send `undefined` for a removed key) would reset an option to the *class* default, not the pre-edit value — the settings editor writes whole option bags, so almost every key is "new" to the definition. Replaced by a **baseline write**: before an `edit:` update, the instance's current value of each key the definition doesn't hold is written unrecorded, so the inverse patch restores the real old value; `undefined` is now only the fallback for non-JSON values. (2) Live editors write per keystroke / drag frame, so H1 gained `mergeWithinMs` (same action within 600 ms → one step) and the settings panel names its action per instance. (3) Redo must take the **older** top across the two stacks, not the newer (undo walked newest → oldest). (4) Several behaviours override `setOptions` without `super`, so `getOptions()` is stale for them (`BrushSelectBehaviour` resolves into `.options`); the baseline reads each key from `getOptions()` then `.options`. The same staleness affects what `CanvasSettingsEditorPanel` shows for those behaviours — pre-existing, not fixed here. Also: undoing an `activeLayout` change re-announces it through `update` so `GraphCanvas` re-wires it; `GraphCanvas.update` gained the `action` parameter |
