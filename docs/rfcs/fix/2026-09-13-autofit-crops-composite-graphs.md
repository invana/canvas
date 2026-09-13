---
id: fix-2026-09-13-autofit-crops-composite-graphs
type: fix
title: Auto-fit frames a box half a card off, cropping any graph whose nodes are composites
status: landed
opened: 2026-09-13
decided: 2026-09-13
landed: 2026-09-13
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/layer/GraphLayer.ts#L1146-L1149" }
  - { predicate: manifests-in, object: "story:designs/SchemaER" }
  - { predicate: manifests-in, object: "story:designs/IterationLoop" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-13-composite-card-renders-as-bare-outline" }
---

## Summary

| | |
|---|---|
| **What breaks** | Fitting the camera to a graph whose nodes are `composite` cards frames a box offset by half a card, so content is clipped off the left/top while empty space is left on the right/bottom. `fitPadding` appears to do nothing. |
| **Root cause** | `boundsOf` is **origin-relative**, and the origin differs per shape kind — centre for `circle`, top-left for `rect` and `composite`. `sym:GraphLayer.getBounds` added the node's raw **centre position** to it for every kind, so a composite's box landed at `[pos, pos + w]` while the renderer paints it at `[pos − w/2, pos + w/2]`. |
| **Defect rows** | F1 |
| **Open decisions** | None |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 1 · deferred 0 · rejected 0 |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | `customer` is sliced by the left viewport edge; ~215px of empty canvas sits to the right | `story:designs/SchemaER` | Headless screenshot at 1280×800 |
| S2 | `Generate` is sliced the same way | `story:designs/IterationLoop` | Same |
| S3 | `fitPadding={72}` and `fitPadding={320}` render **pixel-identically** | `story:designs/SchemaER` | Two screenshots, same framing and same zoom |
| S4 | The all-`circle` story frames correctly — content centred, fills the viewport | `story:designs/NetworkMap` | Screenshot; content centre x≈980 of 2000 |
| S5 | At 430×760 the graph is fully visible and small | all | Narrow screenshot |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The fit never runs | **No** | S3 looked like it, but S5 shows a real fit at another viewport, and the measured zoom at 1280 (~1.31) matches the computed fit scale for the graph's extent |
| R2 | `sym:Canvas.fitView` no-ops because `_contentBounds` is `null` | **No** | It returns a rect; the rect is simply in the wrong place |
| R3 | `BackgroundLayer` pollutes the union with viewport-sized bounds | **No** | It extends `ScreenLayer`, which exposes no `getBounds`; `WorldLayer.getBounds` returns `null` by default, so only `sym:GraphLayer.getBounds` contributes (`file:packages/canvas/src/engine/Canvas.ts#L601-L618`) |
| R4 | The layout-flush race the auto-fit machinery already guards | **No** | That failure mode is a *near-zero* box and runaway zoom; here the box is the right **size** and the wrong **place** |
| R5 | A React-root config ordering problem with `fitOnLoad` | **No** | The `<ElkLayout fitPadding>` path fits independently and shows the same offset |

**Why S3 looked like "no fit at all":** the offset is a *translation*, so both paddings frame the same misplaced box at almost the same scale. Padding changes the zoom slightly; the clipping is caused by the centre being wrong, which padding cannot correct.

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | `boundsOf` is **origin-relative**, and the origin is per kind: `boundsOfCircle` is centre-relative, `boundsOfComposite` returns `{ x: 0, y: 0, width, height }` — top-left | `file:packages/canvas-core/src/specs/shapeGeometry/bounds.ts#L212-L216` | The two kinds cannot share one offset rule |
| D2 | The renderer reconciles this in `sym:shapeRenderXY`: a composite's spec `x`/`y` is `pos − size/2`, a circle's is `pos` | `file:packages/graph/src/layer/GraphLayer.ts#L2789-L2800` | The painted card is centred on `pos` |
| D3 | `getBounds` ignored that reconciliation and used the raw position for every kind: `union({ x: pos.x + local.x, … })` | `file:packages/graph/src/layer/GraphLayer.ts#L1146-L1149` (pre-fix) | A composite's measured box is `[pos, pos + w]` — **half a card right and down** of where it is painted |
| D4 | `sym:Canvas.fitView` frames that box faithfully | `file:packages/canvas/src/engine/Canvas.ts#L484-L487` | The camera centres on the phantom offset: real content clipped on the left/top, dead space right/bottom — **exactly S1 + S2** |

**Why this and nothing else produces the observed frame:** the error is exactly `w/2` per node and in one direction, so it survives the union as a pure translation of the whole box — which is why the box is the right size (zoom looks sane), the framing is off-centre, and padding is powerless (S3). A graph of circles has `local.x = −r`, which already encodes the centre origin, so it is unaffected — **exactly S4**.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Compare the offset against half a card | `CARD_W` is 208; `customer` is clipped by roughly 104 world px | The offset is `w/2`, per D3 |
| T2 | Fix the offset, re-screenshot `story:designs/SchemaER` at 1280×800 | All four tables fully visible, centred, padding honoured | D3 is the whole cause |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` | relates-to | landed | Same shape: composite's top-left origin diverging from every other kind's. Third such divergence found today |
| autofit RFC (cited in-code at `file:packages/graph/src/layer/GraphLayer.ts#L1137`) | relates-to | landed | Its store-derived-not-projected decision is kept intact; this fix only corrects the offset it is added to |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/graph/src/layer/GraphLayer.ts` (`sym:GraphLayer.getBounds`) | Offset the local AABB by the spec's **render origin** (`spec.x`/`spec.y`, already reconciled by `sym:shapeRenderXY`) instead of by `store.getPosition` | Measured box and painted shape coincide for every shape kind; auto-fit frames the real content and `fitPadding` takes effect | **Medium** — `getBounds` feeds auto-fit, the Fit button, the minimap and ELK's bounds query. All of them were consuming the offset box, so all change — toward correct | — |

Reading the origin back off the spec (rather than re-deriving it) is what stops the two from drifting again: `nodeSpec` is the single place the per-kind origin rule lives.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:shapeRenderXY` sets `spec.x`/`spec.y` to the render origin | F1 reads the origin straight off the spec | A kind added there without a matching `boundsOf` origin would re-open this |
| U2 | `boundsOf` staying origin-relative per kind | The offset rule depends on it | Making `boundsOf` world-absolute would double-count the position again |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | Auto-fit / `fitOnLoad` / `<ElkLayout fitPadding>` | engine | Frames correctly on composite graphs; unchanged on circle graphs | V5 |
| N2 | `sym:MiniMapLayer` | layer | Reads the same bounds — its viewport rect shifts by the same `w/2` it was previously wrong by | Eyeball a minimap story |
| N3 | `pkg:@invana/graph-layout-elkjs` bounds query | package | Uses `boundsOfNode` (unchanged), not `getBounds` | None |
| N4 | Every composite-card story — `story:usecases/by-casestudies/data-model/SchemaTable`, `story:usecases/by-casestudies/code-kg/CompositeCards`, the four `designs/` stories | story | Initial framing shifts by half a card, toward correct | V5 |
| N5 | Serialised state | — | None | — |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` | repo | 20/20 | F1 |
| V2 | pass | `pnpm check-types` | repo | 19/19 | F1 |
| V3 | pass | `pnpm lint` | repo | 19/19, 0 errors | F1 |
| V4 | pass | boundary + api-surface gates | repo | intact / unchanged | F1 |
| V5 | pass | Screenshot `story:designs/SchemaER` + `story:designs/IterationLoop` at 1280×800 | headless Chrome | All nodes inside the viewport, content centred | F1 |
| V6 | pass | **Control:** `story:designs/NetworkMap` (all circles) | headless Chrome | Still framed correctly — the kind that was never broken | F1 |
| V7 | pass | Narrow 430×760 | headless Chrome | Whole graph visible | F1 |
| V8 | pending | `story:usecases/by-casestudies/data-model/SchemaTable` and the minimap stories | Storybook, visible tab | Framing shifts by half a card, nothing clipped | F1, N2 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Fix the offset at the call site, or make `boundsOfComposite` centre-relative like `circle`? | (a) offset by the spec's render origin in `getBounds`; (b) change `boundsOfComposite` to centre-relative | **(a)** — (b) would have to be matched by `shapeRenderXY`, `PrimitivesRenderer.boundsOfSpec`, the hit test and ELK sizing all at once, and `composite` genuinely *paints* from its top-left. (a) puts the reconciliation in the one place that already owns it | accepted |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-13 | Opened after visual review of all four `designs/` stories | proposed | Reported as "the layout issue / not responsive" |
| 2026-09-13 | Initially mis-diagnosed as "auto-fit never runs" | proposed | S3 (padding has no effect) pointed that way; S5 (fits at 430px) contradicted it and forced the real diagnosis — the box is the right size in the wrong place |
| 2026-09-13 | F1 implemented; V1–V7 pass | landed | Third instance today of `composite`'s top-left origin diverging from the other kinds; worth a sweep for a fourth |
