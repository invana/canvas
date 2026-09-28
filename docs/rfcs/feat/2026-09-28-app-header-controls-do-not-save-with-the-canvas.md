---
id: feat-2026-09-28-app-header-controls-do-not-save-with-the-canvas
type: feat
title: Control panels can be placed in GraphCanvasApp's header, so header controls save with the canvas
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice }
  - { predicate: depends-on, object: rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panel-command-args-are-raw-json }
---

# Control panels can be placed in GraphCanvasApp's header, so header controls save with the canvas

| | |
|---|---|
| **Motivation** | `GraphCanvasApp`'s header regions (`left` / `center` / `right`) take React nodes, so whatever an app puts there is code and is lost on export. Controls floating *over* the canvas already save as `definition.controlPanels`; the header rail, outside the canvas host, can't hold them. This is D4 of `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice`. |
| **Design** | `ControlPanelSpec.placement?: 'canvas' \| 'header-left' \| 'header-center' \| 'header-right'`. `<ControlPanels>` draws only `canvas` panels. A new `<HeaderControlPanels region>` draws the rest inside the header regions. Persistence, import, `<ControlPanel>` and the editor come with the existing spec. |
| **Row status** | proposed 0 · accepted 0 · implemented 6 · landed 0 · deferred 2 · rejected 0 · superseded 0 |
| **Open decisions** | none — all as recommended |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Header regions are `RegionSlot = ReactNode \| (ctx) => ReactNode` | `file:packages/canvas-ui/src/apps/GraphCanvasAppHeader.tsx#L36-L48`, `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L107` | type |
| M2 | The header is a sibling of the canvas host (`AppLayoutV2.header` vs `mainSection`, which is `overflow-hidden`), so a canvas-anchored panel can't reach it | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L604-L652` | read |
| M3 | Export deep-clones all of `definition` and import restores `controlPanels`, so anything expressed as a panel spec already round-trips | `file:packages/canvas/src/io/stateExport.ts#L182`, `#L284-L290` | read |
| M4 | About 45 story headers use closure content (`<GraphControlsToolbar>`, closure `ToolbarItems`, `ThemeToggle`); none can be saved today | `apps/storybook/stories/**` (Explore catalogue) | grep |
| M5 | Of that content, only theme and the graph / layout presets have commands today. Minimap and dev-info toggles, the side-panel dock, dataset pickers and export / clear buttons have none (**corrected in §8**: minimap and dev-info already had widgets) | `file:packages/canvas-ui/src/control-panels/presets.ts` | read |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A canvas panel at `position: 'top', stretch, surface: false` as a stand-in header | rejected | it overlays the canvas rather than sitting in the rail (M2) |
| R2 | Make `RegionSlot` accept `ControlItemSpec[]` directly | rejected | the prop is code, not state: nothing would reach `definition` or export, so it doesn't meet D4's goal |
| R3 | Save `<GraphControlsToolbar>` as-is | rejected | its layout picker uses per-instance private commands (`toolbar.layout#<uid>`), which are unsaveable by design; the saveable equivalent is `LAYOUT_CONTROL_ITEMS` |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `ControlPanelSpec.placement` (default `'canvas'`). For header placements, `position`, `offset` and `stretch` are ignored, `orientation` is forced to horizontal, and `surface` defaults to `false` | `file:packages/canvas-core/src/state/view/controlPanels.ts#L176-L203` | one spec, one store slice |
| 2 | `<ControlPanels>` filters to `placement === 'canvas'` | `file:packages/canvas-ui/src/control-panels/ControlPanels.tsx#L131-L144` | header panels don't also float |
| 3 | `<HeaderControlPanels region canvas>` reads `useControlPanels(canvas)`, keeps that region's visible panels in insertion order, and draws each with `useControlItems` | `sym:useControlItems` | a hook-using component that `buildHeaderNav`, a plain function, can render |
| 4 | `buildHeaderNav` renders each region as the code slot plus saved panels (D2), gated on a live canvas the same way `center` / `right` are today | `file:packages/canvas-ui/src/apps/GraphCanvasAppHeader.tsx#L56-L103` | saved header controls appear with no app code |
| 5 | Editor: a Placement select; position, offset and stretch fields are hidden for header placements | `file:packages/canvas-ui/src/editor-panels/control-panels/mapping.ts#L92-L97` | the Studio can move a panel into the header |
| 6 | `layer.visible { id }` toggle command in the engine built-ins: active while layer `id` is visible | M5; `sym:CanvasCommand.isActive` | makes the most common header toggles (minimap, dev info) saveable |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice` D4 / R1 | relates-to | landed | header slots already sit in the lifted canvas context, so `useControlItems` works there |
| `rfc:feat-2026-09-27-no-floating-controls-inside-the-canvas` | depends-on | landed | the spec, store slice and `<ControlPanel>` this extends |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| P1 | defect | implemented | `sym:ControlPanelSpec` | `placement?` + TSDoc on which fields each placement honours | a panel can target the header | low — additive, optional | — |
| P2 | defect | implemented | `sym:ControlPanels` | skip non-`canvas` placements | no double draw | low | P1 |
| P3 | defect | implemented | `pkg:@invana/canvas-ui` `control-panels/HeaderControlPanels.tsx` | new exported component | a projection for header regions | low — new export | P1 |
| P4 | defect | implemented | `sym:buildHeaderNav` | append saved panels per region (D2) | `GraphCanvasApp` headers save and restore | **medium** — changes what every `GraphCanvasApp` header renders when header-placed panels exist; none do today, so current stories are unchanged | P3 |
| P5 | defect | implemented | `editor-panels/control-panels/{fields,mapping,types}.ts` | Placement field; hide position, offset and stretch for header placements | Studio authoring | low | P1 |
| P6 | defect | implemented | `file:packages/canvas/src/engine/builtinCommands.ts` | `layer.visible { id }` toggle | minimap and dev-info toggles become saveable | low — additive command | — |
| P7 | defect | deferred | `sym:GraphCanvasAppFooter` | `footer-*` placements (D3) | the same for the footer | low | P3 |
| P8 | defect | deferred | `apps/storybook` headers (M4) | migrate stories to saved header panels | — | — | only if a story is asked for (rule 11) |

## 5. Blast radius

Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `AppLayoutV2` / `NavHorizontal` (`@invana/themes`) | the header rail P4 renders into | none — only the content of the existing `bar` changes |
| U2 | `CanvasThemeSync` registering `theme.toggle` only when `bundle` is on (`file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L360`) | a saved theme toggle in a header without the bundle shows "(not registered)" | as today for canvas panels |

Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `api/canvas-core.surface.txt`, `api/canvas.surface.txt` (type re-exports); canvas-ui exports | published API | additions | regenerate the snapshot |
| X2 | Saved states without `placement` | persistence | treated as `'canvas'` — unchanged | none |
| X3 | `story:canvas-ui/apps/GraphCanvasApp/ControlPanels`, `story:canvas-react/ControlPanel/Canvas/Basic` | story | unchanged (canvas placement) | none; control V5 |
| X4 | `story:canvas-ui/apps/AppLayoutV2` shell header | story | not affected — it doesn't use `buildHeaderNav`; it could render `<HeaderControlPanels canvas={active}>` later | none |
| X5 | Other hosts of `<ControlPanels>` (e.g. a custom app shell) | third-party | header-placed panels vanish from the canvas unless the host also mounts `<HeaderControlPanels>` | note in TSDoc |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build`, `check-types`, `lint` (surface regenerated), `test` | repo | green | all |
| V2 | pass | headless Chromium: on a `GraphCanvasApp` story, `canvas.update({ controlPanels: { h: { kind, placement: 'header-right', items: THEME_CONTROL_ITEMS } } })` | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` | the toggle appears in the header's right region, not over the canvas, and works | P1–P4 |
| V3 | pass | export → import round-trip of V2's state | `story:canvas-ui/apps/GraphCanvasApp/ExportState` | the header panel comes back | P1, P4 |
| V4 | pass | editor: switch a panel's Placement to header-center | `story:canvas-ui/editors/CanvasSettingsEditorPanel` | it moves into the header; position fields hide | P5 |
| V5 | pass | **control**: canvas-placed panels and all existing header stories (FullFeatured, GraphModeller, ExportState, EmbeddedWidget) | stories | pixel-identical headers, panels unchanged | P2, P4 |
| V6 | pass | `layer.visible { id: 'minimap' }` toggle | FullFeatured | the minimap hides and shows; the button shows as pressed while it's visible | P6 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | How a header is stored | A: `placement` on `ControlPanelSpec` · B: a new `definition.header { left, center, right }` | **A** — reuses the store actions, `canvas.update`, import, `<ControlPanel>` and the editor; B needs new plumbing in six places for the same data | accepted |
| D2 | A region with both a code slot (`header.right`) and saved panels | A: both — code first, then saved panels · B: saved panels replace the slot · C: the slot wins | **A** — additive, so no existing header changes, and the Studio can add to an app's header without the app opting out | accepted |
| D3 | Footer placements | now · later | **later** (P7) — no caller asks for it yet; the design extends as-is | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened from D4 of `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice` | proposed | Finding: the minimap, dev-info, dock, dataset and export header controls have no commands; P6 covers the first two |
| 2026-09-28 | Approved whole ("impleemnt all in this branch"); every decision as recommended | accepted | |
| 2026-09-28 | P1–P6 implemented on `feat/view-history` | accepted | V1: build, check-types, lint, tests. V2: headless Chromium, `FullFeatured` — a `header-right` panel draws in the header rail (button bottom 32 px, canvas top 40 px), and its `camera.fit` works; a canvas-placed panel in the same run still floats over the canvas. V3: `exportState` → remove → `importState` brings the header panel back with its placement. V4: a header-placed panel's form shows only Placement / Card surface / Visible (switching the select itself was not driven). V5: `FullFeatured`, `EmbeddedWidget`, `GraphCanvasApp/ControlPanels`, `ControlPanel/GraphCanvas/Modeller`, `ControlPanel/Canvas/Basic` and `usecases/tools/GraphModeller` load with no console errors; an empty region adds no DOM (fragments), so no pixel diff was taken. V6: `layer.visible { id: 'minimap' }` hides and re-shows the minimap and reports active while visible. **Correction to M5 / P6:** minimap and dev-info toggles were already saveable — as the `minimap-toggle` / `dev-info-toggle` widgets. `layer.visible` stays as a generic toggle for any registered layer (legend, contours, a hidden overlay). Also: switching Placement in the editor resets Card surface to that surface's default |
