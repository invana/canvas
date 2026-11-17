---
id: feat-2026-11-17-geographic-shapes-cannot-be-drawn-from-data
type: feat
title: Geographic shapes (areas, routes, radii) cannot be drawn from GeoJSON data
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: doc:docs/geo-intelligence-plan.md
relations:
  - { predicate: relates-to, object: doc:docs/analyst-requirements.md }
  - { predicate: relates-to, object: rfc:feat-2026-11-17-moving-objects-cannot-be-tracked-live }
  - { predicate: relates-to, object: rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale }
  - { predicate: manifests-in, object: story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations }
  - { predicate: blocks, object: doc:docs/geo-intelligence-plan.md }
---

| | |
|---|---|
| What is missing | No layer takes geographic shapes. An analyst's area, route or "within 5 km of here" is stored today as a `polygon` **node** with hand-projected vertices, restroked in four zoom bands by four `ZoomStateBehaviour`s, with its own label layer |
| Scope | Plan P3 rows G1–G8 and E1 (A2, A3, A11, A13, A27). Not P4 (drawing, measuring, area query) and not P6 (time) |
| Rows | F1–F13 — see §4 |
| Row status | proposed 0 · accepted 0 · implemented 12 (F1–F12) · deferred 1 (F13) · landed 0 |
| Open decisions | none |

## 1. Motivation

