---
id: feat-2026-10-12-config-cannot-create-instances
type: feat
title: A CanvasConfig entry that names a kind builds the layer, behaviour or layout it configures
status: proposed
opened: 2026-10-12
decided: null
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas, pkg:@invana/graph, pkg:@invana/graph-layout-d3-force, pkg:@invana/graph-layout-elkjs, pkg:@invana/graph-layout-d3-hierarchy, pkg:@invana/graph-layout-d3-sankey, pkg:@invana/graph-layout-geometric, pkg:@invana/graph-layer-d3-contour, pkg:@invana/graph-layer-bubble-sets, pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/unified-canvas-options-plan.md
relations:
  - { predicate: supersedes, object: doc:docs/unified-canvas-options-plan.md#D3 }
  - { predicate: relates-to, object: rfc:feat-2026-10-05-graph-canvas-app-engine-is-welded-to-its-layout }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state }
  - { predicate: manifests-in, object: story:canvas-demos/tools/AnalystAssistant }
---

**Summary:** `sym:CanvasConfig` can only *configure* instances that code has already registered. An entry for an id nobody registered is stored and does nothing. So a visualisation can't be described by JSON alone: every layer, behaviour or layout outside a host's fixed bundle needs a `new …()` call or a React wrapper. This RFC lets a config entry carry `kind`. When no instance with that id exists, the canvas builds one from a **catalogue** of classes the host registered by kind.

| | |
|---|---|
| **What's missing** | Building a layer / behaviour / layout from a config entry, so a saved definition can be reloaded into an empty canvas |
| **Root cause** | Deliberate: config is "pure JSON keyed by id; classes are registered imperatively" (`file:packages/canvas/src/engine/CanvasConfig.ts#L1-L10`), and locked decision D3 of `doc:docs/unified-canvas-options-plan.md` ruled out a name→constructor map |
| **Defect rows** | none (feat). Core: F1–F6. Hosts: F7–F9. Proof: F10. Docs: F11 |
| **Open decisions** | D-1 (reverse locked D3) · D-2 (who fills the catalogue) · D-3 (how a class names its kind) · D-4 (explicit registration vs config-built instance) · D-5 (removal) |
| **Row status** | proposed 11 · accepted 0 · implemented 0 · landed 0 · deferred 0 · rejected 0 |

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | A story that wants to be "JSON in, canvas out" still mounts `<ElkLayout/>`, `<FocusBehaviour/>`, `<TextResolutionLODBehaviour/>` and adds `D3HierarchyLayout` in `onReady` | `story:canvas-demos/tools/AnalystAssistant` | `file:apps/storybook/stories/canvas-demos/tools/AnalystAssistant.stories.tsx` |
| S2 | `update()` resolves each slice by id. An unknown id is a silent no-op, yet its slice is still written to `view.definition` (a "ghost" entry) | `pkg:@invana/canvas` | `file:packages/canvas/src/engine/Canvas.ts#L1278-L1287`, `#L1322-L1342` |
| S3 | State import restores only into a canvas whose instances already exist under the same ids. Snapshot entries for unregistered ids are ignored | `pkg:@invana/canvas` | `file:packages/canvas/src/io/stateExport.ts#L166-L169`, `#L264-L270` |
| S4 | Export writes options only, never which class an entry is, so a snapshot can't say what to build | `pkg:@invana/canvas` | `file:packages/canvas/src/io/stateExport.ts#L190-L200` |
| S5 | The settings editor lists live instances only. An entry that exists only in the definition never shows | `pkg:@invana/canvas-ui` | `file:packages/canvas-ui/src/editor-panels/canvas-settings/CanvasSettingsEditorPanel.tsx#L364-L366` |
| S6 | `sym:GraphCanvasApp`'s instance set is fixed JSX. Adding one class means a child component, and `D3HierarchyLayout` / `BubbleSetsLayer` have no wrapper | `pkg:@invana/canvas-ui`, `pkg:@invana/canvas-react` | `file:packages/canvas-ui/src/apps/GraphCanvasAppRoot.tsx#L255-L290` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Put every class in `GraphCanvasApp`'s bundle, registered but switched off | rejected | Every app user pulls in elkjs / d3-hierarchy, canvas-ui gains peers, and it still only covers the bundle |
| R2 | D3's `type: ElkLayout` (a class reference) in config | rejected | A class can't be persisted, diffed or synced over the planned CRDT (`doc:docs/canvas-store-migration-plan.md` L210, `doc:docs/canvas-state-plan.md` L438-L441) |
| R3 | Move registration into `onReady` | rejected | Same `new …()` calls, just hidden |
| R4 | Something already maps kind → class | no | Only the renderer's shape registry does (`file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L208`); the canvas-ui registry keyed by kind holds editor schemas, not constructors (`file:packages/canvas-ui/src/editor-panels/canvas-settings/registry.ts#L292`) |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Every engine class already declares a unique `kind` (50 classes, no collisions in src) | `file:packages/canvas-core/src/abstracts/Layout.ts#L175`, e.g. `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L94` (`'elk-layout'`) | A stable, minify-safe name already exists. `GraphLayer` is the exception (no `kind`) |
| 2 | New `sym:KindCatalogue` in canvas-core: `register(ctor)`, `get(kind)`, one per canvas, exposed as `canvas.kinds` | — | Dependency-free (core-purity holds). Explicit per canvas, no global state |
| 3 | A config slice may carry `kind: string`. In `update()`, before `_applyToInstances`, any id that is **not registered** and whose slice has a `kind` the catalogue knows is built and registered | `file:packages/canvas/src/engine/Canvas.ts#L1271-L1273` | `update()` stays patch-only for existing ids (D5 intact). Only unknown ids are built |
| 4 | Construction argument per section: behaviour and layout get `{ id, ...slice }` (flat). Layer gets `{ id, options: slice, zIndex?, visible?, hittable?, cullable? }`, with those top-level keys lifted out | `file:packages/canvas-core/src/abstracts/Layer.ts#L62-L74`, `Behaviour.ts#L140`, `Layout.ts#L198` | Construction-only fields (`id`, `targetLayerId`) are set once, as today |
| 5 | Before init: added to the registry and mounted by `_activate`. After init: the live add path, same as a React wrapper today | `file:packages/canvas/src/engine/Canvas.ts#L1246-L1253` | One code path for config built before and after init |
| 6 | Behaviours are built **disabled**. `enabled: true` in the slice enables them, as today | `file:packages/canvas/src/engine/Canvas.ts#L1250-L1252`, `#L1330-L1336` | Rule 7 / D6 hold: nothing auto-enables |
| 7 | Unknown `kind`: one `console.warn`, the slice stays in the definition | — | A missing catalogue entry is visible, not silent; the definition still round-trips |
| 8 | Export writes each instance's `kind` into its slice | `file:packages/canvas/src/io/stateExport.ts#L190-L200` | A snapshot restored into an empty canvas with the same catalogue rebuilds everything |
| 9 | Hosts pass a catalogue: `new Canvas({ kinds })`, and `<GraphCanvasApp kinds>` / the canvas-react roots forward it | — | The story becomes `data` + `config` + a `kinds` list; no children, no `onReady` registration |

