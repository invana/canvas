# Analyst requirements

What an analyst at an intelligence, logistics or investigations firm needs from the canvas
to **make and defend a decision**, kept as a tracked list. Each requirement has a stable
ID (append-only — never renumber, never reuse), the question it answers, and a status.
How each one gets built lives in the plan that implements it; this file is the *what*
and *why*.

- **Plan:** [`geo-intelligence-plan.md`](./geo-intelligence-plan.md) — phases, work items, RFCs.
- **Status:** ✅ shipped · 🚧 in progress · 📋 planned · 🧊 parked (decided later, reason given).
- **Phase:** the plan phase that delivers it (`P1`…`P8`).

> The test for adding a row: *a named analyst asks this question while deciding something,
> and today the canvas can't answer it.* A capability without a question goes in the plan,
> not here.

---

## Geo — marking, querying and briefing on a map

| ID | Requirement | The analyst's question | Phase | Status |
|---|---|---|---|---|
| A1 | **An area is a query.** Draw or pick an area and every entity inside it is selected or filtered; also "within N km of a point" and "within N km of a route" | "Which devices / accounts / vessels were inside this zone?" | P4 | ✅ P4 — area query by feature / point / route, selecting (in the branch); the filter output is deferred |
| A2 | **Provenance on every feature** — `source`, `reportedAt`, `author`, `confidence`, `reliability` (source grade A–F / info grade 1–6), `classification` | "Where did this come from, and how far do we trust it?" | P3 | ✅ P3 — provenance fields on features (in the branch); shown as data and in the unconfirmed look |
| A3 | **Location uncertainty** — a point may carry an uncertainty radius or ellipse; unconfirmed items draw differently (dashed, faded) | "Is this a precise fix or 'somewhere in this district'?" | P3 | ✅ P3 — `uncertaintyKm` ring and the unconfirmed look (in the branch) |
| A4 | **Measurement** — distance, area (km²) and bearing tools; a scale bar | "How far is the site from the border? How big is the zone?" | P4 | 🚧 distance (km + bearing) and area (km²) tools (P4, in the branch); a scale bar is deferred |
| A5 | **Time on the map** — features and entities carry time; a time slider filters what's shown; playback | "What was here on the 12th?" | P6 | 📋 |
| A6 | **Movement tracks** — a track is a timed line with direction and stop (dwell) points | "Where did the vehicle go, and where did it stop?" | P6 | 📋 |
| A7 | **Co-location** — flag entities in the same place at the same time | "Who was together, and when?" | P6 | 📋 |
| A8 | **Density at overview** — heatmap / contours, and markers that aggregate into count bubbles below a zoom | "Where is activity concentrated?" (10k+ points) | P7 | 📋 |
| A9 | **Geofence alerts** — an entity entering or leaving an area raises an event and a log line | "Tell me when X enters the zone" | P6 | 📋 |
| A10 | **Network over geography** — relationships between geolocated entities drawn as arcs | "Who in this area is connected to whom elsewhere?" | P8 | ✅ engine · 📋 story |
| A11 | **Briefing export** — GeoJSON / KML of drawn features; PNG / PDF with legend, scale bar, north arrow and classification banner | "Put this in the morning brief." | P4 (GeoJSON) · P7 (decorated export) | 🚧 `toGeoJSON()`, a `.geojson` download and the draw tools (in the branch); the decorated PNG / PDF export is P7 |
| A12 | **Assessment notes on an area** — an analyst's judgement attached to an area, like a note on a record | "What did we conclude about this area, and why?" | P7 | 📋 |
| A13 | **Offline / air-gapped** — nothing calls an outside service by default: self-hostable tiles, icons from an app-filled registry | Intel networks often have no internet | P2 (icons) · P3 (tiles) | 🚧 icons and the default basemap make no outside call (blank style, tested with the network blocked); an app supplies its own `styleUrl` and tiles |
| A14 | **Place and coordinate input** — search a place name; accept decimal degrees, DMS and MGRS | "Go to 18°15′N 79°56′E." | P7 | 📋 |

## Live tracking — ships, fleets, deliveries, shipments

Objects that move while you watch: vessels on AIS, delivery riders, trucks, parcels.
Same analyst bar — the question is about a decision (re-route, alert, intercept, reassure a
customer), not just "where is it".

