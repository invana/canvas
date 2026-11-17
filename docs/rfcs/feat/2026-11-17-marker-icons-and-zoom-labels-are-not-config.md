---
id: feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config
type: feat
title: A marker's icon, heading and zoom-tier label cannot be expressed as config
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-core, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-ui]
design_of_record: doc:docs/geo-intelligence-plan.md
relations:
  - { predicate: manifests-in, object: story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations }
  - { predicate: blocks, object: doc:docs/geo-intelligence-plan.md }
  - { predicate: relates-to, object: rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale }
---

| | |
|---|---|
| What is missing | A per-type icon, an icon picked by name, an icon that points along a heading, and a label whose text changes with a zoom state are all expressible today only as **code or per-node records** — never as the JSON `config` a saved visualisation is (`apps/storybook/CLAUDE.md`, "A story's settings are data") |
| Root cause | `NodeStylingTemplate` has no `icon` field and `compileSimple` never reads the structure's reserved `icon` slot (M1); `NodeIcon` offers no JSON way to name an icon (M2); a state overlay is layer-level and literal, so per-type text cannot ride it (M3); `NodeStyle` has no rotation and container rotation would carry the label (M4) |
| Rows | T1–T4, T2b, E1, S1 implemented 2026-11-17 · T5, T6 deferred to P5 |
| Row status | proposed 0 · accepted 0 · implemented 7 · landed 0 · deferred 2 |
| Open decisions | none — D1–D4 accepted 2026-11-17 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | A per-type icon has no home in the template: the `simple` structure declares `slots.icon` ("reserved for later") and `compileSimple` ignores it; `NodeStylingTemplate` has no icon field | `file:packages/graph/src/template/types.ts#L122-L130`, `file:packages/graph/src/template/compile.ts#L328-L394` | `GeoAnnotations` sets `style.icon` on **every POI record** and documents it as a per-instance exception |
| M2 | An icon cannot be named in JSON. `NodeIcon` is `glyph` (a codepoint + a font to load), `svg` (a hand-written path string) or `svg-url` (a URL to fetch — a network call, against requirement A13). The story rendered Lucide components to `data:` URLs in code | `file:packages/graph/src/layer/types.ts#L445-L475` | story built `ICONS` + `renderToStaticMarkup` + `encodeURIComponent` in its `useMemo` |
| M3 | Zoom-tier label text (name → name + description) cannot be config: the `detail` state overlay lives on the **layer** and is a literal, so it cannot read each type's own fields; the story wrote `state.detail.labelText = name + '\n' + description` onto each node | `file:packages/graph/src/layer/GraphLayer.ts#L1360-L1370` (overlay loop) | `ZoomStateBehaviour` writes the state; nothing can bind its text per type |
| M4 | No way to point a marker along a heading: `NodeStyle` has `labelRotation` only. `BaseShapeSpec.rotation` exists (container-level), but the label decoration is a child of the shape's container, so rotating the shape carries the label round with it | `file:packages/canvas-core/src/specs/shape.ts#L32-L44`, `file:packages/renderer-pixijs/src/primitives/decorations/shape/LabelDecoration.ts#L236` | a rotated host rotates its child label; its `placement: 'bottom'` offset orbits the centre |
| M5 | A node with an icon leaves the bare-number fill fast path and takes the multi-layer fill path | `file:packages/graph/src/layer/GraphLayer.ts#L1920-L1955` | cost to measure for tracking (P5) |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | An icon-per-type could ride a layer-level `node.style.icon` | no | one icon for every type; the story's seven categories need seven |
| R2 | Iconify ids (`lucide/waves`) solve naming | partly | already works as `svg-url`, but fetches `api.iconify.design` — fails offline (A13) and on air-gapped networks |
| R3 | Rotating the whole shape is the simple answer | not now | carries the label (M4); needs an upright-label design in the renderer → deferred as T5 |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | An icon set is **data**: `GraphLayerOptions.iconSet: Record<string, string>` — name → SVG markup. JSON-serialisable, offline, merged by `setOptions` like the other registries | `file:packages/graph/src/layer/GraphLayer.ts#L1236-L1246` (registries merge in `setOptions`) | a saved visualisation carries its icons; no code registers them |
| 2 | `NodeIcon` gains a member `{ kind: 'named', name, … }`. It is resolved in `nodeSpec` — the one place `style.icon` becomes a fill layer — into the existing `svg-url` layer with a `data:` URL (the renderer already fetches and parses it; proven in the story) | `file:packages/graph/src/layer/GraphLayer.ts#L1951-L1953` | every route works at once: template, layer style, per-node, state overlay |
| 3 | `NodeStylingTemplate.icon` carries a `NodeIcon` (named or not); `compileSimple` writes it to `out.icon` unless the structure sets `slots.icon: false` | `file:packages/graph/src/template/compile.ts#L328` | per-type icons become template config |
| 4 | `NodeTypeBinding.states[name].label` is an `interpolate` template (`'{data.name}\n{data.description}'`); `resolveNodeStyle` applies it for each active state **between** the layer overlay and the per-node overlay | `file:packages/graph/src/template/compile.ts#L107` (`interpolate`), `file:packages/graph/src/layer/GraphLayer.ts#L1360-L1370` | zoom-tier text is per-type config; `ZoomStateBehaviour` is unchanged |
| 5 | Icon rotation, not shape rotation: `rotation` (radians, clockwise from up) on the three inset layer kinds; the renderer rotates the inset child about its centre in `positionAndScale`, and leaves it **out** of `layerKey` so a heading change repositions, never remounts | `file:packages/renderer-pixijs/src/primitives/paint/insetContentLayer.ts#L134-L160`, `#L230-L240` | the label and the silhouette stay put; a compass course (0° = north, clockwise) maps straight on |
| 6 | A template icon may bind its rotation to a record field: `rotationBind: 'data.course'`, `rotationUnit: 'deg' \| 'rad'` (default `deg`), `rotationOffset` | `file:packages/graph/src/template/bindings.ts` (`resolvePath`) | a vessel or rider icon follows `data.course` with no code |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/geo-intelligence-plan.md` | design of record (P2: T1–T4) | 📋 | this RFC scopes P2's landing |
| `doc:docs/node-styling-unification-plan.md` (memory: node styling unification) | relates-to | plan | one simple semantic node style incl. `icon`; T1 is a step toward it, not a rival |
| `rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks` | relates-to | landed | the template registries (`nodeStructureTemplates` / `nodeStylingTemplates` / `nodeTypes`) are the right home; this RFC extends them rather than adding a parallel channel |
| `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale` | relates-to | accepted | P1 — independent; both feed the rewritten `GeoAnnotations` (plan S1) |

## 4. The change

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| T1 | defect | implemented | `file:packages/graph/src/template/types.ts` (`NodeStylingTemplate`, `SimpleStructure.slots`), `file:packages/graph/src/template/compile.ts#L328` (`compileSimple`) | add `icon?: NodeIcon` to the styling template; `compileSimple` writes it to `out.icon` unless `struct.slots.icon === false`; card structures are unchanged | a per-type icon is plain config (M1) | low — additive; a template without `icon` compiles exactly as before | — |
| T2 | defect | implemented | `file:packages/graph/src/layer/types.ts` (`NodeIcon`, `GraphLayerOptions.iconSet`), `file:packages/graph/src/layer/GraphLayer.ts#L1951` (`nodeSpec`), `#L1236` (`setOptions`) | add `NodeIcon` member `{ kind: 'named', name, color?, alpha?, sizeRatio?, anchor?, strokeWidth?, rotation? }`; add `iconSet`; resolve `named` → `svg-url` + `data:` URL in `nodeSpec` (cached per name); an unknown name draws nothing and warns once per name; merge `iconSet` in `setOptions` | icons by name, offline, serialisable (M2) | medium — widens a public union (any exhaustive `switch (icon.kind)` outside the repo breaks at compile time); touches the fill path every icon takes | — |
| T2b | dressing | implemented | `pkg:@invana/canvas-ui` `sym:iconSetFromLucide` | `iconSetFromLucide({ waves: Waves, … })` → `Record<string, string>` by rendering each Lucide component to SVG markup once (`react-dom/server`, already a peer) | an app builds its icon set in one call; from then on the config is plain JSON | low — optional helper; the engine never imports Lucide | T2 |
| T3 | defect | implemented | `file:packages/graph/src/template/types.ts` (`NodeTypeBinding.states`), `file:packages/graph/src/layer/GraphLayer.ts#L1360-L1370` | `states?: Record<string, { label?: string }>`; `label` is an `interpolate` template; applied per active state after the layer overlay and before the per-node overlay | zoom-tier label text per type as config (M3) | low — additive; no `states` → identical resolution | — |
| T4 | defect | implemented | `file:packages/canvas-core/src/specs/style.ts#L55-L125` (inset layers), `file:packages/renderer-pixijs/src/primitives/paint/insetContentLayer.ts` (`positionAndScale`, `layerKey`), `file:packages/graph/src/layer/types.ts` (`NodeIcon.rotation`, `rotationBind`/`rotationUnit`/`rotationOffset`), `compile.ts` | `rotation?: number` (radians, clockwise from up) on `glyph` / `svg` / `svg-url` insets; the renderer rotates the child about its centre; **not** in `layerKey`; the template resolves `rotationBind` per node (degrees by default) | a marker's icon points along a bound heading; label and body untouched (M4) | **medium** — a renderer change in `positionAndScale`, which every inset passes through; rotation about the centre must not shift the anchor | T1 |
| T5 | defect | deferred | `pkg:@invana/renderer-pixijs` `LabelDecoration`, `pkg:@invana/graph` | rotate the **whole shape** (a ship silhouette) with an upright label: the label decoration counter-rotates *and* its placement offset is rotated back | silhouette markers | high — placement maths for every `placement` value | unblocks with P5 if icon rotation (T4) is not enough |
| T6 | defect | deferred | `pkg:@invana/renderer-pixijs` `sym:PrimitivesRenderer`, `pkg:@invana/graph` | a hot-path `setShapeIconRotation(id, rad)` beside `scaleShape` — a heading update writes a transform, not a style resolve + spec rebuild | per-second heading updates at fleet scale | medium | decided by P5's V7 budget measurement |
| E1 | dressing | implemented | `file:packages/canvas-ui/src/editor-panels/node-styling/NodeStylingEditorPanel.tsx` (+ its `fields.ts` / `mapping.ts`) | icon name, size and rotation-bind / unit / offset fields (root rule 12), **and** `formToStyling` carries every icon it cannot show (a glyph / svg / svg-url icon verbatim; a `named` icon's colour, alpha, anchor, stroke and static rotation) — without it, T1 makes a styling-editor save delete the template's icon | the studio edits what the template now carries, and a save never deletes an icon | low — but the carry-through is the sharp edge (N1) | T1, T2, T4 |
| S1 | dressing | implemented | stories (rule 11) | `graph/Nodes/Icon/Named` (template icons by name from an `iconSet`), `graph/Nodes/Icon/Rotated` (heading from `data.course`; includes a control with no icon), `graph/Nodes/Label/TypeStateLabels` (per-type `states.detail.label` driven by `ZoomStateBehaviour`; filed under `Label/` because `graph/Nodes/State` is already a leaf) | rule 11; each state of each piece shown | low | T1–T4 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | The renderer's `svg-url` fetch + `svgMarkupToPathD` | T2 relies on `data:` URLs going through the same path (proven in `GeoAnnotations`) | an SVG feature the parser drops (it keeps path / circle / ellipse / rect / line / polyline / polygon, strokes only) changes a named icon's look |
| U2 | `ZoomStateBehaviour` writing runtime states via `store.internal` | T3 reads active states in `resolveNodeStyle` | none — T3 only reads |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `pkg:@invana/graph` `sym:NodeIcon` consumers — `file:packages/graph/src/index.ts`, `file:packages/graph/src/template/compile.ts` | package | union gains `named` | `pnpm check-types` finds any exhaustive switch; none found by grep outside type files |
| X2 | Composite cards (`file:packages/graph/src/nodes/composite/*.ts`) | package | they use `CompositePart` icon parts, not `NodeIcon` | none |
| X3 | `story:graph/Nodes/Icon/{Glyph,Svg,FontAwesome}` | story | unchanged icon kinds | V1 control |
| X4 | `story:canvas-demos/by-casestudies/geo-annotations/GeoAnnotations` | story | can drop its per-record icons, `ICONS` and the `detail` state | plan S1 (separate change) |
| X5 | Serialised visualisations (`config`, exported state) | data | gains optional `iconSet`, `icon`, `states` — additive; old state loads unchanged | none |
| X6 | `pkg:@invana/canvas-ui` `NodeStylingEditorPanel` | editor | new fields | E1 |
| X7 | `pnpm check-api-surface` snapshots | gate | `NodeIcon`, `NodeStylingTemplate`, `NodeTypeBinding` are existing exports whose shapes widen; any new exported name (`iconSetFromLucide`) is in `canvas-ui`, outside the three snapshotted barrels | run the check |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | control — visual compare before / after | `story:graph/Nodes/Icon/Glyph`, `…/Svg`, `…/FontAwesome` | identical | T2, T4 |
| V2 | pass | unit test: `compileSimple` with a styling icon, with `slots.icon: false`, with none | `pkg:@invana/graph` | `out.icon` present / absent / absent | T1 |
| V3 | pass | unit test: a `named` icon resolves to an `svg-url` data URL; unknown name → no layer + one warning; `setOptions({ iconSet })` merges | `pkg:@invana/graph` | as stated | T2 |
| V4 | pass | unit test: `resolveNodeStyle` with an active state and a type `states.detail.label` — template filled from `data`; precedence: layer overlay < type state < per-node overlay | `pkg:@invana/graph` | label text per type; order holds | T3 |
| V5 | pass | unit test: `rotationBind` degrees → radians, `rotationOffset`, a missing field → no rotation | `pkg:@invana/graph` | as stated | T4 |
| V6 | pass | story walk: named icons from a template; a rotated icon follows `data.course` (0°, 90°, 180°, 270°); the label stays upright and below; a heading change does not flicker or remount | `story:graph/Nodes/Icon/Named`, `…/Rotated` | icons draw offline (network blocked); four headings correct | T1, T2, T4 |
| V7 | pass | story walk: `ZoomStateBehaviour` lengthens each type's label from its own fields | `story:graph/Nodes/Label/TypeStateLabels` | name → name + description per type | T3 |
| V8 | pass | offline check — block the network in the browser, load the named-icon story | `story:graph/Nodes/Icon/Named` | every icon draws | T2 |
| V9 | pass | `pnpm check-types` · `pnpm lint` · `pnpm build` · `pnpm check-api-surface` | repo | green | all |
| V10 | skipped | editor: change an icon name and a rotation bind in the styling panel | `story:canvas-ui/editors/TemplateStudio` | the marker updates | E1 — **partly run**: the five icon fields render in the panel with no console errors. The live "type a name, watch a marker change" path was not driven: Template Studio edits a *card* styling (icons do not apply to cards) and no story drives this editor against a simple marker. The mapping is covered by 11 unit tests (V4's sibling, N1) and the layer merge by V3 |

**Observed (2026-11-17)**

| Check | Result |
|---|---|
| V1 | `story:graph/Nodes/Icon/Svg` and `…/Glyph` rendered after the change: insets centred and unrotated in every silhouette, as before (`…/FontAwesome` needs the network and was not run) |
| V2–V5 | `packages/graph/tests/template/markerIcons.test.ts` — 17 tests: a template icon reaches the style / `slots.icon: false` drops it / none compiles as before; a named icon publishes an `svg-url` layer over the exact `data:` URL, keeping colour, size and rotation; an unknown name draws as a bare disc and warns once; `setOptions({ iconSet })` merges and a late icon starts to draw; a type's `states.detail.label` fills per type and orders layer overlay < type < node's own; a layer overlay still wins for a type with none; `rotationBind` turns 0/90/180/270° into 0/π/2/π/3π/2, honours `rad`, an offset in the same unit, a missing / string / `null` / `NaN` field draws unrotated, template-only fields are stripped, and a changed `data.course` updates the published spec. Whole `graph` suite: 425 pass |
| V6 | `story:graph/Nodes/Icon/Rotated`: 000° up, 090° east, 180° south, 270° west, 045° up-right and 315° up-left (cropped and enlarged to check the diagonals); the no-`course` control draws up; the label stays upright below each disc; **Turn all +15°** rotates every icon clockwise. `…/Named`: seven types draw from the template + `iconSet`, plus a literal-SVG icon |
| V7 | `story:graph/Nodes/Label/TypeStateLabels`: opens on short labels; zoomed past the threshold a port reads `Kakinada · India · 12 berths` and a vessel `MV Alpha · India · grain` from the same behaviour; **Zoom state** off keeps both short |
| V8 | `…/Named` loaded with every non-localhost request aborted (0 were attempted): all eight icons draw |
| V9 | `pnpm check-types` 19 / 19 · `check-boundaries` · `check-api-surface` (three snapshotted surfaces unchanged) · eslint 0 errors · tests: canvas-core 179, canvas-store 124, canvas 31, renderer-pixijs 12, graph 425, canvas-ui 11, graph-layer-bubble-sets 13 |

**Findings that changed the RFC**

| ID | Finding | Effect |
|---|---|---|
| N1 | `formToStyling` rebuilds a template from the fields it models, so adding `icon` to `NodeStylingTemplate` would have made every styling-editor save **delete a template's icon** — the hazard its own comment names for `group` and `badges` | E1 extended with the carry-through; `pkg:@invana/canvas-ui` gained a `vitest` setup and 11 tests (mutation-checked: removing the carry-through line fails the verbatim-icon test) |
| N2 | A fill built from an icon is a layer array, not a bare number (M5) | not measured; P5's V7 budget (5,000 objects at 1 Hz) is where it is |
| N3 | The first `TypeStateLabels` default (`minZoom 1.6`) sat *below* the fitted zoom (~2.3), so the story opened already in the detail tier and never showed the base labels | default raised to 3, slider range to 8, the docblock says to zoom in |
| N4 | `named` is not resolved for **badges** (badges are built outside the layer instance) | badge `icon` is typed `ResolvedNodeIcon` (`NodeIcon` without `named`) so it cannot be passed; no behaviour change for badges |
| N5 | The renderer keeps only stroked drawing primitives (`path` · `circle` · `ellipse` · `rect` · `line` · `polyline` · `polygon`) — a filled or multi-colour SVG loses its fills | documented on `iconSet`; an outline set such as Lucide is the fit |
| N6 | `graph/Nodes/State` is already a leaf story, so a `State/` group beside it would collide in the sidebar | the per-type label story is `graph/Nodes/Label/TypeStateLabels` |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Rotation first: icon only, or the whole shape | (a) icon inset only · (b) whole shape with upright labels · (c) both | (a): contained, label-safe, enough for a vessel / rider / plane glyph. Whole-shape (T5) waits until a silhouette is needed | accepted 2026-11-17 |
| D2 | Icon set as data in the layer, or a global registry the app fills | (a) `GraphLayerOptions.iconSet` (serialisable, per layer) · (b) an app-global registry (shared, not serialised) | (a): a saved visualisation reproduces its icons; a global registry is code. Layers that share a set repeat it — acceptable for a handful of icons | accepted 2026-11-17 |
| D3 | Heading unit and zero | (a) degrees, 0 = north / up, clockwise · (b) radians | (a) in templates (what AIS and GPS give), radians in specs (what the renderer takes) | accepted 2026-11-17 |
| D4 | Where `iconSetFromLucide` lives | (a) `canvas-ui` helper · (b) documented in a story only · (c) a new `@invana/canvas-icons-lucide` package | (a): `react-dom` and `lucide-react` are already `canvas-ui` peers; a package is premature for one function | accepted 2026-11-17 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened from the GeoAnnotations story and the geo-intelligence plan (P2) | proposed | code read for M1–M5 and the choke points; no code written |
| 2026-11-17 | Approved whole by the maintainer ("approve p2"); D1–D4 accepted with the recommendations | accepted | T5, T6 stay deferred |
| 2026-11-17 | T1–T4, T2b, E1, S1 implemented; V1–V9 pass; V10 partly run (skipped, reason in the row) | accepted | findings N1–N6; reaches `landed` when the change is in `main` and V10's live path is run |
