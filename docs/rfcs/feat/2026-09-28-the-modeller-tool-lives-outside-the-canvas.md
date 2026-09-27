---
id: feat-2026-09-28-the-modeller-tool-lives-outside-the-canvas
type: feat
title: The modeller tool lives in view.interaction, and behaviours gate themselves on it
status: accepted
opened: 2026-09-28
decided: 2026-09-28
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/canvas-state-plan.md
relations:
  - { predicate: supersedes, object: rfc:feat-2026-09-28-control-panels-cannot-pan-or-model }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved }
---

# The modeller tool lives in view.interaction

| | |
|---|---|
| **Motivation** | The modeller tool (select / add / connect / delete + node kind) is `useState` in `GraphToolProvider`, above the canvas. The engine can't see it: commands reach it through a React bridge, it isn't exported, and every consumer must gate the draw behaviours by hand with `enabled={tool === …}` |
| **Design** | The tool becomes `interaction.viewMode` (declared in the design of record, unused today) plus `interaction.viewModeArgs` (holding `nodeKind`). Behaviours gain an optional `modes` option and suspend themselves outside those modes. `tool.*` commands move from the React bridge into graph over the store. `useTool` / `GraphToolProvider` keep their API but read and write the store |
| **Row status** | proposed 0 · accepted 0 · implemented 11 · landed 0 · deferred 1 · rejected 0 · superseded 0 |
| **Open decisions** | none — D1–D4 accepted as recommended; D5 deferred (rule 11) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Tool state is React-only | `file:packages/canvas-react/src/providers/GraphToolProvider.tsx#L33-L34` | `useState` ×2, no engine reference |
| M2 | Commands reach it through a bridge that mirrors context into the registry | `file:packages/canvas-react/src/control-panels/ToolCommands.tsx#L21-L89` | ref + `invalidate()` on every change |
| M3 | Every consumer gates draw behaviours by hand; the story even says config "can't express a value that tracks React state" | `file:apps/storybook/stories/usecases/tools/GraphModeller.stories.tsx#L105-L108`, `#L374-L399`; `file:apps/storybook/stories/canvas-react/ControlPanel/GraphCanvas/Modeller.stories.tsx#L85-L102` | `enabled={tool === 'add'}` etc. |
| M4 | The declared home exists and nothing uses it | `file:packages/canvas-core/src/state/view/CanvasView.ts#L85-L86` (`viewMode`), `#L123` (`defaultViewMode`), `#L175` (default `'select'`) | no action writes it; only export / import touch it (`file:packages/canvas/src/io/stateExport.ts#L62`, `#L206`, `#L300`) |
| M5 | `GraphCanvasApp.wrap` sits above the lifted `CanvasContext`, so a provider there can't reach the canvas — the reason D2 of the prior RFC deferred this | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L628-L662` | but header / footer / side content is *inside* the lifted context, so `useTool` can read the store there |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Model the tool like `select.mode` (write `definition.behaviours.*.enabled`) | rejected | that writes the persisted definition; the tool is per-user and ephemeral (`doc:docs/canvas-state-plan.md` §9: interaction → Awareness) |
| R2 | Add `interaction.nodeKind` | rejected | core is domain-free; "node kind" is a graph concept. A generic `viewModeArgs` bag keeps it out (D1) |
| R3 | Remove `GraphToolProvider` | rejected | published API; it stays and becomes a thin config + compat layer (D3) |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `CanvasView.interaction.viewModeArgs: Readonly<Record<string, string>>` (default `{}`) | M4 | mode parameters without domain types |
| 2 | Actions `viewMode.set(mode, args?)` and `viewMode.setArgs(patch)`, labelled `view:viewMode:*` | `file:packages/canvas-core/src/state/view/createActions.ts#L40` | one write path, visible to telemetry |
| 3 | `Canvas` applies `definition.canvas.defaultViewMode` at init | `file:packages/canvas-core/src/state/view/CanvasView.ts#L123` | a saved canvas opens in its mode |
| 4 | `BehaviourOptions.modes?: readonly string[]`. The base `Behaviour` subscribes to `interaction.viewMode` while attached and is **effectively active** only when `enabled && (!modes \|\| modes.includes(viewMode))`. `onEnable` / `onDisable` fire on effective transitions; `enabled` / `getOptions()` stay the user's flag | `file:packages/canvas-core/src/abstracts/Behaviour.ts#L44-L52`, `#L109-L151` | draw behaviours declare `modes: ['add']` once; no React gating. Mode changes cancel in-flight gestures through the existing `onDisable` (e.g. `file:packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L160`) |
| 5 | graph registers `tool.active` (choice over `viewMode`, default options select / add / connect / delete) and `tool.nodeKind` (choice over `viewModeArgs.nodeKind`, enabled while mode = `add`) in `graphCommands.ts`; they re-read through the view store, with no `invalidate()` | `file:packages/graph/src/canvas/graphCommands.ts` | the canvas-react bridge (M2) is deleted |
| 6 | `useTool()` reads / writes the resolved canvas's store; outside a canvas it falls back to the provider (D3) | `file:packages/canvas-react/src/hooks/useTool.ts#L15-L18` | `ModellerToolbar` and stories keep working |
| 7 | `GraphToolProvider` becomes config: `defaultTool` / `defaultNodeKind` / `escapeToSelect`, applied by `<GraphCanvas>` to its store on mount. The Esc listener writes `viewMode.set('select')` on the canvas it applied to | `file:packages/canvas-react/src/providers/GraphToolProvider.tsx#L5-L46` | same props, same behaviour |
| 8 | Export / import already carry `viewMode`; `viewModeArgs` is added beside it (skipped by `skipInteraction`) | `file:packages/canvas/src/io/stateExport.ts#L62`, `#L300` | a restored canvas keeps its tool |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/canvas-state-plan.md` §3, §9 | design of record | active | `interaction.viewMode: 'select' \| 'draw' \| … \| string`; interaction is per-user (Awareness later) |
| `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` D2 | relates-to | accepted | "`viewMode` is the right home" — this RFC is that move |
| `rfc:feat-2026-09-28-control-panels-cannot-pan-or-model` R1 / D4 | supersedes (R1 only) | accepted | the command names `tool.active` / `tool.nodeKind` and the `MODELLER_` preset survive unchanged; only the bridge goes |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| K1 | defect | implemented | `file:packages/canvas-core/src/state/view/CanvasView.ts` | `interaction.viewModeArgs` + default | a home for the node kind | medium — core type grows; API snapshots | D1 |
| K2 | defect | implemented | `file:packages/canvas-core/src/state/view/createActions.ts` | `viewMode.set` / `setArgs` | one write path | low | K1 |
| K3 | defect | implemented | `sym:Behaviour` (`canvas-core`) | `modes` option + effective-active gating | declarative tool gating | **high** — base class of every behaviour; enable / disable timing changes for behaviours that set `modes` (none do today) | D2 |
| K4 | defect | implemented | `sym:Canvas` | apply `defaultViewMode` at init | saved mode restored | low | K2 |
| K5 | defect | implemented | `file:packages/canvas/src/io/stateExport.ts` | export / import `viewModeArgs` | round-trip | low | K1 |
| G1 | defect | implemented | `file:packages/graph/src/canvas/graphCommands.ts` | `tool.active` / `tool.nodeKind` over the store | commands without React | low | K2 |
| G2 | defect | implemented | `sym:CreateNodeBehaviour`, `sym:DrawEdgeBehaviour`, `sym:EraseBehaviour` | TSDoc: recommend `modes`; no default change (rule 7) | discoverable | low | K3 |
| R1 | defect | implemented | `file:packages/canvas-react/src/control-panels/ToolCommands.tsx`, `sym:GraphCanvas` | delete the bridge; `<GraphCanvas>` applies provider config (K4-style) + the Esc listener | one source of truth | medium — every `<GraphCanvas>` | G1, D3 |
| R2 | defect | implemented | `sym:useTool`, `sym:GraphToolProvider` | store-backed, with the provider fallback outside a canvas | API unchanged | medium — published hooks change their source of truth | K2, D3 |
| U1 | defect | implemented | `sym:ModellerToolbar` | none if R2 keeps `useTool`'s shape; listed as the control | | low | R2 |
| E1 | defect | implemented | `pkg:@invana/canvas-ui` editors for the three draw behaviours | a `modes` field (multi-select over known modes), per rule 12 | studio can set gating | low | K3 |
| S1 | defect | deferred | `story:usecases/tools/GraphModeller`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller` | replace `enabled={tool === …}` with `modes`, **only if you ask** (rule 11); both keep working without it | stories show the new way | low | K3 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| UP1 | `ctx.store.view.subscribe` from inside a behaviour | K3 subscribes the same way `ClickSelectBehaviour` does (`file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L344`) | none; established pattern |
| UP2 | `sym:BehaviourRegistry.setEnabled` + `scene:behaviour:enable` events | K3 must not fire enable events on mode flips (they mean the user flag) | a listener that reacts to mode changes as if the user toggled |
| UP3 | view history | `createHistory` records every view write, but only tests instantiate it | once wired, mode flips would enter undo unless it filters `interaction` |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `api/canvas-core.surface.txt`, `api/canvas-store.surface.txt`, `api/canvas.surface.txt` | snapshots | type additions only | regenerate |
| D-2 | `story:usecases/tools/GraphModeller`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller` | stories | still gate with `enabled`; the tool now reads from the store | V3 |
| D-3 | `sym:ModellerToolbar`, `MODELLER_CONTROL_ITEMS` | component / preset | same names; source switches to the store | V3 |
| D-4 | `sym:GraphCanvasApp.wrap` users that put `GraphToolProvider` in `wrap` | apps | config now applied by `<GraphCanvas>` below it | V3 |
| D-5 | exported states | serialised | new `interaction.viewModeArgs`; older files import with `{}` | V4 |
| D-6 | `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice` T5 | RFC | `ModellerToolbar` conversion gets simpler after this | sequence this first |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` · `pnpm check-types` · `pnpm lint` · `pnpm test` | repo | clean; snapshots regenerated | all |
| V2 | pass | canvas-core unit tests | `sym:Behaviour` gating | `modes` suspends / resumes on `viewMode`; `enabled: false` still wins; `getOptions` unchanged; no `scene:behaviour:enable` on a mode flip | K3 |
| V3 | pass | Storybook (control) | `story:usecases/tools/GraphModeller`, `story:canvas-react/ControlPanel/GraphCanvas/Modeller` | Add drops a node, Connect draws, Delete erases, Esc → Select, Shape greys outside Add, undo works | G1, R1, R2, U1 |
| V4 | pass | export → import | Modeller story | mode + node kind restored; an older export imports | K5 |
| V5 | pass | Storybook (control) | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured`, `story:canvas-ui/apps/GraphCanvasApp/ControlPanels` | unchanged | K3, R1 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where the node kind lives | `viewModeArgs` bag · `interaction.nodeKind` · graph-owned store slice | **`viewModeArgs`** — core stays domain-free (R2) | accepted |
| D2 | How behaviours follow the mode | **A** `modes` on the base `Behaviour` · **B** a mode → behaviour-ids map applied by the canvas · **C** leave gating to consumers | **A** — serialisable, per-instance, and editable in the studio; B spreads one concern over two places | accepted |
| D3 | `GraphToolProvider` / `useTool` | keep both as compat over the store · deprecate the provider now | **keep**, and mark the provider's local-state fallback deprecated in TSDoc | accepted |
| D4 | Tool values | keep `select` / `add` / `connect` / `delete` as `viewMode` strings · namespace them (`graph:add`) | **keep plain** — `viewMode` is already `string`, and the plan's examples are plain | accepted |
| D5 | Stories (S1) | leave them on `enabled` · migrate to `modes` | **migrate**, only on your say-so (rule 11) | deferred |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-28 | Opened: the long-term move named by D2 of `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` and R1 / D4 of `rfc:feat-2026-09-28-control-panels-cannot-pan-or-model`, on the maintainer's "finish all" | proposed | awaiting approval |
| 2026-09-28 | Approved whole ("sure that order works" after "finish all"); D1–D4 as recommended; D5 / S1 deferred until stories are asked for (rule 11) | accepted | |
| 2026-09-28 | K1–K5, G1, G2, R1, R2, U1, E1 implemented on `feat/control-panels` | accepted | V1: build, check-types, lint (API surfaces unchanged: only type members grew), tests pass (core 157, graph 206). V2: 7 new `Behaviour` tests. V3: headless Chromium — `story:canvas-react/ControlPanel/GraphCanvas/Modeller` (Add → Shape enables, drop → Undo, Esc → Select + Shape greys, Undo → Redo) and `story:usecases/tools/GraphModeller` (ModellerToolbar: shape picker only in Add, drop → Undo, Esc) work with no console errors. V4: graph test round-trips mode + node kind and imports an older snapshot. V5: FullFeatured, GraphCanvasApp/ControlPanels, Explorer load clean. Learned: (1) 12 behaviours override `setOptions` without `super`, so a runtime `modes` patch goes through a new `setModes` that `Canvas.update` calls directly, like `enabled`. (2) `_enabled` stays the *live* flag subclasses read (14 files read it directly); the developer's flag moved to a private field behind `enabled`. (3) The provider can't reach a canvas from `wrap`, so `<GraphCanvas>` hands it one (`ToolBindingContext`); the provider seeds that store and mirrors it, so consumers above the canvas still re-render. (4) `config.defaultViewMode` seeds the live mode only on the first config that carries it. (5) E1 is a shared `modes` checkbox group (`editors/_shared/modes.ts`) on create-node / draw-edge / erase |
