---
id: feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic
type: feat
title: Hooks and commands share one set of engine functions, so they can't drift
status: landed
opened: 2026-09-28
decided: 2026-09-28
landed: 2026-09-28
packages: [pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/commands-followups.md
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone }
---

# Hooks and commands share one set of engine functions, so they can't drift

| | |
|---|---|
| **Motivation** | Several actions are written twice: once in a `canvas-react` hook and once in a command (`select.mode`, `clipboard.*`, the two-stack undo). `GraphControlsToolbar` registers private commands only to fit its layout picker into the spec renderer. Five section hooks are a second way to draw toolbar controls that no live toolbar uses. Items 3–10 of `doc:docs/commands-followups.md` |
| **Design** | Logic goes into plain functions in `pkg:@invana/graph`. Hooks and commands both call them. Commands only for saved controls. Section hooks deprecated. The rule goes into `doc:packages/canvas-react/CLAUDE.md` |
| **Constraint** | Nothing users see changes: labels, enabled / pressed states, layout entries, saved panels. No command renamed. No export removed |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 16 · deferred 1 · rejected 0 · superseded 0 |
| **Open decisions** | none — D1–D5 accepted as recommended |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The select-mode rule (first enabled mode → else the mode with no behaviour → else the first key) and its `{ id: { enabled } }` patch are written twice. The hook reads `definition.behaviours[id].enabled`; the command reads the live `canvas.behaviours.get(id).enabled` | `file:packages/canvas-react/src/hooks/useSelectMode.ts#L52-L71`, `file:packages/graph/src/canvas/graphCommands.ts#L136-L171` | read; the command's comment says "the same rule as `useSelectMode`" |
| M2 | `useClipboard` builds cut / copy / delete itself from `useSelection` state. The `clipboard.*` commands build them again from `selectedElementIds`. Only paste is shared (`pasteAndSelect`) | `file:packages/canvas-react/src/hooks/useClipboard.ts#L63-L77`, `file:packages/canvas-react/src/providers/GraphClipboardProvider.tsx#L84-L115` | read |
| M3 | The same selection read exists a third time as `graph`'s private `clickSelection` | `file:packages/graph/src/canvas/graphCommands.ts#L97-L100` vs `file:packages/canvas-react/src/providers/graphActions.ts#L43-L50` | identical bodies |
| M4 | The two-stack undo (`graphGoesFirst` + graph `GraphHistory` / definition `canvas.history`) only exists inside the provider's command closures. No function can be reused by a hook | `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L56-L67`, `#L141-L150` | read |
| M5 | `useHistory().undo` is graph-only (`history.undo()`), but the `history.undo` command picks the newer of both stacks. That difference was deliberate: combined state through `useHistory` is H9 (followups item 16, out of scope) | `file:packages/canvas-react/src/hooks/useHistory.ts#L55-L56` | H9 in `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` |
| M6 | `GraphControlsToolbar` registers `toolbar.layout#<uid>` / `toolbar.layoutRun#<uid>` over `useLayout`, then calls `commands.invalidate()` on every picker change, only to draw the picker through `useControlItems` | `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L135-L187` | D1 → C, history row 3 of `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice` |
| M7 | The section hooks' only in-repo callers: `SchemaToolbar` (`useViewSection`, for Fit only) and the deprecated `GraphToolbar` / `GraphLayoutToolbar`. They build `ToolbarItem`s with baked `lucide-react` icons inside the headless package | `file:packages/canvas-ui/src/toolbars/SchemaToolbar.tsx#L119`; `file:packages/canvas-react/src/hooks/useViewSection.ts#L2` | grep over `packages/` + `apps/storybook` |
| M8 | `SchemaToolbar`'s node-mode, layout and edge-routing pickers are controlled by `SchemaViewPanel`'s React state. No command exists for them. Only Fit touches the canvas | `file:packages/canvas-ui/src/toolbars/SchemaToolbar.tsx#L121-L166` | read |
| M9 | `GraphToolbar` / `GraphLayoutToolbar` are `@deprecated` and have no JSX user in `packages/` or `apps/storybook` | `file:packages/canvas-ui/src/toolbars/GraphToolbar.tsx#L48`, `file:packages/canvas-ui/src/toolbars/GraphLayoutToolbar.tsx#L43` | grep |
| M10 | `doc:docs/README.md` labels three RFCs "🚧 implemented on `feat/control-panels`", but that branch merged. Real state: `canvas-core-structure` is in `main` (`ec3c22fe`, `5e6757b5`) with the folder layout later reshaped. `renderer-preference…` is `landed` 2026-09-10. `label-measurement…` is in `main` (`5e6757b5`) with V1 / V4 `pending`, yet its front matter still says `status: proposed` | `file:docs/README.md#L100-L122` | `git merge-base --is-ancestor`; front matter |

