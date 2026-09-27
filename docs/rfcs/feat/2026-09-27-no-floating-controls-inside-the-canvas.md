---
id: feat-2026-09-27-no-floating-controls-inside-the-canvas
type: feat
title: ControlPanels — serialisable floating UI inside the canvas, declared as children
status: landed
opened: 2026-09-27
decided: 2026-09-27
landed: 2026-09-28
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/graph-canvas-apps-plan.md
relations:
  - { predicate: relates-to, object: doc:docs/graph-canvas-apps-plan.md }
  - { predicate: relates-to, object: doc:docs/canvas-state-plan.md }
---

# ControlPanels — floating UI inside the canvas

| | |
|---|---|
| **Motivation** | `sym:GraphCanvasApp` has header / footer / side rails but no first-class floating chrome over the canvas; floating controls are hand-rolled `sym:Panel` children, invisible to the store, export and the Studio |
| **Design** | A `ControlPanelSpec` (pure JSON) lives in `view.definition.controlPanels`; items name **commands** / **icons** / **widgets** by string; a `sym:CommandRegistry` on each `Canvas` resolves commands; `@invana/canvas-ui` projects the specs to pixels |
| **Row status** | proposed 0 · accepted 0 · implemented 10 · landed 0 · deferred 0 · rejected 0 · superseded 2 (updated in §8) |
| **Open decisions** | none — D1–D3 accepted with the recommendations |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Floating controls are ad-hoc `<Panel>` children; no standard surface or item model | `file:packages/canvas-ui/src/components/Panel.tsx` | `sym:ViewToolbar` etc. each wrap their own `Panel` |
| M2 | Floating chrome is not engine state — lost on export, not undoable, not editable by the Studio | `file:packages/canvas-core/src/state/view/CanvasView.ts` | `definition` has no chrome compartment |
| M3 | Toolbar items carry closures + icon components, so they cannot be serialised | `file:packages/canvas-ui/src/components/ToolbarItem.ts` | `onClick: () => void`, `icon: ComponentType` |
| M4 | The floating/overlay mode planned for the app shell never shipped | `doc:docs/graph-canvas-apps-plan.md` §5a | `overlay` flag absent from `sym:GraphCanvasAppProps` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A `floatingBar` prop on `GraphCanvasApp` | rejected by maintainer | panels are composed as children, like behaviours |
| R2 | Model a panel as a `Layer` | rejected | layers are backend-drawn; panels are DOM built from design-kit components |
| R3 | Model a panel as a `Behaviour` | rejected | behaviours own input; a panel is chrome |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `ControlPanelSpec` + `ControlItemSpec` are plain data in canvas-core | `file:packages/canvas-core/src/state/view/controlPanels.ts` | core stays dependency-free |
| 2 | `definition.controlPanels: Record<id, ControlPanelSpec>` | `sym:CanvasView` | export / undo / telemetry / future CRDT cover panels for free |
| 3 | Items reference behaviour by **name**: `command`, `icon`, `widget`, `slot` | `sym:ControlItemSpec` | panels serialise; closures live in registries |
| 4 | `sym:CommandRegistry` — `name → { run, isActive?, isEnabled? }`, bound to a context | `file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts` | one dispatch seam for panels, shortcuts, menus later |
| 5 | `Canvas.commands` registers built-ins: `camera.zoomIn` · `camera.zoomOut` · `camera.fit` · `view.lock` · `layout.run` · `layout.stop` | `sym:Canvas.commands` | panels work with zero app code |
| 6 | `<ControlPanel>` (canvas-react) is null-rendering: writes its spec on mount, patches on change, removes on unmount; `children` go to a per-canvas **slot registry** (not persisted) | `sym:ControlPanel` | declared as children like behaviours |
| 7 | `<ControlPanels>` (canvas-ui) reads `definition.controlPanels` and draws each via `Panel` + `ToolbarItems`, resolving icons / widgets / slots from registries | `sym:ControlPanels` | the UI is a pure projection of state |
| 8 | `GraphCanvasApp` mounts `<ControlPanels>` in main and registers `theme.toggle` bound to the host theme | `sym:GraphCanvasApp` | panels need no extra wiring in the app |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/graph-canvas-apps-plan.md` §5a | relates-to | partially superseded | "regions floating over a full-bleed canvas" — realised as ControlPanels, not a shell `overlay` flag |
| `doc:docs/canvas-state-plan.md` | relates-to | active | definition = persisted, converged; the renderer (here: UI) is a projection |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/canvas-core/src/state/view/controlPanels.ts`, `sym:CanvasView` | Spec types; `definition.controlPanels`, default `{}` | panels are state | medium — public `CanvasView` shape | — |
| F2 | defect | landed | `sym:createActions` | `controlPanels.{add,update,show,hide,remove}` labelled `view:controlPanel:*` | named, undoable writes | low | F1 |
| F3 | defect | landed | `sym:CommandRegistry` | Dependency-free registry bound to a context getter; `subscribe` for late registration | name → behaviour | low | — |
| F4 | defect | landed | `sym:Canvas.commands` | Registry on `Canvas` + built-in camera / view / layout commands | panels usable out of the box | medium — command names become public API | F3 |
| F5 | defect | landed | `sym:CanvasConfig`, `sym:Canvas.update`, `sym:Canvas.get` | `controlPanels` in config (whole-spec replace per id; `null` removes) | JSON-config path | low | F1 |
| F6 | defect | landed | `file:packages/canvas/src/io/stateExport.ts` | Import restores `definition.controlPanels` (older snapshots → `{}`) | round-trip | low | F1 |
| F7 | defect | landed | `pkg:@invana/canvas-react` | `<ControlPanel>`, slot registry, `useControlPanels`, `useCommandStates` | declarative children | medium — new public components | F2, F4 |
| F8 | defect | landed | `pkg:@invana/canvas-ui` | `<ControlPanels>` projection + default icon / widget registries | pixels | medium | F7 |
| F9 | defect | landed | `sym:GraphCanvasApp` | Mount `<ControlPanels>`; register `theme.toggle` | zero-wiring in the app | low | F8 |
| F10 | defect | landed | `api/*.surface.txt` | Regenerate snapshots | `check-api-surface` green | low | F1–F8 |
| F11 | defect | superseded | `pkg:@invana/graph` | Domain commands (`history.undo/redo`, `selection.clear`, select mode) — superseded by `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` (select mode, history, clipboard, edge type, clear) | richer panels | low | F4 — unblocked any time |
| F12 | defect | superseded | `pkg:@invana/canvas-ui` `editors/control-panels/` | Schema editor for panels (Studio authoring) — superseded by `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` | Studio edits panels | medium | F8 — follow-up round |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:Panel` | positioner reused as-is | a position change moves every panel |
| U2 | `sym:ToolbarItems` / `sym:ToolbarItem` | item rendering reused | item look changes everywhere at once |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `sym:defaultCanvasView`, headless double | type | new required field | default `{}` |
| X2 | Saved state snapshots (`sym:CanvasStateSnapshot`) | serialised | new optional field on import | `?? {}` on import; version unchanged |
| X3 | `api/canvas-core`, `api/canvas-store`, `api/canvas` snapshots | published API | additions | regenerate (F10) |
| X4 | `sym:GraphCanvasApp` consumers (59 stories) | component | a `<ControlPanels>` child is always mounted; renders nothing with no specs | none |
| X5 | Code spreading `CanvasView['definition']` literals | type | must add `controlPanels` | fixed where `check-types` flags |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` | repo | clean | F1–F9 |
| V2 | pass | `pnpm build` + `pnpm check-boundaries` | repo | core stays import-free | F1, F3 |
| V3 | pass | `pnpm check-api-surface` | api snapshots | only additions | F10 |
| V4 | pass | existing canvas-store / canvas-core tests | `pnpm test` | pass (control) | F1, F2 |
| V5 | pass | Storybook: `GraphCanvasApp` stories unchanged with no panels; a panel draws + its commands fire | `story:canvas-ui/apps/GraphCanvasApp` | identical (control); panel works | F7, F8, F9 |
| V6 | pass | Node smoke over built `dist`: `controlPanels.add/hide/update/remove`; `CommandRegistry` run / isActive / dispose / notify | scratch script | all true | F2, F3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Command naming | `namespace.verb` · flat | `namespace.verb` | accepted |
| D2 | Editor in this round? | now · follow-up | follow-up (F12) | accepted |
| D3 | Default panels in `GraphCanvasApp`? | none · view controls | none — opt-in (rule 7) | accepted |
| D4 | React-only vs engine state | React · engine | engine (maintainer) | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-27 | Opened; approach agreed in chat ("engine also", "write the code") | accepted | F11, F12 deferred |
| 2026-09-27 | F1–F10 implemented on `feat/control-panels` | accepted | V1–V4, V6 pass; V5 (visual, in Storybook) pending — no story added (rule 11). Learned: `Panel`'s 8 positions can't express centred side anchors, `center`, insets or `{x,y}` offsets, so the projection positions panels itself rather than reusing `sym:Panel` (U1 no longer applies). `CommandRegistry` is exported from core + canvas, not re-exported by canvas-store (matches the other registries) |
| 2026-09-28 | F11 superseded by `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved`; V5 pass | accepted | F11: that RFC registers `select.mode`, `history.*`, `clipboard.*`, `graph.edgeType`, `graph.clear` (`selection.clear` wasn't needed: `clipboard.delete` and select mode cover the panels built so far). V5: headless Chromium over the running Storybook — `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` and `story:usecases/tools/GraphModeller` (no panels) load unchanged with no console errors; `story:canvas-react/ControlPanel/Canvas/Basic` and `story:canvas-ui/apps/GraphCanvasApp/ControlPanels` draw their panels and the commands fire. F12 (Studio editor for panels) stays deferred |
| 2026-09-28 | F12 superseded by `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` | accepted | `ControlPanelsEditorPanel` / `ControlPanelsEditor`, also a section of `CanvasSettingsEditorPanel`. Nothing in this RFC is still open |
| 2026-09-28 | `feat/control-panels` merged to `main` | landed | Every implemented row → landed (build, check-types, lint, test green at merge) |