| ID | Requirement | The analyst's / operator's question | Phase | Status |
|---|---|---|---|---|
| A15 | **Live position feed** — push position fixes for moving objects by id; transport-agnostic (WebSocket, SSE, polling and replay all feed one API) | "Where is everything right now?" | P5 | ✅ P5 (in the branch) |
| A16 | **Smooth motion** — interpolate between fixes; dead-reckon from speed and course when fixes are sparse (AIS: 2 s – 3 min) | "Where is it *between* reports?" | P5 | ✅ P5 (in the branch) |
| A17 | **Course-aware markers** — the icon rotates to the heading (bow of a ship, nose of a truck) | "Which way is it going?" | P2 (icon) · P5 (live) | ✅ the icon turns to `data.course`, written live by `TrackingBehaviour` (in the branch) |
| A18 | **Trails** — the last N minutes or points as a fading line; the full track on selection | "Where has it just been?" | P5 | ✅ P5 (in the branch) |
| A19 | **Signal state** — moving · stopped · stale (no fix for T) · lost; stale and lost draw differently | "Is this position current, or are we looking at the past?" | P5 | ✅ P5 (in the branch) |
| A20 | **Follow** — the camera follows a selected object | "Keep this vessel in view." | P5 | ✅ P5 (in the branch) |
| A21 | **Planned route vs actual** — a planned route line, deviation distance, an off-route alert | "Has it left its route? By how much?" | P6 | 📋 |
| A22 | **ETA** — remaining distance and estimated arrival along the planned route | "When does it arrive? Will it miss the slot?" | P6 | 📋 |
| A23 | **Replay** — scrub recorded tracks at ×N speed with the time slider (shares A5) | "What happened last night between 02:00 and 04:00?" | P6 | 📋 |
| A24 | **Scale** — thousands of objects updating at ~1 Hz stay smooth; they aggregate at overview (shares A8) | "Show the whole fleet." | P5 (budget) · P7 (aggregation) | 🚧 budget ✅ (P5, in the branch); aggregation at overview is P7 |
| A25 | **Arrival / departure events** — entering or leaving a port, depot or delivery zone is logged with a timestamp (shares A9) | "When did it actually arrive?" | P6 | 📋 |

## Presentation — what every map story already needs

| ID | Requirement | Why | Phase | Status |
|---|---|---|---|---|
| A26 | **Hand-drawn areas** — polygon, freehand, circle (radius in km) and line, drawn on the map and kept as GeoJSON | Marking what the data doesn't already say | P4 | 🚧 draw polygon / line / circle with undo (P4, in the branch); freehand and editing are deferred |
| A27 | **Areas from coordinates** — GeoJSON `Polygon` (with holes) · `MultiPolygon` · `LineString` · `Point` + `radiusKm`, passed as data | Districts, zones, routes from a file or an API | P3 | ✅ P3 — `GeoFeaturesLayer` from GeoJSON (in the branch) |
| A28 | **Clusters from data** — an outline that wraps a group of entities and follows them | "These six sites form one circuit." | P1 | 🚧 works on a map and around pixel-constant markers; live config / editor waits on `setOptions` (B3) |
| A29 | **Icons and zoom-tiered labels as config** — a per-type icon and a per-zoom label (icon → name → name + description) are JSON, not code | Saved visualisations must reproduce the picture | P2 | ✅ in the branch (`iconSet`, template `icon`, per-type `states[].label`); not yet in `main` |
| A30 | **Labels never stack** — no two labels overlap, and a marker never covers a label | Dense cities stay legible | ✅ label vs label · P7 marker vs label | 🚧 |

---

## History

| Date | Change |
|---|---|
| 2026-11-17 | A29 → ✅, A17 and A13 → 🚧 after P2 landed in the branch. A28 → 🚧 after P1 landed in the branch. Created. A1–A14 from the analyst review of `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations`; A15–A25 added for live tracking (ships, deliveries, shipments); A26–A30 the presentation needs that story surfaced |
| 2026-11-17 | A15–A20 and A24 → ✅ in the branch after P5 (the A24 budget is the CPU tick; GPU frame time is machine-dependent and reported only). Aggregation at overview (A8 / A24's second half) is still P7 |
| 2026-11-17 | A2, A3, A27 → ✅; A13 and A11 → 🚧 after P3 (in the branch) |
| 2026-11-17 | A1 → ✅; A4, A26 → 🚧; A11 refreshed, after P4 (in the branch) |
