---
id: feat-2026-11-19-geo-tools-have-no-keys-or-gesture-hints
type: feat
title: Geo tools get named commands, a key map, and on-screen gesture hints
status: proposed
opened: 2026-11-19
decided: null
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: depends-on, object: "sym:KeyboardShortcutsBehaviour" }
  - { predicate: relates-to, object: "sym:BoardToolKeys" }
  - { predicate: manifests-in, object: "story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis" }
---

# Geo tools get named commands, a key map, and on-screen gesture hints

| | |
|---|---|
| **What is missing** | The geo toolbar's tools can only be switched by clicking a button; nothing tells the user how to use a tool once it is on |
| **Root cause** | `sym:GeoToolsToolbar` writes `canvas.update({ behaviours })` directly, so there is no command for `sym:KeyboardShortcutsBehaviour` to bind; tooltips are hand-written strings |
| **Rows that are the capability** | F1, F2, F3, F5 |
| **Rows that are dressing** | none |
| **Open decisions** | D1, D2, D3 |
| **Row status** | proposed 6 · accepted 0 · implemented 0 · landed 0 · deferred 1 · rejected 0 · superseded 0 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Tool toggles call `canvas.update({ behaviours: { [id]: { enabled, tool } } })`; no named command exists, so no key can name one | `file:packages/canvas-ui/src/toolbars/GeoToolsToolbar.tsx#L80-L89` | `pick()` |
| S2 | Key bindings are `{ keys, command, args }` JSON run by `sym:KeyboardShortcutsBehaviour`; they save with the canvas and edit in the Studio | `file:packages/canvas/src/behaviours/KeyboardShortcutsBehaviour.ts#L43-L52` | binding type |
| S3 | `tool.active` is the model: a command with `value`, `isActive`, `options`, `run`, so a toolbar toggle and a key bind to one thing | `file:packages/graph/src/canvas/graphCommands.ts#L362-L383` | def |
| S4 | `sym:BoardToolKeys` already has the typing / ⌘ Ctrl Alt guard and the hold-to-borrow pattern | `file:packages/canvas-react/src/board/BoardToolKeys.tsx#L1-L60` | header |
| S5 | Leaving a tool (Esc) is hard-coded inside the behaviours, not a binding; Esc → `tool.active=select` in `DEFAULT_SHORTCUTS` does not reach geo tools | `file:packages/graph-layer-maplibre/src/tools/DrawGeoFeatureBehaviour.ts#L11` | docstring |
| S6 | How a tool is used (click vertices, double-click or Enter to finish, Esc leaves) appears only in a behaviour docstring and one tooltip suffix | `file:packages/graph-layer-maplibre/src/tools/DrawGeoFeatureBehaviour.ts#L4` · `file:packages/canvas-ui/src/toolbars/GeoToolsToolbar.tsx#L96` | tooltip |
| S7 | `Behaviour.shortcuts` is free text (`'shift+drag-on-bg'`), advisory only, and nothing displays it. Draw and measure set it to `[]` | `file:packages/canvas-core/src/abstracts/Behaviour.ts#L39` · `file:packages/graph/src/behaviours/BrushSelectBehaviour.ts#L181` | grep |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Right-click on a toolbar button / on the map is what is wanted | Ruled out by the requester | The ask is configurable keys / key patterns to activate and deactivate tools, plus visible gesture guidance |
| R2 | A toolbar-local `keymap` prop | Rejected: second key system that drifts from `sym:KeyboardShortcutsBehaviour` | S2 |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Register a `geo.tool` command: `value` = the active draw or measure tool or `null`; `isActive` for a toggle item; `run` sets the tool through the existing option write | S1, S3 | Toolbar button and key now share one entry point |
| 2 | The toolbar presses `geo.tool` instead of calling `update` | S1 | `pick()` logic (switch the other behaviour off) moves into the command |
| 3 | Keys are `KeyboardShortcutsBehaviour` bindings naming `geo.tool`; the toolbar takes an optional `keys` prop that is only a *view* over those bindings | S2, R2 | Customisable in JSON and in the Studio; nothing bound unless the host passes it (rule 7) |
| 4 | Toggle items show the bound key in the tooltip: "Draw polygon · P" | S2 | Read from the bindings, never typed twice |
| 5 | While a tool is active a hint strip states the gesture, text from the behaviour (not the toolbar) | S6 | Behaviour owns its usage text |
| 6 | Deferred: replace free-text `shortcuts` with structured gesture hints so shift+drag brush, draw and measure all list in one hint UI | S7 | Touches every behaviour; own row |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `sym:KeyboardShortcutsBehaviour` | depends-on | shipped | Binding model, scope, key syntax |
| `sym:BoardToolKeys` | relates-to | shipped | Typing guard, hold-to-borrow |
| `sym:CommandPalette` shortcuts | relates-to | shipped | Existing place that already lists shortcuts |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `pkg:@invana/graph-layer-maplibre` (+ command typing) | `geo.tool` command: `value`, `isActive`, `options`, `run` (turn the other of draw / measure off) | Tools addressable by name | Medium: public command surface; registration site is D1 | D1 |
| F2 | defect | proposed | `file:packages/canvas-ui/src/toolbars/GeoToolsToolbar.tsx` | Toggles run `geo.tool` via control specs (`useControlItems`), not `canvas.update` | Button and key agree; Esc un-presses | Low | F1 |
| F3 | defect | proposed | host config / `file:packages/canvas/src/behaviours/KeyboardShortcutsBehaviour.ts` | Document and ship an opt-in `GEO_TOOL_SHORTCUTS` preset (P, L, C, M, A; Esc leaves) as bindings; nothing bound by default | Keys customisable as JSON | Low; letter keys guarded against typing and ⌘ Ctrl Alt (S4) | F1 |
| F4 | defect | proposed | `file:packages/canvas-ui/src/toolbars/GeoToolsToolbar.tsx` | Tooltip shows the bound key, read from the live bindings | Key visible, never duplicated | Low | F3 |
| F5 | defect | proposed | draw / measure behaviours + `pkg:@invana/canvas-ui` | Behaviours expose a `hint` string; canvas-ui shows a hint strip for the active tool | User sees how to use a tool | Medium: new field on two behaviours, new UI surface | F1, D2 |
| F6 | defect | deferred | `file:packages/canvas-core/src/abstracts/Behaviour.ts#L39` + every behaviour with `shortcuts` | Structured gesture hints replacing free-text `shortcuts`; hint UI lists them all (shift+drag brush included) | One source for every gesture | High: public type, all behaviours, API surface snapshot. Unblocks when F5 proves the shape | F5 |
| F7 | defect | proposed | `apps/storybook` (rule 11) | Story per state: keys on, keys off, hint strip, key shown in tooltip; surface the editors via `GraphCanvasApp` | States visible in isolation | Low | F2-F5 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:KeyboardShortcutsBehaviour` key syntax | Presets use it | Binding strings break |
| U2 | `sym:CommandRegistry` (`canvas.commands.register`) | `geo.tool` registers there | Signature change |
| U3 | `sym:DrawGeoFeatureBehaviour` / `sym:MeasureBehaviour` `tool` option | `run` writes it | Option rename |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis` | story | Opts in to the preset | Add bindings |
| X2 | `pkg:@invana/canvas-ui` `GeoToolsToolbar` consumers | published API | Props gain optional `keys`; none removed | None |
| X3 | `api/*.surface.txt` (`pnpm check-api-surface`) | snapshot | Changes if the command typing or a hint field is exported | Regenerate in the same change |
| X4 | Saved canvases (`definition.behaviours`) | serialised state | New bindings are additive JSON | None |
| X5 | Studio / `sym:CanvasSettingsEditorPanel` | editor | Shows new bindings | Verify editor renders them |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Press P in the story | geo-analyst story | Polygon tool on, button pressed | F1, F3 |
| V2 | pending | Press P again, and Esc | same | Tool off, button un-pressed | F2, F3 |
| V3 | pending | Press L while P is on | same | Switches to line; draw only ever has one tool | F1 |
| V4 | pending | Press M while drawing | same | Draw off, measure on | F1 |
| V5 | pending | Type "p" in a text field | any panel input | No tool change | F3 |
| V6 | pending | Hover a tool button | toolbar | Tooltip shows its key | F4 |
| V7 | pending | Activate a tool | story | Hint strip shows the gesture; gone when off | F5 |
| V8 | pending | Remap P to `g` in the bindings | story | New key works, old does not | F3 |
| V9 | pending | Two canvases on one page | any | A key drives only the canvas in use | F3 |
| V10 | pending | **Control:** undo / redo, brush shift+drag, click select | story | Unchanged | F2 |
| V11 | pending | `pnpm check-types`, `pnpm lint` (incl. API surface) | repo | Clean | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where is `geo.tool` registered? | (a) a function the maplibre package exports, called by the host or toolbar; (b) the behaviours register it on attach; (c) canvas-ui registers it | (b): the command lives with the behaviours it drives and canvas-ui stays free of geo knowledge; confirm no precedent blocks it | open |
| D2 | Where does the hint text live? | (a) on the behaviour (`hint`); (b) in the toolbar | (a): the behaviour owns its usage | open |
| D3 | Default key set | one letter each (P L C M A) vs chords | One letter, preset is opt-in and remappable | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-19 | Opened after discussion; keys agreed, hint UI agreed, structured `shortcuts` deferred (F6) | proposed | Branch `feat/geo-tool-keys` off `main` @ `2db062f9` |
