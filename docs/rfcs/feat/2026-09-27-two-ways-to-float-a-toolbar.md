---
id: feat-2026-09-27-two-ways-to-float-a-toolbar
type: feat
title: Toolbars are content; floating over the canvas is a ControlPanel's job
status: landed
opened: 2026-09-27
decided: 2026-09-27
landed: 2026-09-28
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas }
---

# Toolbars are content; ControlPanels float

| | |
|---|---|
| **Motivation** | 11 `*Toolbar`s each self-float via a `Panel` wrapper + `position` / `bare`, duplicating `sym:ControlPanel` — two ways to float a control, only one of which is saved with the canvas |
| **Design** | Toolbars always render their content (no wrapper, no `position`, no `bare`); floating goes through `sym:ControlPanel`; serialisable presets for the view controls |
| **Row status** | proposed 0 · accepted 0 · implemented 6 · landed 0 · deferred 0 · rejected 0 · superseded 1 (updated in §8) |
| **Open decisions** | none |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Toolbars float themselves: `position` + `bare` + `<Panel>` | `file:packages/canvas-ui/src/toolbars/ViewToolbar.tsx#L54-L58` (same in 10 siblings) | `if (bare) return nav; return <Panel …>` |
| M2 | A self-floated toolbar is invisible to state — lost on export, not Studio-editable | `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` | ControlPanel covers the same need, persisted |
| M3 | Almost every caller already uses the content form | grep of `apps/` + `packages/` | 5 `bare` callers; 2 floating toolbar callers |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Delete `Panel` too | rejected | still the positioner for `sym:RendererCapabilityBanner` and side-docked detail panels (`sym:InspectorPanel`, two usecase stories) — not toolbars |
| R2 | Keep `bare` as a deprecated no-op | rejected | pre-1.0; five callers; a dead prop is surface drift |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Each toolbar returns its `ToolbarItems` / trigger directly | `file:packages/canvas-ui/src/toolbars/*` | one job: content |
| 2 | Default `orientation` unchanged per toolbar | e.g. `sym:ViewToolbar` stays `vertical` | existing `bare` callers render identically |
| 3 | Floating = `<ControlPanel>` with `items` (persisted) or toolbar `children` (runtime slot) | `sym:ControlPanel` | one way to float |
| 4 | `VIEW_CONTROL_ITEMS` / `ZOOM_CONTROL_ITEMS` presets as `ControlItemSpec[]` | `file:packages/canvas-ui/src/control-panels/presets.ts` | the view toolbar's content, serialisable |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` | depends-on | accepted | ControlPanel is the floating mechanism |
| `doc:docs/ui-consolidation-plan.md` | relates-to | in progress | toolbars live in canvas-ui |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| T1 | defect | landed | `sym:CanvasControlsToolbar` `sym:ClearCanvasToolbar` `sym:EditToolbar` `sym:ExportStateToolbar` `sym:ExportImageToolbar` `sym:HistoryToolbar` `sym:GraphToolbar` `sym:GridToolbar` `sym:GraphLayoutToolbar` `sym:ModellerToolbar` `sym:ViewToolbar` | Drop `position`, `bare`, the `Panel` wrapper | toolbars are content | medium — breaking props on 11 public components | — |
| T2 | defect | landed | `file:packages/canvas-ui/src/control-panels/presets.ts` | `VIEW_CONTROL_ITEMS`, `ZOOM_CONTROL_ITEMS` | serialisable replacement for a floating view bar | low | — |
| T3 | defect | landed | `sym:SchemaViewPanel` | Its floating `SchemaToolbar` + zoom bar become `<ControlPanel>`s on its own canvas (+ `<ControlPanels/>`) | one mechanism internally too | medium — visible surface | T1, T2 |
| T4 | defect | landed | `story:canvas-ui/apps/GraphCanvasApp/EmbeddedWidget` | Floating `CanvasControlsToolbar` → `<ControlPanel items={ZOOM_CONTROL_ITEMS}>` | story matches the API | low | T2 |
| T5 | defect | landed | 5 story call sites | Remove `bare` | compiles | low | T1 |
| T6 | defect | landed | `file:packages/canvas-ui/CLAUDE.md`, `file:apps/storybook/CLAUDE.md`, toolbar TSDoc | Toolbars = content; float with ControlPanel; the canvas-react ControlPanel story exception | docs match | low | T1 |
| T7 | defect | superseded | `pkg:@invana/graph` commands + presets | History / select-mode / modeller as commands so graph toolbars get serialisable presets — superseded by `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` (history, select mode) and `rfc:feat-2026-09-28-control-panels-cannot-pan-or-model` R1 (modeller tool) | graph panels persist | medium | `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` F11 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:ToolbarItems` | every toolbar still renders through it | none new |
| U2 | `sym:ControlPanel` / `sym:ControlPanels` | the floating path | as in the ControlPanel RFC |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:canvas-store/Export/ExportState` | story | passes `bare` | T5 |
| X2 | `story:canvas/Export/ExportImage` | story | passes `bare` | T5 |
| X3 | `story:usecases/tools/GraphModeller` | story | `ModellerToolbar bare` | T5 |
| X4 | `story:canvas-ui/apps/GraphCanvasApp/EmbeddedWidget` | story | floating `CanvasControlsToolbar` | T4 |
| X5 | `sym:SchemaViewPanel` (+ its stories under `canvas-ui/view-panels/SchemaViewPanel/`) | component | floating toolbar + zoom bar | T3 |
| X6 | External consumers of the 11 toolbars | published API | `position` / `bare` removed | wrap in `<ControlPanel>` |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` | repo | clean | T1–T5 |
| V2 | pass | `pnpm lint` (boundaries + api surface) | repo | clean | T1, T2 |
| V3 | pass | Storybook screenshots | `story:canvas-ui/apps/GraphCanvasApp/EmbeddedWidget`, `story:canvas-ui/view-panels/SchemaViewPanel/CanvasDerived` | controls float where they did, commands fire | T3, T4 |
| V4 | pass | Storybook screenshot (control) | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` | unchanged header toolbar | T1 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Remove or deprecate `position` / `bare` | remove · deprecate | remove (pre-1.0, 7 callers) | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-27 | Opened on maintainer's "ok clean up" | accepted | T7 deferred to the graph-commands work |
| 2026-09-27 | T1–T6 implemented on `feat/control-panels` | accepted | V1–V4 pass (headless Chromium over the running Storybook: EmbeddedWidget + SchemaViewPanel/CanvasDerived zoom fires, FullFeatured / GraphModeller / ExportState / ExportImage unchanged, no console errors). Each toolbar keeps its old default `orientation`. `ControlPanel.items` widened to `readonly` so presets assign. `SchemaViewPanel` keeps its old look via `surface={false}` |
| 2026-09-28 | T7 superseded | accepted | History / select mode landed as commands + presets in `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved`; the modeller tool in `rfc:feat-2026-09-28-control-panels-cannot-pan-or-model` (R1, `MODELLER_CONTROL_ITEMS`). Nothing in this RFC is still open |
| 2026-09-28 | `feat/control-panels` merged to `main` | landed | Every implemented row → landed (build, check-types, lint, test green at merge) |