### Found, not in scope

These are the same kind of problem but are not items 3–10. They are recorded here only. Nothing changes for them.

| ID | Observation | Evidence |
|---|---|---|
| O1 | `useLock` re-implements `view.lock` (enable / disable by id) | `file:packages/canvas-react/src/hooks/useLock.ts#L44`, `file:packages/canvas/src/engine/builtinCommands.ts#L162-L177` |
| O2 | `useEdgeType` is the reverse: the hook goes through the `graph.edgeType` command when one is registered | `file:packages/canvas-react/src/hooks/useEdgeType.ts` (`useCommandStates`) |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `resolveSelectMode(modes, isEnabled)` and `selectModePatch(modes, next)` in `pkg:@invana/graph`. Each caller passes its own `isEnabled` reader (D1) | M1 | one rule, two thin callers |
| 2 | `canvas-react/providers/graphActions.ts` (internal, not exported) moves to `graph/src/canvas/graphActions.ts`. It gains `copySelection` / `cutSelection` / `deleteSelection` (selection read at call time through `selectedElementIds`) and `undoNewest` / `redoNewest` / `canUndoEither` / `canRedoEither` (M4) | M2–M4 | the clipboard and undo logic lives in one place, callable without React |
| 3 | The provider commands and `useClipboard` call step 2. `useClipboard` keeps `useSelection` only for the reactive `hasSelection` | M2 | same selection source (the click-select behaviour). The hook can no longer act on a stale selection captured in a closure |
| 4 | `useHistory` keeps graph-only undo. Moving it to `undoNewest` is H9 (D2) | M5 | no behaviour change. H9 later becomes a one-line switch |
| 5 | `GraphControlsToolbar` builds the layout `select` and the Run / Stop `button` directly from `useLayout`, using the exact fields `useControlItems` produced from the private commands (table below). It appends them after the spec items with a divider | M6 | no private commands, no `invalidate()`. Toolbars aren't saved, so they don't need commands |
| 6 | Deprecate the five section hooks with TSDoc only (D3) | M7 | the surface stays. Callers see the deprecation |
| 7 | `SchemaToolbar`'s Fit becomes `fitSpec(layerId)` through `useControlItems`. The three controlled pickers stay callbacks (D5) | M8 | no non-deprecated caller of `useViewSection` is left |

