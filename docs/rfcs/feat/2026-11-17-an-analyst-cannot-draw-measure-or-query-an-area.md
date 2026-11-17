---
id: feat-2026-11-17-an-analyst-cannot-draw-measure-or-query-an-area
type: feat
title: An analyst cannot draw an area, measure on the map, or ask what is inside it
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-ui]
design_of_record: doc:docs/geo-intelligence-plan.md
relations:
  - { predicate: relates-to, object: doc:docs/analyst-requirements.md }
  - { predicate: depends-on, object: rfc:feat-2026-11-17-geographic-shapes-cannot-be-drawn-from-data }
  - { predicate: relates-to, object: rfc:feat-2026-11-17-moving-objects-cannot-be-tracked-live }
  - { predicate: blocks, object: doc:docs/geo-intelligence-plan.md }
---

| | |
|---|---|
| What is missing | Features can be drawn **from data** (P3) but not by a person; nothing measures a distance or an area on the map; and nothing answers "which of these entities are inside / within N km of that?" |
| Scope (maintainer, 2026-11-17) | **Area query · draw polygon / line / circle (with undo) · measure distance and area · GeoJSON export.** Everything else is a `deferred` row (F11) |
| Rows | F1–F11 — see §4 |
| Row status | proposed 0 · accepted 0 · implemented 10 (F1–F10) · deferred 1 (F11) · landed 0 |
| Open decisions | none |

## 1. Motivation

