---
id: feat-2026-09-16-no-way-to-render-a-schedule-on-the-canvas
type: feat
title: The canvas can draw a graph but not a schedule
status: proposed
opened: 2026-09-16
decided: null
landed: null
packages: [pkg:@canvas/storybook, pkg:@invana/graph, pkg:@invana/canvas, pkg:@invana/canvas-core]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/graph-canvas-apps-plan.md }
  - { predicate: relates-to, object: doc:docs/usecases-storybook-taxonomy-plan.md }
  - { predicate: depends-on, object: file:packages/graph/src/layout/OneShotPositionLayout.ts }
---

# The canvas can draw a graph but not a schedule

| | |
|---|---|
| **What's missing** | A time-axis chart. Tasks with start/end dates, laid out on rows, with dependency arrows and a pinned time header. Today `pkg:@invana/graph` is the only domain on the engine and it has no concept of a scale-bound axis. |
| **Approach** | A **read-only prototype story**, not a package. `sym:GraphLayer` supplies bars + dependency connectors + picking; a story-local `GanttLayout` maps `date → x` / `row → y`; a story-local `TimeAxisLayer` + `TaskListLayer` (both `sym:ScreenLayer`) project the pinned chrome off the camera. |
| **Why a story first** | The two hard parts — who owns the inverse time scale, and how pinned chrome works without a new layer base — are answerable in a story for ~0 published surface. Promoting to `pkg:@invana/gantt` is a later RFC (`D-5`). |
| **Engine changes** | **None proposed.** Two constraints are absorbed by the design instead (`M4`, `M6`), each with a named cost. |
| **Open decisions** | `D-1` story namespace · `D-2` uniform zoom · `D-3` dataset home · `D-4` axis label host · `D-5` promotion to a package |
| **Row status** | proposed 7 · accepted 0 · implemented 0 · landed 0 · deferred 0 · rejected 0 |

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The engine has exactly one domain — graph. Every layer, behaviour and layout assumes free 2-D placement. | `pkg:@invana/graph` | `file:packages/graph/src/layer/GraphLayer.ts`, `file:packages/graph/src/canvas/GraphCanvas.ts` |
| M2 | A schedule is a graph with a forced position function: `x = timeScale(start)`, `width = timeScale(end) − timeScale(start)`, `y = rowIndex × rowHeight`. Dependencies are edges. Nothing about it needs a new renderer. | — | `sym:OneShotPositionLayout` already writes exactly this shape (`ids` + interleaved `Float32Array`) |
| M3 | Variable-width bars are already expressible — `NodeStyle.shape` is a **per-node resolver function**, not a constant. | `file:packages/graph/src/layer/types.ts#L40` | `shape: (n) => ({ kind: 'circle', radius: … })`; `kind: 'rect'` takes `width`/`height`/`cornerRadius` (`file:packages/canvas-core/src/specs/shape.ts#L65`, `file:packages/graph/src/layer/types.ts#L227-L231`) |
| M4 | Pinned chrome has no dedicated base — `sym:WorldLayer` and `sym:ScreenLayer` are deliberately pure, and a Gantt header is half of each (fixed in y, camera-driven in x). | `file:packages/canvas/src/layers/WorldLayer.ts#L1-L17`, `file:packages/canvas/src/layers/ScreenLayer.ts#L1-L17` | No third base exists |
| M5 | But the pattern already ships: `sym:MiniMapLayer` is a `ScreenLayer` that subscribes to camera events and re-projects itself. | `file:packages/graph/src/layer/MiniMapLayer.ts#L264-L265` | `ctx.events.on('input:camera:pan' \| 'input:camera:zoom', …)` + `ctx.camera.getVisibleBounds()` |
| M6 | `sym:IOverlayDevice` is geometry-only — no text method. Axis tick labels cannot be drawn through `surface.overlay(…)`. | `file:packages/canvas-core/src/contracts/IOverlayDevice.ts#L43-L66` | Methods are `moveTo`/`lineTo`/`rect`/`roundRect`/`ellipse`/`poly`/`fill`/`stroke` — nothing else. Text exists only as a `LabelDecoration` on an element (`file:packages/canvas-core/src/specs/label.ts#L34`) |
| M7 | `sym:Camera` carries a single scalar `scale`. A real Gantt zooms time (x) while row pitch (y) stays fixed; this camera cannot. | `file:packages/canvas-core/src/abstracts/Camera.ts#L195` | `get scale(): number` — one value, uniform |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Needs a new shape primitive for bars | **No** | `kind: 'rect'` with per-node `width` covers it (`M3`) |
| R2 | Needs a new data store for tasks | **No** | `sym:GraphStore` holds tasks-as-nodes + dependencies-as-edges, and keeps the typed-array position fast path and rbush picking |
| R3 | Pinned chrome needs a new layer base in `pkg:@invana/canvas-core` | **No, not for v1** | `M5` — `MiniMapLayer` proves a `ScreenLayer` can project off the camera today. A half-pinned base is a real idea but a separate RFC |
| R4 | The axis desyncs after a programmatic camera move (`fitView`, `fitOnLoad`) because `input:camera:*` sounds input-only | **No** | Every `Camera` mutator emits, including `setTransform` (`file:packages/canvas-core/src/abstracts/Camera.ts#L262-L268`) and `fitContent` (`#L341-L346`) |
| R5 | A Gantt is a use case for the existing `GraphVisualiser` tool | **No** | It is a different chart type, not a styling of the graph tool. Filing decided in `D-1` |

