---
id: feat-2026-09-28-graph-toolbar-actions-cannot-be-saved
type: feat
title: Graph toolbar actions become commands, so their controls can be saved as presets
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas }
  - { predicate: relates-to, object: rfc:feat-2026-09-27-two-ways-to-float-a-toolbar }
---

# Graph toolbar actions become commands

| | |
|---|---|
| **Motivation** | A `ControlPanel` item can only call a registered command, and only camera / lock / layout exist. Undo, clipboard, select mode, edge type, grid and export are closures inside toolbars, so a saved panel can't carry them |
| **Design** | Commands gain a **value** (for pickers); a `choice` item kind; the registry gains **override stacking** + `invalidate()`; graph + provider-owned actions register as commands; canvas-ui ships a preset per toolbar |
| **Row status** | proposed 0 · accepted 0 · implemented 14 · landed 0 · deferred 2 · rejected 0 |
| **Open decisions** | none — D1 A, D2 defer, D3 stack, D4 registered layouts |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Undo / redo are closures over a React-context `GraphHistory` | `file:packages/canvas-react/src/hooks/useHistory.ts` | `useContext(HistoryContext)` |
| M2 | Cut / copy / paste / delete: same, via `GraphClipboard` | `file:packages/canvas-react/src/hooks/useClipboard.ts` | `useContext(ClipboardContext)` |
| M3 | Select mode is behaviour enable/disable, but only reachable from a hook | `file:packages/canvas-react/src/hooks/useSelectMode.ts` | `resolved.update({ behaviours: patch })` |
| M4 | Edge type writes `GraphLayer.setEdgeDefaults`; state is hook-local | `file:packages/canvas-react/src/hooks/useEdgeType.ts#L35-L45` | `useState` + `setEdgeDefaults` |
| M5 | Grid writes `BackgroundLayer.setOptions` directly (bypasses the store); state is hook-local | `file:packages/canvas-react/src/hooks/useGrid.ts` | `layer.setOptions(next)` |
| M6 | A pick-one control (select mode, edge type, layout) has no `ControlItemSpec` kind | `file:packages/canvas-core/src/state/view/controlPanels.ts` | union has no select/choice |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Express a picker as N toggles | rejected | loses the dropdown / segmented display and the single "current value" |
| R2 | Put the modeller tool in this round | deferred (D2) | `sym:GraphToolProvider` is React state that usually sits **above** the canvas (`GraphCanvasApp.wrap`), so it has no canvas to register on |
| R3 | Serialise the factory-based layout picker | rejected (D4) | `GraphControlsToolbar.layouts` is `Record<key, () => Layout>`, which is closures by design |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `CanvasCommand` gains optional `value(ctx, args)` and `options(ctx, args)` | `sym:CanvasCommand` | a command can back a picker |
| 2 | New item `{ type: 'choice', command, args?, label, options?, display? }`; picking runs `command` with `{ ...args, value }` | `sym:ControlItemSpec` | select mode / edge type / layout become data |
| 3 | `register` **stacks**: a second registration of a name overrides, and disposing it restores the one below | `sym:CommandRegistry.register` | a provider can upgrade `graph.clear` to its undoable form and cleanly hand it back |
| 4 | `invalidate()` notifies subscribers when command state changes outside the view store (history stack, clipboard buffer, edge defaults) | `sym:CommandRegistry` | `useCommandStates` re-reads without new wiring |
| 5 | Engine- and graph-level actions register on the canvas; context-owned ones register **from their providers while mounted** | `sym:GraphCanvas`, `sym:GraphHistoryProvider`, `sym:GraphClipboardProvider` | commands exist exactly where the toolbars work today |
| 6 | canvas-ui adds one preset per toolbar + widgets for UI-rich controls (export, minimap, dev info) | `file:packages/canvas-ui/src/control-panels/presets.ts` | every toolbar except Schema / Modeller has a saveable equivalent |

### Command catalogue

