---
id: feat-2026-09-29-command-controls-go-stale-or-fail-silently
type: feat
title: Command controls stay live, say when they can't work, and hooks share the engine functions
status: accepted
opened: 2026-09-29
decided: 2026-09-29
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/commands-followups.md
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-control-panel-command-args-are-raw-json }
---

# Command controls stay live, say when they can't work, and hooks share the engine functions

| | |
|---|---|
| **Motivation** | A saved control reads state the view store doesn't hold (edge defaults, layer visibility, registries, two undo stacks, a clipboard buffer), and only goes live when some write site remembers `commands.invalidate()`. An unregistered command draws as a silently disabled button. Arg descriptors are never checked. Two hooks (`useLock`, `useEdgeType`) still bypass or invert the layering rule. Eleven behaviours' `getOptions()` go stale. Items O1, O2, 12–16, 21 of `doc:docs/commands-followups.md` |
| **Design** | Invalidation moves from write sites to **one bridge per source** in the engine (bus events → `invalidate()`). Lock and edge-type logic become engine functions both callers use. `useControlItems` marks unregistered commands and warns in dev. `CommandRegistry.run` checks args in dev. New `scene:behaviour:unregister` event. `useHistory` goes two-stack. Behaviours keep `_options` in sync |
| **Constraint** | No command renamed, no args changed, no export removed. User-visible change only where an item calls for it: R1 (unavailable marker), H1 (hook undo scope), plus the stale-button fixes themselves (§2 table B) |
| **Row status** | proposed 0 · accepted 0 · implemented 20 · landed 0 · deferred 0 · rejected 0 · superseded 0 |
| **Open decisions** | none — D1–D7 accepted as recommended |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | `useLock` disables behaviours itself (`behaviour.disable()`, not the registry → no `scene:behaviour:*` event) and keeps `locked` in React state; `initialLocked: true` sets the flag without disabling anything. `view.lock` derives "locked" from the behaviours and goes through `behaviours.setEnabled` | `file:packages/canvas-react/src/hooks/useLock.ts#L36-L51`, `file:packages/canvas/src/engine/builtinCommands.ts#L162-L177` | read. A `view.lock` panel toggle doesn't follow a hook lock (no event) |
| M2 | `useEdgeType` reads/writes through the `graph.edgeType` command when registered, else its own copy of the same `setEdgeDefaults({ shape: { ...prev, pathType } })` logic — hook depends on command, logic written twice | `file:packages/canvas-react/src/hooks/useEdgeType.ts#L65-L108`, `file:packages/graph/src/canvas/graphCommands.ts#L161-L190` | read |
| M3 | Command state outside the view store goes live only via an explicit `invalidate()` at a write site: `layer.visible` (`#L266-L267`), `graph.edgeType` (`#L187-L188`), the providers' history / clipboard listeners, `Canvas`'s `history.subscribe` | `file:packages/canvas/src/engine/builtinCommands.ts#L266`, `file:packages/graph/src/canvas/graphCommands.ts#L188`, `file:packages/canvas-react/src/providers/GraphHistoryProvider.tsx#L154`, `file:packages/canvas-react/src/providers/GraphClipboardProvider.tsx#L117`, `file:packages/canvas/src/engine/Canvas.ts#L366` | grep `invalidate()` |
| M4 | Any other writer leaves a bound control stale: `LayersViewPanel` calls `layer.setVisible` (a saved `layer.visible` toggle keeps its old pressed state); `ColorByBehaviour` / `useApplyTypeStyling` / `GraphLayer.setOptions` / the plain-Canvas `useEdgeType` call `setEdgeDefaults` (a `graph.edgeType` picker keeps its old value) | `file:packages/canvas-ui/src/view-panels/layers/LayersViewPanel.tsx#L581`, `#L666`; `file:packages/canvas-ui/src/view-panels/styling/useApplyTypeStyling.ts#L80` | read |
| M5 | `useCommandStates` re-reads on view store, command (un)registration / `invalidate`, and behaviour register / enable / disable — **not** on layer add / remove / visibility, layout add / remove, or renderer ready. `layout.activate`'s options, `layout.run` / `layer.visible` / `background.grid` / `graph.*` `isEnabled` read those registries | `file:packages/canvas-react/src/hooks/useCommandStates.ts#L42-L56` | read |
| M6 | A spec naming an unregistered command draws a disabled button with its normal tooltip; a `choice` over one disappears (no options). `CommandState.available` is computed and never read | `file:packages/canvas-ui/src/control-panels/ControlItems.tsx#L56-L109`, `file:packages/canvas-react/src/hooks/useCommandStates.ts#L62` | read. `history.*` without `GraphHistoryProvider` falls back to the definition-only built-in; `clipboard.*` / `theme.toggle` have no fallback |
| M7 | No `scene:behaviour:unregister`: `BehaviourRegistry.unregister` emits only `disable` (when enabled). The control-panel editor's behaviour picker subscribes to `register` only, so a removed behaviour stays listed | `file:packages/canvas-core/src/abstracts/registries/BehaviourRegistry.ts#L72-L82`, `file:packages/canvas-ui/src/editor-panels/control-panels/ControlPanelsEditor.tsx#L53-L66` | read; the layer registry has `scene:layer:remove` |
| M8 | `CanvasCommand.args` is "documentation as data: it isn't validated at run time" — `{ factor: '2' }` or `{ id: 3 }` fail silently inside `run` | `file:packages/canvas-core/src/abstracts/registries/CommandRegistry.ts#L69-L74`, `#L164-L171` | read |
| M9 | `useHistory().undo` is graph-only; the `history.undo` command undoes the newer of graph / definition edits (H9, deferred by D2 of the previous RFC) | `file:packages/canvas-react/src/hooks/useHistory.ts#L45-L71`, `file:packages/graph/src/canvas/graphActions.ts#L148-L170` | read |
| M10 | 11 graph behaviours override `setOptions` without `super`, keep their own `opts`, and don't override `getOptions()` — so the base `getOptions()` returns the **construction** options forever: `BrushSelect`, `LassoSelect`, `ClickSelect`, `HoverActivate`, `HoverElementPreview`, `ContextMenu`, `NodeCentrality`, `ParallelEdge`, `EdgeLOD`, `ContentLOD`, `Theme`. `TextLOD` calls `super` (fine) | `file:packages/graph/src/behaviours/BrushSelectBehaviour.ts#L256-L258` etc.; base `file:packages/canvas-core/src/abstracts/Behaviour.ts#L260-L283` | awk over every `setOptions` override in a `*Behaviour` class. Readers: `CanvasSettingsEditorPanel` seeds from `getOptions()`, and `Canvas._writeBaseline` → `currentOption` reads it for undo baselines (`file:packages/canvas/src/engine/Canvas.ts#L1175-L1196`, `file:packages/canvas/src/engine/CanvasConfig.ts#L117-L124`) |

