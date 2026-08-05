---
id: fix-2026-08-05-group-frame-occludes-edges
type: fix
title: Group frames occlude the edges between their own members
status: implemented
opened: 2026-08-05
decided: 2026-08-05
landed: null
packages: [pkg:@invana/canvas, pkg:@invana/graph, pkg:@canvas/storybook]
design_of_record: doc:docs/render-planes-and-emphasis-plan.md
relations:
  - { predicate: depends-on,  object: doc:docs/render-planes-and-emphasis-plan.md }
  - { predicate: relates-to,  object: doc:docs/group-frame-paint-band-plan.md }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/code-explainability/CodeExplainability }
  - { predicate: manifests-in, object: story:usecases/InvanaArchitecture }
  - { predicate: caused-by,   object: file:packages/canvas/src/primitives/PrimitivesRenderer.ts#L430 }
---

# Group frames occlude the edges between their own members

| Field | Value |
|---|---|
| **What breaks** | Edges between two members of the same group frame are painted over by the frame |
| **Root cause** | `_container` is not `sortableChildren`; `shapeLayer` sits above `connectorLayer`, so no `zIndex` can put a shape under an edge |
| **Blocked promise** | `group.behindChildren` — honoured against sibling shapes, structurally impossible against connectors |
| **Design owner** | `doc:docs/render-planes-and-emphasis-plan.md` §4.1 (`plane` axis) — this RFC scopes the **landing**, not the design |
| **Defect rows** | F1 – F5 |
| **Dressing rows** | F6 |
| **Row status** | `landed` 4 (F1·F2·F3·F5) · `implemented` 2 (F4·F6 — await V4) · `accepted` 0 · `rejected` 0 |
| **Open decisions** | none — D1, D2, D3 accepted 2026-08-05 |
| **Blocking** | V4 needs a session where the ELK worker resolves — see §6 note |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | No edges visible between cards **inside** a package frame | `story:…/CodeExplainability` | User screenshot, 2026-08-05 |
| S2 | Edges crossing open backdrop render normally | same | same screenshot — lines visible outside frames, none inside |
| S3 | Graph reads as 4 disconnected islands; it is one connected dataflow | same | `dataset:canvasDataflow` is a single connected component |
| S4 | Edge **labels** vanish outright where an edge lies inside a frame | `story:usecases/InvanaArchitecture` | `doc:docs/group-frame-paint-band-plan.md` §1 (independent report) |

### 1.1 Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Edges are dropped / merged for grouped nodes | **False** | `dataset:canvasDataflow` declares 55 edges; status bar reads `49 nodes and 55 edges rendered` |
| R2 | Compound ELK writes wrong endpoints | **False** | `edgeRouting` unset ⇒ no waypoints written; positions are absolute (`ElkLayout` accumulates `absX/absY`) |
| R3 | Frames hide edges universally | **False** | `story:graph/Groups/GroupWithEdges` shows intra-group edges through the same veil — see D-note in §2.1 |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Renderer builds 3 sub-containers, added in fixed order `connectorLayer → shapeLayer → overlayLayer` | `file:packages/canvas/src/primitives/PrimitivesRenderer.ts#L430-L434` | Paint order between the three is structural |
| 2 | Each sub-container is `sortableChildren`; `_container` deliberately is **not** | `file:…/PrimitivesRenderer.ts#L426-L429` | `zIndex` orders *within* a container, carries no authority across them |
| 3 | A group frame is an ordinary shape ⇒ lands in `shapeLayer` | `sym:GraphLayer.nodeSpec` | Frame paints over **every** connector in the graph |
| 4 | `behindChildren` is implemented as `zIndex = (baseZ ?? 0) - 1` | `file:packages/graph/src/layer/GraphLayer.ts#L1491-L1499` | Orders frame below sibling **cards** only — no effect vs. connectors |
| 5 | ⇒ Edges between a frame's own members are painted over by that frame | S1, S4 | The defect |

### 2.1 Why it reads as "gone" rather than "dim"

| Factor | Value in `story:…/CodeExplainability` | Contribution |
|---|---|---|
| Frame fill is translucent | mid-slate `alpha: 0.14` | Attenuates rather than erases — so the frame alone does not fully explain S1 |
| Edge stroke alpha | `strokeAlpha: 0.4` | Low signal before any occlusion |
| Edge stroke width at fit zoom | `1.2` × ~26% ⇒ sub-pixel | Below the rasteriser's ability to hold contrast |
| Frame slab is *lighter* than backdrop | `#1b2437` vs `#0f172a` | Removes the contrast the light-grey edge had against near-black |
| **Control case** | `story:graph/Groups/GroupWithEdges` — brighter, thicker edges at 100% zoom | Visible through the same veil ⇒ confirms occlusion is necessary but not sufficient |

**Conclusion:** two contributing factors, one defect. Fixing only the legibility factor hides the bug in one story and leaves it armed everywhere else.

### 2.2 Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Hover a card inside a frame | Intra-group edges appear | Hover applies `dimmed` (`bgAlpha: 0.25`) to the frame; dropping the veil reveals edges ⇒ they were painted, and covered |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/group-frame-paint-band-plan.md` | first diagnosis of this defect | **superseded** | §1–§2 diagnosis carried forward verbatim; its *mechanism* (reparent into a 4th `Container`) rejected |
| `doc:docs/render-planes-and-emphasis-plan.md` | **design of record** | proposed | `plane` axis via Pixi 8 `RenderLayer.attach()` — reorders **without** reparenting; `backdrop` is 1 of 5 planes; planes owned per `Layer` (D4); `plane` picks the stripe, `zIndex` orders within it |
| ↳ its *emphasis* half | — | superseded | Replaced by a renderer colour fast path + graph-layer `focus` sugar. **Voids its D3** ("both axes ship together") ⇒ planes may now land alone |

## 4. The fix

| ID | Kind | Status | File / target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | `landed` | `file:packages/canvas/src/primitives/PrimitivesRenderer.ts` | Create plane stripes per design (`RenderLayer` per plane, owned by the layer's container, `backdrop` first) | Stripe beneath connectors exists; nothing attached ⇒ no visual change | **Medium** — new machinery in the renderer construction path | — |
| F2 | defect | `landed` | same | `spec.plane` → `RenderLayer.attach()` on add; effective plane = live claim ?? `spec.plane` ?? kind default | Shapes can declare a stripe; order changes without reparenting | **Medium** | F1 |
| F3 | defect | `landed` | `file:packages/canvas/src/primitives/types.ts` | Add `readonly plane?: PlaneName` to the shape spec + TSDoc | Public, serialisable declaration of paint stripe | Low, additive — but **new public API**, naming is one-way | F1 |
| F4 | defect | `implemented` | `file:packages/graph/src/layer/GraphLayer.ts#L1491-L1499` | In the branch already computing `zIndex - 1`, also emit `plane: 'backdrop'` | `behindChildren` means behind children **and** the edges between them | Low — same predicate, no new condition | F2, F3 |
| F5 | defect | `landed` | `sym:raiseShape` / `sym:setLifted` — `file:…/PrimitivesRenderer.ts#L797-L808` | Home resolution consults the declared plane instead of assuming `shapeLayer` | Hovering a frame returns it to `backdrop`, not in front of the edges | Low — **but this is the bug the change ships with if forgotten** | F2 |
| F6 | **dressing** | `implemented` | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx` | `strokeAlpha` `0.4 → 0.7`; `strokeWidth` `1.2 → 1.6` (both configs) | Edges legible at fit zoom even over open backdrop | None | — |

**Row status vocabulary:** `proposed` (written, not approved) → `accepted` (approved, not written) → `implemented` (written, not all its checks green) → `landed` (in `main`, verified) · `deferred` (approved but explicitly postponed) · `rejected` (decided against — kept, never deleted) · `superseded` (replaced by a row elsewhere; cite it). The RFC's own `status` reaches `landed` only when every row is `landed`, `rejected`, or `superseded`.

> `implemented` was **added during this RFC's own implementation** — the first real use exposed the gap: F4/F6 are written and building, but V4 can't run in the implementing session, and neither `accepted` (understates: the code exists) nor `landed` (overstates: unverified) was honest. Carried back into `doc:docs/rfcs/README.md`.

### 4.1 Implementation notes

| ID | Note |
|---|---|
| N1 | **`PlaneName` ships as `'backdrop' \| 'content'`** — 2 of the design's 5 stripes. The other three (`background` / `foreground` / `overlay`) are already served by the renderer's built-in `connectorLayer` / `shapeLayer` / `overlayLayer` ordering, so building them now would duplicate machinery for no behaviour. Widening the union later is additive |
| N2 | **One `RenderLayer`, not five.** `backdrop` is the only stripe that has to exist as a real object, because it is the only one that must sit *below* `connectorLayer`. `'content'` is the absence of an attachment |
| N3 | **`detach` is called unconditionally** — Pixi ignores a detach for an object the layer doesn't hold, so there is no "was it attached?" flag to drift out of sync |
| N4 | **`GraphLayer` always emits `plane`**, like `alpha` / `fill` / `visible`. The renderer partial-merges specs, so omitting it on the collapse pass would strand a stale `'backdrop'` on a node that is no longer a frame |
| N5 | **`removeShape` detaches before `destroy()`** — a `RenderLayer` holds its own child list, and a destroyed object left attached renders as a stale entry |

> **F6 is not the fix.** It is independently correct — at 26% fit zoom these edges are marginal even where nothing covers them — and it makes the symptom invisible **without removing the cause**. Landable today, alone.

## 5. Blast radius

### 5.1 Upstream — what this leans on

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | Pixi ≥ 8.18.1 `RenderLayer` | The entire mechanism | No fallback — design reverts to the rejected reparenting plan |
| U2 | `parentRenderLayer` is a single reference (planes do not nest) | Verified in design §3.1a | Nested groups would need a different ordering strategy |
| U3 | Plane-attached child still inherits alpha/tint from logical parent | Verified in design §3 | `dimmed`/`highlighted` states would stop reaching frames |
| U4 | Per-`Layer` container ownership (`sym:WorldLayer`, `sym:ScreenLayer`, `sym:GraphLayer`) | Planes are per layer, not canvas-global | Canvas-global stripes break layer ordering, isolation, visibility |

### 5.2 Downstream — what could break

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `story:graph/Groups/*` (9 stories) | storybook | Frames move behind edges — appearance changes | Visual sweep, **mandatory** |
| D-2 | ~~`story:usecases/InvanaArchitecture`~~ → `story:usecases/by-casestudies/invana-architecture/EndToEnd` | storybook | **Obsolete as written.** The `raiseConnector` + `pointerout` re-assert workaround no longer exists — the story was rewritten and now declares a per-source lift (`canvas.store.actions.raise.set('labelled-edges', …)`), which composes instead of fighting the hover behaviour | **None — left in place.** It raises labelled edges above *every* non-lifted node, including the content boxes, which the backdrop plane does not address. Re-scope to "can this lift be narrowed?" as separate work |
| D-3 | Case studies with package frames (code-explainability, code-kg, …) | storybook | Appearance changes | Visual sweep |
| D-4 | Nested frames | rendering | Child frame must still sort above parent inside the backdrop stripe | Assert via `story:graph/Groups/NestedGroups` |
| D-5 | Hit resolution | engine | **Unaffected** — reads spec `zIndex` recorded at insert (`file:…/PrimitivesRenderer.ts#L589`), not display parent | Assert in review, don't assume |
| D-6 | Serialised canvas state | persistence | Gains one optional field; older snapshots omit it → kind default | No migration |
| D-7 | `pkg:@invana/canvas-ui` settings editor | UI | `plane` is a power-user control | Advanced section only (design D9) |
| D-8 | `doc:docs/render-planes-and-emphasis-plan.md` | docs | Status moves off `proposed` | Update on landing |
| D-9 | Any consumer setting `NodeStyle.zIndex` on a group | public API | `zIndex` keeps its meaning (orders *within* a plane) | Note in TSDoc — behaviour is narrowed, not changed |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers | Result |
|---|---|---|---|---|---|---|
| V1 | `pass` | Intra-group edges visible; frames still read as containers | `story:graph/Groups/GroupWithEdges` | Unchanged from today — **the control**, correct before the change | F1–F5 | Pixel-identical to the pre-change capture |
| V2 | `pass` | Child frames above parent frames | `story:graph/Groups/NestedGroups` | Nesting still legible | D-4 | Inner frame still above outer; +/− toggles on top |
| V3 | `skipped` | Six named labels legible with the workaround deleted | ~~`story:usecases/InvanaArchitecture`~~ | — | D-2 | **Obsolete** — the story was rewritten and the workaround it named no longer exists (see D-2) |
| V4 | `pending` | Edges visible inside all 4 package frames, both looks, both themes | `story:…/CodeExplainability` | S1 resolved | F4, F6 | **Not run** — the ELK web worker never resolved in the implementing session (a cold Vite transform of a 1.4 MB classic worker; unrelated to this change, reproduced on the pre-change tree). Needs a session where the layout completes |
| V5 | `pass` | `pnpm check-types` | repo | Pass | F3 | 14/15; the one failure is `pkg:@invana/canvas-ui` type-checking `@invana/styling`'s shipped `.ts` in `node_modules` — pre-existing, identical before the change |
| V6 | `pass` | **Positive proof of the stripe** — force a frame's fill opaque (`bgAlpha: 1`), temporarily | `story:graph/Groups/GroupWithEdges` | Intra-group edges still visible **over** an opaque frame — impossible unless the frame paints below the connectors | F1, F2, F4 | Confirmed; temporary edit reverted. Added during implementation because V1 is a no-regression check and could not prove the stripe *works* |

**Check status:** `pending` · `pass` · `fail` · `skipped` (say why in the row). A fix row reaches `landed` only when every check that `Covers` it is `pass` — which is why F4 and F6 sit at `implemented` pending V4.

## 7. Decisions

| ID | Question | Options | Recommendation | Status | Outcome |
|---|---|---|---|---|---|
| D1 | Land the `plane` axis without the emphasis half? | (a) planes alone · (b) wait for both, per design D3 | **(a)** — the shared seam is gone (emphasis replaced by colour fast path + `focus` sugar); the defect is live in 4 case studies | `accepted` 2026-08-05 | **(a)** planes land alone. Design D3 is formally void — record it there when `doc:docs/render-planes-and-emphasis-plan.md` status moves (D-8) |
| D2 | Is `backdrop` the default for every expanded `behindChildren` frame? | (a) default-on, per design D1 · (b) opt-in flag | **(a)** — (b) leaves the default broken and every consumer to discover it | `accepted` 2026-08-05 | **(a)** default-on. Accepts a one-commit appearance change across every `style.group` graph ⇒ D-1/D-3 sweep is part of the work, not a follow-up |
| D3 | Land F6 now or with F1–F5? | (a) now · (b) together | **(a)** — correct independently; makes the before/after readable | `accepted` 2026-08-05 | **(a)** F6 lands standalone, ahead of F1–F5. Held at `accepted` pending a go — the same session chose "record, then stop" |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-05 | Reported | proposed | User screenshot of `story:…/CodeExplainability`; suspected z-index |
| 2026-08-05 | Diagnosed | proposed | Container ordering, not `zIndex`; T1 hover test confirms occlusion |
| 2026-08-05 | Prior art found | proposed | Design of record already exists; RFC rescoped from design → landing |
| 2026-08-05 | D1 accepted | accepted | Planes land without the emphasis half — design D3 void |
| 2026-08-05 | D2 accepted | accepted | `backdrop` default-on for expanded `behindChildren` frames; visual sweep in scope |
| 2026-08-05 | D3 accepted | accepted | F6 approved to land standalone, ahead of the engine rows |
| 2026-08-05 | F1–F6 → `accepted` | accepted | All six rows approved. No code written — maintainer chose "record decisions, then stop"; F6 awaits a go despite D3(a) |
| 2026-08-05 | Implemented F1–F6 | implemented | `RenderLayer` backdrop stripe + `spec.plane` + `GraphLayer` emit + `setLifted` interplay + `removeShape` detach + F6 values. Built, `check-types` clean |
| 2026-08-05 | V1, V2, V5 `pass`; V6 added and `pass` | implemented | V6 (opaque-frame proof) added because V1 only shows *no regression* — it can't prove the stripe is doing anything |
| 2026-08-05 | V3 `skipped` | implemented | D-2's workaround no longer exists; the rewritten story's per-source lift is left in place (it covers labels over boxes, which planes don't) |
| 2026-08-05 | V4 blocked | implemented | ELK worker never resolved locally; reproduced on the pre-change tree, so unrelated to this change. F4/F6 held at `implemented` |
| 2026-08-05 | Vocabulary gained `implemented` | implemented | The gap this RFC's own implementation exposed — see §4 note. Carried into `doc:docs/rfcs/README.md` |
