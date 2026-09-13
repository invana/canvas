---
id: fix-2026-09-13-routed-endpoints-aim-at-the-wrong-point
type: fix
title: A routed connector anchors toward the far node instead of its own first waypoint, so every endpoint grows a stub
status: landed
opened: 2026-09-13
decided: 2026-09-13
landed: 2026-09-13
packages: [pkg:@invana/renderer-pixijs]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2329-L2337" }
  - { predicate: manifests-in, object: "story:designs/SchemaER" }
  - { predicate: manifests-in, object: "story:designs/AgenticWorkflow" }
  - { predicate: supersedes, object: "rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read" }
---

## Summary

| | |
|---|---|
| **What breaks** | Every endpoint of an ELK-routed edge grows a short leg that runs along the node's own border before the arrowhead. Present in every story that sets `edgeRouting`. |
| **Root cause** | Anchors are asked "where does the line leave this silhouette?" and answer by aiming at `fromPoint`. `fromPoint` was always the **far endpoint's centre** — but a routed connector leaves toward its **first waypoint**. The anchor therefore landed somewhere the route never goes, and the router joined the two. |
| **Defect rows** | F1 |
| **Open decisions** | None |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 1 · deferred 0 · rejected 0 |

This is **D3** from `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read`, left open there when that RFC's F3 was reverted.

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Each edge into `order_item` runs horizontally, drops vertically **along the card's left border**, then the arrowhead | `story:designs/SchemaER` | Screenshots across the whole session |
| S2 | A matching small jog leaves `product`'s right face | same | Same |
| S3 | `Synthesise → answer` steps sideways just before the target | `story:designs/AgenticWorkflow` | Screenshot |
| S4 | Never appears on an edge with **no** waypoints | `story:designs/NetworkMap` | Screenshot — force-laid, no routing, endpoints clean |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The `orth` router invents the corner | **No** | It faithfully joins the two points it is given; the points are wrong |
| R2 | ELK's bend points are wrong | **No** | ELK's `startPoint`/`endPoint` sit exactly on the node border, which is where the line should meet it |
| R3 | Pin the endpoints with the `edge-port` anchor | **Tried and reverted** | It answers the *outward face normal* as its tangent, so the router's stub — and then the arrowhead — turned back into the node. See the History of `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read` |
| R4 | Keep only ELK's *interior* bends and drop the terminal points | **Tried previously, worse** | Recorded in-code: it made `orth` L-bend across a long misaligned first/last leg — "visible peaks at both ends". Both that and the full path fail **for the same reason**: the anchor is aiming at the wrong thing either way |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | `boundaryAnchor` casts a ray from the shape centre toward `fromPoint` and returns where it exits the silhouette | `file:packages/canvas-core/src/lib/geometry/connectors/anchors/boundary.ts#L24-L40` | The endpoint is entirely determined by what it is told to aim at |
| D2 | The renderer always passed the **far endpoint's centre** as `fromPoint` — a two-pass scheme that predates waypoints | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L2329-L2337` (pre-fix) | For a routed edge the anchor aims at a node the path never heads toward |
| D3 | The router then has to connect that anchor point to `waypoints[0]`, which lies elsewhere on the same border | — | An axis-aligned leg along the node's own edge — **exactly S1, S2, S3** |

**Why this and nothing else produces the observed frame:** the leg is always short, always axis-aligned, and always hugs the node — because both points lie on the same silhouette, differing only in where along it. An edge with no waypoints passes the far centre, which *is* the direction it travels, so it is unaffected — **exactly S4**.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Aim each terminal anchor at its adjacent waypoint; re-screenshot | Every stub gone in both ER and workflow; arrowheads meet the card face square-on | D2 is the whole cause |
| T2 | Screenshot the un-routed story | Unchanged | The change is inert without waypoints |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read` | supersedes (its D3) | landed | Its diagnosis of the jog was right; its chosen fix (`edge-port` pinning, F3) was not and was reverted. This RFC closes what it left open |
| `rfc:feat-2026-09-13-feedback-edges-get-their-own-lane` | relates-to | landed | Reached the same principle independently — *choose geometry so the natural anchor is already right*. This generalises it to every routed edge |
| In-code note on using the full section path | relates-to | superseded | Its reasoning ("connects the boundary-anchored endpoints without a spurious corner") only holds once the anchor aims at the waypoint |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts` (`resolveConnectorGeometry` pass 2) | When the spec carries waypoints, pass the **adjacent waypoint** as `fromPoint` instead of the far endpoint's centre. Falls back to the far centre when there are no waypoints, or when the adjacent one coincides with the shape centre (no ray to cast) | Anchors land where the route actually leaves; the stub disappears everywhere | **Medium** — changes endpoint placement for every waypointed connector in the repo. Unrouted connectors are byte-for-byte unchanged | — |