| ID | Need | Requirement | Where it shows today | Evidence |
|---|---|---|---|---|
| S1 | "Which devices, accounts or vessels were inside this zone?" — and "within N km of a point or a route" | A1 | no query exists; a person would eyeball a polygon | `doc:docs/analyst-requirements.md` A1 |
| S2 | Draw a polygon, a route or a radius on the map and keep it | A26 | features arrive only as GeoJSON data via `setFeatures` | `file:packages/graph-layer-maplibre/src/features/GeoFeaturesLayer.ts` |
| S3 | Undo a drawn feature | A26 | writes to `GeoFeaturesLayer` are not recorded, so `canvas.history` never sees them | same file — no log wiring |
| S4 | How far is the site from the border? How big is the zone? | A4 | no tool; planar world units are wrong at any latitude but the equator | `file:packages/graph-layer-maplibre/src/tracking.ts` (`worldUnitsPerMetre` varies with `cos(lat)`) |
| S5 | Put it in the morning brief | A11 | `toGeoJSON()` returns an object; nothing serialises or offers it | `GeoFeaturesLayer.toGeoJSON` |
| S6 | While a tool is active the map must not pan under the pen | A26 | under a `MapLayer` MapLibre owns every pointer gesture; only `map:click` / `map:hover` are forwarded | `file:packages/graph-layer-maplibre/src/MapLayer.ts` |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Undo for features needs a new history concept (a new `HistoryOp` kind, or features moved into the kernel's annotation collection) | **no** — the log is source-pluggable: any data source registers a `DataOpAdapter` (`applyOps` is the only required method) and records with `recordData`; the graph store is one such source. `GeoFeaturesLayer` becomes a second | `file:packages/canvas-core/src/state/log/types.ts#L163-L197`, `#L219-L236`; `file:packages/graph/src/store/GraphStore.ts#L304-L350` |
| R2 | Drawing needs the canvas to take the pointer back from the map | **no** — it is enough to **suspend the map's drag, double-click-zoom and box-zoom** and forward its raw pointer events; the wheel still zooms, so an analyst can zoom while drawing | §2 step 2 |
| R3 | A freehand stroke makes history huge | n/a here — freehand is deferred (F11); a drawn feature is **one** op written when it is finished, never per point | §2 step 3 |
| R4 | Area query needs a spatial index | not for the sizes in scope — a bounding-box prefilter in world units, then an exact test | §2 step 5 |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | A tool is a **behaviour** gated like the connect tool: it registers disabled, `modes` can tie it to a view mode, and it claims the gesture while live | `file:packages/graph/src/behaviours/DrawEdgeBehaviour.ts` (`claimGesture`, `modes: ['connect']`), `file:packages/canvas-core/src/abstracts/Behaviour.ts` (`modes`, `onEnable` / `onDisable`) | draw and measure are behaviours in the maplibre package, enabled and disabled by the toolbar |
| 2 | `MapLayer` makes the canvas pointer-transparent and the map takes input; MapLibre exposes `dragPan`, `doubleClickZoom`, `boxZoom` as individually disable-able handlers and emits `mousedown` / `mousemove` / `mouseup` / `dblclick` with `lngLat` | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L266` (`passInputToMap`), the P3 `map:click` forwarding | the hand-off is: **suspend those three handlers (refcounted, restored on unmount) and forward a `map:pointer` event**. Wheel zoom and the keyboard are left alone |
| 3 | The log takes ops per source; a gesture that writes unrecorded frames **journals once on release** (a node drag records one op per node) | `file:packages/graph/src/store/GraphStore.ts#L340-L350` (`recordApplied`), `file:packages/canvas-core/src/state/log/types.ts#L236` (`recordData`) | while drawing, the in-progress shape is a **draft** that is never recorded; finishing writes one `addFeature` op holding the finished feature's JSON |
| 4 | Selection is owned by `ClickSelectBehaviour`; other behaviours write it through its public API, looked up by an explicit id, falling back to the `selected` node state | `file:packages/graph/src/behaviours/LassoSelectBehaviour.ts#L390-L407` | area query selects the same way `LassoSelectBehaviour` does |
| 5 | Containment already exists as pure functions over projected world geometry: `pointInPolygon` (even-odd, holes), `distanceToLine` | `file:packages/graph-layer-maplibre/src/features/geometry.ts` | "inside a feature" reuses them; "within N km" needs a **geodesic** distance (a world-unit radius is wrong away from the equator) |
| 6 | World units are Web-Mercator pixels at zoom 0; a metre is `512 / (40 075 016.686 · cos(lat))` units | `file:packages/graph-layer-maplibre/src/tracking.ts` | distance, bearing and area are computed on the **sphere** from lng/lat, not from world units |
| 7 | A label is a decoration at a screen-pixel offset; a feature's `name` is its label | `rfc:feat-2026-11-17-geographic-shapes-cannot-be-drawn-from-data` N1, N2 | a measurement readout is a draft feature whose `name` is the text, so it needs no new drawing path |

**Shape of the answer**

| Part | One line |
|---|---|
| Hand-off | `MapLayer.suspendGestures()` returns a release function; `map:pointer` events carry the raw pointer |
| Collect | one pure `PointerCollector` state machine turns pointer events into a ring, shared by draw and measure |
| Draft | `GeoFeaturesLayer.setDraft(feature \| null)` — a transient, unrecorded feature drawn dashed |
| Undo | `GeoFeaturesLayer` registers as a log source and records `add` / `update` / `remove`; `setFeatures` (config / initial data) is not recorded |
| Draw | `DrawGeoFeatureBehaviour`: polygon, line, circle; one `addFeature` on finish, with `author` and `reportedAt` |
| Measure | `MeasureBehaviour`: distance and area on the sphere, readout on the draft; nothing is stored |
| Query | `AreaQueryBehaviour`: inside a feature, within N km of a point or a line; selects through `ClickSelectBehaviour` |
| Export | `toGeoJSONString()` and a toolbar action that downloads it |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/geo-intelligence-plan.md` | design of record (M1, D1, D3, D4, D5, E2; D-4, D-8) | 📋 | this RFC scopes P4's landing; D-4 holds (polygon, circle, line first), D-8 holds (select by default) |
| `rfc:feat-2026-11-17-geographic-shapes-cannot-be-drawn-from-data` | depends-on | implemented | `GeoFeaturesLayer`, the geometry module, `map:click` forwarding, the label-decoration mechanism |
| `rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed` | relates-to | landed | the operation log and `DataOpAdapter` contract this RFC plugs a second source into; "journal once on release" |
| `rfc:feat-2026-11-17-moving-objects-cannot-be-tracked-live` | relates-to | implemented | the follow-camera trap: a per-frame `jumpTo` stops a drag from starting — a tool must be tested against it |

## 4. The feature

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph-layer-maplibre/src/MapLayer.ts`, `types.ts` | `suspendGestures(): () => void` — refcounted; disables MapLibre `dragPan`, `doubleClickZoom`, `boxZoom` while any holder exists; the release function (and `onUnmount`) restores them. New `map:pointer` event `{ phase: 'down' \| 'move' \| 'up' \| 'dblclick', lngLat, world, button }` from the map's own events, `move` at most once per frame | a tool can draw without the map panning under it; wheel zoom still works (M1) | **medium** — widens `MapLayerEvents`; a missed release would leave the map undraggable (V4) | — |
| F2 | defect | implemented | `file:packages/graph-layer-maplibre/src/features/GeoFeaturesLayer.ts` | register as a log source on mount (`ctx.log?.registerSource`); `addFeature` / `updateFeature` / `removeFeature` record `add` / `update` / `remove` ops (feature JSON, plus the index a removed feature sat at); `applyOps` replays them forward and back with recording off; `setFeatures` and constructor features are **not** recorded; new event `feature:change` `{ kind, id }` | a drawn feature is undoable and redoable through `canvas.history`, like graph edits; also what F5 keys off | **medium** — every existing caller of `addFeature` / `updateFeature` / `removeFeature` now creates undo entries (named in §5) | — |
| F3 | defect | implemented | `GeoFeaturesLayer` | `setDraft(feature \| null)` — one reserved, transient feature drawn dashed and faded, never recorded, never in `features()` or `toGeoJSON()`; `featureAt` ignores it | the in-progress shape and the measurement readout draw with no new drawing path | low | — |
| F4 | defect | implemented | `file:packages/graph-layer-maplibre/src/geo/geodesy.ts` (new, pure) | `haversineKm`, `initialBearing`, `sphericalPolygonAreaKm2` (spherical excess, holes subtracted), `distanceToSegmentKm` (cross-track, clamped to the segment), `distanceToPolylineKm`, `destinationPoint` | distance, bearing, area and "within N km" are right at any latitude | low — pure; the sphere is within ~0.5 % of the ellipsoid, stated in TSDoc | — |
| F5 | defect | implemented | `file:packages/graph-layer-maplibre/src/tools/` (new): `PointerCollector`, `DrawGeoFeatureBehaviour` | `PointerCollector` is a pure state machine: click adds a vertex, `move` updates the cursor, double-click or Enter finishes (polygon ≥ 3, line ≥ 2, circle on its second click), Backspace drops the last vertex, Escape cancels. The behaviour, with `tool: 'polygon' \| 'line' \| 'circle' \| null`, suspends gestures while a tool is set, shows the draft (F3), and on finish calls `addFeature` **once** with `properties.author` (option) and `reportedAt` (now); a circle is a `Point` with `radiusKm` | A26: polygon, line and circle can be drawn and undone | **medium** — input handling is where this breaks (V4, V6); every exit path must restore the map | F1, F2, F3, F4 |
| F6 | defect | implemented | `file:packages/graph-layer-maplibre/src/tools/MeasureBehaviour.ts` | `tool: 'distance' \| 'area' \| null`; same collector; the draft's `name` is the readout — `12.4 km · 087°` (total length, last bearing) or `1,234 km²`; nothing is stored or recorded; Escape or tool off clears it | A4: measure distance and area on the sphere | low — shares the F5 collector | F1, F3, F4, F5 |
| F7 | defect | implemented | `file:packages/graph-layer-maplibre/src/tools/AreaQueryBehaviour.ts` | `query(spec)` returns node ids for `{ featureId }` (inside, holes respected), `{ point, km }` or `{ line, km }` (within N km, geodesic); `select(spec)` selects them through `ClickSelectBehaviour` (explicit `clickSelectId`, else the `selected` node state, as `LassoSelectBehaviour` does); a node is *inside* by its **position**, converted with `unprojectWorld`; `autoQuery` (default off) re-selects when a feature is added or changed | A1: "who was inside this zone" is one call; D-8 select-by-default | **medium** — position is `Float32`; a node on a boundary may flip by ~metres (stated, tested) | F4 |
| F8 | dressing | implemented | `GeoFeaturesLayer` | `toGeoJSONString({ pretty? })` and a one-line `downloadGeoJSON(layer, name)` helper (a `Blob` and an anchor); round-trips through `JSON.parse` to the same collection | A11 (GeoJSON half): a brief can carry the drawn features | low | — |
| F9 | dressing | implemented | `pkg:@invana/canvas-ui` `file:packages/canvas-ui/src/editors/behaviours/{draw-geo-feature,measure,area-query}/`, `file:packages/canvas-ui/src/toolbars/GeoToolsToolbar.tsx` | settings editors (`kind`s registered in the settings registry, root rule 12); `GeoToolsToolbar` with polygon · line · circle · measure distance · measure area · clear · export, switching the tool options through `canvas.update` | the studio and stories can switch tools and edit their settings | low — follows existing patterns | F5–F8 |
| F10 | dressing | implemented | stories (root rule 11) | one story per piece and state under `graph-layers/maplibre/GeoTools/`: `DrawPolygon`, `DrawLine`, `DrawCircle`, `Undo`, `MeasureDistance`, `MeasureArea`, `AreaQuery`, `Export`; plus a combined case study | each tool's own states are shown, not hidden in a demo | low | F5–F9 |
| F11 | dressing | deferred | — | **deferred, by the maintainer's scope:** freehand drawing (needs simplification), a scale bar (MapLibre ships a control), vertex editing (plan D2), the filter output of area query, KML export | the slice stays small; each is a row on record, not forgotten | — | F5 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `OperationLog.registerSource` / `recordData` and the `DataOpAdapter` contract | F2 | a change to replay semantics (recording suspended during replay) would double-record |
| U2 | MapLibre's `dragPan` / `doubleClickZoom` / `boxZoom` handlers and `mousedown` / `mousemove` / `mouseup` / `dblclick` events | F1 | a MapLibre upgrade that renames or changes them |
| U3 | `ClickSelectBehaviour.selectMultiple` | F7 | selection API change |
| U4 | `GeoFeaturesLayer` internals (features map, specs, label decoration) | F2, F3, F8 | built in the previous RFC; this one extends it |
| U5 | `OperationLog.replaying` | F2 | `applyOps` writes with recording off |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:graph-layers/maplibre/GeoFeatures/Provenance` (`updateFeature` from a button) and `…/Events` (`removeFeature`) | stories | those calls become undo entries | note it in each docblock |
| X2 | `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` | story | constructs the layer with `features:`; those are unrecorded, so nothing changes | V8 control |
| X3 | `pkg:@invana/canvas-react` `<GeoFeaturesLayer>` | published API | gains nothing required; `features` stays unrecorded | none |
| X4 | `MapLayerEvents` | published type | gains `map:pointer` | additive |
| X5 | `canvas.history`, the History and Playbook panels in `pkg:@invana/canvas-ui` | UI | will list feature entries from a second source | V3 |
| X6 | `pnpm check-api-surface` | gate | maplibre is not a snapshotted barrel | run the check |
| X7 | Serialised visualisations | data | gains optional `behaviours.<id>` options; old state loads unchanged | none |
| X8 | Docs | docs | plan P4 rows and requirements A1, A4, A11, A26 | update when rows land |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | unit: geodesy — 1° of latitude ≈ 111.19 km; bearing north 0°, east 90°; a 1°×1° cell at the equator ≈ 12,364 km² and smaller at 60° N by `cos`; a polygon with a hole subtracts it; distance to a segment clamps at its ends | `pkg:@invana/graph-layer-maplibre` | within 0.5 % of the reference | F4 |
| V2 | pass | unit: `PointerCollector` — click · click · click · double-click closes a polygon; Enter finishes; Escape cancels and leaves nothing; Backspace drops a vertex; a circle needs two clicks and its radius is the ground distance; too few vertices finish nothing | same | as stated | F5 |
| V3 | pass | unit (headless): `addFeature` → `canvas.history.undo()` removes it → `redo()` restores it; `removeFeature` → undo restores it **at its old draw order**; `updateFeature` → undo restores the old properties; `setFeatures` records nothing; replay does not re-record; a draft is never recorded | same | as stated | F2, F3 |
| V4 | pass | story + Playwright: the map pans by drag before a tool; with a tool set a drag does **not** pan and a double-click does **not** zoom; the wheel still zooms; after Escape, after the tool is set to `null`, after `disable()` and after the layer unmounts, drag-pan and double-click-zoom work again; while a follow camera is re-centring | `story:graph-layers/maplibre/GeoTools/DrawPolygon` | as stated | F1, F5 |
| V5 | pass | unit: area query — inside a polygon with a hole (a node in the hole is out); within 25 km of a point and of a line (geodesic, at 1.3° N and 60° N); a node outside; selection goes through a fake `ClickSelectBehaviour`, and falls back to the `selected` state | same package | as stated | F7 |
| V6 | pass | story + Playwright: click four points and double-click → one feature exists; `canvas.history.undo()` removes it and the draft is gone; draw a circle and read its `radiusKm` | `…/DrawPolygon`, `…/DrawCircle`, `…/Undo` | as stated | F5, F2 |
| V7 | pass | story: measure distance along three clicks reads the haversine sum and a bearing; measure area reads km² of the ring; Escape clears; nothing enters `features()` or the log | `…/MeasureDistance`, `…/MeasureArea` | as stated | F6 |
| V8 | pass | **control** — `GeoAnnotations`, `LiveTracking` and the `GeoFeatures/*` stories render as before; map pan and zoom are normal with no tool set | those stories | identical | F1, F2 |
| V9 | pass | unit: `toGeoJSONString` → `JSON.parse` equals `toGeoJSON()`; a drawn feature carries `author` and `reportedAt` | same package | as stated | F5, F8 |
| V10 | pass | unit: editor `optionsToForm` / `formToOptions` round-trips; the three `kind`s resolve in the settings registry | `pkg:@invana/canvas-ui` | as stated | F9 |
| V11 | pass | `pnpm check-types` · `check-boundaries` · `check-api-surface` · lint (0 new warnings) · tests in each touched package | repo | green | all |

**Observed (2026-11-17)**

| Check | Result |
|---|---|
| V1 | `tests/geodesy.test.ts` (17): 1° of latitude ≈ 111.19 km anywhere; longitude shrinks with `cos(lat)`; bearings N/E/S/W; `destinationPoint` round-trips; a 1°×1° cell at the equator ≈ 12,364 km² and half that at 60° N; holes subtract; distance to a segment (beside, clamped at the ends, zero on it, degenerate) and to a polyline at 60° N — all within 0.5 % |
| V2 | `tests/pointerCollector.test.ts` (10): close a polygon, too few vertices finishes nothing, the double-click's second click is ignored, Backspace, cancel, line needs two, a circle's second click finishes it with the ground radius, Enter finishes a circle from the pointer, previews |
| V3 | `tests/geoFeaturesHistory.test.ts` (8): add → undo → redo; remove → undo restores the **draw-order position**; update → undo; loaded features, `setFeatures` and the draft record nothing; the draft is not in `features()`, `toGeoJSON()` or picking; a replay does not re-record; `feature:change` follows undo and redo |
| V4 | `story:graph-layers/maplibre/GeoTools/DrawPolygon` in Chromium: a drag pans before the tool (3/3 runs); with the tool on a drag does **not** pan and a double-click does not zoom, the **wheel still zooms**; after Escape with nothing in progress the tool is off and a drag pans again. Also unit-tested: the hold is refcounted and handed back by `tool: null`, `disable()`, Escape and unregistering. The first run of the browser script reported "pan before the tool" false once — a start-up race (tiles loading), not repeated in three further runs |
| V5 | `tests/query.test.ts` (7) and `tests/areaQuery.test.ts` (9): inside with the hole excluded; within N km of the boundary at 17° N and 60° N; the hole's own edge; MultiPolygon; a line needs a distance; a point's radius counts; selection through a `ClickSelectBehaviour`-shaped selector, falling back to the `selected` state; disabled does not select but still reads; `autoQuery` on and off |
| V6 | polygon: four clicks + a double-click → **1** feature (`author`, `reportedAt`, `tool` set), Undo → 0, Redo → 1, in the real browser; the whole loop again in `story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis` through the header toolbar, with the vessels inside the polygon selected as it closed. Circle: centre then radius draws a ground circle and stores `radiusKm` |
| V7 | `MeasureDistance` reads `191 km · 059°` after three clicks, `MeasureArea` `11,052 km²`; both show **0** features stored and no history entry; in the case study the dashed draft reads `161 km · 109°` |
| V8 | control: `GeoAnnotations`, `LiveTracking` and the `GeoFeatures/*` stories were not changed by this RFC and still render; map pan and zoom are normal with no tool set (V4) |
| V9 | `toGeoJSONString` round-trips through `JSON.parse`; a drawn feature carries `author` and `reportedAt` |
| V10 | `trackingEditors.test.ts` (now 22 in canvas-ui): the three editors' `optionsToForm` / `formToOptions` round-trip (`none` ↔ `null`), and the three `kind`s resolve in the settings registry |
| V11 | `check-types` (19) · `check-boundaries` · `check-api-surface` (unchanged; maplibre is not a snapshotted barrel) · lint 0 errors and no new warnings · tests: maplibre 109, canvas-ui 22, graph 456 |

**Findings that changed the RFC**

| ID | Finding | Effect |
|---|---|---|
| N1 | The two clicks of a double-click land on the same spot; without a guard they add a duplicate vertex | `PointerCollector.click` ignores a click within 4 screen pixels of the last vertex (converted to km at the click's latitude and the current zoom), so the double-click only finishes |
| N2 | `feature:change` fires **while** a replay is still running, before the log has moved its cursor | a UI that shows "can undo / redo" must follow `canvas.history.subscribe`, not `feature:change` (the `Undo` story does) |
| N3 | A headless canvas has camera scale 1, where 4 px is hundreds of kilometres | tests set the camera to a real zoom first |
| N4 | The tools need `MapLayer.map:pointer` only for `move` and `dblclick`; vertex placement uses the existing `map:click` | `down` / `up` are forwarded for the freehand row that is deferred (F11) |
| N5 | Selecting drawn-polygon contents is **not** undone when the polygon is undone — selection is its own state | stated in the story docblock; the polygon goes, the selection stays until changed |
| N6 | `GeoToolsToolbar` reads the draw and measure behaviours structurally, so `canvas-ui` needs no dependency on the maplibre package | toolbar buttons follow `subscribe()` so an Escape inside the map un-presses the button |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | How does undo for features work? | (a) `GeoFeaturesLayer` registers as a second log source · (b) a new `HistoryOp` kind in `@invana/graph` · (c) features move into the kernel annotation collection | (a): the log is already source-pluggable, the maplibre package owns the feature data, and (b) / (c) would pull a map concept into `graph` or `canvas-core` for no gain | accepted 2026-11-17 |
| D2 | What does "take the pointer from the map" mean? | (a) suspend the map's drag / double-click-zoom / box-zoom and forward its raw events · (b) hand pointer events back to the canvas | (a): the wheel keeps zooming, MapLibre keeps its own hit-testing, and nothing has to be handed back across two DOM layers | accepted 2026-11-17 |
| D3 | Is the in-progress shape stored? | (a) a transient draft, recorded only when finished · (b) a real feature updated per vertex | (a): one op per drawn feature, never per point — which is also what keeps a future freehand stroke cheap | accepted 2026-11-17 |
| D4 | What decides that a node is "inside"? | (a) its position · (b) its drawn bounds | (a): bounds change with zoom for a pixel-constant marker, so the answer would depend on the view | accepted 2026-11-17 |
| D5 | How does area query select? | (a) through `ClickSelectBehaviour` by explicit id, else the `selected` state · (b) write the kernel selection directly | (a): it is how `LassoSelectBehaviour` does it, and selection stays the one behaviour's | accepted 2026-11-17 |
| D6 | Sphere or ellipsoid? | (a) sphere (haversine, spherical excess) · (b) WGS-84 geodesics | (a): ~0.5 % is inside the accuracy of the data this serves; (b) adds a dependency or ~200 lines for no visible gain. Stated in TSDoc | accepted 2026-11-17 |
| D7 | Where do the tools live? | (a) the maplibre package, with the graph layer and selection typed structurally · (b) `@invana/graph` | (a): they are geographic; `@invana/graph` stays domain-free, as for `GeoPositionBehaviour` | accepted 2026-11-17 |
| D8 | Are `setFeatures` and constructor features recorded? | (a) no · (b) yes | (a): loading data is not an edit (graph `initData` is the same); a replace-all op would also be huge | accepted 2026-11-17 |
| D9 | Where does a drawn feature's `author` come from? | (a) a behaviour option, omitted when unset · (b) a canvas-wide user | (a): the engine has no user concept; the app sets it once in config | accepted 2026-11-17 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened after the maintainer scoped P4 to area query, draw (with undo), measure and export; the undo design was checked against the operation-log contract | proposed | summarised in chat; no code written |
| 2026-11-17 | Approved whole by the maintainer ("approved") after the scope was cut to priorities 1–4 | accepted | D1–D9 accepted with the recommendations |
| 2026-11-17 | F1–F10 implemented; F11 deferred by scope; V1–V11 pass with the caveats noted | accepted | not committed; the RFC reaches `landed` when F1–F10 are `landed` (in `main`) |
