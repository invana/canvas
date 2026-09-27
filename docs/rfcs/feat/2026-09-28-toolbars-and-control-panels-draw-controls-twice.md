---
id: feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice
type: feat
title: Toolbars render control-panel presets through one shared item renderer
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
  - { predicate: relates-to, object: rfc:feat-2026-09-27-two-ways-to-float-a-toolbar }
---

# Toolbars render control-panel presets through one shared item renderer

| | |
|---|---|
| **Motivation** | Every preset's controls are drawn twice: once by a `*Toolbar` over the section hooks (`useHistorySection`, `useViewSection`, …), and once by `<ControlPanels>` over commands. The two paths drift; a fix to one doesn't reach the other. This is X2 of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` |
| **Design** | Extract the spec → `ToolbarItem` mapping out of `<ControlPanels>` into an exported `<ControlItems>`. Close the gaps that stop presets from matching toolbars, then rewrite the preset-backed toolbars as `<ControlItems items={PRESET…}>` with their existing props |
| **Row status** | proposed 0 · accepted 0 · implemented 16 · landed 0 · deferred 0 · rejected 0 · superseded 1 |
| **Open decisions** | none — D2–D4 as recommended; D1 changed to C during implementation (§8) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The spec → item mapping is private and fused with absolute placement / tooltip side / surface | `file:packages/canvas-ui/src/control-panels/ControlPanels.tsx#L98-L211` | `ControlPanelView`; the only export is `ControlPanels` (`#L229`) |
| M2 | Toolbars re-implement the same controls over section hooks | `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L143-L160` | 8 hooks; `GRAPH_CONTROL_ITEMS` covers the same set |
| M3 | Toolbar features a preset can't express yet: run / stop as one swapped button, factory `layouts`, a per-item `icons` override map, `extraItems` / `children`, `sections` subtraction, `iconClass` on Stop, history `redraw` | `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L93-L133`, `#L169-L171`; `file:packages/canvas-ui/src/toolbars/HistoryToolbar.tsx#L14-L15` | see §2 gaps |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | X2 is blocked until header slots accept specs | **rejected — the blocker was misread** | header slots already take any `ReactNode` (`RegionSlot`, `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L107`), and they sit inside the lifted `CanvasContext` (`#L631-L632`). So `<ControlItems>` works there as-is. Spec-valued slots only matter for *saving the header*, which is a separate feature (D4) |
| R2 | Convert the callback-driven toolbars too (`GraphToolbar`, `GraphLayoutToolbar`, `SchemaToolbar`) | rejected | they are controlled (value + `onChange`) with no command behind them; `GraphToolbar` and `GraphLayoutToolbar` have 0 JSX usages (D3) |
| R3 | Delete the section hooks | rejected here | canvas-react exports them; consumers outside the toolbars may use them. Deprecating them is later work |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `<ControlItems items orientation? icons? widgets? tooltipSide? canvas? extra?>` — the extracted mapping (commands via `useCommandStates`, choice, widget, slot); `ControlPanelView` becomes placement + `<ControlItems>` | M1 | one renderer |
| 2 | `layout.toggle` engine command: active = `runtime.layout.running`; run = stop when running, else run the active layout. `LAYOUT_` / `GRAPH_` presets use it as a `toggle` (play / stop icons) | `file:packages/canvas/src/engine/builtinCommands.ts#L146-L192` | the swapped Run / Stop button as data |
| 3 | Icon registry entries may carry a class (`{ icon, className }`), so Stop gets `fill-current` | `sym:DEFAULT_CONTROL_ICONS` | same look |
| 4 | A toolbar's `icons` prop maps its item names to registry keys, and is passed to `<ControlItems icons>` | `sym:ControlPanels` already merges `icons` | the override prop keeps working |
| 5 | Preset items carry stable `key`s grouped by section (`history.undo`, `view.fit`, …), and toolbars filter by `sections` | `sym:ControlItemSpec.key` | `sections` subtraction keeps working |
| 6 | `extra` on `<ControlItems>` appends `ToolbarItem`s, so `extraItems` / `children` pass through | M3 | escape hatch kept |
| 7 | Factory `layouts`: the toolbar registers each factory with `canvas.layouts` on mount and disposes it on unmount, so `layout.activate` lists them (D1) | D4 of the prior RFC kept factories out of presets | the full toolbar's picker becomes the preset's picker |
| 8 | `history.redraw` command, registered by `GraphHistoryProvider` beside undo / redo (it calls the layer's `redraw()`) | `file:packages/canvas-react/src/hooks/useHistory.ts#L8-L28` | `HistoryToolbar`'s third button as data |

### Toolbar → preset map

| Toolbar | Preset | JSX usages | Converts |
|---|---|---|---|
| `sym:GraphControlsToolbar` | `GRAPH_` | 43 (36 story files) | T1 |
| `sym:GraphControlsToolbarLite` | `EXPLORER_`-like, minus history / editor | 3 | T2 |
| `sym:CanvasControlsToolbar` | `CANVAS_` / `VIEW_` | 3 | T3 (controlled `locked` / `onToggleLock` kept as an override, D2) |
| `sym:ViewToolbar`, `sym:HistoryToolbar`, `sym:EditToolbar`, `sym:GridToolbar` | `VIEW_`, `HISTORY_`, `EDIT_`, `GRID_` | 0 each | T4 |
| `sym:ModellerToolbar` | `MODELLER_` | 4 | T5 |
| `sym:GraphToolbar`, `sym:GraphLayoutToolbar`, `sym:SchemaToolbar` | none | 0 / 0 / 2 | not converted (R2) |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` | depends-on | accepted | X2 lives here; its D4 (factories stay a toolbar feature) is revisited by step 7 / D1 |
| `rfc:feat-2026-09-27-two-ways-to-float-a-toolbar` | relates-to | accepted | toolbars are content, which is what makes this conversion safe |
| `doc:docs/ui-consolidation-plan.md` | relates-to | active | toolbars stay in canvas-ui |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| E1 | defect | implemented | `file:packages/canvas-ui/src/control-panels/ControlItems.tsx` (+ `ControlPanels.tsx`) | extract + export `<ControlItems>`; `ControlPanelView` uses it | one renderer; a pure refactor for panels | low | — |
| E2 | defect | implemented | `file:packages/canvas/src/engine/builtinCommands.ts` | `layout.toggle` | Run / Stop as one item | low — additive command name | — |
| E3 | defect | implemented | `sym:DEFAULT_CONTROL_ICONS` + renderer | icon entries may carry `className` | Stop keeps `fill-current` | low | E1 |
| E4 | defect | implemented | `file:packages/canvas-ui/src/control-panels/presets.ts` | stable section-grouped `key`s; `LAYOUT_` / `GRAPH_` use `layout.toggle` | toolbars can filter; presets match toolbars | medium — saved panels built from the old presets keep their old items (harmless) | E2 |
| E5 | defect | superseded | `sym:GraphHistoryProvider` | register `history.redraw` — superseded by N4 (`graph.redraw` on every `GraphCanvas`: redraw never needed history) | redraw as data | low | — |
| E6 | defect | implemented | `sym:ControlItems` | `extra` pass-through | `extraItems` / `children` | low | E1 |
| T1 | defect | implemented | `sym:GraphControlsToolbar` | body → `<ControlItems items={filter(GRAPH_…, sections)} extra icons>`; factory layouts registered while mounted (D1) | the most-used toolbar is on the command path | **high** — 36 stories render it; layout picker contents and button order must stay identical | E1–E6, D1 |
| T2 | defect | implemented | `sym:GraphControlsToolbarLite` | same | | medium | T1 |
| T3 | defect | implemented | `sym:CanvasControlsToolbar` | same; `onToggleLock` override (D2) | | medium | E1, D2 |
| T4 | defect | implemented | `sym:ViewToolbar`, `sym:HistoryToolbar`, `sym:EditToolbar`, `sym:GridToolbar` | same | | low — no JSX usages | E1, E5 |
| T5 | defect | implemented | `sym:ModellerToolbar` | same; `nodeKinds` → `args.kinds` | | medium — depends on where the tool lives (`rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas`) | E1 |
| T6 | defect | implemented | `doc:packages/canvas-ui/CLAUDE.md`, toolbar TSDoc | "a toolbar is a preset + props" | docs match | low | T1–T5 |
| N1 | defect | implemented | `sym:ControlCommandItemSpec` (`canvas-core`) | optional `activeIcon` / `activeLabel` / `activeText`, shown while the command `isActive` — a button that swaps its face without a pressed state | Run ⇄ Stop and Erase ⇄ Erase selection as data | medium — core spec type grows (additive; API snapshot unchanged: member-level) | — |
| N2 | defect | implemented | `file:packages/canvas/src/engine/builtinCommands.ts` | `camera.fit { layerId }` fits one layer's bounds (the toolbars' `fitContent(layerId)`) | toolbars keep their fit target | low | — |
| N3 | defect | implemented | `file:packages/graph/src/canvas/graphCommands.ts`, `sym:GraphHistoryProvider`, `sym:GraphClipboardProvider` | `graph.erase` (+ exported `sym:eraseCommand`): delete the click-selection, else `graph.clear`; history / clipboard providers override it undoably | selection-aware erase as data | medium — fixes a latent bug (D-6) | N1 |
| N4 | defect | implemented | same | `graph.redraw { layerId }` | `HistoryToolbar` redraw as data | low | — |
| N5 | defect | implemented | same | `tool.active` gains `isActive` (pressed while the mode is `args.value`) | `ModellerToolbar`'s per-tool toggles as data | low | `rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas` |
| N6 | dressing | implemented | `sym:GraphToolbar`, `sym:GraphLayoutToolbar` | `@deprecated` TSDoc (D3) | steers new code to the spec path | low | — |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| UP1 | commands registered where the toolbar mounts (`GraphCanvas`, `GraphHistoryProvider`, `GraphClipboardProvider`) | a converted toolbar shows disabled buttons when its command is missing | today `GraphControlsToolbar` wraps itself in the history / clipboard providers (`file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L266-L271`); keep that |
| UP2 | `sym:useCommandStates` | drives enabled / active | re-render cost per item is unchanged |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | 36 story files via `GraphControlsToolbar` (e.g. `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:usecases/tools/GraphVisualiser`) | stories | must look and behave identically | V3 screenshot diff on a sample |
| D-2 | `story:usecases/tools/GraphModeller` | story | `ModellerToolbar` on the command path | V4 |
| D-3 | toolbar props (`icons`, `sections`, `extraItems`, `layouts`, `applyInitialLayout`, `orientation`) | published API | unchanged | none |
| D-4 | `canvas.layouts` / `definition.layouts` | serialised | factory layouts registered by T1 now appear in the definition and in exports (D1) | decide D1 |
| D-5 | `api/canvas.surface.txt` | snapshot | unchanged (commands aren't exports) | none |
| D-6 | `sym:ModellerToolbar` / `sym:EditToolbar` erase with **no** `<GraphClipboardProvider>` | behaviour | before: read "Erase selection" but did nothing (`clipboard?.delete`); now deletes the selection (undoably under a `<GraphHistoryProvider>`) | a fix; noted |
| D-7 | presets `LAYOUT_` / `GRAPH_` | serialised | Run + Stop become one `layout.toggle` button; saved panels keep their old two items (both commands still exist) | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` · `pnpm check-types` · `pnpm lint` · `pnpm test` | repo | clean | all |
| V2 | pass | Storybook (control): panels unchanged after the extraction | `story:canvas-react/ControlPanel/GraphCanvas/Explorer`, `story:canvas-ui/apps/GraphCanvasApp/ControlPanels` | identical | E1 |
| V3 | pass | headless Chromium screenshot before / after | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` + 3 other `GraphControlsToolbar` stories | same buttons, order and states; layout picker lists the same entries; Run ⇄ Stop swaps | T1, T2, E2–E4 |
| V4 | pass | Storybook | `story:usecases/tools/GraphModeller` | tool / kind / undo / clear unchanged | T5 |
| V5 | pass | Storybook | `story:canvas-ui/apps/GraphCanvasApp/EmbeddedWidget` | `CanvasControlsToolbar` lock still controlled | T3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Factory `layouts` on `GraphControlsToolbar` | **A** register them with `canvas.layouts` while mounted · **B** keep a toolbar-only picker and convert everything else | **A** — one picker; the cost is that toolbar layouts show up in `definition.layouts` / exports, which is arguably correct | accepted — **C** (see §8) |
| D2 | `CanvasControlsToolbar`'s controlled lock | keep it as an override item · drop it for `view.lock` | **keep** — a published prop; drop it in a later major | accepted |
| D3 | Unconverted callback toolbars | leave as is · deprecate `GraphToolbar` + `GraphLayoutToolbar` (0 usages) | **deprecate** those two in TSDoc; leave `SchemaToolbar` alone | accepted |
| D4 | Spec-valued header slots (`header.right = ControlItemSpec[]`) so the header saves with the canvas | this RFC · its own RFC | **its own RFC** — it's a persistence feature, not X2 | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened from X2 of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` on the maintainer's "finish all" | proposed | Finding: the recorded blocker ("header slots don't accept specs") doesn't block X2 (R1) |
| 2026-09-28 | Approved whole ("sure that order works" after "finish all"); D2–D4 as recommended | accepted | |
| 2026-09-28 | E1–E4, E6, T1–T6, N1–N6 implemented on `feat/control-panels`; E5 superseded by N4 | accepted | V1: build, check-types, lint (API surfaces unchanged), tests (graph +1: `graph.erase` selection / clear / undo). V2–V5: headless Chromium, baseline taken from the pre-conversion build — button labels + enabled / pressed states identical on FullFeatured, GraphVisualiser, GraphModeller, EmbeddedWidget, SchemaViewPanel/CanvasDerived, AppLayoutV2, and their header strips byte-identical in screenshots; only `story:canvas-ui/apps/GraphCanvasApp/ControlPanels` changed (D-7). Run ⇄ Stop swaps while a layout runs and Stop cancels mid-run; lasso / grid switch; Erase reads "Erase selection · Selection" with a node selected. Learned: (1) **D1 → C**: toolbars aren't saved, so factory layouts don't need `canvas.layouts` — the toolbar registers two private commands (`toolbar.layout#<id>` / `toolbar.layoutRun#<id>`) over `useLayout` while mounted; the picker keeps its exact entries and nothing reaches `definition.layouts`. (2) E1 is a hook, `useControlItems`, returning `ToolbarItem`s, plus `<ControlItems>` on top — so toolbars keep `applyIconOverrides`, `extraItems`, `children` and the controlled lock with no new props (E6's `extra` is on `<ControlItems>` only). (3) E3 needed no type change: the registry's `stop` glyph is a filled square. (4) E4's section keys were unnecessary: each toolbar composes its specs per section itself (`toolbars/controlSpecs.ts`). (5) The toolbars used closures the commands didn't cover: selection-aware erase, fit-to-layer, redraw, per-tool toggles, a swapping button face → N1–N5. (6) N3 surfaced D-6. (7) The node-kind picker keeps its "Shape: Circle" trigger by post-processing one `ToolbarItem` |
