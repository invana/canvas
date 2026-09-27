---
id: feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio
type: feat
title: A schema editor lets the Studio add, arrange and edit control panels
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas }
  - { predicate: depends-on, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panels-cannot-pan-or-model }
---

# A schema editor lets the Studio add, arrange and edit control panels

| | |
|---|---|
| **Motivation** | Control panels are JSON in `definition.controlPanels`, but the only way to author one is code (`<ControlPanel>` or `canvas.update`). The Studio and `GraphCanvasApp` settings can't add a panel, move it or change its items. This is F12 of `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` |
| **Design** | An aggregate editor in `canvas-ui/editor-panels/control-panels/`: a list of panels (add / remove / show-hide), panel fields through the `fields.ts` + `mapping.ts` pattern, and a hand-written item list (`useFieldArray`, like `SchemaEditorPanel`) whose pickers read the live command / icon / widget registries. It has a controlled form and a connected wrapper that writes `canvas.update({ controlPanels })` |
| **Row status** | proposed 0 · accepted 0 · implemented 8 · landed 0 · deferred 1 · rejected 0 · superseded 0 |
| **Open decisions** | none — D1–D4 as recommended (D1-B adapted, §8); D5 deferred (rule 11) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | No editor surface for panels; settings sections are hard-coded to layers / behaviours / layouts | `file:packages/canvas-ui/src/editor-panels/canvas-settings/types.ts#L12` | `SettingsSection` union |
| M2 | The write path already exists: a whole-panel replace, and `null` deletes | `file:packages/canvas/src/engine/CanvasConfig.ts#L35`, `file:packages/canvas/src/engine/Canvas.ts#L1077-L1082` | `canvas.update({ controlPanels })` |
| M3 | Pickers can be populated at runtime | `sym:CommandRegistry.list` (`file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L109`), `sym:DEFAULT_CONTROL_ICONS`, `sym:DEFAULT_CONTROL_WIDGETS` | `list()`, `Object.keys` |
| M4 | The spec TSDoc promises that panels "undo", but nothing instantiates a view history, so panel edits are not undoable | `file:packages/canvas-core/src/state/view/controlPanels.ts#L6` vs `sym:createHistory` (only called in tests) | `history.undo` is `GraphHistory`, which journals graph data only |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Register panels as a fourth `SettingsSection` in `CanvasSettingsEditorPanel` | rejected for now (D1) | panels aren't instances with a `kind`, and the rows there are one per registered instance; a panel editor also needs nested item lists the generic section can't draw |
| R2 | Items as `FieldConfig` rows only | rejected | `@invana/forms` `FieldType` has no array type (`design-kit/packages/forms/src/types.ts`); every repeatable list in canvas-ui (schema, node-styling, context-menu) uses `useFieldArray` by hand |
| R3 | A per-command args schema, so args get proper fields | deferred (D3) | `CanvasCommand` carries no args metadata; adding it touches every built-in, graph and provider command |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | **Controlled** `ControlPanelsEditorPanel { panels, commands, icons, widgets, presets, onSubmit }`: `panels: Record<id, ControlPanelSpec>` goes in, and a `Record<id, ControlPanelSpec \| null>` patch comes out | `packages/canvas-ui/CLAUDE.md` "controlled + connected" | a pure form; no engine reference |
| 2 | **Panel fields** (`fields.ts` + `mapping.ts`): position (9-point anchor select, or an insets mode with four text fields), offset x / y, orientation, stretch, surface, visible | `sym:ControlPanelSpec` | the same pattern as every other editor |
| 3 | **Item list** (`useFieldArray`): add / remove / move up / down; a type select per row; per-type fields — command (select from `commands`), icon / activeIcon (select from icon keys), label / activeLabel / text, choice display, widget (select from widget keys), args (JSON text, D3) | `file:packages/canvas-ui/src/editor-panels/schema/SchemaEditorPanel.tsx#L63` | every item kind except `slot` is editable |
| 4 | `slot` items render read-only ("runtime content") and survive a round-trip unchanged | `file:packages/canvas-core/src/state/view/controlPanels.ts#L142-L146` | the editor never drops React-owned content |
| 5 | "Insert preset" appends a preset's items; the preset list is a prop that defaults to the canvas-ui presets | `file:packages/canvas-ui/src/control-panels/presets.ts` | one click to a working panel |
| 6 | Unknown command names show as "(not registered)" instead of being dropped | `sym:CommandRegistry.has` | a panel saved on a richer canvas loads without data loss |
| 7 | **Connected** `ControlPanelsEditor { canvas? }`: `useResolvedCanvas`, reads `useControlPanels`, feeds `canvas.commands.list()` (re-read on `commands.subscribe`), and applies with `canvas.update({ controlPanels: patch })` | `sym:useControlPanels`, M2 | drop-in, with no bridge |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` | depends-on | accepted | this is its F12 |
| `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` | depends-on | accepted | the `choice` kind and the command catalogue that the pickers list |
| `doc:packages/canvas-ui/CLAUDE.md` | relates-to | active | editor rules: form generator, controlled + connected, `editor-panels/` for aggregates, no raw inputs |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| E1 | defect | implemented | `packages/canvas-ui/src/editor-panels/control-panels/{types,fields,mapping}.ts` | panel-level form types + fields + mapping (spec ⇄ flat form) | panel settings editable | low | — |
| E2 | defect | implemented | `…/control-panels/ControlItemsField.tsx` | `useFieldArray` item list with per-type fields and add / remove / move | items editable | medium — the largest hand-written form in canvas-ui | E1 |
| E3 | defect | implemented | `…/control-panels/ControlPanelsEditorPanel.tsx` | controlled editor: panel list + selected panel form + Apply | Studio-ready form | low | E1, E2 |
| E4 | defect | implemented | `…/control-panels/ControlPanelsEditor.tsx` | connected wrapper (resolve canvas, registries, `canvas.update`) | zero-wiring drop-in | low | E3 |
| E5 | defect | implemented | `packages/canvas-ui/src/index.ts` (+ `editor-panels/index.ts`) | export E3 + E4 + types | public | low — surface grows | E3, E4 |
| E6 | defect | implemented | `sym:CanvasSettingsEditorPanel` (was: `sym:GraphCanvasApp` settings) | a last "Control panels" `PanelStack` section hosting `sym:ControlPanelsEditor`; `showControlPanels={false}` opts out (D1) | editable wherever the settings surface is mounted | medium — every story that mounts the settings panel shows a new section | E4, D1 |
| E7 | defect | implemented | `file:packages/canvas-core/src/state/view/controlPanels.ts#L6` | drop "undo" from the TSDoc until a view history exists | the doc stops over-promising | low | D4 |
| E8 | defect | implemented | `doc:packages/canvas-ui/CLAUDE.md` | name the new editor in the editor-panels list | docs match | low | E3 |
| E9 | defect | deferred | `story:canvas-ui/editor-panels/ControlPanelsEditor` | a story with a canvas + the editor, **only if you ask** (rule 11) | V3 has a target | low | D5 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| UP1 | `sym:ControlItemSpec` union | E2's per-type fields mirror it | a new item kind would be uneditable until E2 grows (the renderer has the same exhaustive switch) |
| UP2 | `sym:CommandRegistry.list` / `subscribe` | populates the command picker | a stale picker if registrations don't notify |
| UP3 | `@invana/forms` `FieldConfig` | E1 fields | external package; no array type (R2) |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `pkg:@invana/canvas-ui` public surface | published API | + `ControlPanelsEditorPanel`, `ControlPanelsEditor`, form types | none (canvas-ui has no API snapshot) |
| D-2 | `sym:CanvasSettingsEditorPanel` and its hosts: `story:canvas-ui/editors/CanvasSettingsEditorPanel`, `story:canvas-ui/apps/AppLayoutV2`, `story:usecases/tools/CanvasDesigner`, `story:usecases/by-casestudies/microservices/ServiceTopology`, `story:usecases/by-casestudies/commerce/StockExposure` | component + stories | a new "Control panels" section at the bottom | V4 |
| D-3 | Saved panels | serialised | read and written unchanged; slots and unknown commands kept | V2 |
| D-4 | `sym:ControlPanel` (canvas-react) | runtime registrar | a panel declared by `<ControlPanel>` is re-added on remount, so an editor delete of it doesn't stick | TSDoc note; not fixed here |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` · `pnpm check-types` · `pnpm lint` · `pnpm test` | repo | clean | all |
| V2 | pass | spec → form → spec round-trip for each item kind, including `slot` and an unregistered command — a scratch `tsx` script, not a unit test (canvas-ui has none, per its CLAUDE.md) | `…/control-panels/mapping.ts` | identical spec | E1, E2 |
| V3 | pass | Storybook: add a panel from a preset, move it, reorder items, change a command; the panel re-draws live; export → import keeps it | E9 story (or a scratch mount) | works | E2–E4 |
| V4 | pass | Storybook (control) | `story:canvas-ui/apps/GraphCanvasApp/ControlPanels`, `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` | unchanged unless E6 lands; panels still work | E5, E6 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where it shows up | **A** standalone editor only · **B** also a "Control panels" entry in `GraphCanvasApp` settings · **C** a fourth `SettingsSection` | **A + B** — C needs a generic section to draw nested lists (R1) | accepted (B adapted: `GraphCanvasApp` has no settings rail) |
| D2 | Apply model | live on every change · Apply button (like every other editor) | **Apply button** — matches the pattern; live preview can come later | accepted |
| D3 | Command args | JSON text field · per-command args schema (R3) | **JSON text field** now, with parse errors inline; a schema as its own RFC | accepted |
| D4 | Undo | fix the TSDoc (E7) · wire `createHistory` over the view store now | **fix the TSDoc**; a view history is a kernel-wide RFC (it would also record camera / selection) | accepted |
| D5 | Story | none until asked · add E9 | **add E9** — V3 has nothing to drive without it; you decide, per rule 11 | deferred |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened from F12 of `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` on the maintainer's "finish all" | proposed | awaiting approval |
| 2026-09-28 | Approved whole ("sure that order works" after "finish all"); D1–D4 as recommended; D5 / E9 deferred until a story is asked for (rule 11) | accepted | |
| 2026-09-28 | E1–E8 implemented on `feat/control-panels` | accepted | V1: build, check-types, lint (API surfaces unchanged), tests. V2: 54 round-trips (18 presets × 3 positions, plus slot / unregistered command / choice options / widget options) come back identical. V3 (in `story:canvas-ui/editors/CanvasSettingsEditorPanel`, since E9 is deferred): New panel → Insert "Zoom" → Apply draws the panel top-left; Anchor → bottom-right moves it; bad args JSON lists "Item 1 · argsJson" and submits nothing; Remove deletes it. V4: the six stories hosting the settings panel load with no console errors. Learned: (1) `GraphCanvasApp` has no settings rail — the settings surface is `CanvasSettingsEditorPanel`, which hosts mount themselves — so D1-B became a section there. (2) A slot's name rides along in the form row (RHF keeps unregistered values), which survives reorders; the first cut matched it by index and wouldn't have. (3) Commands named `name#…` are private to a mounted component (the toolbars' factory-layout commands, `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice`); the pickers hide them. (4) Zoom buttons look dead in that story because its auto-fitter re-frames while the force layout runs (the wheel is equally ineffective) — a story trait, not the editor |
