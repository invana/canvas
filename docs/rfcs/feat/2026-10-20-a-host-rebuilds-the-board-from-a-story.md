---
id: feat-2026-10-20-a-host-rebuilds-the-board-from-a-story
type: feat
title: Canvas ships the boards — Explorer, schema (ER) and DAG — and a host only configures them
status: accepted
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/graph, pkg:@invana/graph-layout-elkjs, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-10-20-the-board-shows-every-tool-at-once }
  - { predicate: depends-on, object: rfc:feat-2026-10-20-an-unsaved-change-looks-saved }
  - { predicate: verified-by, object: story:canvas-demos/tools/CanvasExplorer }
---

| | |
|---|---|
| Motivation | Studio, the first product on canvas, holds ~2,900 lines of generic canvas code: three boards copied from stories, five engine workarounds, three theme paths, two colour hashes, four copies of controlled selection |
| Design | Canvas owns every board, behaviour, panel, menu and engine rule; a host passes data, configuration and **seams** (callbacks for what needs its backend). Nothing a second product would need stays in Studio |
| Rows | P0 F1–F4 · P1 F5–F16, F37–F40 · P2 F17–F20 · P3 F21–F24 · P4 F25–F31 · P5 F32–F36 — all accepted |
| Row status | proposed 0 · accepted 6 · implemented 33 · deferred 1 · landed 0 |
| Open decisions | none — D1–D6 accepted in review on 2026-10-20, D7–D9 on 2026-10-21 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The Explorer board is `story:canvas-demos/tools/CanvasExplorer` copied into Studio: modes, rows, dock, menus, rail, bridges | Studio `packages/explorer/src/ExplorerCanvas.tsx` (1,408 lines) | the story is the stated reference in its header |
| M2 | The schema (ER) board and the task-flow DAG are stories copied the same way, JSON templates included | Studio `packages/canvases/src/model/*`, `taskflow/*` | `GlobalModel.stories.tsx`, `WorkflowPlan.stories.tsx` |
| M3 | Engine defects are worked around in the host, once per board | redraw after an un-animated layout ×3, ELK worker ×4, StrictMode config ×1, theme wiping element styles ×1 | P0 fix RFCs |
| M4 | One concern, several mechanisms: theme → canvas ×3, CSS-var probe ×5, type-colour hash ×2 (they never agree), controlled selection ×4 | Studio `packages/canvases/src/theme.ts`, `typeColor.ts`; `sym:typeColor` in canvas-ui | inventory 2026-10-20 |
| M5 | Editing data on the board — net change → ordered edits, saved ids adopted — is generic but lives in Studio | Studio `packages/explorer/src/edit/dataEdits.ts` | no engine-specific logic except the wire call |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Engine defects are fixed in the engine; each has its own `fix/` RFC | P0 | workarounds are deleted, not moved |
| 2 | `sym:GraphBoard` (canvas-ui) is the Explorer board: the story's composition as a component; its rows, dock, modes, menus and panels are exported presets | P1 | a host renders one component; a story renders the same one |
| 3 | A host extends rather than replaces: `menus` takes extra items per target, `panels` takes a function over the default set, `elementPanel` / `changesPanel` take the panel props they already have | P1 | Studio adds *Expand…*, *Versions*, provenance, the save without a fork |
| 4 | What needs the host's backend is a callback: `onSave`, `onExpand`, `onLayoutStart` / `onLayoutEnd`, `onProgress`, `saveDisabledReason` | P1–P2 | canvas imports no toaster, telemetry, auth or HTTP |
| 5 | Board policies (leaving a mode puts its tools down; the minimap only in work modes; Present opens on step 1; a click opens Element; leaving with unsaved changes asks) are `sym:GraphBoard` defaults, each one switchable | P1 | Studio's page shrinks to its seams |
| 6 | Unsaved changes become an ordered list of neutral edit ops in `@invana/graph`; a host maps ops to its wire format | P2 | another backend reuses the batching |
| 7 | One theme path: `sym:CanvasThemeSync` reads a token map (design-kit names by default); one CSS-colour probe; one type-colour hash on the theme's categorical palette | P3 | the legend, the paint and the panels agree on a type's colour |
| 8 | The schema board (frames, schema cards, Detail templates, connect veto) and the layered DAG are canvas-ui components with data props | P4 | Studio's Modeller and task views pass data |
| 9 | Remaining helpers move: controlled selection, thumbnail capture, render preference, store positions, `select(id)` | P5 | Studio has no canvas helper of its own |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-10-20-the-board-shows-every-tool-at-once` | depends-on | implemented | modes, rail, dock, menus — `sym:GraphBoard` composes them |
| `rfc:feat-2026-10-20-an-unsaved-change-looks-saved` | depends-on | implemented | the tracker and Changes panel P2 builds on |
| invana `doc:docs/for-developers/building-studio/refactor-plan.md` §2.6 | the host side of this RFC | accepted | which Studio files go, per phase |

## 4. The change

**P0 — engine defects (each its own `fix/` RFC)**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `pkg:@invana/graph-layout-elkjs` | the default worker loads under a bundler; the synchronous fallback constructs | ELK needs no host `workerFactory` | a worker URL is bundler-sensitive — check Vite and Storybook | — |
| F2 | defect | implemented | `pkg:@invana/graph` `sym:GraphLayer` | an un-animated layout that settles draws what it placed | no host `redraw()` on `layout:run:end` | paint timing — never low | — |
| F3 | defect | implemented | `pkg:@invana/canvas-react` engine creation | a StrictMode remount keeps the config | no host `canvas.update(config)` on ready | lifecycle — never low | — |
| F4 | defect | implemented | `pkg:@invana/graph` `sym:GraphLayer.applyTheme` | a theme change keeps per-element and group styles | no host re-hue on `theme:change` | how every themed story looks | — |

**P1 — the Explorer board**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F5 | defect | implemented | `pkg:@invana/canvas-ui` `sym:GraphBoard` | the board as a component: layers, behaviours, modes, rows, dock, minimap, menus, rail, presenter | M1 | new public surface | F1–F4 |
| F6 | defect | implemented | canvas-ui `board/presets.ts` | `BOARD_MODES`, `WORK_MODES`, `VIEW_MODES`, `BOARD_ROW_ITEMS`, `BOARD_VIEW_ROW_ITEMS`, `BOARD_DOCK_ITEMS`, `ANNOTATE_TOOLS`, `BOARD_CONFIG` | a host composing its own board reuses them | — | F5 |
| F7 | defect | implemented | canvas-ui `sym:defaultBoardMenus` | board / node / edge / selection menus, with `extra` items per target | Studio adds *Expand…* only | — | F5 |
| F8 | defect | implemented | canvas-ui `sym:defaultBoardPanels` | Legend · Styling · History · Element · Changes · Export; options for the Element and Changes panels; a host inserts its own | Studio adds *Versions* | — | F5 |
| F9 | defect | implemented | `sym:GraphBoard` policies | mode change puts tools down; minimap in work modes; Present starts at step 1; inspect opens Element; leave guard while unsaved | each prop-switchable | — | F5, F18 |
| F10 | defect | implemented | `sym:GraphBoard` `onLayoutStart` / `onLayoutEnd` | the engine already re-runs the active layout on `data:changed` (`sym:GraphCanvas.wireActiveLayout`); the board reports each run, and a re-registered active layout is wired again (`useCanvasEngine` replay) | Studio's telemetry rides the callbacks; no host re-run | — | F2, F3 |
| F11 | defect | implemented | canvas-ui `sym:LayoutProgress` | the message line counts the solve; a slow solve calls `onSlowLayout({ cancel })` | Studio raises its own toast | — | F10 |
| F12 | defect | implemented | `sym:GraphBoard` over `sym:useApplyTypeStyling` | the board's config resolves colour (`colorForType`) and label (`readableLabel`); the patch styles over them once the config landed; a type with no label key keeps the template's label | the Styling panel paints live | how styled boards look | F13 |
| F13 | defect | implemented | `pkg:@invana/graph` label resolver | readable node label: `name` · `title` · `label` · `code` · `description`, then type, then id | one fallback for every board | — | — |
| F14 | defect | implemented | `pkg:@invana/graph` edge density | fade by edge count joins `sym:EdgeLODBehaviour`; hovered / selected edges stay opaque | — | — | — |
| F15 | defect | implemented | canvas-ui `sym:MessageStatus` · `sym:ViewStatus` · `sym:RendererStatus` | hover / message; thinned + selection + zoom; backend + fps | Studio composes its footer from them | — | F14 |
| F16 | dressing | implemented | canvas-ui icon registry | `versions` | no blank rail icon | — | — |
| F39 | defect | implemented | `sym:ElementViewPanel` `footer` | a function of the shown element, as `renderExtra` is | a host's acts follow the element | — | — |
| F40 | defect | implemented | `sym:GraphBoard` `theme` | `ThemeBehaviour` + `CanvasThemeSync` by default; `false` for a host that themes the canvas | the story keeps its theme; Studio keeps its own until F22 | — | `rfc:fix-2026-10-20-a-theme-change-wipes-frame-colours` T2 |
| F37 | defect | implemented | `sym:BoardLayoutPopover` | the popover keeps inside the board, as the context menu does; its header names the preset once | opened near the bottom it is cut off; the header reads *Layout · Layout* | — | — |
| F38 | defect | deferred | `sym:MenuItemList`, the layout cards | menu rows are `menuitem`s, layout cards are buttons — an accessible name for each | a host's e2e reaches them by role | the kit's `MenuItem` is in `pkg:@invana/ui`, which holds another session's uncommitted work — unblocked when it lands | — |

**P2 — editing data**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F17 | defect | implemented | `pkg:@invana/graph` `sym:unsavedToEditOps` | net change → ordered ops (edges deleted first; a relationship's type change is delete + add); `hidden` keys never sent | M5 | public type surface | — |
| F18 | defect | implemented | `pkg:@invana/graph` `sym:adoptBackendIds` | new elements take the backend's ids, relationships follow, as the engine actor | the swap is not unsaved | store ops | — |
| F19 | defect | implemented | `pkg:@invana/graph` `sym:saveUnsaved(canvas, persist)` | ops → host `persist` → `adoptBackendIds` → saved | Changes `onSave` in one line | — | F17, F18 |
| F20 | defect | implemented | canvas-react `sym:useUnsavedGuard` | `beforeunload` while unsaved | — | — | — |

**P3 — theme and colour**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F21 | defect | implemented | `pkg:@invana/graph` `sym:readCssColor` | one probe (hsl, oklch, hex, `var()`), cached per theme stamp; `resolveAccentVar` and the unsaved-changes colours use it | five copies become one | — | — |
| F22 | defect | implemented | canvas-react `sym:CanvasThemeSync` `source: 'tokens'`; graph `sym:MiniMapLayer` role colours | the palette read from the host's tokens (`sym:DESIGN_KIT_TOKENS`, overridable); a minimap colour may name a palette role; `GraphBoard theme="tokens"` | Studio's three paths become one | none for `source: 'library'`, the default | F21 |
| F23 | defect | implemented | canvas-ui `sym:typeColor` | design-kit's slot hash (`colorSlotByString`) read live from `--color-data-N`; the fixed palette only where those tokens are unset | legend, paint and Studio's type lists agree | canvas-ui stories' type colours shift once | F21 |
| F24 | defect | implemented | graph `sym:ValueLookup` `categorical` | `{ bind: 'data.hue', categorical: true }` resolves slot N (1-based, wrapping) to the theme's categorical ramp; `GraphLayer` keeps the ramp from `theme:change` | ER hues follow the theme with no host re-hue — lands with F25, the schema board that uses it | — | F22, F25 |

**P4 — schema (ER) and DAG boards**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F25 | defect | implemented | canvas-ui `sym:SchemaBoard` | framed types, ELK, Detail switcher, settings dock, connect with a host veto | M2 | new public surface | F1–F4, F24 |
| F26 | defect | implemented | canvas-ui `sym:useDetailTemplates` | Detail levels as config patches, per-type bindings | one mechanism for ER and DAG | — | — |
| F27 | defect | implemented | `pkg:@invana/graph` `sym:schemaCardStructure` · `sym:schemaTypeChip` | a freeform structure template: hue-washed header, icon, title, subtitle, description, one row per property (type chip, name, `key`, type); one chip table shared with `sym:schemaTableCard` | Studio's `schemaCard` goes | how schema stories look | F24 |
| F28 | defect | implemented | `pkg:@invana/graph` `sym:NodeStylingTemplate` `fillLookup` · `strokeLookup` | a simple structure's fill and border from a record field — a frame washed in its model's hue | Studio's per-node `frameStyle` goes | — | F24 |
| F29 | defect | implemented | canvas-ui `sym:renderSchemaNode` | a type's description and one row per property on hover | Studio's `renderModelNode` goes | — | — |
| F30 | defect | implemented | canvas-ui `sym:LayeredDagBoard` | left→right DAG: column seeding, tone map, legend from keys, connect | Studio's `LayeredCanvas` and `TaskFlowCanvas` pass data | — | F1–F3, F26 |
| F31 | defect | implemented | `pkg:@invana/canvas` `fitCamera.maxZoom` · `fitView(padding, maxZoom)` | a fit never zooms past `maxZoom` | no host re-fit capped at 100% | — | — |

**P4 surfaces** — the shapes the rows above publish

| Surface | Shape | Default | Notes |
|---|---|---|---|
| `sym:SchemaBoard` `data` | `GraphData` — frames (`group` stylings) and types; a type's `data` is `sym:SchemaTypeData` | — | edges carry their own style (a host's dash) |
| `sym:SchemaBoard` `config` | the whole `CanvasConfig` the board mounts on | — | structures, stylings, layouts, behaviours |
| `sym:SchemaBoard` `detail` | `sym:DetailTemplates` — `{ templates: Record<level, Partial<CanvasConfig>>, options: Record<level, label>, initial }` | no Detail switcher | |
| `sym:SchemaBoard` `connect` | `{ onConnect(sourceId, targetId) => refusal \| null, label, panel: ReactNode \| null, panelLabel, onClosePanel }` | no connect tool | a drag never adds an edge; a refusal shows in the message bar; **Shift** connects while held; an accepted drag opens `panel` in the dock |
| `sym:SchemaBoard` `selected` · `onSelect` | `{ kind: 'node' \| 'edge', id } \| null` | uncontrolled | one element at a time; an empty click clears |
| `sym:SchemaBoard` `renderNode` · `renderEdge` | hover card renderers | `sym:renderSchemaNode` · `sym:renderSchemaEdge` | a frame has no card |
| `sym:SchemaBoard` `schemaCard` | `sym:SchemaCardOptions` — `{ subtitle?: string }` (`{data.x}` interpolated) | `{data.frame}` | for the `schema:*` structure |
| `sym:SchemaBoard` `title` · `message` · `height` · `preference` · `dockSection` · `headerClassName` | pass-through to `sym:GraphCanvasApp` | — | |
| `sym:SchemaTypeData` | `{ label, description?, icon?, frame?, hue?, properties: { name, type, identity?, tags?: string[] }[] }` | — | `hue` is a categorical slot (F24) |
| `sym:detailConfig(base, templates, level, data, opts)` | pure: the level's patch merged over `base`; the `*` node type expands into one binding per type without its own; a structure named `prefix:*` becomes `prefix:<type>`, built by `opts.structures[prefix](node)` | `schema` → `sym:schemaCardStructure` | `sym:useDetailTemplates` applies it live: patch, re-run the active layout with `fitCamera` |
| `sym:ValueLookup.categorical` | `true` — the bound value is a 1-based slot into the theme's ramp | — | `map` still wins when both are set |
| `sym:LayeredDagBoard` `data` | `GraphData`; a node's `data.column` seeds its place before any layout (column × 190, row × 90), `data.text` · `data.tone` · `data.disabled` draw it on the default config; an edge's `data.label` · `data.dashed` · `data.highlight` | — | a node with its own `position` keeps it |
| `sym:LayeredDagBoard` `config` · `detail` | as `sym:SchemaBoard`'s; `detail` with one level hides the switcher | `sym:DAG_BOARD_CONFIG` — ELK layered, left → right; no Detail | with the default config the board draws nodes and edges from `tones` (D10) |
| `sym:LayeredDagBoard` `tones` | `Record<string, number>` — a tone's colour | `sym:DAG_TONES` (`muted` · `queued` · `info` · `running` · `success` · `warning` · `error`) | also colours the legend's dots |
| `sym:LayeredDagBoard` `legend` | `{ keys: { swatch: 'node' \| 'edge', tone?, dashed?, label }[], note? }` — a strip at the bottom | none | `error` replaces its copy, in the destructive colour |
| `sym:LayeredDagBoard` `chrome` | `'app'` — header (title, Detail, settings dock) and footer · `'panel'` — the canvas alone, with the legend and the connect switch over it | `'app'` | Studio's work panels are `'panel'`, the task flow `'app'` |
| `sym:LayeredDagBoard` `layout` | `'layered'` runs ELK · `'fixed'` keeps the seeded columns | `'layered'` | a fit never zooms past 100% |
| `sym:LayeredDagBoard` `connect` | `{ onConnect(sourceId, targetId) => refusal \| null, label, hint? }` | no connect tool | the edge comes from the host's data; `hint` replaces the legend's note while connecting |
| `sym:LayeredDagBoard` `selected` · `onSelect` · `renderNode` · `renderEdge` · `title` · `message` · `emptyHint` · `height` | as `sym:SchemaBoard`'s; `emptyHint` is shown in place of a board with no nodes | — | |

**P5 — the rest**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F32 | defect | accepted | canvas-react `sym:useControlledSelection` | `selected` ↔ click-select, both ways | four host bridges go | — | — |
| F33 | defect | accepted | `pkg:@invana/canvas` `sym:captureThumbnail` | the viewport as a capped PNG | — | — | — |
| F34 | defect | accepted | canvas-react `sym:useRenderPreference(storageKey)` | WebGPU when usable, remembered | — | — | — |
| F35 | defect | accepted | `pkg:@invana/graph` `sym:GraphStore.positions` · `sym:ClickSelectBehaviour.select(id)` | positions by id; select without naming the kind | — | — | — |
| F36 | defect | accepted | `pkg:@invana/canvas` io | `isCanvasStateSnapshot` guard | — | — | — |

## 5. Blast radius

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pkg:@invana/ui` (design-kit, local link) | every panel draws on it | kit WIP of another session ships with a build |
| U2 | the `board.*`, `unsaved.*`, `tool.active`, `select.mode` commands | presets run them | — |

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:canvas-demos/tools/CanvasExplorer` | story | renders `sym:GraphBoard` | rewritten in P1 |
| X2 | `story:canvas-demos/by-casestudies/global-model/GlobalModel`, `…/workflow/WorkflowPlan` | stories | render `sym:SchemaBoard` / `sym:LayeredDagBoard` | rewritten in P4 |
| X3 | `sym:useApplyTypeStyling`, `sym:typeColor` (canvas-ui schema) | published API | merged (F12, F23) | callers in this repo move |
| X4 | Studio (invana repo) | app | deletes per phase | refactor-plan §2.6 |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `test`, `check-types`, `lint`, `check-api-surface`, boundaries; storybook `tsc` | graph, canvas-react, canvas-ui, graph-layout-elkjs | clean (392 graph tests) | F1–F16, F20, F37, F39, F40 |
| V2 | pass | Playwright walk | `story:canvas-demos/tools/CanvasExplorer` on `sym:GraphBoard` | Explore, Edit (a dropped node opens as new; Changes counts it), Present (stepper, narration); no console errors | F5–F16 |
| V3 | pass | Studio `turbo run check-types`, Biome, the board e2e | invana `studio/` | green; Tree preset lays out; Edit → Add node → typed from the model → Save → read back from Neo4j; probe removed | F5–F16, F20 |
| V4 | partial | Playwright walk | schema story at each Detail; Studio All models (High · Medium · Low, a stitch drag opening the declare card) and one model's board (ME25 · ME26) | same hues and cards as before; no console errors | F24–F29, F31 |
| V5 | pending | control: a board with no modes | `story:canvas-ui/apps/GraphCanvasApp/RightInspector` | unchanged | F5, F9 |
| V6 | pass | a story per piece, walked in Playwright with no console errors | `story:canvas-ui/apps/SchemaBoard/*` ×4 · `…/DetailTemplates` · `…/GraphBoard/*` ×3 · `story:canvas-ui/editors/ElementEditorPanel/*` ×3 · `story:canvas-ui/components/StatusSections` · `story:canvas-react/board/BoardToolKeys` · `story:canvas-react/hooks/UseUnsavedGuard` · `story:graph/Nodes/SchemaCard` · `story:graph/Groups/HueFrames` · `story:graph/Behaviours/UnsavedEdits/SaveUnsaved` | each renders its states; `fitMaxZoom: 1` holds a small graph at 100 % | F5–F31 |
| V7 | pass | Playwright walk | `story:canvas-ui/apps/LayeredDagBoard/*` ×5, `story:canvas-demos/by-casestudies/workflow/WorkflowPlan`; Studio: a plan's Flow (Circles → Cards), a project's Branches | panel face: tones, legend, seeded columns, `fixed` keeps them; connect: a loop refused in the strip, an accepted edge drawn from the host's data; app face: Detail switches live; every fit at most 100%, framed on first open; no console errors; Studio's plan-page, projects, impact and agents specs as before (19 pass; the known `⋯ opens` failure unchanged) | F30 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does generic canvas logic live? | in each host · in canvas | canvas; a host passes data, configuration and seams | accepted |
| D2 | The board: one component or presets only? | component · presets | a component, with its presets exported for hosts that compose their own | accepted |
| D3 | A host's own toaster, telemetry, auth, HTTP | imported by canvas · callbacks | callbacks — canvas imports none of them | accepted |
| D4 | Engine-specific vocabulary (provenance keys, *Ask about*, the backend's expand filters) | in canvas · in the host | in the host, through `hiddenKeys`, `renderExtra`, `footer` and menu `extra` | accepted |
| D5 | Theme tokens | hard-coded in graph · a map | a map in graph; canvas-react defaults it to the design-kit names | accepted |
| D6 | Order | at once · in phases | phases P0–P5; each leaves Studio green | accepted |
| D7 | The schema card | extend the composite `sym:schemaTableCard` · a freeform structure generator | freeform: Detail levels bind types to structures, and only structures take theme roles and lookups; the composite stays for per-row hover, sharing one chip table | accepted |
| D8 | The DAG boards | one `sym:LayeredDagBoard` · one per Studio board | one: Detail templates (task flow) and a tone map + legend (layered) are both its props | accepted |
| D9 | P4's order | at once · schema first, then DAG | schema first (F24–F29, F31), then F30; each half leaves Studio green | accepted |
| D10 | How the default DAG face draws | node-type templates · tone resolvers on the layer | resolvers on the layer: a disabled step is hollow, faded and dashed, which no styling lookup expresses; a host with its own `config` (the task flow) draws by its templates instead | accepted |
| D11 | Studio's two DAG canvases | delete and call the board everywhere · keep each as a data mapping | keep `LayeredCanvas` and `TaskFlowCanvas` as data mappings over the board — their nine callers do not change, and the kind's legend copy stays Studio's | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened from the inventory of Studio's canvas code; phases P0–P5 and D1–D6 accepted in review | accepted | — |
| 2026-10-20 | P0 F1–F4 written as `fix-2026-10-20-an-elk-layout-hangs-under-a-bundler`, `…-an-unanimated-layout-draws-nothing`, `…-a-strictmode-remount-drops-the-config`, `…-a-theme-change-wipes-frame-colours`; Studio's workarounds deleted | implemented | F37–F38 found while verifying |
| 2026-10-20 | The schema board frames its graph low in the viewport — before and after P0 | accepted | for F25 |
| 2026-10-20 | P1 written: `sym:GraphBoard`, presets, `defaultBoardMenus`, `defaultBoardPanels`, status sections; the story and Studio's Explorer render it; F20 (`useUnsavedGuard`) brought forward | implemented | F38 deferred; F39–F40 added while building |
| 2026-10-20 | P2 written: `unsavedToEditOps`, `adoptBackendIds`, `saveUnsaved` in graph (3 tests); Studio's save is the API call and its hidden keys; verified live — a node saved to Neo4j and read back | implemented | — |
| 2026-10-20 | P3 written: `readCssColor`, `CanvasThemeSync source: 'tokens'`, minimap role colours, `typeColor` on design-kit's slot; Studio's theme bridge, palette hook and `typeColor.ts` deleted; Explorer, model board and plans verified in Studio | implemented | F24 moves to P4 |
| 2026-10-21 | P4 surfaces written; D7–D9 accepted; F24 un-deferred for F25 | accepted | — |
| 2026-10-21 | P4 schema half written: `sym:SchemaBoard` with `SCHEMA_BOARD_CONFIG` / `SCHEMA_DETAIL` presets, `sym:detailConfig` · `sym:useDetailTemplates`, `sym:schemaCardStructure` · `sym:schemaTypeChip`, the categorical lookup, styling fill/stroke lookups, `fitCamera.maxZoom`; the GlobalModel story renders the board (its Force view goes — the board is ELK only); Studio's model config, JSON and hover card deleted. The low framing was the Model tab's panel not filling its row — a design-kit board renderer defect, fixed there | implemented | F30 next |
| 2026-10-21 | Stories written for every piece P1–P4 added (V6); `CLAUDE.md` rule 11 now requires a story per canvas piece in the same change. The board annotations (`rfc:feat-2026-10-21-the-board-cannot-show-what-people-noted-on-the-data`) are another session's, in progress — their stories are owed by that RFC | implemented | — |
| 2026-10-22 | P4 DAG half designed: `sym:LayeredDagBoard` surfaces; D10, D11 accepted | accepted | — |
| 2026-10-22 | P4 DAG half written: `sym:LayeredDagBoard` (`chrome` app · panel, tones, `sym:DagLegend`, seeded columns, `layout` fixed, connect with a veto, Detail); `WorkflowPlan` renders it (its Force switch goes — the board is ELK only); Studio's `LayeredCanvas` and `TaskFlowCanvas` are data mappings over it (D11). Found while building: the first run lays out before the data lands, and the canvas's own re-layout as it lands carries no fit — the board frames every settled run, capped, and refits on a resize until the camera is moved; `ElkLayout`'s uncapped end fit is off. `sym:SchemaBoard` shares the first-run gap and does not yet frame on settle | implemented | P5 not started |
