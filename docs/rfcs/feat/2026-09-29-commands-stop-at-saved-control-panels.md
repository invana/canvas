---
id: feat-2026-09-29-commands-stop-at-saved-control-panels
type: feat
title: Commands reach keys, menus and a palette, are typed, and own their state — the remaining command work
status: accepted
opened: 2026-09-29
decided: 2026-09-29
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: doc:docs/commands-followups.md
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panel-command-args-are-raw-json }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-app-header-controls-do-not-save-with-the-canvas }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic }
---

# Commands reach keys, menus and a palette, are typed, and own their state — the remaining command work

| | |
|---|---|
| **Motivation** | Every open row of `doc:docs/commands-followups.md` after `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently`: two defects it found (O3, O4), its one unverified check (V5), items 11, 17–19, 22–26 and G1. Commands today only drive saved control panels: they're untyped strings, the undo / clipboard commands exist only under React providers, nothing binds keys or menus to them, and the Studio editor still has two raw-JSON fields |
| **Design** | Seven phases, each independently approvable, ordered so a partial landing makes sense: **A** defects → **B** editor + footer → **C** the engine owns history / clipboard → **D** typed commands → **E** shortcuts, menus, palette → **F** stories (rule 11 — only when asked) → **G** breaking removals (next breaking release) |
| **Constraint** | Command names and args are public API — none renamed. Saved `ControlPanelSpec` JSON keeps loading unchanged. Additive until phase G. Behaviours stay opt-in (rule 7); each new behaviour ships an editor (rule 12) |
| **Row status** | proposed 0 · accepted 1 · implemented 36 · landed 0 · deferred 4 · rejected 0 · superseded 0 |
| **Open decisions** | none. D1–D15 accepted — D11 as an opt-in (see §8) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | **O3.** Base `Behaviour.setOptions` calls `this.enable()` / `disable()` directly; `Canvas._applyToInstances` then calls `behaviours.setEnabled`, which returns early (`b.enabled === enabled`). So `canvas.update({ behaviours: { id: { enabled } } })` fires no `scene:behaviour:enable` / `disable` and skips the gesture-conflict warning, for every behaviour on the base `setOptions` — DragPan, DragShape, KeyboardCameraInput, PinchZoom, WheelZoom, ElementScaleLOD (canvas); ClickInspect, ClickView, CollapseExpand, ColorBy, CreateNode, DragNode, DrawEdge, EdgeScaleLOD, Entrance, Erase, LabelCollision, NodeResize, NodeScaleLOD, TextResolutionLOD (graph). `Canvas._activate` hits the same path | `file:packages/canvas-core/src/abstracts/Behaviour.ts#L260-L268`, `file:packages/canvas/src/engine/Canvas.ts#L1167-L1185`, `file:packages/canvas-core/src/abstracts/registries/BehaviourRegistry.ts#L93` | read; `useLock` already works around it by re-reading on store writes (`file:packages/canvas-react/src/hooks/useLock.ts#L47-L48`) |
| M2 | **O4.** `useHoverElementPreview` and `useViewTarget` attach to a behaviour once (dropping their `register` listener after the first attach) and never handle `scene:behaviour:unregister`. A behaviour re-registered under the same id (wrapper remount, key change, StrictMode) is never re-attached — the preview / view panel stays dead. `ElementInspectorViewPanel` re-attaches but keeps `behaviourPresent: true` after removal. All three keep listeners on the destroyed instance's emitter | `file:packages/canvas-react/src/hooks/useHoverElementPreview.ts#L34-L58`, `file:packages/canvas-react/src/hooks/useViewTarget.ts#L31-L54`, `file:packages/canvas-ui/src/view-panels/element-inspector/ElementInspectorViewPanel.tsx#L87-L116`, `#L321` | read |
| M3 | **V5 gap.** The control-panel editor's behaviour picker dropping an unregistered behaviour was verified by event + registry only, not in the UI | `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently` V5 | its §8 |
| M4 | **17 / A8.** Two editor fields are still raw JSON: a choice item's `options` (a list of `{ value, label, icon? }`) and a widget item's `options` (a keyed bag). Widgets declare no option schema — `pan-pad` reads `options.step` by hand, `export-image` casts options to props. The command-arg descriptor machinery (`argFields`, `argsToForm`) already maps `CommandArgSpec` kinds to fields | `file:packages/canvas-core/src/state/view/controlPanels.ts#L103-L138`; `file:packages/canvas-ui/src/editor-panels/control-panels/fields.ts#L124-L171`, `#L246`, `#L259`; `…/mapping.ts#L73`, `#L121-L124`, `#L213`, `#L280-L292`; `file:packages/canvas-ui/src/control-panels/widgets.tsx#L13-L24`, `#L48`, `#L86-L107` | `rfc:feat-2026-09-28-control-panel-command-args-are-raw-json` A8 (deferred "until A1–A7 prove the kinds") |
| M5 | **18 / P7.** `ControlPanelPlacement` is `'canvas' \| 'header-left' \| 'header-center' \| 'header-right'`. `GraphCanvasAppFooter` has left / center / right slots but no saved-panel append, and the footer only shows when a `footer` bag or `showFooter` is given | `file:packages/canvas-core/src/state/view/controlPanels.ts#L181-L196`; `file:packages/canvas-ui/src/control-panels/HeaderControlPanels.tsx#L11-L63`; `file:packages/canvas-ui/src/apps/GraphCanvasAppHeader.tsx#L72-L95`; `file:packages/canvas-ui/src/apps/GraphCanvasAppFooter.tsx#L34-L66`; `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L607-L611` | P7 / D3 of `rfc:feat-2026-09-28-app-header-controls-do-not-save-with-the-canvas` ("no caller asks for it yet") |
| M6 | **19 / D1-B.** `GraphHistory` / `GraphClipboard` (and drag-to-history capture, and the `history.*` / `clipboard.*` / undoable `graph.clear` / `graph.erase` commands) exist only while `GraphHistoryProvider` / `GraphClipboardProvider` are mounted. Library code mounts them only inside `GraphControlsToolbar`; `GraphCanvasApp` doesn't. So a saved panel's Cut / Paste is unavailable on most canvases, and the clipboard is undoable only when nested under the history provider (context lookup) | `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L66-L159`, `file:packages/canvas-react/src/providers/GraphClipboardProvider.tsx#L63-L122`, `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L266-L270` | D1 option B of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` ("its own RFC — the kernel-owns-state direction") |
| M7 | **11.** Every registry method takes `name: string`, `args: unknown`; each package reads args through its own untyped `arg<T>()`. 30 command names across engine / graph / providers; 41 string literals in `presets.ts`, 8 in `controlSpecs.ts`, more in toolbars and 3 stories. Direct callers are few (`useGrid`, the `pan-pad` / reset widgets, `graph.erase` → `graph.clear`) | `file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L196-L273`; `file:packages/canvas/src/engine/builtinCommands.ts#L44`; `file:packages/graph/src/canvas/graphCommands.ts#L62`; `file:packages/canvas-core/src/state/view/controlPanels.ts#L65`, `#L89`, `#L120` | grep. No `declare module` augmentation exists anywhere in `packages/*/src`; `@invana/graph` peers on `@invana/canvas`, not `canvas-core` (`file:packages/graph/package.json#L27`) |
| M8 | **25.** No key binding reaches a command. `KeyboardCameraInputBehaviour` handles its own keymap on `document` and calls the camera directly; Escape is handled ad hoc (`GraphToolProvider`, `useContextMenu`); the only Cmd/Ctrl+Z handler is local to the card designer. No Delete / copy / paste keys anywhere. `IBehaviour.shortcuts` are advisory gesture-conflict labels, not bindings | `file:packages/canvas/src/behaviours/KeyboardCameraInputBehaviour.ts#L55-L120`; `file:packages/canvas-react/src/providers/GraphToolProvider.tsx#L102-L108`; `file:packages/canvas-designer/src/templates/NodeCardDesigner.tsx#L160-L175` | grep `keydown` |
| M9 | **26.** Context menus (`canvas-ui/src/menus/`) build `@invana/ui` `MenuItem[]` with closure `onClick`s. No command-backed item, no palette. `commands.list()` returns names only; `label` is optional; no category / keywords; pick-one and id-taking commands can't run bare; clipboard commands act on the click-selection, not the right-clicked element | `file:packages/canvas-ui/src/menus/GraphNodeContextMenu.tsx#L47`, `file:packages/canvas-ui/src/menus/GraphBackgroundContextMenu.tsx#L20-L41`; `file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L230` | read |
| M10 | **22 / E9.** No story renders `ControlPanelsEditor` on its own; it is reachable only as a section of `CanvasSettingsEditorPanel` | `file:packages/canvas-ui/src/editor-panels/canvas-settings/CanvasSettingsEditorPanel.tsx#L275-L278` | E9 / D5 of `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` |
| M11 | **23 / S1.** Two modeller stories still gate behaviours with `enabled={tool === …}` (11 usages) instead of the behaviours' `modes` | `apps/storybook/stories/canvas-react/ControlPanel/GraphCanvas/Modeller.stories.tsx#L85-L102`, `apps/storybook/stories/usecases/tools/GraphModeller.stories.tsx#L374-L399` | S1 of `rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas` |
| M12 | **24 / P8.** 45 of 61 `GraphCanvasApp` stories pass header content as closures (mostly `center: <GraphControlsToolbar/>`, `right: (ctx) => …`) rather than saved `placement: 'header-*'` panels | e.g. `apps/storybook/stories/canvas-ui/apps/GraphCanvasApp/FullFeatured.stories.tsx#L87-L91`; ~22 `usecases/by-casestudies/*` | P8 of the app-header RFC. `canvas-ui/apps/GraphCanvasApp/*` teaches the slot API on purpose (`apps/storybook/CLAUDE.md#L159`) |
| M13 | **G1.** `GraphToolbar`, `GraphLayoutToolbar` and five section hooks are `@deprecated` with **no** importer in packages, stories or docs source | `file:packages/canvas-ui/src/toolbars/index.ts#L11-L30`, `file:packages/canvas-ui/src/index.ts#L1032-L1068`, `file:packages/canvas-react/src/hooks/index.ts#L72-L85`, `file:packages/canvas-react/src/index.ts#L218-L277` | grep; canvas-ui / canvas-react have no surface snapshot |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Type command names by module augmentation of one `CanvasCommandMap` in core | **rejected as the mechanism** (D6) | graph / canvas-react don't depend on canvas-core directly; augmenting through `@invana/canvas`'s re-export doesn't merge; strict pnpm needn't resolve canvas-core from graph |
| R2 | Narrow `ControlItemSpec.command` to the known names | rejected | saved JSON and the Studio editor accept app-registered names; keep `KnownName \| (string & {})` |
| R3 | Rebuild `KeyboardCameraInputBehaviour` on commands in the same change | out of scope (D10) | works today; different conflict model (continuous pan on held keys) |