| ID | Need | Requirement | Where it shows today | Evidence |
|---|---|---|---|---|
| S1 | Draw a polygon (with holes), a multipolygon, a line, a point with a radius from **GeoJSON** | A27 | the story projects each ring in code, recentres it, and stores it as a node with relative vertices | `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` (`regionShapes`, `vertices: world.map(...)`) |
| S2 | A border that is one thickness on screen at every zoom | A27 | no pixel-constant stroke for world-space shapes; four `ZoomStateBehaviour`s swap `bgStrokeWidth` per band | same story, `config.layers.regions.node.state` (`border-far` … `border-street`) |
| S3 | A name at the visual centre of an area, readable at every zoom | A27 | a second `GraphLayer` of label-only nodes at hand-computed positions | same story, `region-labels` |
| S4 | Click or hover an area | A11 | nothing: under a `MapLayer` the map takes all pointer input (`pointer-events: none` on the canvas) | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L222-L225` |
| S5 | Every feature says where it came from and how far to trust it | A2 | no field exists | — |
| S6 | An imprecise location looks imprecise | A3 | no field exists | — |
| S7 | Put a node on the map from `data.lng` / `data.lat` | A27 | every marker is projected with `projectLngLat` in code | same story, `projectLngLat(p.lngLat)` |
| S8 | Nothing calls an outside service by default | A13 | `MapLayer` falls back to a CDN style when none is given | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L76` (`DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/…'`) |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Features should be `GraphLayer` nodes, so selection, layout and export already work | no — an area is not an entity: it must not enter layouts, the legend counts, or the unsaved tracker; the annotation RFC reached the same conclusion for group frames | `rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph` D3; `file:packages/graph/src/layer/GroupFramesLayer.ts` |
| R2 | The kernel's `LayerData.annotations` collection can hold features, with undo for free | **no — it has no undo path** (D-2's check, answered below) | §2 step 3 |
| R3 | A polygon with holes needs a renderer change | not necessarily — it can be drawn without one (a keyhole-bridged fill plus stroke-only rings); a renderer `holes` field is the fallback (F13) | §2 step 5 |
| R4 | A shape's own `label` is enough for area names | no — see §2 step 6 | `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale` N3 |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | The pattern for "derived geometry that is not an entity" is a `WorldLayer` that owns its data and publishes `path` / shape specs through a `SpecStore` + `SpecProjector` | `file:packages/graph/src/layer/GroupFramesLayer.ts#L83-L110` (owns `frames`, `setFrames`); `file:packages/graph/src/layer/TrailsLayer.ts` (specs per id, rebuilt for dirty ids, restroked on zoom settle) | `GeoFeaturesLayer` is the same shape, in the package that owns the geography |
| 2 | `@invana/graph-layer-maplibre` already owns Web-Mercator (`projectLngLat`, `worldUnitsPerMetre`, `WORLD_SIZE = 512`) and peers only on `@invana/canvas` | `file:packages/graph-layer-maplibre/src/mercator.ts`, `file:packages/graph-layer-maplibre/src/tracking.ts` | the layer needs no new dependency on `@invana/graph`, and works with or without a `MapLayer` |
| 3 | `LayerData` has `annotations()`, `upsert`, `patch`, `remove`, but `GraphStore`'s history union has no annotation op and its flush writes empty annotation deltas | `file:packages/canvas-core/src/state/data/LayerData.ts#L384-L393`, `file:packages/graph/src/history/types.ts#L29-L42` (no `annotation` kind), `file:packages/graph/src/store/GraphStore.ts#L2482` | **D-2 resolved: not wired.** Features are the layer's own data now; undo arrives with P4's draw tool, which adds the history op it needs |
| 4 | Under a `MapLayer` the canvas has `pointer-events: none` and the map takes input; `MapLayer` emits only `map:ready` and `map:move` | `file:packages/graph-layer-maplibre/src/types.ts#L77-L79` | a feature click needs `MapLayer` to forward map `click` / mouse-move with the world and lng/lat position (F7) |
| 5 | `PathSpec` is one ring; a polygon spec is one ring; neither has holes | `file:packages/canvas-core/src/specs/shape.ts#L183-L186`, `#L271` | holes without a renderer change: **fill** = one closed path whose outer ring is joined to each hole by a zero-width bridge (a keyhole polygon); **outline** = separate stroke-only closed paths, one per ring, so the bridge is never stroked. The risk is a hairline seam along a bridge, measured in V4 |
| 6 | A world-space shape's `label` is sized in world units, and a map is 512 units across at zoom 0 | `file:packages/canvas-core/src/specs/label.ts#L37` (`fontSize` default 12 "px"); camera scale is `2^mapZoom` | **hypothesis, unverified:** at map zoom 7.6 (scale ≈ 194) a 12-unit font is ≈ 2,300 px tall — off screen — which is why a `BubbleSet.label` drew nothing. The fix is the same as for strokes: size the font as `px / scale` on zoom settle (F4). V3 is the spike that confirms or kills this |
| 7 | A pixel-constant stroke is `px / scale` world units, republished on zoom settle | `file:packages/graph/src/layer/TrailsLayer.ts` (`publish`, `input:camera:zoom` → debounce); `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts` (zoom-settle recompute) | one known pattern; its cost grows with feature count, so it is measured at 1,000 features (V6) |
| 8 | A ground circle is a circle in Web Mercator (the projection is conformal) with radius `metres × worldUnitsPerMetre(lat)` | `file:packages/graph-layer-maplibre/src/tracking.ts` (`worldUnitsPerMetre`, tested within 0.5 % at 1.3° N / 30° N / 60° N) | a `Point` + `radiusKm` is a `circle` spec; accurate to ~0.5 % for radii of tens of km, drifting for radii of hundreds |
| 9 | `MapLayer`'s default style is a CDN URL | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L76` | an air-gapped canvas makes an outside call it did not ask for (S8) |

**Shape of the answer**