### Found, not in scope

| ID | Observation | Evidence |
|---|---|---|
| O3 | The **base** `Behaviour.setOptions` calls `this.enable()` directly, so on `canvas.update({ behaviours: { id: { enabled } } })` the registry's follow-up `setEnabled` sees no change and fires no `scene:behaviour:enable`/`disable`. The 11 non-`super` overrides happen to avoid this — which is why F-rows below must **not** simply add `super.setOptions` (D6) | `file:packages/canvas-core/src/abstracts/Behaviour.ts#L260-L267`, `file:packages/canvas/src/engine/Canvas.ts#L1147-L1156` |
| O4 | `useHoverElementPreview`, `useViewTarget`, `ElementInspectorViewPanel` re-attach on `scene:behaviour:register` but never detach on removal. N1 makes that possible; wiring them is not item 14 | `file:packages/canvas-react/src/hooks/useHoverElementPreview.ts#L49`, `file:packages/canvas-react/src/hooks/useViewTarget.ts#L47`, `file:packages/canvas-ui/src/view-panels/element-inspector/ElementInspectorViewPanel.tsx#L107` |

## 2. Design

**A. Item 12 audit — every command state read outside the view store**

| Source | Read by | Today's signal | Decision (D1) |
|---|---|---|---|
| `canvas.isInitialised` | `camera.*` `isEnabled` | none (works because init writes the store) | bridge `canvas:renderer:ready` |
| behaviour registry + `enabled` | `behaviour.toggle`, `view.lock`, `select.mode`, `graph.erase`'s `clickSelectId` | `useCommandStates` listens to register / enable / disable | bridge register / **unregister (N1)** / enable / disable |
| layer registry | `layer.visible`, `background.grid`, `graph.*` `isEnabled` | none | bridge `scene:layer:add` / `remove` |
| `layer.visible` | `layer.visible` `isActive` | inline `invalidate()` in the command only (M4) | bridge `scene:layer:visibilitychange`; drop the inline call |
| layout registry | `layout.run` / `layout.toggle` `isEnabled`, `layout.activate` options | none | bridge `scene:layout:add` / `remove` |
| `GraphLayer.edgeDefaults` | `graph.edgeType` value | inline `invalidate()` in the command only (M4) | bridge the layer's own `style:changed` (scope `edge`), in `GraphCanvas`; drop the inline call |
| `canvas.history` (definition stack) | built-in `history.*`, provider `history.*` | `history.subscribe → invalidate` in `Canvas` | **keep** — already one structural bridge, not a write site |
| `GraphHistory` stacks | provider `history.*` | provider `history.events 'change' → invalidate` | **keep** — the provider owns the object; moving it into the engine is D1-B (item 19, out of scope). Stacks of ops don't belong in the reactive store (they'd be recorded by the store's own history) |
| `GraphClipboard` buffer | `clipboard.paste` | provider `clipboard.events 'change' → invalidate` | **keep** — same reason |
| host theme (`isDark`) | `theme.toggle` | re-register on flip | **keep** — host React state, not canvas state |
| `BackgroundLayer.getOptions().type` (fallback only when the definition lacks it) | `background.grid` | none | **keep** as-is: the definition is read first, and every write path through `canvas.update` fills it |
| selection, camera, interaction mode, runtime layout | many | view store | already live |

