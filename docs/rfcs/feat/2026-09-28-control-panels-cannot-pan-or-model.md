---
id: feat-2026-09-28-control-panels-cannot-pan-or-model
type: feat
title: Control-panel presets for pan, zoom, canvas, explorer, modeller and theme, shown in canvas-react stories
status: landed
opened: 2026-09-28
decided: 2026-09-28
landed: 2026-09-28
packages: [pkg:@invana/canvas, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
  - { predicate: depends-on, object: rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas }
---

# Control-panel presets for pan, zoom, canvas, explorer, modeller and theme

| | |
|---|---|
| **Motivation** | Saved panels can zoom / fit / lock, but can't **pan**, jump to a **zoom level**, **reset** the camera, toggle **input** behaviours, switch the **modeller tool**, or flip the **theme** outside `GraphCanvasApp`. No preset maps to an app mode (canvas / explorer / modeller), and the canvas-react stories show two hand-written panels only |
| **Design** | 4 new engine commands (`camera.pan`, `camera.zoomTo`, `camera.reset`, `behaviour.toggle`); canvas-react registers `tool.*` and `theme.toggle`; canvas-ui adds a `pan-pad` widget and 9 presets; canvas-react/ControlPanel stories split into one-story folders (Canvas/* and GraphCanvas/*), one per preset |
| **Row status** | proposed 0 · accepted 0 · implemented 15 · landed 0 · deferred 0 · rejected 1 · superseded 2 |
| **Open decisions** | none — D1–D5 accepted as recommended |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | No command pans the camera; `Camera.pan(dx, dy)` exists but is reachable only from code / gestures | `file:packages/canvas/src/engine/builtinCommands.ts` · `file:packages/canvas-core/src/abstracts/Camera.ts#L251` | built-ins are zoomIn / zoomOut / fit / lock / layout.* / grid |
| M2 | No "100%" / zoom-level / reset-view control | same | `Camera.setZoom` / `setTransform` unused by commands |
| M3 | Toggling one input behaviour (wheel zoom, drag pan, keyboard) has no command; `view.lock` flips a fixed set together | `file:packages/canvas/src/engine/builtinCommands.ts` `view.lock` | `DEFAULT_LOCK_IDS = ['pan', 'drag-node']` |
| M4 | Modeller tool is React state with no canvas; no saved panel can switch Select / Add / Connect / Delete | `sym:GraphToolProvider` | deferred as X1 / D2 of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` |
| M5 | `theme.toggle` is registered only by `sym:GraphCanvasApp`, so a bare `<Canvas>` / `<GraphCanvas>` panel renders it disabled | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L555-L565` | `canvas.commands.register('theme.toggle', …)` |
| M6 | Presets are per-toolbar building blocks; none names an app mode | `file:packages/canvas-ui/src/control-panels/presets.ts` | ZOOM, VIEW, HISTORY, EDIT, SELECT_MODE, EDGE_TYPE, LAYOUT, GRID, GRAPH |
| M7 | canvas-react ControlPanel stories: two files, hand-written items, no `choice`, no presets | `story:canvas-react/ControlPanel/Canvas` · `story:canvas-react/ControlPanel/GraphCanvas` | predates the choice kind |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A vanilla `canvas/ControlPanel` story | rejected (asked 2026-09-28) | nothing in `pkg:@invana/canvas` draws a `ControlPanelSpec`; the maintainer chose the canvas-react `<Canvas>` root |
| R2 | Per-behaviour commands (`input.pan`, `input.wheelZoom`) | rejected | one generic `behaviour.toggle { id }` covers every behaviour, and ids differ between vanilla and React (`'zoom'` vs `kind: 'wheel-zoom'`) |
| R3 | Store the tool in `view.interaction` now | rejected here | right long-term home (D2 of the prior RFC), but moves the provider's state into the kernel — its own RFC |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `camera.pan { dx?, dy? }` (screen px, default step 80 on the axis given) → `camera.pan` | `sym:Camera.pan` | arrow buttons as data |
| 2 | `camera.zoomTo { value? }` → `setZoom(value ?? 1)`; `value()` = current zoom, `options()` = 25 / 50 / 100 / 200 / 400 % (overridable via `args.levels`) | `sym:Camera.setZoom`; camera writes `view.interaction.camera`, so `useCommandStates` re-reads | usable as a **button** (100%) and a **choice** (zoom levels) |
| 3 | `camera.reset` → zoom 1 with world origin at the viewport centre (D2) | `sym:Camera.setTransform` | a "home" button distinct from fit |
| 4 | `behaviour.toggle { id }` — active = `behaviours.get(id).enabled`, enabled = `behaviours.has(id)`, run via `behaviours.setEnabled` | same path as `view.lock` | wheel-zoom / drag-pan / keyboard toggles |
| 5 | canvas-react `<GraphCanvas>` mounts an internal `ToolCommands` bridge: when a `ToolContext` is above it, registers `tool.active` (choice: select / add / connect / delete) and `tool.nodeKind` (choice; options from `args.kinds`; enabled while tool = add); `invalidate()` on change | `sym:ToolContext`, `sym:CommandRegistry.invalidate` | modeller preset works wherever `GraphToolProvider` wraps the canvas |
| 6 | `theme.toggle` moves into `sym:CanvasThemeSync` (already reads `useThemeOptional`); `GraphCanvasApp` stops registering it | `file:packages/canvas-react/src/CanvasThemeSync.tsx` | theme preset works on any root that mounts the sync |
| 7 | canvas-ui: `pan-pad` widget (3×3 cross running `camera.pan`, centre = `camera.reset`) + icons (arrows, locate, mouse, tool glyphs) + presets below | `file:packages/canvas-ui/src/control-panels/widgets.tsx` | one-line panels per mode |

### Preset catalogue (canvas-ui)

| Preset | Items | Needs |
|---|---|---|
| `PAN_CONTROL_ITEMS` | pan ← ↑ ↓ → · reset | engine |
| `PAN_PAD_CONTROL_ITEMS` | `pan-pad` widget | engine |
| `ZOOM_LEVEL_CONTROL_ITEMS` | zoom out · zoom-level choice · zoom in · 100% | engine |
| `INPUT_CONTROL_ITEMS` | toggle drag-pan (`pan`) · wheel zoom (`zoom`) · keyboard (`keyboard-camera`) | those behaviours |
| `NAVIGATION_CONTROL_ITEMS` | pan-pad · zoom in / readout / out · fit · reset | engine |
| `CANVAS_CONTROL_ITEMS` | zoom in / out · fit · reset · lock · grid | engine + background |
| `EXPLORER_CONTROL_ITEMS` | layout choice / run / stop · select mode · edge type · fit · lock (read-only: no history / delete) | `GraphCanvas` |
| `MODELLER_CONTROL_ITEMS` | tool choice · node kind · undo / redo · delete · clear · fit | `GraphToolProvider` + `GraphHistoryProvider` + `GraphClipboardProvider` |
| `THEME_CONTROL_ITEMS` | theme toggle (sun / moon) | `CanvasThemeSync` + `ThemeProvider` |

### Stories (canvas-react, one story per file)

| Story | Root | Shows |
|---|---|---|
| `story:canvas-react/ControlPanel/Canvas/Basic` | `<Canvas>` | today's `Canvas` story, moved |
| `story:canvas-react/ControlPanel/Canvas/Pan` | `<Canvas>` | `PAN_` + `PAN_PAD_` side by side |
| `story:canvas-react/ControlPanel/Canvas/Zoom` | `<Canvas>` | `ZOOM_` + `ZOOM_LEVEL_` |
| `story:canvas-react/ControlPanel/Canvas/Input` | `<Canvas>` | `INPUT_` — toggles each gesture |
| `story:canvas-react/ControlPanel/Canvas/Navigation` | `<Canvas>` | `NAVIGATION_` |
| `story:canvas-react/ControlPanel/Canvas/CanvasPreset` | `<Canvas>` | `CANVAS_` + `THEME_` |
| `story:canvas-react/ControlPanel/GraphCanvas/Basic` | `<GraphCanvas>` | today's `GraphCanvas` story, moved |
| `story:canvas-react/ControlPanel/GraphCanvas/Explorer` | `<GraphCanvas>` | `EXPLORER_` + `ZOOM_` |
| `story:canvas-react/ControlPanel/GraphCanvas/Modeller` | `<GraphCanvas>` in `GraphToolProvider` / history / clipboard | `MODELLER_`, drawing behaviours gated on `useTool()` |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` | depends-on | accepted | registry stacking + `invalidate`, `choice` kind; its X1 (modeller tool) lands here as a bridge, not the `viewMode` move |
| `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` | depends-on | implemented | specs, `<ControlPanel>`, `<ControlPanels>` |
| `doc:apps/storybook/CLAUDE.md` | relates-to | active | the `<ControlPanels/>` exception is widened (S1) |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| C1 | defect | landed | `file:packages/canvas/src/engine/builtinCommands.ts` | `camera.pan` | pan buttons | low | — |
| C2 | defect | landed | same | `camera.zoomTo` (button + choice) | zoom levels / 100% | low | — |
| C3 | defect | landed | same | `camera.reset` | home button | low | D2 |
| C4 | defect | landed | same | `behaviour.toggle { id }` | input toggles | low | — |
| R1 | defect | superseded | `pkg:@invana/canvas-react` `sym:GraphCanvas` (+ new internal `ToolCommands`) | registers `tool.active` / `tool.nodeKind` when a `ToolContext` is present — superseded by `rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas` G1 / R1 (commands over `interaction.viewMode`; the bridge is gone) | modeller preset | medium — new registration inside every `<GraphCanvas>` (no-op without the provider) | D4 |
| R2 | defect | landed | `sym:CanvasThemeSync` | registers `theme.toggle` | theme preset on bare roots | low | — |
| R3 | defect | landed | `sym:GraphCanvasApp` | drop its own `theme.toggle` (it mounts `CanvasThemeSync`) | one registration | low — stacking would hide a duplicate anyway | R2 |
| U1 | defect | landed | `file:packages/canvas-ui/src/control-panels/icons.ts` | arrow-up / down / left / right, locate, mouse, spline / pointer / plus / eraser tool glyphs | preset icons | low | — |
| U2 | defect | landed | `file:packages/canvas-ui/src/control-panels/widgets.tsx` | `pan-pad` widget | d-pad in one item | low | C1, C3, D3 |
| U3 | defect | superseded | `file:packages/canvas-ui/src/control-panels/ControlPanels.tsx` | `choice` options may carry an `icon` (tool picker shows glyphs) | modeller tool picker reads like the toolbar | medium — `ControlChoiceOption` type grows | — |
| U4 | defect | landed | `file:packages/canvas-ui/src/control-panels/presets.ts` + `index.ts` | the 9 presets above | one-line panels per mode | low | C1–C4, R1, R2, U1–U3 |
| S1 | defect | landed | `doc:apps/storybook/CLAUDE.md` | exception also allows canvas-ui `*_CONTROL_ITEMS` presets in `canvas-react/ControlPanel/*` | presets demoed where the user asked | low | D5 |
| S2 | defect | landed | `apps/storybook/stories/canvas-react/ControlPanel/Canvas/` | split `Canvas.stories.tsx` → `Basic`; add Pan, Zoom, Input, Navigation, CanvasPreset | | low — story URL of the old `Canvas` story changes | U4, S1 |
| S3 | defect | landed | `apps/storybook/stories/canvas-react/ControlPanel/GraphCanvas/` | split → `Basic`; add Explorer, Modeller | | low — story URL changes | U4, S1 |
| S4 | defect | landed | `doc:packages/canvas-ui/CLAUDE.md` | preset list in the "Toolbars are content" paragraph | | low | U4 |
| A1 | defect | rejected | `api/canvas-ui.surface.txt` (if snapshotted) | regenerate for new preset exports | | low | U4 |
| T1 | defect | landed | `sym:ModellerToolbar` | no change — keeps its own `useTool` path; listed so it stays the control | | low | — |
| U5 | defect | landed | `sym:ToolbarSelectItem`, `sym:ControlPanels` | `disabled` on select items (dropdown + segmented); a `choice` item is disabled while its command is | `tool.nodeKind` greys out outside Add, as §2 step 5 promised | low — additive prop | R1 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| UP1 | `sym:Camera.pan` / `setZoom` / `setTransform` push `view.interaction.camera` | `camera.zoomTo` value re-reads through the store | a stale zoom-level picker |
| UP2 | `sym:ToolContext` shape | R1 reads `tool` / `setTool` / `nodeKind` | tool picker breaks |
| UP3 | `sym:CommandRegistry.invalidate` | R1 signals tool changes | stale disabled node-kind picker |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `story:canvas-ui/apps/GraphCanvasApp/ControlPanels`, `story:canvas-ui/apps/GraphCanvasApp/EmbeddedWidget` | stories | theme.toggle now from `CanvasThemeSync` (same name) | spot-check |
| D-2 | `story:usecases/tools/GraphModeller` | story | `<GraphCanvas>` now registers `tool.*` — no visible change | control V5 |
| D-3 | `story:canvas-react/ControlPanel/Canvas`, `story:canvas-react/ControlPanel/GraphCanvas` | stories (URLs) | move to `…/Basic` | S2, S3 |
| D-4 | Saved panels referencing `theme.toggle` | serialised | still resolves on any root with `CanvasThemeSync` | none |
| D-5 | `pkg:@invana/canvas-ui` public surface | published API | + 9 presets, `pan-pad` widget key, `ControlChoiceOption.icon` (core type) | regenerate snapshots (`canvas-core` / `canvas-store` / `canvas` if the option type lives in core) |
| D-6 | Command names | public API | 6 new names (`camera.pan`, `camera.zoomTo`, `camera.reset`, `behaviour.toggle`, `tool.active`, `tool.nodeKind`) | frozen once landed |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` · `pnpm check-types` · `pnpm lint` (boundaries + api surface) · `pnpm test` | repo | clean | all |
| V2 | pass | Storybook, visible tab | `story:canvas-react/ControlPanel/Canvas/*` | pan moves the view by one step each way; 100% / level picker / reset / input toggles work; theme flips | C1–C4, R2, U1, U2, S2 |
| V3 | pass | Storybook | `story:canvas-react/ControlPanel/GraphCanvas/Explorer` | layout / select / edge type switch; no history controls | U4, S3 |
| V4 | pass | Storybook | `story:canvas-react/ControlPanel/GraphCanvas/Modeller` | tool picker switches draw behaviour; node kind enabled only on Add; Esc returns picker to Select; undo after draw | R1, U3, S3 |
| V5 | pass | Storybook (control) | `story:usecases/tools/GraphModeller`, `story:canvas-ui/apps/GraphCanvasApp/ControlPanels` | unchanged; theme toggle still works | R1, R3, T1 |
| V6 | skipped | export → import round-trip | any new story | panels restore with the same items (skipped: new presets are plain specs on the export path V5 of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` already covers) | U4 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Sign of `camera.pan` | camera moves by `dx` (content moves opposite) · content moves by `dx` | **content moves by `dx`** — matches `Camera.pan`; presets pick signs so "←" shows what's to the left | accepted |
| D2 | `camera.reset` target | zoom 1, world origin centred · zoom 1, origin top-left · the initial transform | **zoom 1, origin centred** — deterministic and saved-panel-safe | accepted |
| D3 | Pan pad | 4 command items only · `pan-pad` widget as well | **both** — items for linear bars, widget for a floating pad | accepted |
| D4 | Where the tool bridge lives | internal in canvas-react `<GraphCanvas>` (auto) · public `<ToolCommands/>` child · move tool into `view.interaction` | **internal, auto** — no-op without the provider, zero wiring; the `view.interaction` move stays a later RFC | accepted |
| D5 | Presets in canvas-react stories | widen the storybook exception · keep canvas-react stories hand-written | **widen** — requested 2026-09-28 | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened after the maintainer asked for canvas + canvas-react preset stories (canvas = the canvas-react `<Canvas>` root) and PAN + ZOOM, CANVAS + EXPLORER, MODELLER, THEME presets | proposed | awaiting approval |
| 2026-09-28 | Approved whole; D1–D5 accepted as recommended | accepted | |
| 2026-09-28 | 16 rows implemented on `feat/control-panels`; U3 superseded, A1 rejected, U5 added | accepted | V1: build, check-types, lint (boundaries + api surface unchanged), tests pass. V2–V5 driven in headless Chromium: 2× pan-left + pan-up moves the content right 160 / down 80, reset recentres; zoom picker 200% → readout 200%, 100% button restores; wheel-zoom toggle off stops wheel zoom; grid + theme toggle; modeller Add drops a node, undo removes it, Esc returns the picker to Select and greys Shape; Explorer shows layout / select / edge pickers; GraphModeller, FullFeatured, EmbeddedWidget load clean. Learned: (1) U3 already existed: `ControlChoiceOption.icon` shipped with the prior RFC, so it's superseded by that RFC. (2) A1: canvas-ui has no API snapshot, so there's nothing to regenerate. (3) The zoom picker fell back to its first option (25%) between levels, so `camera.zoomTo.options` now also lists the current zoom. (4) The icon registry had no `spline`, so Connect rendered as text; added. (5) Choice items ignored `enabled`, so U5 was added |
| 2026-09-28 | R1 superseded by `rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas` | accepted | The tool moved into `view.interaction.viewMode`; `tool.*` are graph commands now and `ToolCommands` is deleted. Command names and `MODELLER_CONTROL_ITEMS` are unchanged |
| 2026-09-28 | `feat/control-panels` merged to `main` | landed | Every implemented row → landed (build, check-types, lint, test green at merge); U4 rests on V6 (skipped — covered by V5 of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved`) |