**Example (after):**

```ts
layouts: {
  elk:  { kind: 'elk-layout', targetLayerId: 'graph', algorithm: 'layered', direction: 'RIGHT' },
  tree: { kind: 'd3-hierarchy-layout', targetLayerId: 'graph', mode: 'tree' }
},
behaviours: { focus: { kind: 'focus', targetLayerId: 'graph', enabled: true } }
// host: <GraphCanvasApp data={data} config={config} kinds={[ElkLayout, D3HierarchyLayout, FocusBehaviour]} />
```

**What stays code, honestly:** the catalogue. A class can't live in JSON, and something has to import elkjs. JSON names *what* to build; the host decides *which classes are allowed*.

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/unified-canvas-options-plan.md` | supersedes D3; amends D1 | design, locked (D1/D3 never landed; D5 landed) | D2 (keyed by id), D5 (`update()` patch-only for existing ids), D6 (`enabled` never defaults true). D3's goal "custom classes with zero ceremony" becomes "one `kinds` entry" |
| `doc:docs/canvas-state-plan.md` L136 | relates-to | design, not shipped | Its sketch puts `type: GroupLayer` (a class) in the persisted definition, which conflicts with its own CRDT rule. A `kind` string resolves that |
| `doc:docs/architecture-proposal.md` L536-L540 | relates-to | draft | `registerShape(kind, ctor)`, the same idea one level down, which landed in the renderer |
| `rfc:feat-2026-10-05-graph-canvas-app-engine-is-welded-to-its-layout` | relates-to | accepted, F1–F4 uncommitted | `GraphCanvasAppRoot` is where `kinds` is threaded through (F8) |
| `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` | relates-to | proposed | Its restore-in-place stance holds; F6 only adds `kind` so an empty canvas can be restored too |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | proposed | `pkg:@invana/canvas-core` `abstracts/registries/KindCatalogue.ts` (new) + `abstracts/{Layer,Behaviour,Layout}.ts` | `sym:KindCatalogue` (`register(...ctors)`, `get(kind)`, `has`, duplicate-kind throws). Base classes get a static-side `kind` per D-3 | The vocabulary for kind → class, dependency-free | low: new code. Public surface changes, so `api/canvas-core.surface.txt` is regenerated | D-3 |
| F2 | feature | proposed | 50 classes across 10 packages | Move each `override readonly kind = 'x'` to the form D-3 picks; values **unchanged** | Classes become catalogue-registrable | **medium**: mechanical but touches every engine package. Values must not change (editor registry + saved state key on them) | F1 |
| F3 | feature | proposed | `file:packages/graph/src/layer/GraphLayer.ts` | Add `kind = 'graph-layer'` | The central layer can be built from config | low. Settings registry has no `graph-layer` schema, so the editor still falls back as today | F1 |
| F4 | feature | proposed | `pkg:@invana/canvas-core` (pure helper) | `buildFromSlice(catalogue, section, id, slice)` → instance or `undefined`; holds the per-section argument mapping (§2 step 4) | Construction logic is unit-testable outside `packages/canvas` (rule 10) | low | F1 |
| F5 | feature | proposed | `file:packages/canvas/src/engine/Canvas.ts` (`update`, `_activate`, `CanvasOptions`) + `file:packages/canvas/src/engine/CanvasConfig.ts` | `canvas.kinds` + `CanvasOptions.kinds`. `update()` builds unknown ids that carry a known `kind`, then applies as today. JSDoc rewritten (config may now build) | Config can create instances | **medium**: changes `update()` semantics for unknown ids, and every config path goes through it (init, editors, undo reconcile, import, playbook `settings`) | F4, D-4 |
| F6 | feature | proposed | `file:packages/canvas/src/io/stateExport.ts` | Export writes `kind` per instance; import goes through F5 so missing ids are built | A snapshot restores into an empty canvas with the same catalogue | medium: changes the serialised shape (additive; old snapshots without `kind` import exactly as today) | F5 |
| F7 | feature | proposed | `pkg:@invana/canvas-react` `Canvas.tsx`, `GraphCanvas.tsx`, `useCanvasEngine.tsx` | `kinds` prop forwarded to the engine | React hosts can pass a catalogue | low | F5 |
| F8 | feature | proposed | `file:packages/canvas-ui/src/apps/GraphCanvasAppRoot.tsx`, `GraphCanvasApp.tsx` | `kinds` prop. The bundle's own classes are in the catalogue by default, so config can add a *second* instance of a bundle class too | `GraphCanvasApp` hosts are JSON-only | low | F7 |
| F9 | feature | proposed | `file:packages/canvas/src/engine/Canvas.ts` (registry add path) | Per D-4: an explicit add of an id that config built **replaces** it instead of throwing | React wrappers and config can coexist during migration, whichever lands first | medium: changes duplicate-id behaviour for config-built ids only | F5, D-4 |
| F10 | proof | proposed | `file:apps/storybook/stories/canvas-demos/tools/AnalystAssistant.stories.tsx` | Drop the three children and the `onReady` layout add; config carries `kind`, `kinds={[…]}` on the app | The motivating story is `data` + `config` + `playbook` + `kinds` | low | F8 |
| F11 | docs | proposed | `doc:docs/unified-canvas-options-plan.md`, `pkg:@invana/canvas` `CLAUDE.md` if it restates the rule | Mark D3 superseded by this RFC (banner, D3 kept) | The locked decision record stays truthful | low | D-1 |

**Out of scope (named so nobody assumes them):** removing an instance by deleting its slice (D-5); a `playbook` prop on `GraphCanvasApp`, so the story still loads its playbook in `onReady`; a global catalogue filled by side-effect imports (D-2 option b).

## 5. Blast radius

**Upstream** (what this builds on)

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:Canvas.update` / `_applyToInstances` | The single door every config write uses; F5 adds construction ahead of it | Build-then-apply ordering must hold or a new instance misses its first slice |
| U2 | `scene:layer:add` re-apply (`file:packages/canvas/src/engine/Canvas.ts#L508-L511`) | Late layers re-read their slice; behaviours and layouts have no equivalent | F5 applies the slice right after building, so this isn't relied on |
| U3 | `sym:Canvas._reconcileDefinition` (undo) | An undo that removes a slice pushes `undefined` keys; it never removes instances | Undoing an edit that built an instance leaves it in place (D-5) |
| U4 | Base constructor shapes (`Layer`: nested `options`; `Behaviour` / `Layout`: flat) | F4's mapping depends on them | A subclass with a custom constructor signature can't be built from config. Audit in V3 |