Moved into the store: **none** (D1). Every "keep" is an owner-side bridge, not a write-site call, so nobody can forget it.

**B. User-visible changes, all called for by an item**

| Row | Change |
|---|---|
| I1–I4 | A bound control now follows writes it used to miss (M4, M5): e.g. hiding a layer in `LayersViewPanel` updates a saved `layer.visible` toggle |
| R1 | An unregistered command's button / toggle tooltip reads "`<label>` (unavailable)"; dev builds also warn once (D3) |
| H1 | `useHistory().undo/redo/canUndo/canRedo` cover definition edits too (D5) |
| L2 | `useLock().locked` reflects the behaviours; `initialLocked: true` now actually locks (D4) |
| E2 | `useEdgeType().edgeType` follows the layer's actual edge default on any canvas (D7) |

**C. Arg validation (item 15)** — in `CommandRegistry.run`, before `isEnabled`, when `validateArgs` is on:

| Kind | Accepts | Note |
|---|---|---|
| `string`, `layer`, `behaviour`, `layout` | string | ids aren't checked against registries (the kernel's registry is context-free) |
| `number` | finite number; a numeric string when the key is `pick` | pickers send strings (`camera.zoomTo`) |
| `boolean` | boolean | |
| `enum` | one of `options[].value` | |
| `strings` | array of strings | |
| `json` | anything | |