The fix is at the **call site**, not in the anchors: every anchor already honours `fromPoint` correctly, and they all improve at once (`boundary`, `perpendicular`, `silhouette-port`). No anchor needed changing, and no new anchor kind was added.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | Anchors treating `fromPoint` as "the direction the line travels" | F1 relies on that reading | An anchor redefining `fromPoint` as "the other node" would reintroduce the stub |
| U2 | `ElkLayout` writing the full section path (start + bends + end) | The first waypoint is on the border, so the anchor lands exactly on it | Dropping the terminal points is now *also* fine — but untested; don't change both at once |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | Every ELK story with `edgeRouting` — `story:usecases/by-casestudies/data-model/SchemaTable`, `…/microservices`, `…/invana-architecture`, `…/agent-harness`, `story:designs/SchemaER`, `story:designs/AgenticWorkflow`, `story:designs/IterationLoop` | story | Endpoint stubs disappear; edges meet faces square-on | V5, V7 |
| N2 | Sankey (`edge-port` anchors + layout waypoints) | story | `edge-port` ignores `fromPoint` except for `side: 'auto'`, so ribbons are unaffected unless they use auto | Eyeball a sankey story |
| N3 | Hand-authored `style.shape.waypoints` | published API | Same improvement | None |
| N4 | Un-routed edges (force layouts, plain straight/curved) | engine | **None** — same code path as before | V6 |
| N5 | Serialised state | — | None | — |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` | repo | 20/20 | F1 |
| V2 | pass | `pnpm check-types` | repo | 19/19 | F1 |
| V3 | pass | `pnpm lint` + boundary + api-surface | repo | 19/19, 0 errors, intact | F1 |
| V4 | pass | Screenshot `story:designs/SchemaER` | headless Chrome | No border-hugging drops; arrowheads meet the card face | F1 |
| V5 | pass | Screenshot `story:designs/AgenticWorkflow` | headless Chrome | No endpoint steps, incl. `Synthesise → answer` | F1 |
| V6 | pass | **Control:** `story:designs/NetworkMap` (no waypoints) | headless Chrome | Unchanged | F1 |
| V7 | pass | Screenshot `story:designs/IterationLoop` | headless Chrome | Feedback-lane arrowhead into `Generate` now lands square on the top face | F1 |
| V8 | pending | `story:usecases/by-casestudies/data-model/SchemaTable`, `…/microservices`, `…/invana-architecture`, `…/agent-harness`, and a sankey story | Storybook, visible tab | Stubs gone; sankey ribbons unaffected | F1, N1, N2 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Fix at the anchor, at the call site, or with a new fixed-point anchor kind? | (a) call site — choose a better `fromPoint`; (b) teach `boundary` about waypoints; (c) add a `fixed-point` anchor and have layouts pin endpoints | **(a)** — (b) duplicates the knowledge into every anchor, (c) is what `edge-port` already is and is the approach that failed. (a) is one expression and every anchor benefits | accepted |
| D-2 | Now that the anchor aims at `waypoints[0]`, should `ElkLayout` stop writing the terminal section points? | (a) leave as-is; (b) drop them | **(a)** for now — with (a) the anchor lands *on* the first waypoint, giving a zero-length first segment that `sym:distinctAnchorBefore` already handles. (b) is plausibly tidier but changes two things at once | accepted |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-13 | Opened; D3 carried over from the arrow RFC after its F3 was reverted | proposed | — |
| 2026-09-13 | Maintainer approved | accepted | "fix all" |
| 2026-09-13 | F1 implemented; V1–V7 pass | landed | Two earlier attempts failed because both changed *which points the router joins* while leaving the anchor aiming at the far node. Fixing what the anchor aims at made both the full-path and interior-bends questions moot |