**Downstream** (what could break)

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| W1 | `pkg:@invana/canvas-ui` settings editor (`CanvasSettingsEditorPanel`, `DEFAULT_CANVAS_SETTINGS_SCHEMAS`) | reads `instance.kind` | F2 must keep instance `kind` readable with the same values | Keep an instance getter (D-3) |
| W2 | All 50 classes with `kind`, in 10 packages | published API | Declaration form changes (F2) | Mechanical; values frozen |
| W3 | Saved snapshots / `canvas.get()` consumers, invana/studio | serialised state | New optional `kind` key per slice | Additive; old snapshots still import |
| W4 | `api/canvas-core.surface.txt`, `api/canvas.surface.txt` | API snapshot | New exports (`KindCatalogue`, `kinds` option) | Regenerate in the same change (rule 16) |
| W5 | Every React-wrapper story (≈20 stories with `<ElkLayout>` etc.) | stories | None unless they also put `kind` in config; F9 covers that case | none |
| W6 | `packages/graph/tests/canvas/playbookPr2.test.ts`, `playbookPr3.test.ts` | tests | Declare a test behaviour with `kind = 'counting'` in both | Update to the D-3 form |
| W7 | Playbook steps with `settings` | playbook runtime | A step's `settings` goes through `update()`, so a step could now **build** an instance | Intended; covered by V6 |
| W8 | `docs/unified-canvas-options-plan.md` D3 | locked doc | Reversed | F11 |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Unit: catalogue register / get / duplicate kind throws | `pkg:@invana/canvas-core` tests | pass | F1 |
| V2 | pending | Unit: `buildFromSlice` per section (layer options nesting + lifted `zIndex`; behaviour built disabled; unknown kind → `undefined`) | `pkg:@invana/canvas-core` tests | pass | F4 |
| V3 | pending | Audit: every class with `kind` builds from `{ id, ...slice }` / layer form; list any custom constructors | grep + unit test looping the catalogue | all build, or listed as exceptions | F2, F3 |
| V4 | pending | Integration: `GraphCanvas` with empty registries + config carrying `kind` builds elk / tree / focus and runs `activeLayout` | `pkg:@invana/graph` tests | instances present, layout runs | F5 |
| V5 | pending | Round trip: export from a built canvas, import into an empty canvas with the same catalogue | `pkg:@invana/graph` tests | identical definition + instance set | F6 |
| V6 | pending | A playbook step whose `settings` adds a `kind` entry builds the instance; ◀ keeps it (D-5) | `pkg:@invana/graph` tests | as stated | F5 |
| V7 | pending | React wrapper mounting after config built the same id replaces, no throw | Storybook smoke | no duplicate-id error | F9 |
| V8 | pending | AnalystAssistant plays all 7 steps with no children and no `onReady` registration | `story:canvas-demos/tools/AnalystAssistant` (visible tab) | matches today's render | F10 |
| V9 | pending | **Control:** a config with no `kind` anywhere behaves exactly as today; the `GraphCanvasApp` bundle stories render unchanged | `story:canvas-demos/by-casestudies/org-directory/OwnershipChain`, `story:graph/Playbook/Walkthrough` | unchanged | F5, F8 |
| V10 | pending | `pnpm check-types`, `pnpm lint` (incl. `check-boundaries`, `check-api-surface`), `pnpm build` | repo | green | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Reverse locked D3 ("no name→constructor registry map")? | (a) yes, superseded by this RFC; (b) no, keep imperative registration | **(a)**. D3 predates the CRDT and studio goals; a class reference can't be saved or synced, and a kind string can | open |
| D-2 | Who fills the catalogue? | (a) explicit per canvas: `kinds={[…]}` / `canvas.kinds.register(…)`; (b) global, each package registers itself on import; (c) (a) plus the `GraphCanvasApp` bundle classes by default | **(c)**. Explicit, tree-shakeable, no hidden globals. (b) makes "which classes exist" depend on import order | open |
| D-3 | How does a class name its kind without being built? | (a) `static readonly kind`, with a base instance getter reading it; (b) keep the instance field and also add a static (two copies); (c) `register('elk-layout', ElkLayout)`, caller supplies the string | **(a)**. One source, mirrors the renderer's `static kind` shapes. Costs the F2 sweep | open |
| D-4 | Config built id `x`, then code explicitly adds `x` | (a) explicit replaces the config-built one; (b) throw as today; (c) explicit add is skipped | **(a)**. Explicit code is the more specific intent, and React roots apply config before child wrappers mount | open |
| D-5 | Does removing a slice (or `null`) remove the instance? | (a) not now, removal stays explicit (D5 of the plan); (b) `null` slice removes | **(a)** now, revisit with the CRDT work. Removal semantics affect undo and sync and deserve their own RFC | open |
| D-6 | Kind naming is inconsistent (`'elk-layout'` vs `'focus'`, `'degree-size'` for `NodeCentralityBehaviour`) | (a) keep values; (b) normalise now | **(a)**. Values are keys in the editor registry and in saved state; renaming is a separate migration | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-12 | Opened | proposed | From the AnalystAssistant "JSON only" rewrite: three wrappers + an `onReady` add remained because config can't build instances |
