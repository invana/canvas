---
id: feat-2026-10-20-the-board-shows-every-tool-at-once
type: feat
title: The board shows only its mode, its tools, its panels and its view — every other verb is on right-click
status: accepted
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@invana/ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-10-19-a-layout-switch-moves-nodes-but-not-edges-or-labels }
  - { predicate: verified-by, object: story:canvas-demos/tools/CanvasExplorer }
---

| | |
|---|---|
| Motivation | The Explorer board's row carried ~25 controls; Edit / Annotate / Focus / Present had no home |
| Design | Board **modes** (a viewer's choice, never saved) decide what shows; a **panel rail** opens one floating panel; a **view dock** holds the minimap and zoom; **right-click menus** carry every verb |
| Rows | F1–F14, F16, F18–F20 implemented; F15, F17 deferred |
| Open decisions | none — D1–D6 accepted in review of the Explorer Canvas Panels design canvas |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Every verb had a button: forms, select, expand, layout, size, legend, minimap, zoom ×5, undo, export, present | `story:canvas-demos/tools/CanvasExplorer` (before) | the row at `file:apps/storybook/stories/canvas-demos/tools/CanvasExplorer.stories.tsx` in 9beae32d |
| M2 | The legend and the form cards looked different — one bare, one `PanelContent` with ✕ | `sym:GraphLegend`, `sym:PanelContent` (canvas-ui) | two surfaces for one kind of thing |
| M3 | A modeller, a data editor and an annotator need different tools on the same board | product review | no way to scope a control to a use |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `sym:BoardModes` registers the pick-one `board.mode` command; its value is React state, never written to the definition | `file:packages/canvas-react/src/board/BoardModes.tsx` | the mode is per viewer, not saved or exported |
| 2 | `ControlPanelSpec.modes` and `ControlItemSpec.modes` name the modes a panel / item shows in | `file:packages/canvas-core/src/state/view/controlPanels.ts` | one declaration covers every mode; still pure JSON |
| 3 | `sym:ControlPanels` / `sym:RegionControlPanels` read `useBoardMode` and drop what is out of mode, tidying dividers (`sym:itemsInMode`) | `file:packages/canvas-ui/src/control-panels/ControlPanels.tsx` | a board with no `<BoardModes>` shows everything, as before |
| 4 | `ControlPanelSpec.fade: 'idle'` fades a panel while the pointer rests | same | Focus / Present chrome yields to the drawing |
| 5 | `sym:BoardPanels` mounts a saved `board-rail` control panel of `board.panel` toggles and floats the open panel on the kit's `FloatingPanel` | `file:packages/canvas-ui/src/board/BoardPanels.tsx` | one surface for every panel (M2) |
| 6 | `sym:BoardContextMenus` builds board / node / edge / selection menus from command refs, functions and separators, each with `modes`, headed by its target | `file:packages/canvas-ui/src/menus/BoardContextMenus.tsx` | the verbs leave the row (M1) |
| 7 | `sym:BoardLayoutPopover` registers `board.layoutPresets({ x, y })` and opens the Layout card at the pointer over `sym:useLayoutPresetCards` | `file:packages/canvas-ui/src/board/BoardLayoutPopover.tsx` | the toolbar popover and the menu card share one binding |
| 8 | `sym:ZoomField` — − · typed percent ▾ (50 · 100 · 200 · Fit) · + over `camera.zoomTo` | `file:packages/canvas-ui/src/board/ZoomField.tsx` | the dock's bar |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-10-19-a-layout-switch-moves-nodes-but-not-edges-or-labels` | relates-to | landed rows F1–F12 | the presets, `layout.preset`, `graph.typeVisible`, the legend toggle |
| Invana Products `explorer.board` (EX-18) and `doc:docs/products/explorer.md` (invana repo) | design of the product | accepted | modes, rail, dock, menus as drawn |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-core/src/state/view/controlPanels.ts` | `modes?` on items and panels; `fade?: 'idle'` | specs say where they show | none — optional fields | — |
| F2 | defect | implemented | `file:packages/canvas-react/src/board/BoardModes.tsx` | `BoardModes`, `useBoardMode`, `inBoardMode`, `BOARD_MODE_COMMAND`; Esc and per-mode shortcuts | the mode switch | window keydown; skips text fields | F1 |
| F3 | defect | implemented | `file:packages/canvas-ui/src/control-panels/ControlPanels.tsx`, `HeaderControlPanels.tsx` | filter by mode; idle fade | — | — | F2 |
| F4 | defect | implemented | `file:packages/canvas-ui/src/board/BoardModePicker.tsx` | the picker; `board-mode` widget | — | — | F2 |
| F5 | defect | implemented | `file:packages/canvas-ui/src/board/BoardPanels.tsx` | rail + one floating panel; `board.panel`; `modes` for the rail | M2 | — | F1, F12 |
| F6 | defect | implemented | `file:packages/canvas-ui/src/view-panels/legend/LegendViewPanel.tsx` | `GraphLegend` → `LegendViewPanel`, bare content, Nodes / Relationships headings, empty state | **breaking rename** | callers of `GraphLegend` | — |
| F7 | defect | implemented | `file:packages/canvas-ui/src/view-panels/export/ExportViewPanel.tsx` | Image (in view · whole board, PNG · SVG) or Data — `exported-data.json` `{ nodes, edges }` of the board or the selection | — | — | — |
| F8 | defect | implemented | `file:packages/canvas-ui/src/menus/BoardContextMenus.tsx`, `GraphContextMenuBase.tsx`, `components/ContextMenuOverlay.tsx`, `components/MenuItemList.tsx` | board menus with headers, modes, selection target; builders may return `{ items, header }`; an empty menu does not open; the overlay flips to stay on the board | — | — | F2, F13 |
| F9 | defect | implemented | `file:packages/canvas-ui/src/board/BoardLayoutPopover.tsx`, `control-panels/chromeWidgets.tsx` | Layout card at the pointer; `useLayoutPresetCards` shared with the popover widget | — | — | — |
| F10 | defect | implemented | `file:packages/canvas-ui/src/board/ZoomField.tsx`; `view-readout` `show: 'pan'` | the dock's zoom | — | — | — |
| F11 | dressing | implemented | `file:packages/canvas-ui/src/control-panels/icons.ts` | icons: modes, panels, board tools | — | — | — |
| F12 | defect | implemented | `pkg:@invana/ui` `FloatingPanel` | `actions` in the bar | panel actions (Show all, undo · redo, Size by) | kit not released | — |
| F13 | defect | implemented | `pkg:@invana/ui` `MenuItem` | `disabled`, `destructive`, `separator` | menu rows | kit not released | — |
| F14 | defect | implemented | `file:packages/canvas-ui/src/components/PanelContent.tsx` (deleted) | canvas-ui's `PanelContent` retired for the kit's `PanelContent` / `FloatingPanel` | one panel surface | **breaking** | F12 |
| F15 | defect | deferred | Annotate | notes, shapes, arrows, text, highlight | — | needs an annotation layer — its own RFC | — |
| F16 | defect | implemented | `file:packages/canvas-ui/src/view-panels/properties/PropertiesViewPanel.tsx`, `components/PropertiesEditor.tsx` | Properties: the clicked element read-only, *Edit* (or `editProperties` from a menu or a drawing tool) swaps in the editor generated from `@invana/forms`; `InspectorPanel` deprecated | — | needs the kit's `keyvalue` field | — |
| F17 | defect | deferred | image export of the selection | a world-rect capture area in `sym:Canvas.export` | — | engine change | — |
| F18 | defect | implemented | `story:canvas-demos/tools/CanvasExplorer` | Edit: Shift-drag connects with any tool, N / C pick the tools, a node press either moves or draws; Edit and Annotate add Undo · Redo · Redraw to the row | — | — | F2 |
| F19 | defect | implemented | `file:packages/graph/src/canvas/GraphCanvas.ts` | a flush that adds or removes only nodes placed by hand (pinned on arrival) does not re-run the layout | a drop, and its undo, stay put | — | — |
| F20 | dressing | implemented | `file:packages/canvas-core/src/state/view/controlPanels.ts`, `control-panels/ControlPanels.tsx`, `components/ToolbarItems.tsx` | `width` on a control panel (the dock bar matches the minimap); a dropdown inside a row is the kit's borderless trigger | — | — | — |
| F21 | defect | implemented | `story:canvas-demos/tools/CanvasExplorer`, `file:packages/canvas-ui/src/board/ZoomField.tsx` | the view dock is 200 px wide and the zoom field 56 px, so `121%` is not clipped; rail panels are 320 px | — | — | F10, F20 |
| F22 | defect | implemented | `file:packages/canvas-ui/src/view-panels/properties/PropertiesViewPanel.tsx`, `editing.ts`, `components/PropertiesEditor.tsx`, `pkg:@invana/forms` text field | a drawn node or relationship opens as *New node* / *New relationship*: id made up, type asked for (first, focused, offered from the board's types, required); Cancel takes it off the board; the editor no longer closes on the panel's first render; a relationship's editor shows its ends, From and To, read-only, with *Reverse direction* beside them | `editProperties(…, { isNew })`; `PropertiesEditor` `requireType` · `typeSuggestions` | kit not released | F16, F18 |
| F23 | defect | implemented | `file:packages/canvas-ui/src/view-panels/element/ElementViewPanel.tsx`, `components/ElementEditorPanel.tsx` | one name for what is drawn: `ElementViewPanel` (the read-only view and, when `editable`, the editor switch — was `PropertiesViewPanel` + `ElementInspectorViewPanel`) and `ElementEditorPanel` (the form — was `PropertiesEditor`); `editElement` · `stopEditingElement` · `useElementEditing` · `elementKey`; `ElementEditorValues`; `InspectorPanel` deleted; the rail panel is *Element*; `editable` defaults to `false` | **breaking rename**, no aliases | every caller of the old names | F16, F22 |
| F24 | defect | implemented | `file:packages/canvas-ui/src/components/ElementEditorPanel.tsx`, `view-panels/element/ElementViewPanel.tsx`, `pkg:@invana/forms` `keyvalue` | keys from the model: `schema` (types, each with its keys and their kinds) and `strictSchema` on both panels; a type's keys become its rows, *Add property* lists the keys not set, changing the type swaps the keys and names those dropped, a blank value is not saved; strict picks the type and keys from the model only; each key once, always | `ElementTypeSchema`, `ElementSchemaKey`; kit `options` · `strictKeys` · `uniqueKeys` on `keyvalue` | kit not released | F22, F23 |
| F25 | defect | implemented | `file:packages/canvas-react/src/board/BoardModes.tsx` | Esc inside an open menu, listbox or dialog closes it and no longer also leaves the mode | — | — | F2 |
| F26 | defect | implemented | `file:packages/canvas-ui/src/view-panels/element/ElementViewPanel.tsx`, `components/ElementEditorPanel.tsx`, `view-panels/changes/ChangesViewPanel.tsx`, `story:canvas-ui/view-panels/ElementPanelsWithoutABackend` | every act of the panels is a prop a host may take, so they work with a backend or none: `ElementViewPanel` `onApply` · `onCancel` · `onDelete` (a *Delete* in the editor, `deletable`) · `onEditingChange`; `ElementEditorPanel` `onReset` · `onDelete` · controlled `values` / `onChange`; `ChangesViewPanel` `onSave(changes)` (then marked saved) · `onDiscard` · `onRevert`. Left out, each does the default — the board store, the `unsaved.save` command | `ElementEdit`, `ElementTarget` | — | F22, F24 |
| F27 | dressing | implemented | `file:packages/canvas-react/src/board/BoardToolKeys.tsx` | a mode's tools on keys — N · C, Shift held connects — as `<BoardToolKeys>`, out of the story | `BoardToolKeys` | — | F18 |

## 5. Blast radius

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pkg:@invana/ui` 0.0.36 (unreleased, `feat/legend-toggle`) | F12, F13 | a clean canvas checkout won't type-check canvas-ui until the kit ships |
| U2 | `layout.preset`, `graph.typeVisible`, `tool.active`, `select.mode` commands | the row and menus run them | — |

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `sym:GraphLegend` callers | published API | renamed to `LegendViewPanel` | none in this repo or in Studio |
| X2 | `sym:PanelContent` (canvas-ui) callers | published API | removed | four stories moved to the kit's; Studio does not import it |
| X3 | `graph-legend` widget | saved control panels | now draws on `FloatingPanel` | none |
| X4 | Studio (`pkg:@invana/studio`) | app | none until it adopts the board | GC25/GC26 work in the invana repo |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` | canvas-react, canvas-ui, `apps/storybook`, kit `ui` + storybook | clean | F1–F14 |
| V2 | pass | `pnpm build` | canvas-core, canvas, canvas-react, canvas-ui, kit `ui` | builds | F1–F14 |
| V3 | pass | `pnpm lint` + `check-api-surface` + boundaries + node-import | canvas | 0 errors | F1–F14 |
| V4 | pass | `pnpm test` | canvas-core (178) | green | F1 |
| V5 | pass | Playwright walk | `story:canvas-demos/tools/CanvasExplorer` — every mode, board and node menus, each rail panel, Focus idle fade, Present at 1/2 | no console errors | F2–F10 |
| V6 | pass | Playwright walk | `story:canvas-ui/apps/GraphCanvasApp/BoardModes` · `BoardPanels` · `BoardContextMenus` · `ZoomField` · `story:canvas-ui/view-panels/LegendViewPanel` · `ExportViewPanel` | no console errors | F2–F10 |
| V7 | pass | control: a board with no `<BoardModes>` | `story:canvas-ui/apps/GraphCanvasApp/RightInspector` | unchanged | F3, F14 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does the mode live? | definition · React state behind a command | React state behind `board.mode`: never saved, one switch for picker, ⌘K and Esc | accepted |
| D2 | How does chrome follow the mode? | per-mode panels in code · `modes` on specs | `modes` on specs — still JSON, no mode-specific chrome code | accepted |
| D3 | Where is the mode picker? | top-left row · view dock · top-centre | first item of the top-left row; the mode's tools follow it | accepted |
| D4 | Where do panels open? | under the row · a rail top-right | a rail top-right, one floating panel left of it | accepted |
| D5 | Export data format | board file · CSV · JSON `{ nodes, edges }` | JSON `{ nodes, edges }` only, `exported-data.json` | accepted |
| D6 | Annotate now? | build the layer · show the mode, tools disabled | tools disabled; the layer is its own RFC (F15) | accepted |
| D7 | A drawn element's type | a default per tool · asked for | asked for: a type cannot be guessed; the id can | accepted |
| D8 | Leaving a new element's editor without a type | remove it · keep it, untyped | Cancel removes it; any other way out keeps it, and the Changes panel holds Save until it has a type | accepted |
| D9 | Where type suggestions come from | the board's types · the graph's schema | the board's types; the schema is the host's once Studio adopts the board | accepted |
| D10 | Can a relationship's ends be changed in its editor? | editable From / To · read-only | read-only, Reverse beside them: other ends make another relationship, drawn again | accepted |
| D11 | What the panel and its form are called | Properties · Inspector · Element | *Element*: what the canvas draws — a node, a relationship, later a group; `ElementViewPanel` + `ElementEditorPanel`, one panel holding both | accepted |
| D12 | Property keys: from a schema or free? | free · from the schema · a flag | a flag — `strictSchema`: a host with a model (Studio) is strict, the library alone is open; keys are unique in both | accepted |
| D13 | Who decides what Apply, Save, Cancel, Delete do? | the panel · the host · both | both: the panel has a default that needs no backend (the board store), and every act is a prop that hands it to the host | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened as the record of the board's chrome, after review of the Explorer Canvas Panels canvas | accepted | D1–D6 from that review |
| 2026-10-20 | F1–F14 written; component stories and CanvasExplorer rewritten; V1–V7 pass | implemented | not committed |
| 2026-10-20 | F16, F18–F20 built in review of the Edit mode; unsaved changes split out | implemented | `rfc:feat-2026-10-20-an-unsaved-change-looks-saved` |
| 2026-10-20 | F21–F22 and D7–D9 from review of the Edit mode in the story | implemented | not committed |
| 2026-10-20 | F23, D10–D11: the relationship's ends in its editor; Properties renamed Element | implemented | not committed |
| 2026-10-20 | F24–F25, D12: keys from the model, unique keys; Esc in an overlay | implemented | not committed; Invana Products EX-21 |
| 2026-10-20 | F26–F27, D13: panels usable with or without a backend; tool keys out of the story | implemented | not committed |
