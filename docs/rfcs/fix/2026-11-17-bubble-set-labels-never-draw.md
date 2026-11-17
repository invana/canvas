---
id: fix-2026-11-17-bubble-set-labels-never-draw
type: fix
title: A bubble set's label is attached to a field the spec does not have, so it never draws
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/graph-layer-bubble-sets]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale }
  - { predicate: manifests-in, object: story:graph-layers/bubble-sets/AtMapScale }
---

| | |
|---|---|
| What breaks | `BubbleSet.label` is accepted, typed and documented, and draws nothing — on a plain canvas and on a map |
| Root cause | `publishSet` spreads `label` into a `PathSpec`, which has no such field; labels are `'label'` decorations attached to a mounted element (F1) |
| Defect rows | F1, F2, F3 |
| Row status | proposed 0 · accepted 0 · implemented 5 (F1–F5) · landed 0 |
| Open decisions | none |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | A set with `label: { text, placement: 'centroid' }` paints its hull and no text, at map zoom 7.4 and 11 | `story:graph-layers/bubble-sets/AtMapScale` | `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale` finding N3 |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Map scale is the cause | no (not yet confirmed on a plain canvas; V1 does that) | the field is wrong at any scale — see step 1 |
| R2 | The decoration is drawn but hidden by `LabelCollisionBehaviour` | unlikely | nothing ever calls `setDecoration` in this package (grep: 0 hits) |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `publishSet` builds a `PathSpec` and adds `label: this.labelStyleFor(...)` | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L430` | the spec type has no `label` field, the renderer ignores it |
| 2 | The working pattern is `primitives.setDecoration(specId, 'label', { kind: 'label', style })` after `project` | `file:packages/graph-layer-maplibre/src/features/GeoFeaturesLayer.ts#L573` | the label never reaches the renderer → S1 |
| 3 | (compounds) `labelStyleFor` returns `offset` in **world units** (`anchorX - cx`), but a label's offset is **screen pixels** | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L497`; `sym:ShapeLabelStyle` | even once attached, `contour-end` is misplaced by the camera scale |
| 4 | (compounds) pixel offsets go stale on zoom, and bubble sets only republish on a member-size change | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L110-L114` | the label drifts off the contour after a zoom |

**Confirming test**

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Headless canvas, one set with a label; observe `setDecoration` calls (the headless renderer's `getDecoration` is a stub) | no call today | step 1–2 |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-11-17-bubble-sets-draw-nothing-at-map-scale` | relates-to (N3) | accepted | the hull geometry; this RFC adds the label only |
| `file:packages/graph-layer-maplibre/src/features/GeoFeaturesLayer.ts#L560-L580` | pattern | implemented | attach via `setDecoration` after `project`; offset = world gap × scale |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph-layer-bubble-sets/src/BubbleSetsLayer.ts#L430` (`publishSet`) | drop `label` from the `PathSpec`; after `project(id)`, call `surface.primitives.setDecoration(id, 'label', { kind: 'label', style })` when the set has a label, and `setDecoration(id, 'label', null)` when it does not | the label draws | low | — |
| F2 | defect | implemented | `labelStyleFor` | multiply the offset by `ctx.camera.scale` (screen pixels) | `contour-end` lands on the contour at any zoom | low | F1 |
| F3 | defect | implemented | zoom-settle handler | on zoom settle, re-run only the label step (no hull recompute) when any set has a label and the scale changed | the label stays on the contour after zooming | low | F2 |
| F4 | dressing | implemented | `file:packages/graph-layer-bubble-sets/src/types.ts#L28-L31` | fix the TSDoc: it says label control "lands once we settle on a label primitive" — the primitive exists | docs match behaviour | none | F1 |
| F5 | defect | implemented | `publishSet` | publish the hull spec centred on its bounding box (`x`,`y` = centre, points local), not at (0, 0) with world-sized points. Found in V3: a pixel-size label policy scales a label about its host's origin, so a hull at (0, 0) dragged its label toward the map corner and it never showed | the label is visible and stays on its hull | medium: changes the spec's `x`/`y` and points for every set (same drawn pixels) | F1 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:IElementRenderer.setDecoration` | F1 uses it | none — public contract |
| U2 | `sym:SpecProjector.project` mounts synchronously | the decoration needs a mounted host | if it became async, F1 attaches too early |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:graph-layers/bubble-sets/BubbleSetsLayer` | story | labels now appear on any set that defines one | V2 |
| X2 | `story:graph-layers/bubble-sets/AtMapScale` | story | same; add a label to one set | V3 |
| X3 | `pkg:@invana/canvas-ui` `BubbleSetsLayerEditorPanel` | editor | none — it does not edit labels | none |
| X4 | Published `BubbleSet.label` | API | no type change; behaviour now matches its docs | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | unit test: label present → `getDecoration(id, 'label')` defined; removed via `setOptions` → cleared | `pkg:@invana/graph-layer-bubble-sets` | passes (fails before) | F1, F5 |
| V2 | pass | control: sets without a label | `story:graph-layers/bubble-sets/BubbleSetsLayer` | unchanged contours, no decorations | F1 |
| V3 | pass | visual: label at `centroid` and `contour-end`, zoom 7 → 12 on a map | `story:graph-layers/bubble-sets/AtMapScale` | text on the hull, on the contour, after each zoom settles | F2, F3 |
| V4 | pass | `pnpm check-types` · `check-boundaries` · `check-api-surface` · vitest | repo | green | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Label size on zoom: a bubble-set renderer's default grows the label with the world | (a) leave the default; (b) `setLabelSizePolicy('shape', { zoomGrowth: 0 })` so text stays one pixel size, as `GeoFeaturesLayer` does | (b): bubble sets are annotations; a 600 px label at map zoom 12 is wrong. Needs a check that the policy is per renderer and this layer owns its own | accepted — implemented as (b) |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened | proposed | follow-up to N3 of the map-scale RFC |
| 2026-11-17 | Approved, all rows | accepted | |
| 2026-11-17 | Implemented F1–F5 | implemented | F5 added: the label was attached but invisible until the hull spec was centred. `labels.test.ts` (4 tests) pass; V3 seen in Chromium on `AtMapScale` at map zoom 7.4 and after Fly to Hyderabad. Rows stay `implemented` until the change is in main |