Absent / `undefined` keys pass. Undescribed keys pass (they're documented pass-through). Non-object `args` on a command with descriptors warns. Warns via `console.warn('[canvas] command "x": …')` **once per (command, key, problem)**, never throws, and `run` proceeds unchanged. `validateArgs` defaults to a dev-build check written as a literal `process.env.NODE_ENV !== 'production'` inside `try` (bundlers substitute and tree-shake it; an unbundled browser throws → off; vitest → on). A private helper, so no export.

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/commands-followups.md` | design of record | open | the rule (logic → hooks → commands for saved controls). This RFC lands O1, O2, 12–16, 21 |
| `rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` | relates-to | landed | recorded O1 / O2; its `undoNewest` / `canUndoEither` are what H1 calls. Its D2 deferred H9 — H1 lands it |
| `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` | relates-to | accepted | owns the two-stack arbitration; H9 row lands here as H1 |
| `rfc:feat-2026-09-28-control-panel-command-args-are-raw-json` | relates-to | landed | introduced `CommandArgSpec`. A1 validates against it; no descriptor changes |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| L1 | defect | implemented | new `file:packages/canvas/src/engine/viewLock.ts` (O1) | `isViewLocked(canvas, behaviourIds?)`, `setViewLocked(canvas, locked, behaviourIds?)` — the rule moved out of `view.lock` (targets = registered ids of `behaviourIds ?? ['pan','drag-node']`; locked ⇔ non-empty and all disabled; writes via `behaviours.setEnabled`). Exported from `pkg:@invana/canvas` | one lock rule | low — additive; `canvas.surface.txt` +2 | — |
| L2 | defect | implemented | `sym:view.lock`, `sym:useLock` (O1, D4) | the command calls L1. The hook: `locked` = `isViewLocked` re-read on behaviour events; `setLock` / `toggleLock` call `setViewLocked`; `initialLocked: true` locks once on mount | hook and panel agree; hook writes fire events | medium — `useLock` semantics (only caller: deprecated `useViewSection`) | L1 |
| E1 | defect | implemented | `file:packages/graph/src/canvas/graphActions.ts` (O2) | `edgePathType(layer): string \| undefined` and `setEdgePathType(layer, type)` (keeps anchors / waypoints). Exported from `pkg:@invana/graph` | one edge-type rule | low — additive | — |
| E2 | defect | implemented | `sym:graph.edgeType`, `sym:useEdgeType` (O2, D7) | command calls E1. Hook stops calling the command: value = `edgePathType(layer) ?? initial ?? types[0]`, re-read on the layer's `style:changed`; `setEdgeType` = `setEdgePathType`. Works the same on a plain `Canvas` (no command needed) | hook no longer depends on a command | medium — `useEdgeType` (only caller: deprecated `useStyleEditorSection`) | E1 |
| I1 | defect | implemented | `file:packages/canvas/src/engine/Canvas.ts#L366` (item 12) | one "command-state bridge" in the constructor: `scene:layer:add/remove/visibilitychange`, `scene:layout:add/remove`, `scene:behaviour:register/unregister/enable/disable`, `canvas:renderer:ready` → `commands.invalidate()` | registry / visibility reads go live for every writer | medium — more `invalidate()` calls (none pointer-rate); every bound control re-reads | N1 |
| I2 | defect | implemented | `sym:GraphCanvas` (item 12) | on `scene:layer:add` of a `GraphLayer`, subscribe its `style:changed` (scope `edge`) → `invalidate()`; unsubscribe on remove | edge-type controls follow every `setEdgeDefaults` writer | low | — |
| I3 | dressing | implemented | `sym:layer.visible`, `sym:graph.edgeType` | drop the inline `canvas.commands.invalidate()` (now redundant with I1 / I2) | write sites carry no invalidation duty | low | I1, I2 |
| I4 | defect | implemented | `sym:useCommandStates` | subscribe = view store + `commands.subscribe` only (the bus listeners move to I1, so non-React consumers get the same signal) | one signal | low | I1 |
| I5 | dressing | implemented | TSDoc of `sym:CommandRegistry.invalidate`, `sym:CanvasCommand` | "state outside the store needs an **owner-side** bridge (engine / provider), never a write-site call"; cite §2 A | rule written down | low | — |
| R1 | defect | implemented | `sym:useControlItems` (item 13, D3) | `command` / `toggle` item with `available === false`: label → "`<label>` (unavailable)" (tooltip + `aria-label`), still disabled | end users see why | medium — visible on any panel naming an unregistered command | — |
| R2 | defect | implemented | `sym:useControlItems` (item 13, D3) | dev builds: `console.warn` once per (canvas, command) when still unregistered **1 s after first seen** (providers register in a later effect), naming the usual provider: `clipboard.*` → `GraphClipboardProvider`, `theme.toggle` → `CanvasThemeSync` (`history.*` is built into every `Canvas`, so it gets no hint). Covers `choice` items too | developers find the missing provider | low — dev only; new console warnings in stories that name unavailable commands | — |
| N1 | defect | implemented | `sym:CanvasEventMap`, `sym:BehaviourRegistry.unregister` (item 14) | add `'scene:behaviour:unregister': { id: string }`; emitted after the behaviour is deleted and destroyed (after `disable`). `LEVEL_BY_TYPE` in `file:packages/canvas-store/src/telemetry/logging.ts#L52-L66` gets it at `info` | removal is observable | low — additive event key; no export-name change | — |
| N2 | defect | implemented | `useRegistryIds` in `file:packages/canvas-ui/src/editor-panels/control-panels/ControlPanelsEditor.tsx#L53` (item 14) | also listen to `scene:behaviour:unregister` | picker drops removed behaviours | low | N1 |
| A1 | defect | implemented | `sym:CommandRegistry.run`, `sym:CommandRegistryOptions` (item 15, D2) | §2 C. New optional `validateArgs?: boolean` on the existing options interface | bad saved args are visible in dev | low — warn-only; zero cost when off | — |
| H1 | defect | implemented | `sym:useHistory` (item 16 / H9, D5) | `undo` / `redo` / `canUndo` / `canRedo` = `undoNewest` / `redoNewest` / `canUndoEither` / `canRedoEither`; re-read on the graph history's `change` **and** `canvas.history.subscribe`. Without a provider: `canvas.history` alone (same as the built-in command). Signature unchanged | **behaviour change**: the hook's Undo now also undoes Studio definition edits, in newest-first order | medium — published hook (in-repo caller: deprecated `useHistorySection`) | H2 |
| H2 | defect | implemented | `sym:undoNewest`, `sym:redoNewest`, `sym:canUndoEither`, `sym:canRedoEither` | widen `history: GraphHistory` → `GraphHistory \| null` (null ⇒ `canvas.history` only) | one function for with / without provider | low — widening only | — |
| F1 | defect | implemented | `sym:Behaviour` (item 21, D6) | add `protected recordOptions(patch)`: merges into `_options` only (no enable / modes / `onOptionsChanged` side effects) | a no-side-effect sync seam | low — protected member, no export change | — |
| F2 | defect | implemented | the 11 behaviours of M10 | each `setOptions` calls `this.recordOptions(patch)` first; apply logic unchanged | `getOptions()` current → `CanvasSettingsEditorPanel` seeds and undo baselines are right | medium — 11 classes; apply logic must be untouched | F1 |
| B1 | dressing | implemented | `doc:docs/commands-followups.md` | items 12–16, 21 → ✅; add rows O1, O2 (✅) and O3, O4 (📋, found) | bookkeeping | low | all |
| B2 | dressing | implemented | `doc:packages/canvas-react/CLAUDE.md` "Hooks vs commands" | one line: state outside the store gets an owner-side bridge (I5) | rule next to the rule | low | I5 |

## 5. Blast radius

Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.setEdgeDefaults` emitting `style:changed { scope: 'edge' }` | I2 / E2 rely on it for every writer | low — documented event (`file:packages/graph/src/layer/types.ts#L1552-L1561`) |
| U2 | `sym:Layer.setVisible` emitting `scene:layer:visibilitychange` only when mounted | I1 misses pre-mount toggles | low — an unmounted layer's toggle isn't drawn live anyway |
| U3 | `sym:History.subscribe` / `peekUndo` (`file:packages/canvas-store/src/port/createHistory.ts`) | H1 reads it | low |
| U4 | `Canvas._applyToInstances` routing `enabled` / `modes` itself | F2 relies on it (O3) | low — unchanged |

Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `sym:GraphControlsToolbar` / `sym:GraphControlsToolbarLite` (~36 stories, e.g. `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:canvas-ui/editors/CanvasSettingsEditorPanel`, `story:usecases/tools/GraphVisualiser`, `usecases/by-casestudies/*`) | runtime UI | I1–I4 re-reads; R1 only where a spec names an unregistered command | V8 diff vs V0; any label change must be an R1 "(unavailable)" |
| D-2 | `sym:ControlPanels` / saved panels: `story:canvas-react/ControlPanel/GraphCanvas/Modeller`, `story:usecases/tools/GraphModeller` | runtime + saved state | same; names / args unchanged, no migration | V8, V9 |
| D-3 | `sym:ControlPanelsEditor` (behaviour picker) | runtime UI | N2 | V5 |
| D-4 | `sym:CanvasSettingsEditorPanel` (`story:canvas-ui/editors/CanvasSettingsEditorPanel`), `sym:CanvasSettingsBrowser` | runtime UI | F2 — seeds show current values after an edit | V7, V8 |
| D-5 | `Canvas._writeBaseline` undo baselines | engine | F2 — baselines read current, not construction, values | V7 |
| D-6 | `sym:useLock`, `sym:useEdgeType`, `sym:useHistory` (published); in-repo only via deprecated `useViewSection`, `useStyleEditorSection`, `useHistorySection` → deprecated `GraphToolbar` (no JSX user) | published API | L2, E2, H1 semantics (§2 B) | TSDoc states it |
| D-7 | `pkg:@invana/graph` surface | published API | **additions**: `edgePathType`, `setEdgePathType`; widened H2 params | none — no snapshot |
| D-8 | `api/canvas.surface.txt` | surface snapshot | **+2**: `isViewLocked`, `setViewLocked` | regenerate with `--write` in the same change |
| D-9 | `api/canvas-core.surface.txt`, `api/canvas-store.surface.txt` | surface snapshots | no export name changes (N1 is a key in an existing interface; A1 an optional field; F1 a protected member) | must pass **without** `--write` |
| D-10 | Telemetry log bridge / OTel (`pkg:@invana/canvas-telemetry-otel`) | observability | N1 logs at `info` | none |
| D-11 | `story:canvas-ui/view-panels/SchemaViewPanel/CanvasDerived` | runtime UI | control: `SchemaToolbar` Fit only | V8 |
| D-12 | `apps/docs/api/**` TypeDoc | generated | picks up new TSDoc | none by hand |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V0 | pass | **Baseline before any code edit**: Playwright over current `dist/` — button labels, `disabled`, `aria-pressed`, picker entries, console errors | the 5 stories in D-1/D-2/D-4/D-11 | recorded | — |
| V1 | pass | `pnpm build`, `pnpm check-types`, `pnpm lint` (boundaries + surface: only `canvas.surface.txt` regenerated, +2 lines), `pnpm test` | repo | green | all |
| V2 | pass | `packages/canvas-core/tests/registries/BehaviourRegistry.test.ts`: `unregister` emits `disable` (if enabled) then `unregister`; unknown id emits nothing; `clear()` emits per behaviour | canvas-core | pass | N1 |
| V3 | pass | `packages/canvas-core/tests/registries/CommandRegistry.test.ts`: each kind accepts / warns; numeric string on a `pick` number passes; warns once per (command, key, problem); never throws; `run` still runs; `validateArgs: false` silent | canvas-core | pass | A1 |
| V4 | pass | new `packages/graph/tests/canvas/commandState.test.ts` (headless `GraphCanvas`; `graphCommands.test.ts` left unedited for V10): a `commands.subscribe` listener fires on `layer.setVisible`, `layers.add`/`remove`, `layouts` add, behaviour unregister, and a direct `setEdgeDefaults`; `graph.edgeType` value follows a direct write; `view.lock` over `setViewLocked` / `isViewLocked` (incl. events fire) | graph | pass | I1, I2, I3, L1, E1 |
| V5 | pass | Playwright on FullFeatured: `canvas.behaviours.unregister('lasso-select')` fires `scene:behaviour:unregister` and the registry drops it. The picker's own redraw was **not** driven in the UI (it needs a panel with a `behaviour.toggle` item); its subscription is a one-line listener, checked by read-through | FullFeatured | event + registry | N2 |
| V6 | pass | `commandState.test.ts` (kept out of `graphActions.test.ts` so V10's control stays unedited): `undoNewest` / `canUndoEither` with `null` history = `canvas.history` only; existing cases unchanged | graph | pass | H2 |
| V7 | pass | new `packages/graph/tests/behaviours/getOptions.test.ts`: for each of the 11, `setOptions(p)` → `getOptions()` contains `p`; `canvas.update({ behaviours: { id: { enabled } } })` still fires `scene:behaviour:enable/disable` (O3 guard) | graph | pass | F1, F2 |
| V8 | pass | Playwright after rebuild, diffed against V0 | same 5 stories | identical except R1 "(unavailable)" labels where the command is missing; new console **warnings** only from R2; no new errors | I1–I4, R1, R2, F2, E2, L2 |
| V9 | pass | Playwright, driven: hide a layer via `LayersViewPanel` / `layer.setVisible` → a `layer.visible` control follows; pick edge type in panel ↔ direct `setEdgeDefaults`; `camera.zoomTo` still accepts picker strings (no A1 warning); `history.undo` after a definition edit | FullFeatured, Modeller | as stated | I1, I2, A1, H1 |
| V10 | pass | **Control**: existing `graphCommands`, `graphActions`, `definitionHistory` tests pass unedited | graph | pass | E2, L2, H2 |
| V11 | pass | `grep -rn "commands.invalidate()" packages/*/src` | repo | only `Canvas` bridge, `GraphCanvas` bridge, the two providers (`builtinCommands` / `graphCommands` hits are comments) | I3 |
| V12 | pass | read-through | I5, B1, B2, TSDoc of L2 / E2 / H1 | matches this RFC | I5, B1, B2 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Item 12: move non-store state into the store, or bridge it? | **a** owner-side bridges (§2 A), no store moves · **b** edge type into `view.definition.layers[id].edge` · **c** undo stacks / clipboard into the store | **a**. **b** would persist and make undoable an edge-type change, and `ColorByBehaviour` writes the same template outside the definition, so the read would still need the layer. **c** is D1-B (item 19) and would put op-lists in a store that records its own history | accepted |
| D2 | Item 15: how is validation switched on? | **a** `validateArgs?` option, default = dev build · **b** dev build only, no option · **c** always on | **a** — tests can force it; production bundles drop the check | accepted |
| D3 | Item 13: what does an unregistered command look like? | **a** "(unavailable)" tooltip / aria-label suffix + dev warning · **b** dev warning only · **c** hide the item | **a** — the end user sees why it's disabled; hiding reflows saved panels and hides a real config problem | accepted |
| D4 | O1: `useLock().locked` — hook-owned or derived? | **a** derived from behaviours (as `view.lock`); `initialLocked` locks on mount · **b** keep hook-owned state, share only the write | **a** — two answers to "is it locked?" is the drift O1 names; today's `initialLocked` sets the flag without locking | accepted |
| D5 | Item 16 without a provider: what does `useHistory` undo? | **a** `canvas.history` (same as the built-in `history.undo`) · **b** nothing, as today | **a** — hook == command in both setups; today the hook is a no-op while the command works | accepted |
| D6 | Item 21: call `super.setOptions` or sync only? | **a** `recordOptions(patch)` (sync `_options`, no side effects) · **b** `super.setOptions(patch)` | **a**. **b** runs the base's direct `enable()` before the registry's `setEnabled`, which then fires no event (O3) — select-mode toggles of brush / lasso would stop emitting `scene:behaviour:enable` | accepted |
| D7 | O2: `useEdgeType`'s `initial` | **a** fallback only when the layer has no `pathType` (the command's rule) · **b** keep "`initial` wins until the first write" | **a** — then the hook and the command answer the same; in-repo, nobody passes `initial` | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-29 | Opened for O1, O2, items 12–16, 21 of `doc:docs/commands-followups.md`; branch `feat/commands-followups-2` from `main` @ `f029cfe5` | proposed | Findings: item 12's stale cases are real today (`LayersViewPanel` visibility, `ColorBy` / styling edge writes, late layers / layouts). Item 21 is 11 behaviours, and the obvious `super` fix would regress events (O3). Only `canvas.surface.txt` changes (+2) |
| 2026-09-29 | Approved whole ("ok proceed"); D1–D7 as recommended. V0 baseline over the pre-change `dist/` (5 stories, 0 console errors) | accepted | |
| 2026-09-29 | Implemented on `feat/commands-followups-2`. All 20 rows `implemented`; they reach `landed` when the branch merges to `main` | accepted | V1: build, check-types, lint (0 warnings in changed files; boundaries intact; `canvas-core` / `canvas-store` surfaces unchanged, `canvas.surface.txt` +2 via `--write`), test (canvas-core 166, canvas-store 95, canvas 31, graph 249 incl. 19 new). V7's 11 cases fail against the old behaviours (checked by stashing F2). V8: 5 stories identical to V0 (labels, disabled, pressed; no new logs, 0 errors). V9 in FullFeatured: direct `setVisible` flips `layer.visible`; a direct `setEdgeDefaults` moves `graph.edgeType` and the Edge menu's checked item (Straight → Curved); `camera.zoomTo { value: '1' }` warns nothing; Undo enables after an `edit:` write and disables after undo; `{ factor: 'big' }` warns once; an unregistered `history.undo` draws "Undo (unavailable)" and warns after 1 s. Learned: (1) `history.*` is built into every `Canvas`, so R2's `GraphHistoryProvider` hint was misleading and was dropped; (2) the `view.lock` "is it usable" check became an internal `canLockView` helper, not exported, so the surface stays +2; (3) no existing test or story tripped A1, so no saved args currently mismatch their descriptors |