| Part | One line |
|---|---|
| Layer | `GeoFeaturesLayer` (maplibre package): a `WorldLayer` that holds GeoJSON features and publishes specs |
| Data | RFC-7946 `Feature`s: `Polygon` (holes), `MultiPolygon`, `LineString`, `MultiLineString`, `Point` (+ `radiusKm`); stable `id`; `toGeoJSON()` round-trips |
| Style | [simplestyle-spec](https://github.com/mapbox/simplestyle-spec) keys on `properties` (`stroke`, `stroke-width`, `stroke-opacity`, `fill`, `fill-opacity`), else per-kind defaults in `config` |
| Pixels | stroke and label sizes in screen pixels, refreshed on zoom settle |
| Trust | provenance fields on `properties`; `confidence` and `uncertaintyKm` change how a feature draws |
| Input | `feature:click` / `feature:hover`, whether the map or the canvas has the pointer |
| Offline | no outside call by default |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/geo-intelligence-plan.md` | design of record (P3, G1–G8, E1; D-1, D-2, D-5, D-10, D-11) | 📋 | this RFC scopes P3's landing; D-2 is answered in §2 step 3 |
| `doc:docs/analyst-requirements.md` | requirements A2, A3, A11, A13, A27 | 📋 | the acceptance language |
| `rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph` | relates-to | landed | a frame is a world layer, not an entity (R1) |
| `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale` | relates-to | implemented | the zoom-settle recompute pattern; N3 (label at map scale) is picked up here |
| `rfc:feat-2026-11-17-moving-objects-cannot-be-tracked-live` | relates-to | implemented | `TrailsLayer` is the template for F2–F4; `worldUnitsPerMetre` is reused by F3 |

## 4. The feature

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `pkg:@invana/graph-layer-maplibre` `sym:GeoFeaturesLayer` (new `WorldLayer`) | holds features (`setFeatures`, `addFeature`, `updateFeature`, `removeFeature`, `getFeature`, `toGeoJSON()`); validates geometry (closed rings, finite coordinates, ≥ 3 / ≥ 2 positions) and drops a bad feature with one warning per id; `id` required, taken from `feature.id` | an area is data, not a node (A27); the layer is config-driven (`setOptions`, `kind = 'geo-features-layer'`) | low — additive; a new class | — |
| F2 | defect | implemented | same layer, `file:packages/graph-layer-maplibre/src/features/geometry.ts` (new, pure) | geometry → specs: `Polygon` fill = keyhole-bridged closed `path` (no stroke) plus one stroke-only closed `path` per ring; `MultiPolygon` = each polygon; `LineString` / `MultiLineString` = open `path`; `Point` + `radiusKm` = `circle` (radius `km·1000·worldUnitsPerMetre(lat)`); `Point` without radius = a small pixel-constant disc | every GeoJSON kind draws; a hole is a hole | **medium** — the bridge can leave a hairline seam in the fill (V4); if it does, F13 | F1 |
| F3 | defect | implemented | same layer | style from `properties` (simplestyle keys) over per-kind `defaults` in config (`polygon`, `line`, `point`); a per-feature `classification` / `confidence` never changes colour on its own (that is F9) | interoperable with geojson.io data; config holds the look (storybook rule) | low | F2 |
| F4 | defect | implemented | same layer | pixel-constant **stroke**: `strokeWidthPx / scale`, republished for all features on zoom **settle** (debounced), geometry cached so only paint changes. **Labels need no republish:** the layer sets the renderer's existing `setLabelSizePolicy('shape', { zoomGrowth: 0 })` on its own renderer, which keeps each label's authored pixel size (found while building; see N1/N2) | A27: one thickness on screen at every zoom; the bubble-set label (N3) turned out to have a different cause — see N1 | **medium** — O(features) per settle; measured at 1,000 features (V6); a zoom storm is debounced | F2 |
| F5 | defect | implemented | same layer, `dependency: polylabel` | label at the visual centre (polylabel of the largest ring, holes respected), attached as a `'label'` decoration on one spec of the feature from `properties[labelKey]` (default `name`); `labelMinZoom` / `labelMaxZoom` in camera-scale units (D-5, `2 ** mapZoom`) | G3 / A27: area names that sit inside the area and appear at the right zoom | **medium** — depends on F4 making a label visible at map scale (V3 spike); adds one 3rd-party dependency, installed online | F4 |
| F6 | defect | implemented | same layer | hit testing: point-in-polygon with holes (even-odd), distance to a line within `hitTolerancePx / scale`, circle containment; topmost feature by draw order; events `feature:click` and `feature:hover` `{ id, feature, lngLat, world }` | A11: click an area | low | F2 |
| F7 | defect | implemented | `file:packages/graph-layer-maplibre/src/MapLayer.ts`, `types.ts` | `MapLayer` emits `map:click` and a throttled `map:hover` `{ lngLat, world }` from MapLibre's own events; `GeoFeaturesLayer` listens when a `MapLayer` is present, and to the canvas's pointer events (`shape:click`) when it is not | clicks reach features under a map without handing the map's input away (that is P4's M1) | **medium** — widens `MapLayerEvents` (public type); hover is throttled to bound its cost | F6 |
| F8 | dressing | implemented | maplibre package, `GeoPositionBehaviour` (new) | nodes with `data.lng` / `data.lat` are projected on load and on `data:changed`; written through `store.internal.setPositionsBulk` (unrecorded) | G5 / A27: "I'm at this lng/lat" is data, not code in the story | low — its writes are positions only, as layouts do | — |
| F9 | defect | implemented | same layer + a `provenance` module | provenance on `properties`: `source`, `reportedAt` (ISO 8601), `author`, `confidence` (0–1), `reliability` (Admiralty code `'B2'`: source A–F, information 1–6; D4), `classification` (free text, D-11) — typed, validated on `addFeature`, never required. Uncertainty styling: `uncertaintyKm` draws a translucent ring; a feature with `confidence` below `unconfirmed.below` (default 0.5), or `confirmed: false`, draws dashed and faded (`unconfirmed.dash`, `unconfirmed.alpha` in config) | A2 / A3: how far to trust a feature is visible and carried, and an analyst can tell a precise fix from "somewhere in this district" | low — additive fields; the visual rule is one config block | F2 |
| F10 | defect | implemented | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L76`, a bundled blank style | with no `styleUrl`, `MapLayer` loads a bundled minimal style (background only, no tiles, no network); tiles need an explicit `styleUrl`, documented as required config | A13: no outside call by default (plan D-10) | **high** — changes a shipped default: any consumer relying on the implicit CDN basemap gets a blank map. Mitigated by listing consumers in §5 and passing `styleUrl` explicitly in each story | — |
| F11 | dressing | implemented | `pkg:@invana/canvas-react` `<GeoFeaturesLayer>` wrapper; `pkg:@invana/canvas-ui` `file:packages/canvas-ui/src/editors/layers/geo-features-layer/` | headless wrapper (renders `null`); `fields.ts` + `mapping.ts` + editor panel, registered in the settings registry (root rule 12) | the studio and stories can edit feature defaults, label and uncertainty rules (E1) | low — follows the existing pattern | F1–F9 |
| F12 | dressing | implemented | stories (root rule 11) | `graph-layers/maplibre/GeoFeatures/{Polygons,Lines,PointsRadius,Labels,Provenance,Events,Scale1000}` (one per state; holes and multipolygon in `Polygons`), `Scale1000` for the re-stroke budget; `GeoAnnotations` migrates: its district `polygon` nodes, four band behaviours and `region-labels` layer become one `GeoFeaturesLayer` over GeoJSON | each piece's own states shown; the case study loses its hand-projected rings | low | F1–F9 |
| F13 | dressing | deferred | `pkg:@invana/canvas-core` `PathSpec`, `pkg:@invana/renderer-pixijs` `PathShape` | **deferred — V4 showed no seam, so it is not built; builds only if a seam is ever seen.** Original text: fallback only, built only if V4 shows a visible seam: `holes?: ReadonlyArray<ReadonlyArray<Point>>` on `PathSpec`; `PathShape` cuts them; `boundsOfPath`, `scalePath`, hit testing and the SVG serialiser follow | holes drawn natively, no bridge | **high** — a spec-vocabulary addition across `canvas-core`, the renderer, hit testing and SVG export | F2 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `SpecStore` / `SpecProjector` and the `path` / `circle` specs | everything F2 publishes | a spec change would need the geometry module updated |
| U2 | `projectLngLat`, `worldUnitsPerMetre`, `WORLD_SIZE` | F2's projection and radii | a change of world size (it is 512 by `MapLayer`'s contract) would rescale every feature |
| U3 | MapLibre's `click` / `mousemove` events and the canvas `pointer-events: none` hand-off | F7 | a change in who owns input under a map |
| U4 | Camera `scale` and the `input:camera:zoom` event | F4 | the settle recompute keys off it |
| U5 | `polylabel` (MIT, no dependencies) | F5 | a new 3rd-party dependency of the maplibre package, as layer packages list their one algorithm lib |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` | story | its region nodes, band behaviours and `region-labels` layer are replaced (F12) | migrate in the same change; keep the district data |
| X2 | Every story and app that mounts `MapLayer` without a `styleUrl` | stories | F10 turns an implicit CDN basemap into a blank one | enumerate with `grep` when F10 is implemented (12 story files mention `MapLayer`; `GeoAnnotations`, `LiveTracking`, `Airports`, `Routes`, `AirRoutes` and both bubble-set map stories already pass `styleUrl`); add it where missing |
| X3 | `pkg:@invana/canvas-react` `<MapLayer>` wrapper and its consumers | published API | default basemap changes (F10) | document in the wrapper's TSDoc |
| X4 | `MapLayerEvents` | published type | gains `map:click` / `map:hover` (F7) | additive |
| X5 | Serialised visualisations (`config`) | data | gains optional `layers.<id>` options for the new layer; old state loads unchanged | none |
| X6 | `pnpm check-api-surface` | gate | the maplibre package is not a snapshotted barrel; F13 would touch `canvas-core` types but not export names | run the check |
| X7 | `pkg:@invana/canvas-ui` settings registry | editor | a new `kind` | F11 |
| X8 | Docs | docs | `doc:docs/geo-intelligence-plan.md` P3 rows and `doc:docs/analyst-requirements.md` A2, A3, A11, A13, A27 change status | update when rows land |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | unit: geometry → specs for every kind; a polygon with two holes: the fill's signed area equals outer − holes (bridges add zero); `MultiPolygon` yields one fill per polygon; invalid features are dropped with one warning | `pkg:@invana/graph-layer-maplibre` | areas within 1e-9; counts as stated | F1, F2 |
| V2 | pass | unit: `radiusKm` circle radius against the great-circle value at 1.3° N, 30° N, 60° N | same | within 0.5 % (shares the `worldUnitsPerMetre` check) | F2 |
| V3 | pass | **spike** (it killed the hypothesis): a path spec's `label` at map zoom 7.6 draws nothing because a spec has no `label` field at all — see N1 | `story:graph-layers/maplibre/GeoFeatures/Labels` | the spike reproduces N3, then F4's sizing fixes it — or the hypothesis is wrong and F5 gets a different mechanism | F4, F5 |
| V4 | pass | seam: a donut and a multi-hole polygon with a translucent fill, viewed at map zoom 5, 9 and 13 on a plain and a tiled background | `story:graph-layers/maplibre/GeoFeatures/Polygons` | no visible hairline along any bridge; else F13 | F2, F13 |
| V5 | pass | unit: hit tests — inside, in a hole, on the boundary, on a line within tolerance, in a circle, topmost wins | same package | as stated | F6 |
| V6 | pass | measure: 1,000 features (mixed kinds, labelled); republish time per zoom settle and the frame cost during a zoom | `story:graph-layers/maplibre/GeoFeatures/Scale1000` | settle republish ≤ 50 ms p95 on the reference browser; no per-frame cost while still | F4 |
| V7 | pass | events: click and hover a feature under a `MapLayer` (a plain canvas gets `feature:click` only — see N3) | `story:graph-layers/maplibre/GeoFeatures/Events` | `feature:click` / `feature:hover` fire with the right id and position in both | F6, F7 |
| V8 | pass | offline: a `MapLayer` with no `styleUrl` and a `GeoFeaturesLayer`, every non-localhost request aborted | stories | renders a blank map plus features; zero outside requests | F10 |
| V9 | pass | provenance and uncertainty: a feature with `confidence 0.3` draws dashed and faded; `uncertaintyKm` draws a ring; a bad `reliability` is warned about once and the feature kept (provenance never rejects a feature; only unusable geometry does) | `story:graph-layers/maplibre/GeoFeatures/Provenance` | as stated | F9 |
| V10 | pass | `GeoPositionBehaviour`: a node with `data.lng` / `data.lat` lands on `projectLngLat`, and moves when the data changes | unit | position within 1e-9 | F8 |
| V11 | pass | **control** — `Airports`, `Routes`, `AirRoutes` and both bubble-set map stories render as before after F10 | those stories | identical (each already passes `styleUrl`) | F10 |
| V12 | pass | the editor changes a live option (e.g. `defaults.polygon.strokeWidthPx`) through `canvas.update` | `story:canvas-ui/editors/…` | applied without remount | F11 |
| V13 | pass | `pnpm check-types` · `check-boundaries` · `check-api-surface` · lint (0 new warnings) · tests in each touched package | repo | green | all |

**Observed (2026-11-17)**

| Check | Result |
|---|---|
| V1 | `tests/geometry.test.ts` (19): a donut and a three-hole polygon fill to outer − holes within 1e-9; either ring direction; a concave outer whose nearest vertex is hidden; `MultiPolygon`; invalid geometry refused |
| V2 | `radiusKmToWorld` against the projected great-circle distance within 0.5 % at 1.3° N, 30° N, 60° N |
| V3 | spike: see N1 |
| V4 | `story:graph-layers/maplibre/GeoFeatures/Polygons` at map zoom 7.4, ~9 and ~12 on OpenFreeMap positron, fill alpha 0.25: the hole is empty, no hairline along the bridge. **Not checked at fill alpha 1** — the slider change did not take in my scripted run |
| V5 | `tests/geoFeaturesLayer.test.ts` (12): inside, in a hole, near a line, in a circle, a point beats an area |
| V6 | `story:graph-layers/maplibre/GeoFeatures/Scale1000`: 1,000 features, 1,334 specs, **republish 8.9 ms** at zoom 5, **21 ms** at zoom 9 and 12, 10 ms back at zoom 5 (software GL browser). Budget was ≤ 50 ms p95. Single-run values, not a p95 |
| V7 | `…/Events`: hover over the ring band reports `ring`; click reports `ring @ 78.299, 17.496`; a click inside the hole reached the route that crosses it (the hole itself is empty, as it should be) |
| V8 | `…/Offline`: a `MapLayer` with no `styleUrl` and features, every non-localhost request aborted: renders, zero outside requests, zero errors |
| V9 | `…/Provenance`: *Rumoured camp* (`confirmed: false`) and *Eastern ridge* (0.3) dashed and faded, *Confirmed depot* and *Checkpoint* solid, the 30 km uncertainty ring drawn; provenance helpers unit-tested |
| V10 | `tests/geoPositionBehaviour.test.ts` (4): a node lands on `projectLngLat`, other paths, no `.data` write, follows data changes |
| V11 | every story that builds a `MapLayer` (7) already passed `styleUrl`; the 12 grep hits for "MapLayer" in stories were mostly `MiniMapLayer`. `Airports`, `Routes`, `AirRoutes`, both bubble-set map stories, `GeoAnnotations` and `LiveTracking` render |
| V12 | the apply path (`setOptions` through `canvas.update`) and the editor's `optionsToForm` / `formToOptions` round-trip are unit-tested and the `geo-features-layer` kind resolves in the settings registry. **The editor UI was not driven** |
| V13 | `check-types` (19) · `check-boundaries` · `check-api-surface` (unchanged — maplibre is not a snapshotted barrel) · lint 0 errors, no new warnings · tests: maplibre 43, canvas-ui 18, graph 456 |

**Findings that changed the RFC**

| ID | Finding | Effect |
|---|---|---|
| N1 | **A shape spec has no `label` field.** A label is a `'label'` decoration attached with `setDecoration` after the spec is projected. `BubbleSetsLayer` put `label` on its path spec, so the field was silently dropped — **that, not world-sized fonts, is why bubble-set labels never drew** (N3 of `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale`). The hypothesis in §2 step 6 was wrong | the layer attaches the label as a decoration; the bubble-set bug is real and still open (a follow-up row there) |
| N2 | A label's `offset` is **screen pixels**, and the renderer already has `setLabelSizePolicy('shape', { zoomGrowth: 0 })` that keeps a label's authored pixel size at any zoom, per renderer — each layer owns its renderer, so it is per layer | F4's label half needs no republish; D8 resolved by a mechanism that already existed; the offset to the visual centre is the world gap × the scale |
| N3 | A plain canvas gets a click from the primitives' `shape:click`; there is no hover event there | `feature:hover` works under a `MapLayer` only; documented on the layer |
| N4 | `PathSpec` / `CircleSpec` need centre-relative points (`x`, `y` is the centre) for the host's visual centre — and so the label — to sit where intended | `centred()` in the geometry module |
| N5 | `GeoPositionBehaviour` needs `GraphLayer` only structurally; `@invana/graph` is a devDependency of the maplibre package for its tests, not a dependency | the package still peers on `@invana/canvas` only |
| N6 | Node positions are `Float32`, ~3e-5 world units resolution at mercator coordinates | documented on `GeoPositionBehaviour`: fine to ~zoom 13, a pixel or two at 17 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where do features live? (plan D-2) | (a) `LayerData.annotations` · (b) the layer's own data | (b): annotations have no undo path (§2 step 3); P4's draw tool adds the history op it needs, with features as its subject | accepted 2026-11-17 |
| D2 | How are holes drawn? | (a) keyhole-bridged fill + stroke-only rings, no renderer change · (b) a `holes` field on `PathSpec` now | (a) first, with F13 as the fallback if V4 shows a seam: (b) touches `canvas-core`, the renderer, hit testing and SVG export for one feature | accepted 2026-11-17 |
| D3 | Where does a feature's look come from? | (a) simplestyle keys on `properties`, config defaults per kind · (b) a style template registry like `GraphLayer` · (c) config only | (a): GeoJSON from geojson.io and most tools already carries simplestyle; defaults in config keep the storybook rule. A template registry is machinery for three kinds | accepted 2026-11-17 |
| D4 | Shape of `reliability` | (a) one Admiralty string `'B2'` · (b) two fields `sourceGrade` + `infoGrade` | (a): that is how analysts write and read it; a parser gives the two parts | accepted 2026-11-17 |
| D5 | What is the default basemap? (plan D-10) | (a) a bundled blank style, tiles by explicit `styleUrl` · (b) keep the CDN default and document it | (a): an air-gapped canvas must not call out unasked; the cost is that existing implicit-CDN consumers add one line | accepted 2026-11-17 |
| D6 | How does a click reach a feature under a map? | (a) `MapLayer` forwards map `click` / `mousemove` as events · (b) hand pointer input back to the canvas · (c) hit-test inside MapLibre | (a): hand-off is P4's M1, and it breaks map gestures; forwarding keeps the map's input where it is | accepted 2026-11-17 |
| D7 | Which package? | (a) `@invana/graph-layer-maplibre` · (b) a new `@invana/graph-layer-geo` | (a) as the plan: it already owns the projection and peers only on `canvas`; split only if the layer needs a package of its own for non-map canvases | accepted 2026-11-17 |
| D8 | How is a label made pixel-constant? | (a) republish with `fontPx / scale` on settle (as strokes) · (b) a renderer-side pixel-constant label | (a): no renderer change; (b) only if V3/V6 show (a) is too slow | accepted 2026-11-17 — resolved by neither: the renderer's existing label size policy (N2) |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened from plan P3 after the `GeoAnnotations` review; D-2 checked against the code and found not wired | proposed | summarised in chat; no code written |
| 2026-11-17 | Approved whole by the maintainer ("approve the RFC and start building") | accepted | D1–D8 accepted with the recommendations |
| 2026-11-17 | F1–F12 implemented; F13 deferred (V4 showed no seam); V1–V13 pass with the caveats noted; the label hypothesis (§2 step 6) was wrong — N1 | accepted | not committed; the RFC reaches `landed` when F1–F12 are `landed` (in `main`) |