**The layout items step 5 must reproduce** (what `useControlItems` makes from today's specs, `file:packages/canvas-ui/src/control-panels/ControlItems.tsx#L56-L95`):

| Item | Fields |
|---|---|
| picker | `{ type: 'select', key: 'layout', label: 'Layout', value: layout, options: layoutOptions, disabled: false, onChange: applyLayout }`, plus `display: 'segmented'` in the full variant. No `icons` (the options carry none). Omitted when `layoutOptions` is empty |
| run | `{ type: 'button', key: 'run-layout', icon: DEFAULT_CONTROL_ICONS[isRunning ? 'stop' : 'play'], label: isRunning ? 'Stop layout' : 'Run layout', disabled: false, onClick: isRunning ? stopLayout : () => applyLayout(layout) }` |

One difference: today, the first render before the effect registers the commands shows no picker and a disabled Run for one frame. After step 5 they are correct from the first render.

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/commands-followups.md` | design of record | open | the three-layer rule (logic → hooks → commands for saved controls). This RFC lands items 3–10 |
| `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice` | relates-to | landed | `useControlItems` stays the one spec renderer. Its D1 → C (private layout commands) is undone by L1. Its D4 is closed separately (followups item 20) |
| `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` | relates-to | landed | `graphActions.ts` began there as "shared by hooks and commands". This RFC finishes that for clipboard and undo |
| `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` | relates-to | accepted | owns the two-stack arbitration. H3 moves it and does not change it. H9 stays deferred there |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| B1 | defect | landed | `doc:docs/README.md` (item 3) | `canvas-core-structure` → "✅ landed (in `main` since v0.0.12; folder layout since reshaped by `canvas-core-folder-sprawl`)". `renderer-preference…` → "✅ landed 2026-09-10". `label-measurement…` → "🚧 in `main`; V1 / V4 pending" | index matches git | low | — |
| B2 | defect | landed | `doc:docs/rfcs/fix/2026-09-10-label-measurement-allocates-a-textstyle-per-call.md` (item 3) | front matter `proposed` → `accepted`; F1 / F2 `accepted` → `implemented`; row-status line; history row | RFC agrees with its own history | low | — |
| S1 | defect | landed | new `file:packages/graph/src/canvas/selectMode.ts` (item 4) | `resolveSelectMode(modes, isEnabled): string \| null`, `selectModePatch(modes, next)`, exported from `pkg:@invana/graph` | one rule | low — additive exports | — |
| S2 | defect | landed | `sym:select.mode` in `file:packages/graph/src/canvas/graphCommands.ts#L145-L171` | `value` / `run` call S1 (live-behaviour reader, D1) | — | low — `graphCommands.test.ts` covers it | S1 |
| S3 | defect | landed | `sym:useSelectMode` | `mode` / `setMode` call S1 (definition reader, D1). Initial-mode enforcement unchanged | — | low — signature unchanged | S1 |
| H1 | defect | landed | `canvas-react/providers/graphActions.ts` → `file:packages/graph/src/canvas/graphActions.ts` (item 5, D4) | move `clearGraphLayer` / `selectedElementIds` / `pasteAndSelect`. Add `copySelection` / `cutSelection` / `deleteSelection`. `graphCommands`' private `clickSelection` → `selectedElementIds`. Export from `pkg:@invana/graph` | one home, no React | **medium** — cross-package move. The canvas-react file was internal, so no public import breaks | — |
| H2 | defect | landed | `sym:GraphClipboardProvider`, `sym:useClipboard`, `sym:useClearGraph` | commands and hook call H1. `useClipboard` reads the selection at call time. Result type unchanged | clipboard hook and commands can't diverge | medium — every Cut / Copy / Paste / Delete button and command | H1 |
| H3 | defect | landed | `sym:GraphHistoryProvider` → H1's module | `graphGoesFirst` + the `history.undo` / `.redo` bodies and `isEnabled` → `undoNewest` / `redoNewest` / `canUndoEither` / `canRedoEither`. Commands call them | arbitration reusable (H9-ready) | medium — every Undo / Redo button | H1 |
| H4 | defect | landed | `sym:useHistory` | no code change: already a thin wrapper over `GraphHistory`. TSDoc points at `undoNewest` and notes the combined form is H9 (D2) | behaviour unchanged | low | H3 |
| X1 | defect | landed | `useViewSection`, `useHistorySection`, `useLayoutsSection`, `useEditorSection`, `useStyleEditorSection` (item 6, D3) | TSDoc `@deprecated`, pointing at control specs + `useControlItems` for toolbars, or the plain hooks for bespoke UI. Removal is left to the next breaking release, with G1 | callers get a deprecation hint | low — no removal. The shared ESLint config is warn-only | T1 |
| X2 | dressing | landed | comments in `file:packages/canvas-react/src/uiModel.ts#L1-L3`, `file:packages/canvas-ui/src/components/ToolbarItem.ts#L9`, `file:packages/canvas-ui/src/components/ToolbarItems.tsx#L158`, `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L1-L25` | stop recommending the section hooks. Fix the toolbar's header, which still names them and the private commands | docs match code | low | X1, L1 |
| L1 | defect | landed | `sym:GraphControlsToolbar` `useLayoutSpecs` (item 7) | → `useLayoutItems`: build the two §2 items straight from `useLayout`. Drop both `register` calls and the `invalidate()` effect | no private commands | **high** — ~36 stories render this toolbar (§5 N1). Picker entries, Run ⇄ Stop and icon overrides must be identical | — |
| C1 | defect | landed | `doc:packages/canvas-react/CLAUDE.md` (item 8) | a short "logic → hooks → commands (saved controls only)" section, pointing at `doc:docs/commands-followups.md` | the rule is written down | low | — |
| T1 | defect | landed | `sym:SchemaToolbar` Fit (item 9, D5) | `useViewSection` → `useControlItems([fitSpec(layerId)], { canvas })`. `icons.fit` still applies through `applyIconOverrides` (key `'fit'`) | Fit uses the one renderer | medium — Fit is now `disabled` until the schema canvas is initialised (`camera.fit`'s `whenInitialised`) | — |
| T2 | defect | landed | `sym:SchemaToolbar` groups 1–3 (item 9) | **stay callback-based**, recorded in the TSDoc: their state belongs to `SchemaViewPanel`, not the canvas. A spec needs a command, meaning a new public schema-view command (new scope) or a private one (what L1 removes) | recorded | none | — |
| G1 | defect | deferred | `sym:GraphToolbar`, `sym:GraphLayoutToolbar` (item 10) | **deferred**: remove them in the next breaking release (breaking `pkg:@invana/canvas-ui` export). Nothing changes now | recorded | none | — |
| F1 | dressing | landed | `doc:docs/commands-followups.md` | items 2–10 and 20 → ✅ (item 10 as "recorded, removal deferred") | bookkeeping | low | all |

## 5. Blast radius

Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:useLayout`'s result (`layout`, `layoutOptions`, `applyLayout`, `stopLayout`, `isRunning`) | L1 reads it directly | low — same package, unchanged |
| U2 | `DEFAULT_CONTROL_ICONS.play` / `.stop` | L1 looks these up by name, as `useControlItems` did | low |
| U3 | `sym:GraphClipboard`, `sym:GraphHistory`, `sym:CanvasHistory` (`canvas.history.peekUndo` / `peekRedo`) | H1 / H3 call them unchanged | low |

Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | `sym:GraphControlsToolbar` / `sym:GraphControlsToolbarLite` in ~36 stories, e.g. `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:canvas-ui/editors/CanvasSettingsEditorPanel`, `story:usecases/tools/GraphVisualiser`, `story:canvas-ui/view-panels/SchemaViewPanel/CanvasDerived`, the `usecases/by-casestudies/*` stories. Also referenced from `file:packages/canvas-ui/src/control-panels/presets.ts` | runtime UI | L1 — must look and act identical | V4 before / after |
| N2 | `sym:SchemaViewPanel` → `story:canvas-ui/view-panels/SchemaViewPanel/CanvasDerived`, `…/CustomSchema` | runtime UI | T1 — Fit button | V4 |
| N3 | Every Cut / Copy / Paste / Delete / Undo / Redo / Erase control: `story:usecases/tools/GraphModeller`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller`, the full `GraphControlsToolbar`, saved panels using `history.*` / `clipboard.*` / `graph.erase` / `graph.clear` | runtime + saved state | H2 / H3 — same behaviour. Command names and args unchanged, so saved panels need no migration | V2, V4, V5 |
| N4 | `sym:useSelectMode` (`GraphLayoutToolbar`, external apps), `sym:useClipboard` (`useEditorSection`, `GraphToolbar`), `sym:useHistory` (`useHistorySection`), `sym:useClearGraph` (`ClearCanvasToolbar`, `story:usecases/tools/GraphModeller`) | published API | signatures unchanged | none |
| N5 | Section hooks for external consumers | published API | deprecation hint only | none |
| N6 | `pkg:@invana/graph` public surface | published API | **additions**: `resolveSelectMode`, `selectModePatch`, `clearGraphLayer`, `selectedElementIds`, `pasteAndSelect`, `copySelection`, `cutSelection`, `deleteSelection`, `undoNewest`, `redoNewest`, `canUndoEither`, `canRedoEither` | none. `graph` has no surface snapshot |
| N7 | `api/canvas-core.surface.txt`, `api/canvas-store.surface.txt`, `api/canvas.surface.txt` | surface snapshots | untouched: none of those barrels changes | V1 must pass **without** `--write` |
| N8 | `apps/docs/api/**` TypeDoc output (`useSelectMode.md`, `useViewSection.md`, …) | generated docs | picks up `@deprecated` on the next docs build | none by hand |
| N9 | `canvas-designer`'s own `useHistory` | unrelated | name overlap only | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V0 | pass | **Baseline, taken before any edit**: Playwright over the current `dist/` | the four stories below + `SchemaViewPanel/CanvasDerived` | button labels, `disabled`, `aria-pressed`, layout-picker entries, console errors recorded | — |
| V1 | pass | `pnpm build`, `pnpm check-types`, `pnpm lint` (boundaries + API surface, **no** `--write`), `pnpm test` | repo | all green, snapshots unchanged | all |
| V2 | pass | new `packages/graph/tests/canvas/graphActions.test.ts` (headless `GraphCanvas` + `HeadlessRenderer`): `resolveSelectMode` cases (enabled mode, behaviour-less fallback, first key, empty), `selectModePatch`, copy / cut / delete / paste through the functions with and without history, `undoNewest` / `redoNewest` ordering across both stacks | `pkg:@invana/graph` | pass | S1, H1, H3 |
| V3 | pass | **Control**: existing `graphCommands.test.ts` and `definitionHistory.test.ts` pass unedited | `pkg:@invana/graph` | pass | S2, H3 |
| V4 | pass | Playwright after the rebuild, diffed against V0 | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:canvas-ui/editors/CanvasSettingsEditorPanel`, `story:usecases/tools/GraphModeller`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller`, `story:canvas-ui/view-panels/SchemaViewPanel/CanvasDerived` | identical labels / disabled / pressed / picker entries; no new console errors | L1, T1, H2, H3, S3 |
| V5 | pass | Playwright, driven: pick a layout → it runs, Run ⇄ Stop swaps and Stop cancels; switch select mode (the pressed state follows); select a node → copy → paste → undo; Fit on the schema view | FullFeatured, GraphModeller, CanvasDerived | same as V0's run | L1, S2, S3, H2, H3, T1 |
| V6 | pass | `grep -r "toolbar.layout#\|providers/graphActions" packages/*/src` | repo | 0 hits | L1, H1 |
| V7 | pass | read-through | B1, B2, C1, X1, X2, T2, G1, F1 | text matches this RFC | B1, B2, C1, X1, X2, T2, G1, F1 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Which "is this behaviour enabled" source does select mode read? | **a** share the rule, each caller keeps its source (hook: `definition`, reactive; command: live behaviour) · **b** both read `definition` · **c** both read live behaviours | **a**: no behaviour change. The two sources agree whenever writes go through `canvas.update`. Picking one is a separate question | accepted |
| D2 | Should `useHistory().undo` become the combined two-stack undo now? | **a** no, H3 only makes it possible · **b** yes | **a**: that is H9 (followups item 16), explicitly out of scope, and it changes what the hook's Undo does | accepted |
| D3 | Section hooks: deprecate or keep? | **a** deprecate (TSDoc only) · **b** keep as a supported second path | **a**: after T1 no non-deprecated caller is left. They are the second drawing path the draw-controls-twice RFC removed from toolbars, and they bake `lucide-react` icons into the headless package | accepted |
| D4 | Where do the shared functions live? | **a** `pkg:@invana/graph` (next to `eraseCommand`) · **b** stay in `canvas-react/providers/graphActions.ts` | **a**: the rule says "plain engine functions". `graph` already has a third copy of the selection read (M3). Commands can then run without React | accepted |
| D5 | `SchemaToolbar`: how much converts? | **a** Fit only, the pickers stay callbacks (T2) · **b** nothing · **c** everything, via new schema-view commands | **a**: Fit is a pure rendering change. **c** is new public API, and a private-command version is the workaround L1 removes | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened for items 3–10 of `doc:docs/commands-followups.md`. Items 1, 2 and 20 are bookkeeping outside this RFC | proposed | Finding: the hook / command difference in undo (M5) is H9, not drift, so H4 keeps it. O1 / O2 recorded, not in scope |
| 2026-09-28 | Approved whole ("yes"); D1–D5 as recommended. V0 baseline taken over the pre-change `dist/` (5 stories, 0 console errors) | accepted | |
| 2026-09-28 | Implemented on `feat/view-history` (two parallel subagents + lead). All rows `implemented` except G1 `deferred` (removal waits for the next breaking release) | accepted | V1: build, check-types, lint (0 warnings in changed files; boundaries + API surfaces unchanged, no `--write`), test (graph 230 incl. 14 new in `graphActions.test.ts`). V3: `graphCommands` / `definitionHistory` unedited and green. V4: 5 stories, controls / disabled / pressed / picker menus identical to V0, 0 console errors. V5: layout switch runs, Run ⇄ Stop, lasso toggles, copy → paste → undo → redo = 77 → 78 → 77 → 78 nodes, schema Fit present + enabled. V6: 0 hits. Learned: `useClipboard` now reads the selection at call time (never stale); `canvas-ui/CLAUDE.md` also prescribed the private-command workaround and was updated with C1; T1's `whenInitialised` gate never showed (the toolbar mounts after init). Rows reach `landed` when `feat/view-history` merges to `main` |
| 2026-09-28 | `feat/view-history` merged to `main` | landed | Every implemented row → landed (all verification rows `pass`; build, check-types, lint, test green at merge). Deferred rows stay deferred, tracked in `doc:docs/commands-followups.md` |
