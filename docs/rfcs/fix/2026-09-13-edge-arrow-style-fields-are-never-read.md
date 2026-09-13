---
id: fix-2026-09-13-edge-arrow-style-fields-are-never-read
type: fix
title: Six EdgeStyle arrow fields are declared but never read, and ELK's routed endpoints are discarded
status: landed
opened: 2026-09-13
decided: 2026-09-13
landed: 2026-09-13
packages: [pkg:@invana/graph, pkg:@invana/renderer-pixijs, pkg:@invana/graph-layout-elkjs]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/layer/GraphLayer.ts#L1686-L1692" }
  - { predicate: caused-by, object: "file:packages/graph-layout-elkjs/src/ElkLayout.ts#L305-L311" }
  - { predicate: manifests-in, object: "story:designs/SchemaER" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-13-composite-card-renders-as-bare-outline" }
  - { predicate: superseded-by, object: "rfc:fix-2026-09-13-routed-endpoints-aim-at-the-wrong-point" }
---

## Summary

| | |
|---|---|
| **What breaks** | Arrowheads render at a fixed default size no matter what `arrow*Size` says, `'diamond'` / `'circle'` both draw a triangle, `arrow*Alpha` does nothing — and every ELK-routed edge arrives via a short leg hugging the target's border instead of meeting it head-on. |
| **Root cause** | `sym:GraphLayer.edgeSpec` builds both markers as `{ kind: 'arrow', fill }` and reads none of the other six declared fields (D1). Independently, ELK writes its routed endpoints as waypoints but the connector re-derives its own endpoints with the default `boundary` anchor, so the router has to join the two (D3). |
| **Defect rows** | F1 (D1 sizing/alpha), F2 (D1 shape), F3 (D3 routing) |
| **Dressing rows** | F4 — story-side size tuning; real, but not a fix |
| **Open decisions** | None. D-1 resolved to pixels. |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 4 · deferred 0 · rejected 0 · **reverted 1** |

This is the **third instance of one defect class** — a publicly declared, typed option the layer silently drops. See `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` for the first two (`CompositeShapeOption.fill`).

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Arrowheads are ~6px specks against 208px-wide table cards, despite `arrowTargetSize: 7` | `story:designs/SchemaER` | User screenshot, 2026-09-13 11:06 |
| S2 | Each edge into `order_item` runs horizontally, drops vertically along the card's left border at x≈1200 (card starts at 1210), then the head points right | same | Screenshot |
| S3 | A smaller matching jog leaves `product` at y≈235 while the horizontal run sits at y≈218 | same | Screenshot |
| S4 | Cards, rows, labels and the `1:N` edge labels all render correctly | same | Screenshot — confirms `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` landed |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `arrowTargetSize` is in the wrong units | **No — it is read nowhere at all** | `grep` over `packages/*/src` finds it only in `file:packages/graph/src/layer/types.ts` and 7 consumer call sites in `pkg:@invana/graph-datasets` |
| R2 | Markers are clipped by the card, as the composite parts were | **No** | Markers paint into the connector's own `Graphics` (`file:packages/renderer-pixijs/src/primitives/base/ConnectorBase.ts#L37-L58`), never the shape's masked `gfx` |
| R3 | The head points right because the marker takes its angle from the wrong segment | **No** | The final segment *is* a short horizontal stub into the anchor; the angle is correct, the **route** is wrong |
| R4 | Missing per-row port anchoring is the cause | **No — separate, still open** | Port anchoring would move the endpoint to the FK row; it would not remove the jog, which exists between the anchor and ELK's waypoint |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | `edgeSpec` builds both markers as `{ kind, fill }` and nothing else — `arrow*Size`, `arrow*Alpha` are never referenced, and `arrow*Shape` is only tested `!== 'none'` | `file:packages/graph/src/layer/GraphLayer.ts#L1686-L1692` | Every marker falls back to `ArrowMarker`'s defaults, and every marker is a triangle |
| D2 | `ArrowMarker` sizes off `lengthScale 4 × widthScale 3 × strokeWidth` | `file:packages/renderer-pixijs/src/primitives/connectors/ArrowMarker.ts#L48-L49` | At `strokeWidth: 1.6` that is a **6.4 × 4.8 px** head — **exactly S1** |
| D3 | ELK writes `section.startPoint` / `endPoint` as the first/last **waypoints**, but the endpoint itself is resolved by the anchor, which defaults to `boundary` | `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L305-L311`, `file:packages/graph/src/layer/GraphLayer.ts#L1620` | The two disagree in y, so `orth` joins them with a leg along the node border — **exactly S2 + S3** |

**Why this and nothing else produces the observed frame:** D1+D2 explain the size but not the jog; D3 explains the jog but not the size. Both are needed, and they are independent — S1 appears on every graph in the repo, S2/S3 only on ELK-routed ones.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep -rn "arrowTargetSize" packages/*/src` | 7 hits, **all** in `pkg:@invana/graph-datasets` (consumers) plus the type declaration. Zero readers | The field has never done anything since it shipped |
| T2 | Compute old vs new head length for each dataset that sets it | invana-architecture 4→7px, microservices 4.8→7px, agent-trace 5.2→8px, ontology 4.8→7px | The blast radius of honouring it is real but modest (+46…75%) |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` | relates-to | landed | Same defect class — a declared option the layer drops. Its F1 fixed `fill`; this RFC fixes six more fields |
| `file:packages/canvas-core/src/lib/geometry/connectors/anchors/edgePort.ts` | depends-on | shipped | The `edge-port` anchor already models "a face plus a displacement", and its docstring names ER table rows. F3 uses it as-is — no new anchor |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/graph/src/layer/GraphLayer.ts` (`sym:markerSpecFor`) | Honour `arrow*Size` (pixels → the primitives' stroke-relative scale) and `arrow*Alpha` (emit a `solid` fill layer, since a bare number carries no alpha through `applyMarkerFill`) | Both fields work; marker silhouette ratio preserved at 4:3 | **Medium** — 4 shipped datasets set a size that previously did nothing; their arrows grow 46–75% | — |
| F2 | defect | landed | `file:packages/renderer-pixijs/src/primitives/connectors/DiamondMarker.ts`, `…/DotMarker.ts`, registered in `sym:PrimitivesRenderer` | Add `diamond` and `dot` marker primitives and map the public `ArrowShape` vocabulary onto them | `'diamond'` and `'circle'` stop rendering as triangles | Low — new registry keys, nothing existing changes unless a consumer already asked for those values | — |
| F2a | defect | landed | `file:packages/renderer-pixijs/src/primitives/paint/applyFillStroke.ts` (`sym:finishMarkerPaint`) | Extract the marker fill/halo tail shared by all three markers; `ArrowMarker` folded onto it | One definition of marker paint precedence instead of three | Low — faithful extraction, covered by V2 | — |
| F3 | defect | **reverted** | `file:packages/graph-layout-elkjs/src/ElkLayout.ts` (`sym:portOptsFor`) | Thread ELK's node rects to `onPositionsApplied` and pin both endpoints with `edge-port` + the `side`/`offset` derived from ELK's own section points | **Reverted.** It did end the connector where ELK routed, but `edge-port` answers the *outward* face normal as its tangent and makes the endpoint coincide with the last waypoint — every arrowhead turned back into its own node and rendered half-occluded by it. The border-hugging leg is the lesser defect | **High** — changes endpoint placement on **every** ELK-laid-out graph in the repo. Falls back to `boundary` when a rect is unknown | `edgePort.ts` |
| F6 | defect | landed | `file:packages/canvas-core/src/lib/geometry/connectors/pathSampling.ts` (`sym:distinctAnchorBefore`) | Terminal tangents walk back/forward to the last **distinct** anchor instead of differencing two coincident points | A zero-length terminal segment no longer silently yields `normalize(0,0)`'s `{ x: 1, y: 0 }` — a marker pointing due east regardless of its actual route | Low — only changes the previously-degenerate case | — |
| F4 | dressing | landed | `story:designs/SchemaER`, `story:designs/AgenticWorkflow`, `story:designs/IterationLoop` | Raise `arrowTargetSize` (7→12 ER, 6→10 workflow/loop) now that the field is honoured | Heads read at card scale | Low — story-only | F1 |

F4 is **dressing, and marked so**: with F1 alone the ER head goes 6.4px → 7px, which the reporter would not perceive as fixed. The size value was chosen when the field was inert and had never been calibrated.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `ArrowMarker`'s `lengthScale × strokeWidth` contract | F1's pixel→scale conversion assumes it | A primitive switching to absolute units would double-apply the conversion |
| U2 | `sym:edgePortAnchor` opts shape (`side`, `offset`) | F3 writes these verbatim | Renaming either silently drops the pinning back to `boundary` |
| U3 | Marker kinds share the **shape** registry | `'circle'` is a body shape, so the circular marker registers as `'dot'` | Registering a marker under a body-shape key silently no-ops (no static `paintInto`) |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | `dataset:invanaArchitecture`, `dataset:microservices`, `dataset:agentTrace`, `dataset:ontology` | dataset | Arrowheads grow 46–75% — they finally get the size they asked for | V5 — eyeball each |
| N2 | Every ELK-routed story (`story:usecases/by-casestudies/data-model/SchemaTable`, `…/microservices`, `…/invana-architecture`, `…/agent-harness`, `story:designs/SchemaER`, `story:designs/AgenticWorkflow`, `story:designs/IterationLoop`) | story | F3 moves endpoints from the boundary intersection to ELK's ports. Parallel edges should separate rather than converge | V6 — **the row most likely to need reverting** |
| N3 | `dataset:twitter` | dataset | Sets `arrowTargetSize: 5` / `6` at `strokeWidth: 1` — grows 4→5/6px | V5 |
| N4 | `pkg:@invana/renderer-pixijs` public exports | published API | Gains `DiamondMarker` / `DotMarker` + spec builders. Additive | None — not a snapshotted surface |
| N5 | Serialised state | — | None. No config key or type changed | — |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` | repo | 20/20 tasks | F1, F2, F2a, F3, F4 |
| V2 | pass | `pnpm check-types` | repo | 19/19 tasks | F1, F2, F2a, F3 |
| V3 | pass | `pnpm lint` | repo | 19/19, 0 errors | all |
| V4 | pass | `check-renderer-boundary` + `check-api-surface` | repo | Intact / unchanged | F2, F2a |
| V5 | pending | Visual: the four datasets in N1 | Storybook | Arrowheads larger but proportionate; nothing overlaps a node | F1 |
| V6 | pending | Visual **control**: `story:usecases/by-casestudies/data-model/SchemaTable` | Storybook | Still renders; endpoints now at ELK's ports, no border-hugging leg | F3 |
| V7 | pending | Visual: `story:designs/SchemaER` | Storybook | Heads read at card scale and meet the card head-on | F1, F3, F4 |
| V8 | pending | Visual: an edge with `arrowTargetShape: 'diamond'` / `'circle'` | Storybook | Renders a diamond / circle, not a triangle | F2 |

V5–V8 need a human at a **visible** Storybook tab — background tabs suspend rAF.

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Is `arrow*Size` pixels or a stroke-width multiplier? | (a) pixels, converted internally; (b) multiplier, matching the primitive | **(a)** — the 7 existing call sites pass 5–8 against stroke widths of 0.4–1.6, which only reads as pixels. The primitive stays multiplier-based so an *unsized* marker keeps scaling with its line | accepted |
| D-2 | Implement `diamond`/`circle`, or narrow `ArrowShape` to `'triangle' \| 'none'`? | (a) implement; (b) narrow the type | **(a)** — narrowing is a breaking change to a published type, and the marker vocabulary is wanted anyway. Crow's-foot and bar remain unimplemented | accepted |
| D-3 | Should F3 land with the marker fixes or separately? | (a) together; (b) defer F3 | **(a)**, at the maintainer's instruction — but it is the one row here with repo-wide visual blast radius and no automated check. If V6 looks wrong, revert F3 alone; F1/F2 are independent | accepted |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-13 | Opened from a second user screenshot of `story:designs/SchemaER` | proposed | Two independent causes: dropped marker fields, discarded ELK endpoints |
| 2026-09-13 | Maintainer approved the full scope ("fix it") | accepted | F1–F4; D-1 taken as recommended (pixels) |
| 2026-09-13 | F1, F2, F2a, F3, F4 implemented; V1–V4 pass | landed | RFC written and implemented in one pass at the maintainer's instruction, deviating from README lifecycle step 1 |
| 2026-09-13 | Correction to an earlier claim | landed | A previous chat answer stated `EdgeStyle` "exposes `'triangle' \| 'diamond' \| 'circle' \| 'none'`", implying all four worked. The *type* offered them; the layer honoured only on/off. The plate-book P3 gap was understated as a result — it was 1 real mark of 7, not 4 |
| 2026-09-13 | **F3 reverted** after visual verification | landed | Headless screenshots of `story:designs/SchemaER` and `story:designs/AgenticWorkflow` showed every arrowhead half-occluded by its target card. Cause: `edge-port` returns the outward face normal as its tangent *and* makes the endpoint coincide with ELK's last waypoint, so the marker aimed back into the node. D-3's warning ("if V6 looks wrong, revert F3 alone") is exactly what happened |
| 2026-09-13 | F6 added | landed | Found while chasing F3: `normalize(0,0)` answers `{x:1,y:0}`, so any zero-length terminal segment silently points a marker due east. F3 merely made it reachable; the hardening is kept |
| 2026-09-13 | D3 closed elsewhere | landed | The endpoint jog F3 tried and failed to fix is now fixed by `rfc:fix-2026-09-13-routed-endpoints-aim-at-the-wrong-point` — at the call site that chooses the anchor's `fromPoint`, not by pinning the endpoint. Both attempts here changed *which points the router joins* while leaving the anchor aiming at the far node; fixing what it aims at made the question moot |
| 2026-09-13 | Implementation note | landed | F2a was not in the original plan. Writing two markers would have tripled the fill/halo tail, so it was extracted first — `ArrowMarker` now shares it |
