---
id: feat-2026-09-13-feedback-edges-get-their-own-lane
type: feat
title: A layout can be told which edges are returns, so a loop stops staggering the flow it belongs to
status: landed
opened: 2026-09-13
decided: 2026-09-13
landed: 2026-09-13
packages: [pkg:@invana/graph-layout-elkjs]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:designs/IterationLoop" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-13-autofit-crops-composite-graphs" }
---

## Summary

| | |
|---|---|
| **What this adds** | `ElkLayoutOptions.feedbackEdges` — a predicate naming the edges that are *returns* rather than forward flow. Those edges are withheld from ELK and routed along a reserved lane clear of every node box. |
| **Why** | A layered algorithm cannot draw a cycle. ELK breaks it by reversing an edge and threading dummy nodes through every spanned layer; those dummies take real slots and push the nodes either side out of line. The result is the staggered band every feedback loop produces. |
| **Rows** | F1 (ELK options, story-side) · F2 (withhold) · F3 (route) · F4 (story wiring) |
| **Open decisions** | None |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 4 · deferred 0 · rejected 0 |

**ELK is not at fault and nothing here works around it.** It does the right general thing for an unlabelled cycle; it simply has no way to know the edge *means* "go back". This gives it that information.

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | `Generate` and `Critique` are consecutive in a linear chain yet sit ~36 world px apart vertically — the flow reads as a diagonal drift | `story:designs/IterationLoop` | User screenshot + headless shot |
| M2 | The retry edge, its label and the counter badge all crowd the band immediately above the cards | same | Same |
| M3 | The same router, card kinds, ELK options and padding produce a cleanly aligned band in the story with **no** back-edge | `story:designs/AgenticWorkflow` | Headless shot: `user query` / `Planner` / `needs tools?` share one band |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The edge router is at fault | **No** | M3 — same router, no stagger, when there is no cycle. The router faithfully draws the route ELK computed |
| R2 | It is the same defect as the other stories' wonky edges | **No — separate** | `story:designs/SchemaER` and `story:designs/AgenticWorkflow` have no cycle; their jogs are the still-open D3 endpoint mismatch in `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read`. Same visual signature, different cause |
| R3 | ELK cannot handle cycles | **No** | It handles them correctly; the drawing is poor because the edge's *meaning* is unavailable to it |

---

## 2. Design

| Step | Mechanism | Consequence |
|---|---|---|
| D1 | A flow diagram has a **spine** (forward progression) and **returns** (feedback). ELK's cycle breaking guesses which edge to reverse; the author knows | The guess is the only thing missing |
| D2 | Withhold return edges from the ELK graph. What remains is a DAG — no cycle to break, no dummy nodes, no displaced layers | The spine lays out as authored |
| D3 | Route the withheld edges afterwards along a lane offset past the outermost node box, on the axis perpendicular to the flow direction | The return reads as a return: a staple over the top of the band it returns across |
| D4 | Stack multiple returns longest-span-outermost | Nested returns never cross |

### Why the endpoints stay on the `boundary` anchor

The lane's first and last waypoints sit directly above (or beside) the endpoint's centre, so the default `boundary` anchor — which intersects the silhouette along the line to the neighbouring waypoint — lands exactly on the face midpoint with no correction. Pinning with `edge-port` was tried in `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read` (row F3) and reverted: it answers the outward face normal as its tangent, which turned every arrowhead back into its own node. Choosing the lane geometry so the natural anchor is already right avoids that trap entirely.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Declare `retry` a feedback edge, re-screenshot | `Generate → Critique → gate` align on one band; the return rides a lane above; no dummies | D2 is the cause and the cure |
| T2 | Screenshot the three stories with no feedback edges | Visually unchanged | The option is inert unless used |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| The plate book, P7 | relates-to | published | Said it before the code did: *"a loop needs a lane, not a cleverer router."* This implements exactly that |
| `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read` | relates-to | landed | Its reverted F3 is why D3 above chooses anchor-friendly geometry instead of pinning endpoints |
| BPMN / yFiles feedback routing | relates-to | external | Same split: lay out the DAG, draw returns around it |