| Name | Kind | Registered by | Value / active | Args |
|---|---|---|---|---|
| `layout.activate` | choice | `sym:Canvas` | `definition.activeLayout`; options = registered layouts | `{ value }` |
| `background.grid` | toggle | `sym:Canvas` | background `type === 'pattern'` (read from the definition) | `{ layerId?, patternType? }` |
| `select.mode` | choice | `sym:GraphCanvas` | first enabled mode's behaviour | `{ modes?, value }` (default modes `{ click: '', brush: 'brush-select', lasso: 'lasso-select' }`) |
| `graph.edgeType` | choice | `sym:GraphCanvas` | `GraphLayer.edgeDefaults` path type | `{ layerId?, types?, value }` |
| `graph.clear` | button | `sym:GraphCanvas`; overridden by `sym:GraphHistoryProvider` (undoable) | — | `{ layerId? }` |
| `history.undo` / `history.redo` | button | `sym:GraphHistoryProvider` | enabled = `canUndo` / `canRedo` | — |
| `clipboard.cut` / `.copy` / `.paste` / `.delete` | button | `sym:GraphClipboardProvider` | enabled = has selection / has content | `{ clickSelectId? }` |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` | depends-on | implemented | registry, specs, `<ControlPanels>`; F11 of that RFC is this document |
| `rfc:feat-2026-09-27-two-ways-to-float-a-toolbar` | relates-to | implemented | T7 of that RFC is this document |
| `doc:docs/canvas-state-plan.md` | relates-to | active | D1 option B is that plan's direction (the kernel owns state) |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| C1 | defect | implemented | `sym:CanvasCommand` | optional `value()` + `options()` | pickers | low — additive | — |
| C2 | defect | implemented | `sym:ControlItemSpec` | `ControlChoiceItemSpec` | pickers as data | medium — union grows; exhaustive switches must handle it | C1 |
| C3 | defect | implemented | `sym:CommandRegistry` | override stack on `register` / dispose; `invalidate()` | provider overrides + external state | medium — changes dispose semantics | — |
| C4 | defect | implemented | `file:packages/canvas/src/engine/builtinCommands.ts` | `layout.activate`, `background.grid` (writes via `canvas.update`, so the store sees it) | layout + grid presets | low | C1 |
| G1 | defect | implemented | `sym:GraphCanvas` | registers `select.mode`, `graph.edgeType`, `graph.clear` | graph pickers headless-capable | medium — cross-package | C1, C3 |
| G2 | defect | implemented | `pkg:@invana/graph` | move `DEFAULT_EDGE_TYPES` / labels from canvas-react into graph, re-export from canvas-react | command owns its defaults | low | G1 |
| R1 | defect | implemented | `sym:GraphHistoryProvider` | registers `history.undo/redo` + undoable `graph.clear`; `invalidate()` on history `change` | undo in panels | medium | C3 |
| R2 | defect | implemented | `sym:GraphClipboardProvider` | registers `clipboard.*` (selection from `interaction.selection`, split by layer store); `invalidate()` on buffer `change` | edit in panels | medium — duplicates `useClipboard` logic unless shared | C3 |
| R3 | defect | implemented | `sym:useCommandStates` | also reports `value` (in the snapshot) + resolved `options` | renderer draws pickers | low | C1 |
| U1 | defect | implemented | `sym:ControlPanels` | `choice` → dropdown / segmented `ToolbarSelectItem` | pickers render | low | C2, R3 |
| U2 | defect | implemented | `sym:DEFAULT_CONTROL_ICONS` | undo / redo / cut / copy / paste / trash / eraser / lasso / brush / edge-type glyphs | presets have icons | low | — |
| U3 | defect | implemented | `sym:DEFAULT_CONTROL_WIDGETS` | `export-image`, `export-state`, `minimap-toggle`, `devinfo-toggle` (wrapping the existing components) | UI-rich controls in saved panels | low | — |
| U4 | defect | implemented | `file:packages/canvas-ui/src/control-panels/presets.ts` | `HISTORY_` · `EDIT_` · `SELECT_MODE_` · `EDGE_TYPE_` · `LAYOUT_` · `GRID_` · `GRAPH_CONTROL_ITEMS` (the `GraphControlsToolbar` set, minus factory layouts) | a saveable equivalent per toolbar | low | U1–U3 |
| U5 | defect | implemented | `pkg:@invana/canvas-react` | `useSelectMode` / `useEdgeType` / `useGrid` read + write through the commands | one write path; toolbar and panel stay in sync | medium — behaviour of existing hooks | C4, G1 |
| X1 | defect | deferred | `sym:GraphToolProvider` | modeller tool as a command (D2) | Modeller preset | medium | D2 |
| X2 | defect | deferred | toolbars → thin wrappers over presets | `<ControlItems items={PRESET}>` replaces toolbar bodies | one renderer | medium | U4 + header slots accept specs |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| UP1 | `sym:GraphHistory` / `sym:GraphClipboard` events (`change`) | drive `invalidate()` | a missed event leaves a stale disabled button |
| UP2 | `sym:GraphLayer.setEdgeDefaults` | `graph.edgeType` writes it | same contract as `useEdgeType` today |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `sym:ControlPanels` renderer | component | new `choice` kind | U1 |
| D-2 | Code switching exhaustively on `ControlItemSpec['type']` | type | new member | handle `choice` |
| D-3 | `sym:GraphControlsToolbar`, `sym:GraphLayoutToolbar`, `sym:GridToolbar` via `useSelectMode` / `useEdgeType` / `useGrid` | hooks | same UI, new write path | U5; visual check |
| D-4 | Stories using those toolbars (38 via `GraphControlsToolbar`) | stories | none expected | spot-check FullFeatured, GraphVisualiser |
| D-5 | `api/canvas-core`, `api/canvas-store`, `api/canvas` snapshots | published API | additions | regenerate |
| D-6 | Saved panels | serialised | new item kind only; existing specs unchanged | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | canvas-core unit tests | `sym:CommandRegistry` | override stack restores the prior command; `invalidate()` notifies | C3 |
| V2 | pass | graph unit tests | `select.mode`, `graph.edgeType` | value reflects the definition / edge defaults; run switches | G1 |
| V3 | pass | `pnpm check-types` · `pnpm lint` · `pnpm test` | repo | clean | all |
| V4 | pass | Storybook (control) | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:usecases/tools/GraphVisualiser` | header toolbar unchanged; select mode / edge type / grid still switch | U5 |
| V5 | pass | Storybook: a panel built from `GRAPH_CONTROL_ITEMS` + undo | `story:canvas-ui/apps/GraphCanvasApp/ControlPanels` (requested 2026-09-28) | every control works and survives export → import | U1–U4, R1, R2 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Who owns history / clipboard? | **A** providers register commands while mounted · **B** `GraphCanvas` owns `history` / `clipboard`, providers become thin | **A** now (small, matches where toolbars work today); B as its own RFC, since it's the kernel-owns-state direction | accepted |
| D2 | Modeller tool | defer · store it in `interaction.viewMode` and let a command switch it | defer; `viewMode` is the right home but the provider sits above the canvas | accepted |
| D3 | Registry override semantics | replace (today) · stack | stack | accepted |
| D4 | Layout picker source | registered layouts (`canvas.layouts`) · factories | registered only; factory pickers stay a toolbar feature | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened: F11 of the ControlPanel RFC / T7 of the toolbar RFC | proposed | awaiting approval |
| 2026-09-28 | Approved whole (except deferred X1, X2); D1–D4 accepted with the recommendations | accepted | order: C1–C3 → C4/G/R → R3/U1/U2 → U3/U4 → U5 |
| 2026-09-28 | All 14 rows implemented on `feat/control-panels` | accepted | V1 (7 registry tests) + V2 (3 graph command tests) + V3 (build, check-types, lint, 481 tests) + V4 (FullFeatured header: grid toggles, edge type re-routes via `graph.edgeType`; GraphVisualiser clean) pass. V5 waits on a story. Learned: (1) `GraphCanvas` also overrides `layout.activate`, because its `update({ activeLayout })` already runs the layout, so the engine's version would run it twice. (2) Clear / selection / paste logic moved to `canvas-react/src/providers/graphActions.ts`, shared by the hooks and the provider commands so they can't drift. (3) `useSelectMode` needed no change: it already reads the store, which `select.mode` writes. (4) Behaviour change: on a `GraphCanvas`, `useEdgeType` now shows the layer's actual edge type; its `initial` option no longer overrides what's displayed when the two disagree |
| 2026-09-28 | V5 pass | accepted | Story `canvas-ui/apps/GraphCanvasApp/ControlPanels`, driven in headless Chromium: undo / paste start disabled; selecting a node enables copy / delete; copy enables paste; delete enables undo; undo enables redo; layout picker lists `graph-force` + `layered`; no console errors |