## 2. Design

**Phases and sequencing**

| Phase | Items | Depends on | Size | Breaking |
|---|---|---|---|---|
| A | O3, O4, V5 | — | S | no |
| B | 17 (A8), 18 (P7) | — | M | no (additive widget descriptor) |
| C | 19 (D1-B) | A | L | no if providers stay as bridges (D5); behaviour change: drag capture + clipboard always on for `GraphCanvas` (D4) |
| D | 11 | — (C makes the map honest: `history.*` / `clipboard.*` always registered) | M | no (types only; loosened generics) |
| E | 25, 26 | C (keys / menus need undo + clipboard without a provider); D optional | L | no |
| F | 22, 23, 24 | B (E9 exercises A8), C (P8 panels need clipboard/history commands) | M | no — **stories: only when explicitly asked (rule 11)** |
| G | G1 | — | S | **yes** — next breaking release |

**Phase C — the ownership model (D3–D5)**

| Concern | Today | After |
|---|---|---|
| Who builds `GraphHistory` / `GraphClipboard` | providers, per mount | `GraphCanvas`, per `GraphLayer` on `scene:layer:add` (the `offEdgeStyle` pattern already in `file:packages/graph/src/canvas/GraphCanvas.ts#L44-L62`); disposed on remove / destroy |
| Access | `HistoryContext` / `ClipboardContext` | `graphCanvas.graphHistory(layerId = 'graph')`, `graphCanvas.clipboard(layerId = 'graph')`; contexts kept, filled from these (D5) |
| Commands | registered while a provider is mounted | permanent graph built-ins; `history.*` default to the `'graph'` layer's history + `canvas.history` (D3); `clipboard.*` / `graph.clear` / `graph.erase` resolve `args.layerId` |
| Drag → history | provider effect | `GraphCanvas` (D4) |
| Options | provider props `limit`, `pasteOffset` | `GraphCanvasOptions.history?: { limit? }`, `.clipboard?: { pasteOffset? }`; provider props still honoured (reconfigure) |