---

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | landed | `story:designs/IterationLoop` config | `elk.layered.considerModelOrder.strategy: NODES_AND_EDGES` + `nodePlacement.strategy: NETWORK_SIMPLEX` via the existing `layoutOptions` passthrough | The authored order drives layering; chains align better once dummies exist | Low — no code; passthrough already wins over the convenience fields (`file:packages/graph-layout-elkjs/src/ElkLayout.ts#L392`) | — |
| F2 | feature | landed | `file:packages/graph-layout-elkjs/src/types.ts`, `…/ElkLayout.ts` | `feedbackEdges?: (edge) => boolean`; matching edges are withheld from the ELK graph and carried to `onPositionsApplied` | ELK lays out a DAG | Low — **opt-in**; with the option unset the edge build is byte-for-byte what it was | — |
| F3 | feature | landed | `file:packages/graph-layout-elkjs/src/ElkLayout.ts` (`sym:routeFeedbackEdges`) | Route withheld edges as a staple along a lane past the outermost node box; `feedbackLaneGap` (default 36) spaces stacked lanes | Returns are drawn, and drawn legibly | Low — only ever touches edges the author declared | F2 |
| F4 | feature | landed | `story:designs/IterationLoop` | `feedbackEdges: (e) => e.type === 'RETRY'`; badge keeps the lane midpoint, label steps to `t = 0.72` | The loop story reads as a loop | Low | F2, F3 |

**Opt-in, and a predicate rather than automatic cycle detection.** Which edge of a cycle is "the return" is a question about what the diagram *means*, not about its topology — so it belongs to the author. It also mirrors the existing `nodeSize?: (node) => NodeSize` in shape.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `boundary` anchor resolving toward the neighbouring waypoint | F3's endpoints depend on it | A different default anchor would reintroduce the endpoint jog on return edges |
| U2 | `collectLayoutEdges` | F2 filters its output | A change in what it yields changes what can be withheld |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | Every existing `ElkLayout` consumer — `story:usecases/by-casestudies/data-model/SchemaTable`, `…/microservices`, `…/invana-architecture`, `…/agent-harness`, `story:designs/SchemaER`, `story:designs/AgenticWorkflow` | story | **None.** `feedbackEdges` unset ⇒ identical edge set and identical meta | V5 (done) |
| N2 | `story:designs/IterationLoop` | story | Intended redraw | V4 |
| N3 | `ElkLayoutOptions` public type | published API | Two additive optional fields | None |
| N4 | Serialised state | — | None — both new options are functions/numbers on the ctor, not `config` | — |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` | repo | 20/20 | all |
| V2 | pass | `pnpm check-types` | repo | 19/19 | all |
| V3 | pass | `pnpm lint` + boundary + api-surface | repo | 19/19, 0 errors, intact | all |
| V4 | pass | Screenshot `story:designs/IterationLoop` | headless Chrome | Spine on one band; return in its own lane; badge and label not overlapping | F1–F4 |
| V5 | pass | **Control:** screenshot `story:designs/NetworkMap`, `story:designs/SchemaER`, `story:designs/AgenticWorkflow` | headless Chrome | Unchanged | F2 |
| V6 | pending | A graph with **two or more** return edges | Storybook | Lanes stack without crossing, longest span outermost | F3 |
| V7 | pending | `direction: 'DOWN'` with a return edge | Storybook | Lane runs vertically to the left of the band | F3 |

V6/V7 are `pending`: both code paths exist and are typed, but no story exercises them yet.

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Detect cycles automatically, or make the author declare returns? | (a) predicate; (b) auto-detect and pick a back-edge | **(a)** — auto-detection still has to *choose* which edge of the cycle is the return, which is a semantic question. A wrong guess is exactly today's behaviour | accepted |
| D-2 | Where does the feedback router live — `pkg:@invana/graph-layout-elkjs` or a shared layout util? | (a) in the ELK package; (b) shared | **(a)** for now — the lane must clear the laid-out boxes, which only the layout knows. Promote it if a second layout needs returns | accepted |
| D-3 | Lane above or below the flow? | (a) above (outward from the band's leading edge); (b) below; (c) configurable | **(a)** — matches the feedback-arc convention. `feedbackLaneGap` tunes distance; a side option can follow if asked | accepted |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-13 | Opened from "layout is not beautiful — is it layout or the router?" | proposed | Isolated by comparing against the cycle-free story: same router, no stagger |
| 2026-09-13 | Maintainer approved L1+L2+L3 | accepted | — |
| 2026-09-13 | F1–F4 implemented; V1–V5 pass | landed | RFC written and implemented in one pass at the maintainer's instruction, deviating from the README lifecycle step 1 |
| 2026-09-13 | Scope note | landed | The wonky edges in the **cycle-free** stories are *not* fixed by this — they are the still-open D3 endpoint jog in `rfc:fix-2026-09-13-edge-arrow-style-fields-are-never-read`. Fixing loops alone leaves those unchanged |
