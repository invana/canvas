---
id: fix-2026-11-23-a-self-loop-edge-is-not-drawn-on-the-schema-board
type: fix
title: A self-loop edge (source === target) draws as a stray arrowhead at the node's top-left corner instead of a loop
status: proposed
opened: 2026-11-23
decided: null
landed: null
packages: [pkg:@invana/graph, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/layer/GraphLayer.ts#L2096-L2105" }
  - { predicate: caused-by, object: "file:packages/renderer-pixijs/src/primitives/base/ShapeBase.ts#L286-L289" }
  - { predicate: manifests-in, object: "sym:SchemaBoard" }
  - { predicate: manifests-in, object: "story:canvas-ui/apps/SchemaBoard/SchemaBoard" }
  - { predicate: manifests-in, object: "story:canvas-demos/by-casestudies/global-model/GlobalModel" }
  - { predicate: relates-to, object: rfc:fix-2026-11-23-schema-board-detail-levels-read-inverted }
  - { predicate: relates-to, object: "doc:docs/group-aware-layouts-plan.md" }
---

| | |
|---|---|
| What breaks | An edge whose source and target are the same node draws no line, only a tiny right-pointing arrowhead at the node's bounding-box top-left corner. This happens at every Detail level, framed or not |
| Root cause | `GraphLayer.edgeSpec` has no self-loop branch. A true loop gets the default `straight` path and `boundary` anchors. Both anchors aim at the node's own centre, the ray is zero-length, and `aabbRayExit` returns its top-left-corner sentinel for both ends, so the path is `M p L p` |
| Defect rows | F1, F2 (F4 is the SchemaBoard-only alternative to F1) |
| Dressing rows | F3, F5, F6 |
| Row status | proposed 6 · accepted 0 · implemented 0 · landed 0 |
| Open decisions | D1 where the loop rule lives · D2 default placement · D3 the zero-length guard · D4 layout room for loops |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | AirRoutes has 3 node types and 2 edge types: `contains` (continent → airport) and `route` (airport → airport). The footer reads "3 nodes and 2 edges rendered", but only `contains` is visible | Invana Studio model board, `sym:SchemaBoard` (`pkg:@invana/canvas-ui` 0.0.18, `pkg:@invana/graph` 0.0.18, linked locally) | screenshot `03-model-board.png` (Detail Low) |
| S2 | A tiny right-pointing arrowhead sits just outside the airport node's top-left corner | same | `03-model-board.png` at (963, 415); `02-global-high.png` at (903, 336), the 60×60 bbox corner of the circle |
| S3 | The same at every Detail level (circles, cards, schema cards) and in the multi-model framed board | Studio global model | `02-global-high.png`, `02-global-low.png` |
| S4 | The repo's own schema-board data has 4 self-loops: `AirRoutes.route`, and `Twitter.REPLIES_TO`, `RETWEETS` and `QUOTES` on `Twitter.Tweet`. Every story that draws `airwaysSchema()` carries the defect | `dataset:airwaysGlobalModel` → `file:apps/storybook/stories/canvas-ui/apps/SchemaBoard/data.ts#L40` | `global-model.json`: 4 edges with `source === target` (node count over the JSON) |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Studio's mapping drops or misaddresses the edge | no | `board.ts#L54-L64` maps every edge type with `source`/`target` = `typeId(model, …)`, the same ids its nodes carry. The footer counts the edge as rendered, and S2 is that edge's marker |
| R2 | The ELK worker 403 lost the loop's route, so the edge fell back to nothing | no | no layout ever routes a self-loop: `collectLayoutEdges` drops `source === target` (`file:packages/graph/src/layout/groups.ts#L162`). Also, `SCHEMA_BOARD_CONFIG.layouts.elk` sets no `edgeRouting` (`file:packages/canvas-ui/src/board/schema/presets.ts#L178-L185`), so `routePathType` is `null` (`file:packages/graph-layout-elkjs/src/ElkLayout.ts#L327-L330`) and no edge has a route. `contains` draws without one |
| R3 | The edge is culled as hidden | no | the only self-loop cull is the collapse case, which needs `edge.source !== edge.target` (`file:packages/graph/src/layer/GraphLayer.ts#L2139-L2140`). The edge is emitted `visible: true` |
| R4 | A Detail-level shape (circle vs card vs schema card) anchors wrongly | no | the three structures are freeform/composite and use `ShapeBase.boundaryIntersect` (the AABB). All three hit the same sentinel, so the corner is the bbox top-left at every level (S2, S3). Only analytic shapes override it: `EllipseShape` returns `(rx, 0)` on a zero ray (`file:packages/renderer-pixijs/src/primitives/shapes/EllipseShape.ts#L79-L82`) |
| R5 | The frame (group) clips or covers the edge | no | the unframed model board shows the same thing (`03-model-board.png`) |
| R6 | The loop path styles are broken | no | `loop-curve` / `loop-polyline` are registered (`file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L475-L476`) and draw in the loop stories (V1 control). They are simply never chosen |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | The board's edge template sets no `pathType`, and nothing in `<SchemaBoard>` looks at `source === target` | `file:packages/canvas-ui/src/board/schema/presets.ts#L174`; `file:packages/canvas-ui/src/board/schema/SchemaBoard.tsx#L361` | the loop edge resolves like every other edge |
| 2 | `edgeSpec` defaults `pathType` to `straight` (router `straight`, pathStyle `normal`) and both anchors to `boundary`. There is no branch for a true self-loop | `file:packages/graph/src/layer/GraphLayer.ts#L2100-L2105`; `#L96-L99` | spec: `{ source: airport/boundary, target: airport/boundary, router: straight, pathStyle: normal }` |
| 3 | The renderer aims each anchor at the other endpoint's centre. For a loop, that is the node's own centre | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2716-L2744` | `boundaryAnchor` gets `localFromCenter = (0, 0)` (`file:packages/canvas-core/src/lib/geometry/connectors/anchors/boundary.ts#L30-L36`) |
| 4 | `aabbRayExit` treats a zero ray as degenerate and returns the centred bounds' origin `(-w/2, -h/2)` as a documented sentinel ("callers … should ensure the two endpoints differ") | `file:packages/renderer-pixijs/src/primitives/base/ShapeBase.ts#L279-L289` | both endpoints land on the bbox **top-left corner** |
| 5 | The `straight` router and `normal` style emit `M p L p` | `file:packages/canvas-core/src/lib/geometry/connectors/routers/straight.ts#L14-L19`; `…/pathStyles/normal.ts#L11-L17` | a zero-length stroke draws nothing → S1 |
| 6 | The target marker is still painted at `p`. `tangentAtEnd` on a zero-length leg falls back to `normalize(0, 0) = (1, 0)` | `file:packages/renderer-pixijs/src/primitives/base/ConnectorBase.ts#L240-L246`; `file:packages/canvas-core/src/lib/geometry/connectors/pathSampling.ts#L661-L664` | a right-pointing arrowhead at the corner → S2, identical at every level → S3 |

This produces exactly the symptom: the footer counts a connector (it is visible), no line shows, and a right-pointing arrowhead sits at the bbox top-left at every Detail level.

**Confirming test** (not run; this RFC changes no code)

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Headless `GraphLayer`, one node, edge `a → a`; read the published connector spec | expected: `router: 'straight'`, `pathStyle: 'normal'`, both anchors `'boundary'` | steps 1–2 |
| T2 | Renderer unit: rect shape at (0, 0) 100×60, connector `straight`/`normal`/`boundary` to itself; read `inst.path` | expected: `[M(-50,-30)+origin, L same]`, zero length | steps 3–5 |
| T3 | Open `story:canvas-ui/apps/SchemaBoard/SchemaBoard`, find `AirRoutes.airport` and `Twitter.Tweet` | expected: no loops, and one stray arrowhead per loop-carrying node (Tweet's three loops overlap) | S4 reproduces in-repo |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `sym:loopCurvePathStyle` (`file:packages/canvas-core/src/lib/geometry/connectors/pathStyles/loopCurve.ts#L157-L199`) | the loop geometry already exists | shipped | two-foot mode (distinct feet from anchors) and single-pivot mode (coincident ends). F1 uses two-foot mode |
| `sym:loopPolylinePathStyle` | orthogonal sibling | shipped | the alternative to D2 |
| `EdgePathType` `'loop-curve' \| 'loop-polyline'` (`file:packages/graph/src/layer/types.ts#L81-L86`) | its TSDoc puts the burden on the caller ("use when `source === target`") | shipped | the type; F6 rewrites the TSDoc |
| `file:packages/canvas-ui/src/view-panels/schema/schema.ts#L130-L133` (`sym:schemaToMetaGraph`) | the same fix done consumer-side for the other schema view: `c.from === c.to ? 'loop-curve' : edgeRouting` | shipped | the precedent for the rule. It leaves anchors at `boundary`, so its loop also starts from the step-4 corner sentinel (single-pivot petal above the bbox corner) |
| `file:packages/graph/src/behaviours/DrawEdgeBehaviour.ts#L94` | a drawn self-loop is created as `loop-curve` with `center` anchors | shipped | explicit per-edge style; F1 must not override it |
| `file:packages/graph/src/layer/GraphLayer.ts#L2134-L2146` | collapse-induced self-loops are culled on purpose | shipped | F1 applies only when `edge.source === edge.target` |
| `doc:docs/group-aware-layouts-plan.md` (§ `collectLayoutEdges`) | layouts drop self-loops | design of record | unchanged; F5 only adds room around a loop and does not hand loops to ELK |
| `doc:docs/badges-edges-plan.md` (Edge cases) | a badge on a loop lands on its apex | plan | holds once loops draw |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/graph/src/layer/GraphLayer.ts#L2096-L2125` (`edgeSpec`) | For a **true** self-loop (`edge.source === edge.target`) with no own `waypoints`: (a) a non-loop `pathType` (template, route or toolbar default) becomes `loop-curve`; (b) an anchor the edge's style leaves unset becomes `silhouette-port` on the D2 side, source at `offset: -gap` and target at `+gap`, which is loop-curve's two-foot mode; (c) `pathStyleOpts.side` defaults to the same side. An explicit loop `pathType`, explicit anchors and explicit `pathStyleOpts` are kept | every `GraphLayer` board draws a loop on the node's silhouette. This covers SchemaBoard at all three Detail levels, framed and unframed, plus Studio, with no consumer change | medium: it is a graph-wide default, so every story or dataset with a self-loop changes how it looks (§5 X1–X7). Anchors move for explicit-`loop-curve` edges that set no anchors (X5) | — |
| F2 | defect | proposed | same | The k-th true self-loop on one node (stable order by edge id, from `store.edgesOf(node)`) grows `radius` and `gap` by a fixed step × k unless its style sets them | `Twitter.Tweet`'s three loops nest instead of drawing as one | medium: O(degree) per loop spec, only on loop edges. Changing one loop re-specs its siblings | F1 |
| F3 | dressing | proposed | `file:packages/renderer-pixijs/src/primitives/base/ConnectorBase.ts#L240` (and the source-marker twin) | skip both markers when the path's total length is 0 | no stray arrowhead from any remaining degenerate connector. **Hides** the symptom and does not draw the loop | low | — (D3: only together with F1) |
| F4 | defect | proposed | `file:packages/canvas-ui/src/board/schema/presets.ts#L174` | *Alternative to F1, exclusive with it (D1):* the board's edge `style.shape` resolver returns the F1 loop shape when `source === target` | fixes SchemaBoard only. Plain `GraphLayer` boards and other apps keep the defect | low | — |
| F5 | dressing | proposed | `file:packages/graph/src/layer/GraphLayer.ts` (group auto-fit) or `SCHEMA_DETAIL` padding | a group's auto-fit includes its members' loop extents (or frame padding ≥ loop height at each level) | a loop near a frame edge stays inside the frame (airport sits at the frame's right edge in `02-global-*`) | medium: frame sizes change, so a re-layout moves neighbours | F1 (D4) |
| F6 | dressing | proposed | `file:packages/graph/src/layer/types.ts#L81-L86` | TSDoc: a self-loop takes `loop-curve` by default; name the anchor/side defaults | docs match behaviour | none | F1 |

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:loopCurvePathStyle` two-foot mode, `chordLen > COINCIDENT_EPS` | F1 relies on the two feet being distinct | if `gap` ≤ 0.25 it drops to single-pivot mode and blooms from the first foot |
| U2 | `silhouette-port` anchor (`file:packages/canvas-core/src/lib/geometry/connectors/anchors/silhouettePort.ts`) | puts the feet on the drawn outline | freeform/composite shapes fall back to the AABB face. A `top` foot near the face midpoint is on the ring of the High-level circle; a corner foot would float off it (D2) |
| U3 | `sym:GraphStore.edgesOf` | F2's sibling index | none, public |
| U4 | `ShapeBase.boundaryIntersect` sentinel | stays as is. F1 stops loops from reaching it | none |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | `story:canvas-ui/apps/SchemaBoard/SchemaBoard` · `story:canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail` · `story:canvas-ui/apps/SchemaBoard/SchemaBoardConnect` · `story:canvas-demos/by-casestudies/global-model/GlobalModel` | story | 4 loops appear (airport ×1, Tweet ×3) | V3, V4 |
| X2 | `story:canvas-ui/apps/SchemaBoard/SchemaBoardUnframed` (NewsArticles, no loops) | story | unchanged | V2 control |
| X3 | `story:graph/Edges/Types/LoopCurve/*`, `story:graph/Edges/Types/LoopPolyline/*`, `story:canvas/Conncepts/Connectors/PathStyles/Loop*` | story | unchanged: explicit `pathType` and `center` anchors | V1 control |
| X4 | `story:canvas-demos/tools/GraphModeller` (`DrawEdgeBehaviour` loops) | story | unchanged: explicit `loop-curve` and `center` | V1 |
| X5 | `sym:schemaToMetaGraph` (`pkg:@invana/canvas-ui` view panel) | component | its explicit `loop-curve` has no anchors, so F1(b) moves its petal from the bbox corner to the D2 side | look once; no code change |
| X6 | `dataset:invanaCodeKg` (2 self-loops) via `file:apps/storybook/stories/canvas-demos/by-casestudies/code-kg/DotsForce.stories.tsx`, `HealthBadges.stories.tsx`, `CompositeCards.stories.tsx`, `file:apps/storybook/stories/canvas-demos/tools/CanvasDesigner.stories.tsx` | story | 2 loops appear where an arrowhead was | look once |
| X7 | Invana Studio `studio/apps/web/src/model/board.ts` | external consumer | loops appear after the version bump; no change | none |
| X8 | Published API | API | no type change. `EdgePathType`, `EdgeAnchor` and `SchemaBoardProps` are unchanged, so `check-api-surface` is unaffected. There is a behaviour change → changeset for `pkg:@invana/graph` (+ `pkg:@invana/renderer-pixijs` if F3, `pkg:@invana/canvas-ui` if F4) | changeset |
| X9 | Serialised state | state | none: the loop shape is resolved at render. `exportData` and saved canvases are unchanged. Image/SVG export now includes loops | none |
| X10 | Picking / hover / `ClickSelectBehaviour` | behaviour | a loop now has an extent, so it can be hovered and selected (today only the corner point) | V3 |
| X11 | Status bar "N edges rendered" | UI | unchanged count | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | control: explicit loops | `story:graph/Edges/Types/LoopCurve/Ring`, `story:canvas-demos/tools/GraphModeller` (release on the same node) | unchanged, pixel for pixel | F1 |
| V2 | pending | control: non-loop edges | `story:canvas-ui/apps/SchemaBoard/SchemaBoardUnframed`; `contains` in Studio's AirRoutes | unchanged straight edges with arrowheads | F1, F2 |
| V3 | pending | new story `canvas-ui/apps/SchemaBoard/SchemaBoardSelfLoops`: one node with one loop, one node with three, framed and unframed, cycled through High · Medium · Low | new story | at each level: a visible loop on the silhouette with its arrowhead on the foot, three nested loops on the second node, hover/select works | F1, F2 |
| V4 | pending | visual | `story:canvas-ui/apps/SchemaBoard/SchemaBoard`, `story:canvas-demos/by-casestudies/global-model/GlobalModel` | airport and Tweet carry loops; no stray corner arrowhead | F1, F2, F5 |
| V5 | pending | unit (`packages/graph/tests/layer/selfLoopEdge.test.ts`): `a → a` with no style → `pathStyle: 'loop-curve'`, `silhouette-port` anchors with distinct offsets; with explicit `center` anchors → kept; collapse self-loop → still `visible: false`; 3 loops → distinct radii | `pkg:@invana/graph` | passes (fails before) | F1, F2 |
| V6 | pending | unit: zero-length path paints no marker | `pkg:@invana/renderer-pixijs` | passes | F3 |
| V7 | pending | Studio: AirRoutes model board and global model at all levels | Invana Studio (local link) | `route` drawn on airport | F1 |
| V8 | pending | `pnpm check-types` · `check-boundaries` · `check-api-surface` · vitest | repo | green | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does "a self-loop draws as a loop" live? | (a) `GraphLayer` default, F1; (b) `<SchemaBoard>` preset, F4; (c) every consumer, like `schemaToMetaGraph` | (a): no path type other than a loop can draw `source === target`, so a non-loop default is never right. (b) leaves every other board broken, and (c) is how it got missed | open |
| D2 | Default loop placement | (a) `top`, feet at ±gap on the top face; (b) `top-right` corner (G6 default); (c) `right` | (a): the top-face midpoint is on the silhouette of the circle and the cards alike, and stays clear of layered-RIGHT in/out edges. (b) floats off the High-level circle (U2) | open |
| D3 | Land the zero-length marker guard (F3)? | (a) with F1, as a guard for other degenerate connectors; (b) reject | (a) only alongside F1, never in place of it | open |
| D4 | Room for loops in layout (F5) | (a) group auto-fit includes loop extents; (b) larger frame padding per level; (c) defer | (c) until V4 shows a loop crossing a frame. ELK still never sees loops (`doc:docs/group-aware-layouts-plan.md`) | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-23 | Opened from Invana Studio's AirRoutes board (`route` airport → airport missing) | proposed | the ELK worker 403 in that setup is unrelated (R2) |