**Phase D — typed commands (D6, D7)**: `CommandRegistry<C, M extends CommandMapBase = CommandMapBase>` where `M` maps name → args type. Overloads: `run<K extends keyof M>(name: K, args?: M[K])` plus the existing `(name: string, args?: unknown)` fallback. Each package exports its map as a type (`EngineCommandMap` in canvas, `GraphCommandMap` in graph, `ProviderCommandMap` in canvas-react); `GraphCanvas.commands` is typed `CommandRegistry<Canvas, EngineCommandMap & GraphCommandMap>`. Spec `command` fields become `KnownCommandName | (string & {})` for completion without rejecting app names. No augmentation, no runtime change.

**Phase E — shortcuts, menus, palette (D8–D12)**

| Surface | Shape |
|---|---|
| `KeyboardShortcutsBehaviour` (`pkg:@invana/canvas`, `kind: 'keyboard-shortcuts'`) | opt-in (rule 7); options `bindings: Array<{ keys: string; command: string; args?: unknown }>` — JSON, so they save in `definition.behaviours`; keys normalised (`mod` = Cmd on macOS, Ctrl elsewhere); listens on the canvas element's focus scope (D9), ignores inputs; runs `commands.run`, respects `isEnabled`. `DEFAULT_SHORTCUTS` exported (undo / redo / delete / copy / cut / paste / Escape → `tool.active select`), never auto-applied. Editor in `canvas-ui/editors/behaviours/keyboard-shortcuts/` (rule 12) |
| Command metadata | `CanvasCommand` gains optional `category?`, `keywords?` (core, data only) |
| Menu items | canvas-ui helper `useCommandMenuItems(refs)` → `MenuItem[]` via `useCommandStates` (label / disabled / checked live); existing menus keep their closures and may mix both |
| Palette | `CommandPalette` in `pkg:@invana/canvas-ui` over `list()` + `get()`: lists commands runnable bare (no required pick / id arg), grouped by `category`; pick-one commands expand to their `options` |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/commands-followups.md` | design of record | open | the rule (logic → hooks → commands for saved controls) and the item list this RFC closes |
| `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently` | depends-on | accepted | owner-side invalidation bridges (phase C's instances bridge the same way); found O3 / O4; V5 gap |
| `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` | relates-to | landed | D1-A (providers register commands) is what phase C replaces with D1-B |
| `rfc:feat-2026-09-28-control-panel-command-args-are-raw-json` | relates-to | landed | `CommandArgSpec` kinds and `argFields` are what phase B reuses (A8) |
| `rfc:feat-2026-09-28-app-header-controls-do-not-save-with-the-canvas` | relates-to | landed | header placement design extends to footer as-is (P7 / D3); P8 |
| `rfc:feat-2026-09-28-control-panels-cannot-be-edited-in-the-studio` | relates-to | accepted | E9 |
| `rfc:feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas` | relates-to | accepted | S1 |
| `rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` | relates-to | landed | G1 deferral; the shared graph functions phase C moves callers onto |
| `doc:docs/canvas-state-plan.md` | relates-to | plan | "kernel owns state" — phase C is a step in that direction for undo / clipboard |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| A1 | defect | implemented | `sym:Behaviour.setOptions` (O3, D1) | when mounted (`this.ctx`), route `enabled` through `this.ctx.behaviours.setEnabled(this.id, …)`; unmounted → direct as today | events + conflict warning fire on every path | medium — every base-`setOptions` behaviour; re-entry checked (registry calls `enable()`, not `setOptions`) | — |
| A2 | dressing | implemented | `sym:useLock` | drop the store-write re-read added as the O3 workaround (keep behaviour events) | one signal | low | A1 |
| A3 | defect | implemented | new `sym:useBehaviourInstance` (`pkg:@invana/canvas-react`, O4, D2) | `useBehaviourInstance<T>(id, canvas?)` → the live instance or `null`; listens to `scene:behaviour:register` **and** `unregister` for its id | one correct attach / detach | low — additive export | — |
| A4 | defect | implemented | `sym:useHoverElementPreview`, `sym:useViewTarget`, `sym:ElementInspectorViewPanel` | rebuild on A3: subscribe per instance, reset state + `present: false` on removal, re-attach on re-register. Also `sym:useInspectTarget` — same defect, worse (no late registration at all), found while implementing | no dead panels after remount | medium — three live UIs | A3 |
| A5 | defect | implemented | `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently` V5 | drive the picker in Playwright (a panel with a `behaviour.toggle` item → unregister → entry gone), record the result there | closes that RFC's gap | none | — |
| A6 | defect | implemented | `sym:CanvasSettingsEditorPanel` | re-read layers / behaviours / layouts on their add / remove / (un)register events, not once on mount | an instance registered after mount gets its row (found verifying K2) | low | — |
| B1 | defect | implemented | `sym:ControlWidget` (A8, D13) | additive: a widget component may carry a static `optionsSpec?: Record<string, CommandArgSpec>`; `pan-pad` / `export-image` declare theirs | widgets self-describe | low — additive; custom widgets without it keep the JSON field | — |
| B2 | defect | implemented | `ControlPanelsEditor` → `ControlPanelsEditorPanel` | pass widget descriptors (not only names); generalise `argFields` / `argsToForm` from `args.*` to a prefix so `options.*` reuses them; JSON fallback for undescribed keys | widget options become fields | medium — editor round-trip | B1 |
| B3 | defect | implemented | choice item `options` field | a repeatable-rows field (`value`, `label`, `icon` picker) replacing the textarea | last JSON field goes | medium — needs a rows field in `@invana/forms` or a local one | — |
| P1 | defect | implemented | `sym:ControlPanelPlacement` (P7) | add `'footer-left' \| 'footer-center' \| 'footer-right'` | footer placements are valid JSON | low — additive union member; old readers ignore unknown placement (`ControlPanels` skips non-`canvas`) | — |
| P2 | defect | implemented | `sym:HeaderControlPanels` | generalise to `RegionControlPanels({ rail: 'header' \| 'footer', region })`; keep `HeaderControlPanels` as a thin alias | one renderer for both rails | low — additive export | P1 |
| P3 | defect | implemented | `sym:GraphCanvasAppFooter` / `sym:GraphCanvasApp` (D14) | append saved `footer-*` panels per region; show the footer when any saved footer panel exists | saved footer panels appear | medium — footer (25 px) appears on canvases that save one | P1, P2 |
| P4 | defect | implemented | `PLACEMENTS` in `…/control-panels/fields.ts#L10` | three footer options | editable in the Studio | low | P1 |
| C1 | defect | implemented | `sym:GraphCanvas` (19, D3, D4) | per `GraphLayer`: build `GraphHistory` + `GraphClipboard`, drag capture, bridge their `change` to `commands.invalidate()` (the edge-style bridge folds into the same per-layer state); `graphHistory(id)`, `clipboard(id)` accessors; `GraphCanvasOptions.history` (`false` opts out) / `.clipboard` | undo / clipboard exist on every `GraphCanvas` | **high** — always-on drag capture and memory per layer; behaviour change on canvases without providers | A1 |
| C2 | defect | implemented | `graphCommands.ts` | `history.undo/redo`, `clipboard.*`, undoable `graph.clear` / `graph.erase` become permanent graph built-ins over C1 (the shared `graphActions` functions), reached through `sym:GraphEditAccess`. `history.*` accept `args.layerId` but stay undescribed — an existing test pins them arg-less (V-C3) | saved Cut / Paste / Undo work everywhere | medium — overrides stack (a provider's registration still wins while mounted) | C1 |
| C3 | defect | implemented | `sym:GraphHistoryProvider`, `sym:GraphClipboardProvider` (D5) | on a `GraphCanvas`: stop constructing; put the canvas's instances in the contexts and apply `limit` / `pasteOffset` while mounted (`GraphHistory.setLimit`, `GraphClipboard.setPasteOffset`, restored on unmount); register nothing — except the clipboard provider under a history provider whose history isn't the canvas's (`history: false`). On a plain `Canvas`, or `history: false`: today's behaviour, drag capture via the exported `sym:captureNodeDrags` | contexts / hooks unchanged | medium — `usecases/tools/GraphModeller` lifts the history out of the context | C1, C2 |
| C4 | dressing | implemented | `ControlItems` hint map, `presets.ts` docs, `builtinCommands.ts` header | drop "mount `<GraphClipboardProvider>`" hints for `GraphCanvas` | docs match | low | C2 |
| C5 | defect | implemented | new `sym:useGraphHistory`, `sym:useGraphClipboard`, `sym:useCanvasGraphHistory`, `sym:useCanvasGraphClipboard` (`pkg:@invana/canvas-react`) | provider context, else the `GraphCanvas`'s own for `layerId`; `useHistory`, `useClipboard` (+ `layerId` option), `useClearGraph`, `useEntityEditor`, `useDrawHistory` (+ optional `layerId`, `canvas`) read through them | hooks work on a `GraphCanvas` with no provider (N6) | low — additive; unchanged under a provider | C1 |
| T1 | defect | implemented | `sym:CommandRegistry` (11, D6) | second type parameter `M` (name → args); one generic signature per method (`name: K extends CommandName<M>`, `args?: CommandArgsOf<M, K>`), not overloads — an overload's string fallback swallows wrong args. `CommandArgsOf` is an indexed access (`(M & Record<string, unknown>)[K]`), keeping the registry covariant in `M` so `GraphCanvas` can redeclare `commands` with a wider map and a typed registry still passes as `CommandRegistry<C>` | typed calls, zero runtime change | medium — public generic; snapshot unchanged unless a new type is exported | — |
| T2 | defect | implemented | `EngineCommandMap` (canvas), `GraphCommandMap` (graph), `ProviderCommandMap` (canvas-react) | `EngineCommandMap` (canvas), `GraphCommandMap` + `GraphCanvasCommandMap` (graph); `Canvas.commands` / `GraphCanvas.commands` typed with them; the built-in tables are mapped types over the maps (a key without a command fails to compile). No `ProviderCommandMap`: after C2 the providers register no new names. `arg<T>()` helpers unchanged. Engine `history.*` args widened to `{ layerId? }` so the graph map extends it | autocompletion + checked args | medium — **`api/canvas.surface.txt` +1** (and canvas-core if `CommandMapBase` is exported) | T1 |
| T3 | defect | implemented | `ControlCommandItemSpec.command` etc. (D7) | `defineControlItems([…])` (canvas-ui) types `command` as `ControlCommandName` = `CommandName<GraphCanvasCommandMap>` for completion; the presets use it; the persisted type stays `string`. `controlSpecs.ts` builders left as they are | completion for authors, saved JSON unaffected | low | T2 |
| K1 | defect | implemented | new `sym:KeyboardShortcutsBehaviour` (`pkg:@invana/canvas`, 25, D8, D9) | §2 E. `GraphCanvasApp` marks its shell `data-canvas-scope` (D9); scope also follows the last pointer-down when focus is on the page body; `handleKey` is callable without the DOM | keys run commands | medium — focus scope, conflicts with `KeyboardCameraInputBehaviour` keys (warned via `shortcuts`) | C2 (for undo / clipboard) |
| K2 | defect | implemented | `DEFAULT_SHORTCUTS` + editor (`canvas-ui/src/editors/behaviours/keyboard-shortcuts/`, rule 12) | export the default map; schema editor (`fields.ts` + `mapping.ts` + panel) | configurable in the Studio | low | K1 |
| K3 | defect | implemented | canvas-react `<KeyboardShortcutsBehaviour>` wrapper | null-rendering wrapper like the other behaviours | JSX usage | low | K1 |
| K4 | defect | implemented | `sym:CanvasContext` (`pkg:@invana/canvas-core`) | optional `readonly commands?: CommandRegistry<unknown>`; `Canvas` fills it | a behaviour can run commands by name (K1) | low — additive, optional (test doubles unaffected) | — |
| U1 | defect | implemented | `sym:CanvasCommand` (26, D11) | optional `category?`, `keywords?`; built-ins / graph commands fill them | palette grouping + search. Filled from per-name tables keyed by the maps (`BUILTIN_META`, `GRAPH_META`) at registration | low — data only | — |
| U2 | defect | implemented | new `sym:useCommandMenuItems` (`pkg:@invana/canvas-ui`) | `CommandMenuRef[]` → `@invana/ui` `MenuItem[]`: `useCommandMenuItems` (live) + pure `commandMenuItems(canvas, refs)` for open-time builders. `MenuItem` has no disabled / checked, so disabled = dimmed class + no `onClick`, active = a check icon, pick-one = a submenu | menus can list commands | low | — |
| U3 | defect | implemented | new `sym:CommandPalette` (`pkg:@invana/canvas-ui`, D12) | searchable list over `list()` + `get()`; bare-runnable commands; pick-one expands to options | discoverability | medium — new UI surface | U1 |
| U4 | defect | implemented | graph context menus (D11) | "act on the right-clicked element": `selectTarget` (a click-select id) on the node / edge menus selects the target as the menu opens, unless already selected — **opt-in**, not default (D11 note, §8) | menus reuse `clipboard.*` without new args | medium — changes the selection on right-click | U2 |
| U5 | defect | implemented | `sym:CommandArgSpec` (`pkg:@invana/canvas-core`), `file:packages/canvas/src/engine/builtinCommands.ts#L171`, `#L273`, `sym:CommandPalette` | add `required?: boolean`; set it on `behaviour.toggle` / `layer.visible` `id`; `runsBare` = no `pick` and no `required` arg (was: any id-kind arg without a default) | `camera.fit`, `layout.run`, `layout.toggle` reach the palette (V-U1 fail 1) | low — additive field; the `api/*.surface.txt` export lists are unchanged | U3 |
| U6 | defect | implemented | new `sym:MenuItemList` (`pkg:@invana/canvas-ui`), `sym:ContextMenuOverlay` | render `MenuItem[]` through `@invana/ui` `MenuItem` with the item's `className` merged (`NestedMenu` overwrites it with `px-3 py-1.5`); `ContextMenuOverlay` uses it | disabled command items render dimmed + inert in every context menu (V-U1 fail 2) | low — same markup as `NestedMenu`; upstream fix belongs in `@invana/ui` | U2 |
| U7 | defect | implemented | `sym:CommandPalette` | own the filter: `Command` with `shouldFilter={false}`, controlled search, rank rows (exact → prefix → word-prefix → substring → name / keyword → fuzzy), groups ordered by their best row, selection = top enabled row. cmdk 1.1.1 never reorders groups (it looks them up by internal id against a heading `data-value`), and `@invana/ui` `CommandDialog` forwards no props to `Command` | Enter runs the best match (V-U1 fail 3) | medium — palette renders its own `Dialog` + `Command` | U3 |
| U8 | dressing | implemented | `keyHint` in `sym:CommandPalette` | Mac glyphs ⌃⌥⇧⌘, `Esc`, `Del` / `⌫`; others `Ctrl+Shift+Z` | readable hints; `DeleteDelete` → `Delete  Del` | none | U3 |
| U9 | defect | implemented | `sym:CommandPalette` | `variant?: 'dialog' \| 'inline'` (default `'dialog'`); `inline` renders the list in place (a docked region) and ignores `open`, which becomes optional | the palette docks in `GraphCanvasApp`'s `right` region (asked) | low — additive prop | U7 |
| U10 | defect | implemented | `sym:KeyboardShortcutsBehaviourOptions` | `bindings?: readonly KeyboardShortcutBinding[]` | `bindings={DEFAULT_SHORTCUTS}` compiles without a copy | low — widening | K1 |
| S4 | defect | implemented | `story:canvas-ui/apps/GraphCanvasApp/CommandPalette` (asked) | palette as `variant="inline"` in the `right` region instead of a modal; Edit menu through `MenuItemList` | V-U1 target | low | U5–U9 |
| S1 | defect | deferred | `story:canvas-ui/editors/ControlPanelsEditor` (22 / E9) | connected editor + canvas in `GraphCanvasApp`'s right region, incl. a custom widget with `optionsSpec` | visual target for B | low | B1–B3; **explicit ask (rule 11)** |
| S2 | defect | deferred | the two modeller stories (23 / S1) | `enabled={tool === …}` → the behaviours' `modes` | stories show the store-owned tool | low | **explicit ask (rule 11)** |
| S3 | defect | deferred | `usecases/*` headers (24 / P8, D-Stories) | move the `usecases/by-casestudies/*` + `usecases/tools/*` headers to saved `header-*` panels; keep `canvas-ui/apps/GraphCanvasApp/*` on slots | stories demo saving | medium — ~25 files | C2; **explicit ask (rule 11)** |
| G1 | defect | deferred | `sym:GraphToolbar`, `sym:GraphLayoutToolbar`, the five section hooks + option types + `EditorItemKey` | delete 7 files and their barrel lines; regenerate typedoc | smaller surface | **breaking** for npm consumers | next breaking release |
| X1 | dressing | accepted | `doc:docs/commands-followups.md`, `doc:docs/README.md` | tick items per phase as they land | bookkeeping | low | per phase |

## 5. Blast radius

Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U-1 | `CanvasContext.behaviours` (`file:packages/canvas-core/src/abstracts/CanvasContext.ts#L33-L37`) | A1 routes through it | low |
| U-2 | `GraphHistory` / `GraphClipboard` constructors `(store, opts)` + `events` | C1 builds them | low |
| U-3 | `@invana/forms` field kinds | B3 needs a repeatable-rows field | medium — external design kit; else a local field |
| U-4 | `@invana/ui` `MenuItem`, command / dialog primitives | U2, U3 | low |

Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | every base-`setOptions` behaviour (M1 list) and listeners of `scene:behaviour:*` (telemetry log bridge, `useCommandStates` via the engine bridge, `useLock`) | runtime | A1: events now fire where they didn't | V-A1 |
| N2 | `useHoverElementPreview` (hover preview cards), `useViewTarget` (view panels), `ElementInspectorViewPanel` | runtime UI | A4 | V-A2 |
| N3 | `ControlPanelsEditor(Panel)`, `CanvasSettingsEditorPanel` (`story:canvas-ui/editors/CanvasSettingsEditorPanel`), custom widget hosts (`ControlPanels`, `HeaderControlPanels`, `ControlPanelsEditor` `widgets` props) | runtime + published API | B1–B3 additive | V-B1 |
| N4 | `GraphCanvasApp` footer, saved definitions with `footer-*` placement | runtime + saved state | P1–P3; older builds ignore footer panels | V-P1 |
| N5 | every `GraphCanvas`: memory + drag capture (C1); `GraphControlsToolbar`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller`, `story:canvas-ui/apps/GraphCanvasApp/ControlPanels`, `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:usecases/tools/GraphModeller` (lifts `HistoryContext`) | runtime | C1–C3 | V-C1..3 |
| N6 | `useHistory`, `useClearGraph`, `useDrawHistory`, `useEntityEditor`, `useClipboard` (read the contexts) | published API | unchanged signatures; now non-null on a `GraphCanvas` without providers | V-C2 |
| N7 | `api/canvas-core.surface.txt`, `api/canvas-store.surface.txt`, `api/canvas.surface.txt` | snapshots | T2 (+ map types), K1 (`KeyboardShortcutsBehaviour`, `DEFAULT_SHORTCUTS`), U1 none (fields) | regenerate with `--write` in the same change, intended additions only |
| N8 | `KeyboardCameraInputBehaviour` users | runtime | K1 key conflicts warned, not resolved | D10 |
| N9 | canvas-ui menus (`GraphContextMenu` family) | runtime UI | U4 selects on right-click | V-U2 |
| N10 | npm consumers of the G1 exports | published API | removal | release notes |
| N11 | `apps/docs/api/**` | generated | new / removed pages | regenerate |
| N12 | `ControlItemFields` (exported form-row type, `pkg:@invana/canvas-ui`) | published API | B2/B3: `choiceOptionsJson` → `choiceOptions` rows; `widgetOptions` added. canvas-ui has no surface snapshot | release note; only hosts that build rows by hand are affected |
| N14 | `CanvasContext` implementers | published API | K4 adds an optional field | none |
| N15 | `EngineCommandMap['history.*']` | types | widened to `{ layerId? }` (the engine ignores it) | none |
| N16 | `GraphCanvasApp` root element | DOM | `data-canvas-scope` attribute (K1 scope) | none |
| N13 | every `GraphCanvas` with a `GraphLayer` | runtime | C1: `history.undo` now also undoes drags on canvases that never mounted a provider (e.g. `story:canvas-ui/apps/GraphCanvasApp/Default`) | V-C1, V-C2 |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V0 | pass | Baseline per phase before code: Playwright over current `dist/` (labels, disabled, pressed, picker entries, console) | FullFeatured, CanvasSettingsEditorPanel, GraphModeller, ControlPanel/GraphCanvas/Modeller, SchemaViewPanel/CanvasDerived (+ phase-specific stories) | recorded | — |
| V1 | pass | `pnpm build`, `pnpm check-types`, `pnpm lint` (boundaries + surfaces), `pnpm test` per phase | repo | green; snapshot diffs = intended additions only | all |
| V-A1 | pass | `packages/graph/tests` (headless): `canvas.update({ behaviours: { drag-node: { enabled } } })` fires enable / disable for a base-`setOptions` behaviour | graph | pass | A1 |
| V-A2 | pass | Playwright: unregister + re-register the hover-preview / view behaviour; preview and inspector recover, `present` false in between | a story with the element inspector | as stated | A3, A4 |
| V-A3 | pass | the picker check (M3) | CanvasSettingsEditorPanel story | entry gone after unregister | A5 |
| V-B1 | pass | Playwright: editor shows fields for `pan-pad.step` and choice option rows; round-trip into `definition.controlPanels` unchanged for untouched panels | CanvasSettingsEditorPanel | as stated | B1–B3 |
| V-P1 | pass | save a `footer-right` panel → footer appears with it; headers unchanged | FullFeatured | as stated | P1–P4 |
| V-C1 | pass | graph tests: `GraphCanvas` without providers → `history.undo` / `clipboard.*` registered, drag produces one history entry, per-layer isolation, dispose on layer remove | graph | pass | C1, C2 |
| V-C2 | pass | Control: with providers mounted, hooks and commands behave as today (V0 diff) | GraphModeller, ControlPanel/Modeller | identical | C3 |
| V-C3 | pass | existing `graphCommands`, `graphActions`, `definitionHistory` tests unedited | graph | pass | C2 |
| V-T1 | pass | type tests (`tsc` on a fixture): typed `run('camera.fit', { padding: 'x' })` errors; unknown string names still compile | canvas-core / graph tests | as stated | T1–T3 |
| V-K1 | pass | tests: key → command, `isEnabled` respected, inputs ignored, `mod` normalisation; Playwright: Cmd/Ctrl+Z undoes a drag | `packages/graph/tests` (no tests in `pkg:@invana/canvas`) + a story if asked | as stated | K1–K3 |
| V-U1 | pass | Playwright: palette lists, filters, runs `camera.fit`; a menu built with `useCommandMenuItems` shows live disabled state | `story:canvas-ui/apps/GraphCanvasApp/CommandPalette` | as stated | U1–U4 |
| V-K2 | pass | Playwright: a registered `KeyboardShortcutsBehaviour` gets a row in the settings panel; its bindings show as lines; editing saves `definition.behaviours.keys.bindings` and reaches the live instance | CanvasSettingsEditorPanel | as stated | K2, A6 |
| V-U2 | pass | Playwright: `commandMenuItems` over the live canvas — disabled until a selection, Paste enables after Copy and pastes, pick-one → submenu, unregistered left out | GraphCanvasApp/Default | as stated | U2 |
| V-U3 | pass | Re-run V-U1 on the docked palette: `camera.fit` listed and runs; typing `copy` puts Copy first and Enter runs it; disabled Edit-menu items dimmed; hints readable. Control: right-click menus on FullFeatured / GraphModeller render the same items as before, now with disabled ones dimmed | `story:canvas-ui/apps/GraphCanvasApp/CommandPalette`, FullFeatured, `story:usecases/tools/GraphModeller` | as stated | U5–U10, S4 |
| V-S1 | skipped | stories (S1–S3) are written only on an explicit ask | — | — | S1–S3 |
| V-G1 | pending | grep for the removed names = 0 in packages / stories / docs source | repo | 0 hits | G1 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | O3 fix | **a** base `setOptions` routes `enabled` through `ctx.behaviours` when mounted · **b** base stops applying `enabled` / `modes` (engine owns them) · **c** `_applyToInstances` diffs `enabled` and emits | **a** — correct events on every path; **b** silently breaks direct `behaviour.setOptions({ enabled })` callers | accepted |
| D2 | O4 | **a** one `useBehaviourInstance` hook, three callers · **b** patch each site | **a** — three hand-rolled copies already drifted | accepted |
| D3 | Phase C: which history do `history.*` use? | **a** the `'graph'` layer's + `canvas.history` (as today's provider default) · **b** newest across all layers | **a** — matches today; multi-layer undo is new scope | accepted |
| D4 | Phase C: drag capture always on for `GraphCanvas`? | **a** yes, `history: false` opts out · **b** only with a provider | **a** — otherwise saved Undo misses drags; opt-out keeps the cheap path | accepted |
| D5 | Phase C: providers after the move | **a** keep as context bridges + reconfigure · **b** deprecate now · **c** remove | **a** now, **b** later — no breaking change before phase G | accepted |
| D6 | Typing mechanism | **a** generic map parameter on `CommandRegistry` · **b** module augmentation of one core map | **a** — R1; works with the peer layout | accepted |
| D7 | Spec `command` typing | **a** `KnownCommandName \| (string & {})` for authors, persisted type stays `string` · **b** narrow | **a** — R2 | accepted |
| D8 | Where shortcuts live | **a** an opt-in behaviour with JSON bindings (saved in the definition, editor per rule 12) · **b** a registry on `Canvas` | **a** — fits rule 7 / 12 and saves with the canvas | accepted |
| D9 | Shortcut focus scope | **a** the canvas element + its app root (focus-within) · **b** `document` | **a** — two canvases on a page must not both undo | accepted |
| D10 | `KeyboardCameraInputBehaviour` | **a** leave as-is, warn on key conflicts · **b** rebuild on commands | **a** — R3 | accepted |
| D11 | Menu target | **a** right-click selects the target, then runs the selection command · **b** add `ids` args to clipboard / erase | **a** — no public arg change; matches most editors | accepted |
| D12 | Palette scope | **a** bare-runnable commands + pick-one expansion · **b** also prompt for required args | **a** first; **b** once arg descriptors cover every kind | accepted |
| D13 | Widget option descriptor home | **a** static `optionsSpec` on the widget component (canvas-ui) reusing `CommandArgSpec` · **b** a core registry | **a** — widgets are React; additive | accepted |
| D14 | Footer auto-show | **a** show when any saved footer panel exists · **b** only with `showFooter` | **a** — otherwise a saved panel is invisible | accepted |
| D15 | Story scope for P8 (only when asked) | **a** `usecases/*` only · **b** all 45 | **a** — `canvas-ui/apps/GraphCanvasApp/*` teaches slots | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-29 | Opened as the umbrella for every open row of `doc:docs/commands-followups.md` after `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently` (branch `feat/commands-followups-2` @ `395293f6`) | proposed | Findings: O3 affects 20 behaviours; typing by augmentation doesn't fit the peer layout (R1); the undo / clipboard commands are missing on most canvases because only `GraphControlsToolbar` mounts the providers (M6), which is why phase C precedes keys and menus. Story rows (S1–S3) and G1 start `deferred` |
| 2026-09-29 | Phases A, B, C approved together, on one branch (`feat/commands-phases-a-b-c`, stacked on `feat/commands-followups-2` @ `395293f6`, unmerged). D1, D2, D3, D4, D5, D13, D14 → **a** | accepted | Phases D–G not approved; S1–S3, G1 stay `deferred` |
| 2026-09-29 | A1–A5, B1–B3, P1–P4, C1–C4 implemented; C5 added (the hook fallback N6 needs) | implemented | A4 also rebuilt `useInspectTarget` (same defect). B3 is a local rows field over `useFieldArray` — `@invana/forms` has no array field (U-3). `GraphHistory.setLimit` / `GraphClipboard.setPasteOffset` / `captureNodeDrags` added for C3 |
| 2026-09-29 | V0–V-C3 pass | implemented | V1: build, check-types, lint (boundaries; surfaces unchanged), test (graph 261, core 166, store 95, canvas 31). V-A1: 3 of 4 new tests fail with A1 reverted. V-A2: inspector + hover preview recover after unregister → re-register (a pre-fix control run couldn't find the canvas in the hover story, not investigated). V-A3: `lasso-select` leaves / returns in the picker. V-B1: fields for `pan-pad.step` and `export-image`, choice rows; untouched round-trip equal up to key order (described keys now follow the JSON rest); untouched panel byte-identical. V-P1: a saved `footer-right` panel shows the footer on Default (canvas 860→835 px) and hides with the panel; headers unchanged. V-C1: 8 tests. V-C2: 5 stories — drag → Undo button enables → click restores; copy / paste / undo; no errors; V0 controls identical. Rows stay `implemented` until merge |
| 2026-09-29 | Observation, out of scope | — | An unset `number` arg / option renders as a slider at 0 (`@invana/forms` number field) — pre-existing for command args, now also for widget options (`openDelay`, `closeDelay`); nothing is written unless edited |
| 2026-09-29 | Phases A–C committed on `feat/commands-phases-a-b-c` (`885ca01d`). Phases D and E approved ("continue"); D6–D12 → **a**, D11 as an opt-in | accepted | F (stories) and G (removals) stay `deferred` |
| 2026-09-29 | T1–T3, K1–K3, U1–U4 implemented; A6 and K4 added | implemented | T1 changed mechanism: overloads were dropped (the untyped fallback overload accepts wrong args, so V-T1 could never fail); a conditional `CommandArgsOf` made the registry invariant in its map (a `GraphCanvas` couldn't narrow `commands`, a typed registry wasn't a `CommandRegistry<C>`), so it's an indexed access instead. D11: `selectTarget` is opt-in, not default — defaulting it would change the selection on every existing right-click menu (N9) and duplicate `GraphContextMenu`'s own Select item. K2's bindings are one text line each (`keys → command {args}`), not JSON rows, to fit the settings registry's flat-field model; the panel form reports unparseable lines, the registry path drops them. A6: `CanvasSettingsEditorPanel` introspected once on mount |
| 2026-09-29 | V-T1, V-K1, V-K2, V-U2 pass; V-U1 skipped | implemented | V1: build, check-types, lint (surfaces regenerated: canvas-core +3, canvas +12, additions only), test (graph 270). V-T1: `@ts-expect-error` fixture in `packages/graph/tests/canvas/commandTypes.test.ts` (fails `check-types` if a line stops erroring), incl. `GraphCanvas` → `Canvas` and typed → untyped assignability. V-K1: 7 headless tests + Playwright with the built module loaded into existing stories (no story mounts it): Ctrl/⌘+Z undoes a drag after a canvas click and with focus on a header button, input typing ignored, Escape → select; on MultipleApps only the clicked canvas of four undid. V-U1 skipped: `CommandPalette` needs a mounted story (rule 11) — U3 stays `implemented` until it's seen. V0 controls identical on all 8 stories |
| 2026-09-28 | D15 → **a** (`usecases/*` only). `story:canvas-ui/apps/GraphCanvasApp/CommandPalette` added (asked); V-U1 run | implemented | V-U1 **fail**, U3 stays `implemented`. Pass: palette opens (button, Ctrl/⌘+K), 36 rows grouped, live disabled (Cut / Copy enable on a node click, Paste after a Copy row), a row runs and closes, key hints shown; no console errors. Fail, three defects: (1) `camera.fit`, `layout.run`, `layout.toggle` are missing — `sym:runsBare` (`file:packages/canvas-ui/src/menus/CommandPalette.tsx#L52`) treats every `layer`/`behaviour`/`layout` arg without a default as required, and `sym:CommandArgSpec` has no way to say optional vs required; (2) disabled menu items don't look disabled — `@invana/ui` `NestedMenu` overwrites every top-level item's `className` with `px-3 py-1.5`, dropping `commandMenuItems`' `DISABLED_CLASS` (affects `sym:ContextMenuOverlay` too); (3) palette ranking — typing `Copy` highlights `Layout: graph-force` above `Copy`, so Enter runs the wrong row. Cosmetic: Mac key hints read `⌘ShiftZ` (no ⇧/⌥/⌃ glyphs), and `Delete` + hint `Delete` reads `DeleteDelete`. The story uses the builder `commandMenuItems` (read on open), not `useCommandMenuItems`: the story rules forbid helper components, and the hook can't run before the canvas is ready without one. Each defect needs its own fix row before code |
| 2026-09-28 | U5–U10, S4 added (the V-U1 defects + a docked palette, asked) and approved in the same message | accepted | — |
| 2026-09-28 | U5–U10, S4 implemented; V-U1, V-U3 pass | implemented | V1: build, check-types, lint (boundaries; canvas-core / canvas-store / canvas surfaces unchanged — `required` is a field, `MenuItemList` is canvas-ui), test (graph 270, core 166, store 95, canvas 31). V-U3 on the docked palette: 38 rows incl. `Fit to content`, `Run layout`; `copy` → Copy first, Enter copies (Paste enables); `fit` → Enter zooms 4 → 0.83 and clears the query; `lasso` → Lasso first; no match → empty state; Edit menu dims Undo / Redo while disabled; hints `⇧⌘Z`, `⌫`, `Esc`; no console errors. Control: right-click menus on FullFeatured and GraphModeller list the same items as before, no errors. Observation: `layout.toggle`'s static label is also `Run layout`, so the palette now shows two `Run layout` rows (toggle + run) — label-only, not a row here. `@invana/ui` `NestedMenu` still drops top-level `className` upstream; `MenuItemList` works around it in canvas-ui |