---

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| S1 | Tasks load into a `sym:GraphLayer` as nodes; dependencies as edges. Task fields (`start`, `end`, `progress`, `rowId`, `type`) ride `node.data`. | `sym:GraphNode` is generic over `D` (`file:packages/graph/src/store/types.ts#L38`) | Picking, hover, selection, connectors and LOD arrive for free |
| S2 | `GanttLayout extends OneShotPositionLayout` computes `x` from a linear `date → world-unit` scale and `y` from row index, returning `{ ids, positions }`. | `file:packages/graph/src/layout/OneShotPositionLayout.ts#L14-L31` | Positioning is a normal layout run; transition/easing come with the base |
| S3 | The **scale object** (`{ origin: Date, unitsPerDay, toX(date), toDate(x) }`) is constructed by the story and handed to *both* the layout and the axis layer. | — | `toDate` is unused in a read-only v1 but is the seam edit-mode needs. This is the piece that later forces a real `GanttLayer` (`D-5`) |
| S4 | Bar width comes from the per-node shape resolver: `shape: (n) => ({ kind: 'rect', width: scale.toX(n.data.end) − scale.toX(n.data.start), height: barHeight, cornerRadius: 3 })`. A milestone resolves to a diamond (`kind: 'regular-polygon'`), a summary bar to a flat rect. | `M3`, `file:packages/canvas-core/src/specs/shape.ts#L184-L196` | Three task types, zero new primitives |
| S5 | `TimeAxisLayer extends ScreenLayer` subscribes to `input:camera:pan` / `input:camera:zoom`, reads `ctx.camera.getVisibleBounds()`, picks a tick granularity from the visible span, and re-emits ticks each camera change. | `M5`, `R4` | Header stays pinned in y, scrolls in x, and survives `fitView` |
| S6 | Tick **lines** draw through `surface.overlay('ticks')`; tick **labels** ride as `LabelDecoration`s on the tick-line shape specs, because the overlay device has no text. | `M6` | The tick line is its own label host — no invisible placeholder specs. Cost recorded in `D-4` |
| S7 | `TaskListLayer extends ScreenLayer` mirrors S5 on the other axis: pinned in x, rows projected from `camera.toScreen(0, rowY)`. | `file:packages/canvas-core/src/abstracts/Camera.ts#L380` | The left name column |
| S8 | Row banding + today-marker draw as a `WorldLayer` **below** the graph layer (separate `Layer` instance for draw order, per `WorldLayer`'s own guidance). | `file:packages/canvas/src/layers/WorldLayer.ts#L11-L14` | No z-fighting with bars |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Grep every `bus?.emit` in `sym:Camera` | 13 sites, covering `setPosition`, `pan`, `setTransform`, `setZoom`, `zoomAt`, `fitContent`, `centerOn` | `S5` holds for programmatic moves, not just input — `R4` confirmed |
| T2 | Read `sym:IOverlayDevice` method list end to end | Geometry + style + lifecycle only; no `text` | `S6` is forced, not chosen — `M6` confirmed |
| T3 | Read `NodeStyle.shape` type | `NodeShapeOptions \| ((n) => NodeShapeOptions)` per-node | `S4` holds — `M3` confirmed |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/graph-canvas-apps-plan.md` | relates-to | landed | The compound-component shape (`GraphCanvasApp` + header/main/footer regions) is what a `GanttCanvasApp` would copy, **later** — out of scope here |
| `doc:docs/usecases-storybook-taxonomy-plan.md` | relates-to | active | Governs `D-1`. Its rule "an engine-capability demo wearing a use-case costume is not a use case" is the reason `D-1` is a real question |
| `file:apps/storybook/CLAUDE.md` | depends-on | active | Story shape (1), imperative + `play`, `createContainer` from `file:apps/storybook/stories/div-util.tsx`; one story per file; no hand-rolled CSS (root rule 13) |
| `doc:docs/canvas-state-plan.md` §3.1 | relates-to | active | `data` is a keyed registry of data sources — the seam a future `pkg:@invana/gantt` would register a task source into. Not touched by a story |

**No design of record exists for a non-graph chart domain.** This RFC is the first.

---

## 4. The changes

All rows are **story-local** unless the `File/target` says otherwise. Nothing ships in a published package.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:apps/storybook/stories/<per D-1>/GanttChart.stories.tsx` | The story: sized container, `sym:GraphCanvas`, layer + layout registration, `play` driver | The deliverable | low | D-1 |
| F2 | defect | proposed | same file (or a sibling `_gantt/` module) | `timeScale(origin, unitsPerDay)` — `toX` / `toDate` / `tickEvery(granularity)` | The single owner of `date ↔ x` (`S3`) | low | — |
| F3 | defect | proposed | same | `GanttLayout extends OneShotPositionLayout` — rows from `rowId` order, x from `F2` | Bars land on the right dates and rows | low | F2 |
| F4 | defect | proposed | same | Node style: per-node `shape` resolver for `task` / `milestone` / `summary`; progress shown as a second inset rect part | Bars read as a Gantt, not as circles | low | F2 |
| F5 | defect | proposed | same | `TimeAxisLayer extends ScreenLayer` — camera-subscribed ticks + labels (`S5`, `S6`) | Pinned time header | **medium** — re-emits specs on every camera frame; watch pan cost at ~30 ticks | F2, D-4 |
| F6 | defect | proposed | same | `TaskListLayer extends ScreenLayer` — pinned left name column (`S7`) | Row labels stay readable when panned right | medium — same repaint path as F5 | F5 |
| F7 | dressing | proposed | same | Row banding + today marker as a `WorldLayer` below the graph layer (`S8`) | Reads as a chart rather than floating bars. **Cosmetic — not the capability**; droppable without touching F1–F6 | low | — |

**Explicitly not in this RFC:** drag-to-reschedule, edge-resize, link drawing, critical path, calendars/working days, `pkg:@invana/gantt`, a `canvas-ui` editor (root rule 12 binds a *shipped* layer/behaviour/layout — nothing here ships), a `GanttCanvasApp`.

---

## 5. Blast radius

### Upstream — what this leans on

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:OneShotPositionLayout` contract (`ids` + interleaved `Float32Array`) | `F3` implements it | Low — stable, five layout packages depend on it |
| U2 | `input:camera:pan` / `input:camera:zoom` firing on **programmatic** moves | `F5`/`F6` desync silently if this narrows to input-only | **Medium** — the event names imply input; nothing documents the programmatic guarantee. Worth a TSDoc line on `sym:Camera` regardless of this RFC |
| U3 | Per-node `shape` resolver on `NodeStyle` | `F4` is impossible without it | Low — public, widely used |
| U4 | `LabelDecoration` attachable to an arbitrary shape spec | `F5`'s tick labels have no other host (`M6`) | Medium — if label placement assumes a node-sized host, tick labels may need a different anchor |

### Downstream — who could break

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `pkg:@canvas/storybook` sidebar | story tree | One new node (placement per `D-1`) | None beyond `D-1` |
| D2 | `pkg:@invana/graph`, `pkg:@invana/canvas`, `pkg:@invana/canvas-core` | published API | **None** — no package source is edited | None |
| D3 | `file:api/*.surface.txt` snapshots | API surface | **None** — no barrel export changes, so `pnpm check-api-surface` is unaffected | None |
| D4 | `pnpm check-boundaries` | lint gate | Story imports only `@invana/canvas` + `@invana/graph`; no pixi, no zustand/immer | None — but `V5` verifies it |
| D5 | Serialised canvas state / snapshots | persistence | **None** — no new config keys in a published package | None |
| D6 | A future `pkg:@invana/gantt` | successor | This story becomes its reference implementation and then its first story | Tracked by `D-5` |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Bars land on correct dates | story | A task 2026-03-01→2026-03-15 spans exactly 14 day-units; a same-row neighbour starting 03-15 abuts it with no gap | F2, F3, F4 |
| V2 | pending | Dependency arrows connect the right bars | story | Every `from→to` edge terminates on its successor's left edge; no arrow crosses into a wrong row | F1, F3 |
| V3 | pending | Pinned header tracks the camera | story | Pan right → tick labels advance, header stays at the same screen y. Zoom → granularity switches (month → week → day) without labels overlapping | F5 |
| V4 | pending | Header survives a **programmatic** camera move | story | After `canvas.fitView(24)` one rAF post-`onReady`, the header's leftmost tick matches the leftmost visible bar's date | F5, F6, U2 |
| V5 | pending | `pnpm check-boundaries` | repo | pass — no pixi / zustand / immer import reaches the story | F1–F7 |
| V6 | pending | `pnpm check-types` | repo | pass | F1–F7 |
| V7 | pending | **Control** — an existing graph story still renders | `story:usecases/tools/GraphVisualiser` | Unchanged: nodes, edges, layout, toolbars all behave as before | D2 |
| V8 | pending | Pan cost | story | Dragging across the full span stays smooth; `DevInfoLayer` frame time shows no step change vs. the same scene with `F5`/`F6` unregistered | F5, F6 |
| V9 | pending | Visual read in a **visible** browser tab | story | Reads as a Gantt chart at first glance — rows, bars, header, dependency arrows | F1–F7 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Where does the story file? | (a) `usecases/tools/GanttChart` — a product surface, like `GraphVisualiser`; (b) `graph/Charts/GanttChart` — nests a non-graph chart under the graph package; (c) a new top-level `charts/` node | **(a)**. It is a product surface whose dataset is a prop — exactly the `tools/` bucket's definition. (b) misfiles a schedule as graph-domain; (c) invents a top-level node for one prototype | open |
| D-2 | Uniform zoom: `sym:Camera` has one scalar `scale` (`M7`), so zooming scales row height too — a real Gantt zooms only time | (a) accept it for v1 — the chart zooms like a diagram; (b) re-run `F3` on every zoom to hold row pitch constant in screen space; (c) add anisotropic zoom to `sym:Camera` | **(a)**. (b) puts a layout run on the zoom hot path; (c) is a `canvas-core` contract change that touches every backend and belongs in its own RFC. Record the limitation in the story's docs block | open |
| D-3 | Where does the sample schedule live? | (a) inline in the story file; (b) a new entry in `pkg:@invana/graph-datasets` | **(a)**. `apps/storybook/CLAUDE.md` calls for self-contained stories, and a ~20-task schedule is small. Promote to (b) only if a second consumer appears | open |
| D-4 | Axis tick labels have no text primitive (`M6`) | (a) `LabelDecoration` on the tick-line shape spec; (b) DOM-overlay header outside the canvas; (c) add text to `sym:IOverlayDevice` | **(a)**. Stays inside the spec vocabulary and needs no contract change. (b) splits the chart across two rendering systems; (c) is an engine change this prototype does not justify | open |
| D-5 | After the prototype — promote to `pkg:@invana/gantt`? | (a) decide later, from what the story teaches; (b) commit now | **(a)**. The prototype exists precisely to price `S3` (who owns the inverse scale) before committing to a package. A promotion RFC would carry `GanttCanvas`, a task/dependency vocabulary, edit behaviours, and a `canvas-ui` editor per root rule 12 | open |
| D-6 | `F7` (row banding + today marker) is dressing | (a) include; (b) drop | **(a)** include — without banding the chart is hard to read across rows — but it is marked `Kind: dressing` so it can be cut without touching the capability | open |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-16 | Opened | proposed | Maintainer chose: prototype in a story (not a package), read-only v1, pinned chrome via camera-projecting `ScreenLayer`s |
| 2026-09-16 | Research | proposed | `T1`–`T3` run against the source; `R1`–`R5` ruled out; `M6` and `M7` found to be binding constraints and absorbed by `D-4` / `D-2` rather than by engine changes |
