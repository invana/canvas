# Geo intelligence plan — mark, query, track and brief on a map

**Goal.** Make the map a surface an analyst can *decide* on: mark areas (from data or by
hand), group entities into clusters, query by area, track things that move (ships,
fleets, deliveries, shipments), replay time, and brief from it — with **every setting and
every drawn shape JSON-serialisable**, so a visualisation is `data` + `config` and the
pieces are components, never story code.

- **Requirements (the what / why):** [`analyst-requirements.md`](./analyst-requirements.md) — `A1`…`A30`.
- **This doc (the how / when):** phases, work items, packages, RFCs, decisions.
- **Status:** ✅ shipped · 🚧 in progress · 📋 planned · 🧊 parked.
- **Process:** every phase lands through RFCs in `docs/rfcs/` (root rule 15), approved
  before code. This plan is the index; an RFC may refine a row here, never silently drop it.

---

## 1. Where it starts — what the GeoAnnotations story proved

`story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` (PRs #12, #13) built
regions, clusters and zoom-tiered icon markers on a MapLibre map **with no package
change** — but only by writing geometry and presentation code in the story. Each
workaround is a gap this plan closes:

| Story workaround today | Gap | Closed by |
|---|---|---|
| Cluster hulls computed in the story | `BubbleSetsLayer` returns an empty outline at map scale (it grids in whole units; a state is ~4 world units wide) and sizes members from their *authored* shape, which `NodeScaleLODBehaviour` rewrites to screen px | B1, B2 |
| District rings projected + recentred in code, drawn as `polygon` **nodes** | No layer takes geographic shapes; an area isn't an entity but is stored as a node | G1 |
| Four `ZoomStateBehaviour`s swap border width per zoom band | No pixel-constant stroke for world-space shapes | G2 |
| Lucide icons rendered to `data:` URLs per node | `NodeStylingTemplate` has no `icon`; no icon-by-name | T1, T2 |
| `state.detail.labelText` written on every node | A state overlay can't bind a label template per type | T3 |
| Marker positions projected with `projectLngLat` in code | Nodes can't say "I'm at this lng/lat" | G5 |

---

## 2. Architecture — where each piece lives

| Piece | Package | Why there |
|---|---|---|
| BubbleSets fixes | `@invana/graph-layer-bubble-sets` | the defect is there |
| Template `icon`, icon registry, per-state bindings | `@invana/graph` (+ the registry seam in `@invana/canvas-core` if the renderer must resolve names) | presentation-as-config is graph-template territory; no new third-party dep (Lucide stays an app choice) |
| `GeoFeaturesLayer`, geo-position, draw tools, measurement, area query, geodesy (km, bearing, buffers) | `@invana/graph-layer-maplibre` | lng/lat, web-mercator and MapLibre input are map-specific |
| Moving objects: fix ingestion, interpolation, trails, signal state, follow | `@invana/graph` (domain-free: world coordinates, so a floor plan or warehouse map works too) | tracking isn't map-only; the geo glue (lng/lat in, dead reckoning in km/knots) lives in the maplibre package |
| Time model (current time, window, playback clock) | kernel view state — `@invana/canvas-core` contract + `@invana/canvas-store` | time filters every layer, so it is canvas state, not one layer's option (see D-T1) |
| Time slider, playback controls, draw toolbar, feature inspector | `@invana/canvas-ui` (pixels) on `@invana/canvas-react` hooks (headless) | root rule: draws UI → canvas-ui |
| A settings editor per new layer / behaviour | `@invana/canvas-ui/editors/...` | root rule 12 |
| Stories | `apps/storybook` — one per piece and state (rule 11); case studies under `canvas-demos/by-casestudies/` | |

**Boundaries held throughout:** no drawing library outside `renderer-pixijs`; no
`zustand`/`immer` outside `canvas-store`; positions on the typed-array fast path
(`sym:GraphStore.setPositionsBulk`), never through the reactive store (kernel rule — a live
feed at 1 Hz × thousands of objects is exactly the case it exists for).

---

## 3. Phases and work items

Work-item IDs are append-only. `Req` cites [`analyst-requirements.md`](./analyst-requirements.md).

### P1 — Clusters work on a map (fix)

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| B1 | Run `bubblesets-js` in a scaled space (`k = 4 / pixelGroup`), divide the outline back — world-unit options work at any scale; `k = 1` at the default, so no change for existing users. Measured standalone: 0 → 1,524 outline points | `graph-layer-bubble-sets` | A28 | ✅ implemented (unit-tested), not yet in `main` |
| B2 | Member rects from **drawn** bounds (renderer world bounds), not authored spec bounds — pixel-constant markers can be members; recompute on zoom settle when a member's drawn size changed (RFC row F3) | `graph-layer-bubble-sets` | A28 | ✅ implemented, not yet in `main` |
| B3 | `setOptions` on `BubbleSetsLayer`, so `canvas.update` / the settings editor / JSON `config.layers` reach it (found in P1: today they are silently ignored) | `graph-layer-bubble-sets` | A28, rule 12 | 📋 proposed (RFC row F5) |

### P2 — Markers are pure config

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| T1 | `icon` on `NodeStylingTemplate` (fills the reserved `simple` structure `icon` slot) | `graph` | A29 | ✅ implemented, not yet in `main` |
| T2 | Icon registry — `{ kind: 'named', name: 'waves' }` in JSON, the app registers the set (Lucide as the documented default); no network call (A13) | `graph` / `canvas-core` seam | A29, A13 | ✅ implemented, not yet in `main` |
| T3 | Per-state label bindings on node types — `stateBindings.detail.label: '{data.name}\n{data.description}'` | `graph` | A29 | ✅ implemented, not yet in `main` |
| T4 | **Icon** rotation (radians, clockwise from up) on the inset layers, bindable per type (`rotationBind: 'data.course'`, degrees). Whole-shape rotation is T5 — deferred: container rotation carries the label | `canvas-core`, `renderer-pixijs`, `graph` | A17 | ✅ implemented, not yet in `main` |
| T5 | Whole-shape heading rotation with an upright label (silhouette markers) | `renderer-pixijs`, `graph` | A17 | 🧊 deferred (RFC row T5) |
| T6 | Hot-path `setShapeIconRotation` for per-second heading updates — decided by P5's V7 budget | `renderer-pixijs`, `graph` | A17, A24 | 🧊 deferred (RFC row T6) |

### P3 — Geographic features from data

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| G1 | `GeoFeaturesLayer` — GeoJSON `Polygon` (holes) · `MultiPolygon` · `LineString` · `Point` + `radiusKm`; style from `properties` or per-kind defaults in config; not nodes (the `GroupFramesLayer` pattern) | `graph-layer-maplibre` | A27 | ✅ implemented, not yet in `main` |
| G2 | Pixel-constant stroke — the layer re-strokes on zoom settle; no renderer change | same | A27 | ✅ implemented, not yet in `main` |
| G3 | Feature labels at the visual centre (polylabel), pixel-constant, min / max zoom | same | A27 | ✅ implemented, not yet in `main` |
| G4 | `feature:click` / `feature:hover` events; `add` / `update` / `remove` / `toGeoJSON()` | same | A11 | ✅ implemented, not yet in `main` |
| G5 | Geo-position — nodes with `data.lng` / `data.lat` are projected on load and on change | same | A27 | ✅ implemented, not yet in `main` |
| G6 | Provenance schema on feature `properties`: `source` · `reportedAt` · `author` · `confidence` · `reliability` · `classification` | same | A2 | ✅ implemented, not yet in `main` |
| G7 | Uncertainty styling — `uncertaintyKm` ring; unconfirmed features dashed / faded, from G6 fields | same | A3 | ✅ implemented, not yet in `main` |
| G8 | Offline defaults — no CDN by default; tile style URL documented as required config; a bundled minimal style for stories | same | A13 | ✅ implemented, not yet in `main` |
| E1 | `<GeoFeaturesLayer>` wrapper + settings editor | `canvas-react`, `canvas-ui` | rule 12 | ✅ implemented, not yet in `main` |

### P4 — Draw, measure, query

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| M1 | `MapLayer` input hand-off — borrow pointer input from MapLibre while a tool is active, give it back after | `graph-layer-maplibre` | A26 | ✅ implemented, not yet in `main` |
| D1 | `DrawGeoFeatureBehaviour` — polygon (click, double-click closes) · freehand (drag) · circle (drag radius, km) · line; writes a GeoJSON feature with G6 provenance (`author`, `reportedAt`), undoable | same | A26 | ✅ implemented, not yet in `main` |
| D3 | Measure tools — distance, area (km²), bearing; scale bar | same | A4 | ✅ implemented, not yet in `main` |
| D4 | Area query — "inside feature", "within N km of point / line"; output **select** (default) or **filter** | same + `graph` selection / filter | A1 | ✅ implemented, not yet in `main` |
| D5 | GeoJSON export of drawn features (KML later) | same | A11 | ✅ implemented, not yet in `main` |
| E2 | Draw toolbar (canvas-ui) + behaviour editor | `canvas-ui` | rule 12 | ✅ implemented, not yet in `main` |
| D2 | Edit drawn features — drag vertices, move, delete | same | A26 | 🧊 after P4 core |

### P5 — Live tracking core

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| V1 | Fix ingestion API — `pushFixes([{ id, t, x, y, course?, speed? }])`, transport-agnostic; writes through `setPositionsBulk` | `graph` (+ lng/lat adapter in maplibre) | A15 | ✅ implemented, not yet in `main` |
| V2 | Interpolation between fixes; dead reckoning from speed + course when fixes are late | `graph` (+ geodesic version in maplibre) | A16 | ✅ implemented, not yet in `main` |
| V3 | Course-aware markers (uses T4) | `graph` | A17 | ✅ implemented, not yet in `main` |
| V4 | Trails — last N minutes / points, fading; full track on select | `graph` | A18 | ✅ implemented, not yet in `main` |
| V5 | Signal state — moving · stopped · stale · lost from fix age + speed; state overlays style them | `graph` | A19 | ✅ implemented, not yet in `main` |
| V6 | Follow camera on a selected object | `graph` / `canvas` | A20 | ✅ implemented, not yet in `main` |
| V7 | Performance budget — 5,000 objects at 1 Hz with trails, measured headless + in Storybook | — | A24 | ✅ implemented, not yet in `main` |
| E3 | Editors for the tracking behaviour / trails layer | `canvas-ui` | rule 12 | ✅ implemented, not yet in `main` |

### P6 — Time

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| Z1 | Time model — `view.time` (now, window, playing, rate) in the kernel; features, nodes and fixes carry timestamps | `canvas-core` contract, `canvas-store` | A5 | 📋 |
| Z2 | Time slider + playback controls | `canvas-ui` (on `canvas-react` hooks) | A5, A23 | 📋 |
| Z3 | Replay recorded tracks at ×N | `graph` | A23 | 📋 |
| Z4 | Dwell / stop detection on tracks | `graph` | A6 | 📋 |
| Z5 | Co-location detection (same place, same window) | `graph` + maplibre geodesy | A7 | 📋 |
| Z6 | Geofence events — enter / exit a feature → event + history line | `graph-layer-maplibre` | A9, A25 | 📋 |
| Z7 | Planned route vs actual — deviation distance, off-route alert | `graph-layer-maplibre` | A21 | 📋 |
| Z8 | ETA along the planned route | `graph-layer-maplibre` | A22 | 📋 |

### P7 — Analyst extras

| ID | Item | Package | Req | Status |
|---|---|---|---|---|
| X1 | Density + aggregation — count bubbles below a zoom (contours already exist) | `graph` / maplibre | A8, A24 | 📋 |
| X2 | Assessment notes on a feature — reuse the board's notes-on-records (`rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph`) with a feature as the anchor | `graph`, `canvas-ui` | A12 | 📋 |
| X3 | Briefing export — PNG / PDF with legend, scale bar, north arrow, classification banner | `canvas` io, `canvas-ui` | A11 | 📋 |
| X4 | Place search + coordinate input (DD, DMS, MGRS) | `graph-layer-maplibre`, `canvas-ui` | A14 | 📋 |
| X5 | Label collision also avoids marker bodies | `graph` | A30 | 📋 |

### P8 — Case studies

| ID | Item | Req | Status |
|---|---|---|---|
| S1 | Rewrite `GeoAnnotations` as `data` + `config` only (no geometry code) once P1–P4 land | A26–A30 | 📋 |
| S3 | **Maritime case study** — vessels on AIS-style fixes: trails, course, stale signal, port geofences, a route deviation | A15–A25 | 📋 |
| S4 | **Last-mile delivery case study** — riders, delivery zones, ETA, arrivals | A15–A25 | 📋 |
| S5 | Network-over-geography story | A10 | 📋 |

Per-piece stories (rule 11) ship **with** each phase, not in P8.

---

## 4. RFC index

| Phase | RFC | Status |
|---|---|---|
| P1 | [`fix/2026-11-17-bubble-sets-draw-nothing-at-map-scale`](./rfcs/fix/2026-11-17-bubble-sets-draw-nothing-at-map-scale.md) | 🚧 F1–F4 implemented; F5 (`setOptions`) proposed |
| P2 | [`feat/2026-11-17-marker-icons-and-zoom-labels-are-not-config`](./rfcs/feat/2026-11-17-marker-icons-and-zoom-labels-are-not-config.md) | 🚧 T1–T4, T2b, E1, S1 implemented; V10 partly run |
| P3 | `feat/…-a-map-cannot-show-an-area-from-coordinates` | ✅ RFC accepted and implemented, not yet in `main` — `docs/rfcs/feat/2026-11-17-geographic-shapes-cannot-be-drawn-from-data.md` |
| P4 | `feat/…-an-analyst-cannot-draw-or-query-an-area` | ✅ RFC accepted and implemented (scope: query, draw polygon / line / circle, measure, export), not yet in `main` — `docs/rfcs/feat/2026-11-17-an-analyst-cannot-draw-measure-or-query-an-area.md` |
| P5 | `feat/…-moving-objects-cannot-be-tracked-live` | ✅ RFC accepted and implemented, not yet in `main` — `docs/rfcs/feat/2026-11-17-moving-objects-cannot-be-tracked-live.md` |
| P6 | `feat/…-the-canvas-has-no-time` (+ a design note `docs/time-model-plan.md` first — it touches every layer) | 📋 |
| P7 | one RFC per X-row | 📋 |

---

## 5. Decisions

| ID | Question | Decision | Status |
|---|---|---|---|
| D-1 | Name of the areas layer ("annotation" already means notes on records) | `GeoFeaturesLayer` — GeoJSON's own word, covers lines and circles | accepted 2026-11-17 |
| D-2 | Where drawn features live | the kernel's `LayerData.annotations` collection if its undo / history path is wired (verified in the P3 RFC); otherwise the layer's own data | accepted 2026-11-17 — checked in the P3 RFC: the annotation collection has no undo path, so features live in the layer; undo arrives with P4's draw tool |
| D-3 | Icons in JSON | app-filled icon registry (offline), Lucide as the documented default | accepted 2026-11-17 |
| D-4 | First draw tools | polygon + freehand + circle + line; editing (D2) after | accepted 2026-11-17 |
| D-5 | Zoom units in config | camera scale (`2 ** mapZoom`), documented conversion; no new unit | accepted 2026-11-17 |
| D-6 | RFC split | this plan + one RFC per phase | accepted 2026-11-17 |
| D-7 | Scope of this round | P1–P4 first; time (P6) after its own design note | accepted 2026-11-17 |
| D-8 | Area query output | select by default, filter as an option | accepted 2026-11-17 — area query selects by default; the filter output is deferred |
| D-9 | Case-study domains | maritime (S3) and last-mile delivery (S4); the GeoAnnotations story keeps Telangana | recommended — open |
| D-10 | Air-gapped as a hard requirement | yes for the engine (no default outside calls); stories may use OpenFreeMap but say so | recommended — open |
| D-11 | `classification` field shape | free text now, with an app-supplied list later for the export banner | recommended — open |
| D-T1 | Time as kernel state vs per-layer option | kernel state (`view.time`) — one clock filters every layer | recommended — open, decided in the time-model note |
| D-T2 | Tracking machinery in `@invana/graph` (domain-free) vs a new package | `@invana/graph` + geo glue in maplibre; revisit if it grows past one behaviour + one layer | recommended — open |

---

## 6. Risks

| Risk | Where | Mitigation |
|---|---|---|
| Live feeds at scale fight the reactive store | P5 | positions only through `setPositionsBulk`; fixes buffered and flushed per frame; V7 budget measured before P5 lands |
| Time touches every layer | P6 | design note first; layers opt in to time filtering |
| Pixel-constant stroke by re-stroking on zoom costs with many features | P3 | re-stroke on zoom *settle*, measured in G2's story with 1,000 features |
| Map input hand-off breaks MapLibre gestures | P4 | M1 restores input on tool exit, escape, and unmount; covered by a story check |
| Scope creep | all | requirements stay in `analyst-requirements.md`; this plan only moves a row when its RFC is approved |

---

## 7. History

| Date | Event |
|---|---|
| 2026-11-17 | P2 approved and implemented (icons by name, per-type state labels, icon rotation bound to a heading; 17 + 11 unit tests, three stories); the styling editor's save would have deleted template icons — fixed and tested |
| 2026-11-17 | P1 approved and implemented (F1–F4, 13 unit tests, two stories); a finding added B3 / RFC row F5 |
| 2026-11-17 | Plan created from the GeoAnnotations review and the analyst requirements (A1–A30); D-1…D-7 accepted by the maintainer, D-8…D-T2 recommended |
| 2026-11-17 | P5 implemented (RFC `feat-2026-11-17-moving-objects-cannot-be-tracked-live`): `TrackingBehaviour`, `TrailsLayer`, map follow driver, lng/lat adapter, editors, stories; budget measured (tick p95 0.7 ms at 5,000, 2.4 ms with every heading rewritten). D-T1 stays open; D-T2 confirmed |
| 2026-11-17 | P3 implemented (RFC `feat-2026-11-17-geographic-shapes-cannot-be-drawn-from-data`): `GeoFeaturesLayer`, `GeoPositionBehaviour`, `MapLayer` click / hover forwarding and an offline blank default, editor, wrapper, eight stories; `GeoAnnotations` migrated. D-2 and D-10 answered |
| 2026-11-17 | P4 implemented in the maintainer's scope (RFC `feat-2026-11-17-an-analyst-cannot-draw-measure-or-query-an-area`): `suspendGestures` + `map:pointer`, features as a second operation-log source (undo), draft, geodesy, `DrawGeoFeatureBehaviour`, `MeasureBehaviour`, `AreaQueryBehaviour`, GeoJSON export, editors, `GeoToolsToolbar`, nine stories. Freehand, scale bar, vertex editing (D2), filter output and KML stay deferred |
