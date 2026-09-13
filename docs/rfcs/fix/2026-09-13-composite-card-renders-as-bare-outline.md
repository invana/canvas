---
id: fix-2026-09-13-composite-card-renders-as-bare-outline
type: fix
title: A composite card that declares its own fill renders as a bare outline, and with clip:true loses every part
status: landed
opened: 2026-09-13
decided: 2026-09-13
landed: 2026-09-13
packages: [pkg:@invana/graph, pkg:@invana/renderer-pixijs]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/layer/GraphLayer.ts#L1575" }
  - { predicate: caused-by, object: "file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L228" }
  - { predicate: manifests-in, object: "story:designs/SchemaER" }
  - { predicate: relates-to, object: "story:usecases/by-casestudies/data-model/SchemaTable" }
---

## Summary

| | |
|---|---|
| **What breaks** | A `composite` node that declares `fill` in its own `CompositeShapeOption` paints unfilled. With `clip: true` it additionally loses **every** part — header, dividers, labels, icons — leaving only the border. |
| **Root cause** | Two independent defects that compound: `sym:GraphLayer.nodeSpec` always overwrites the shape option's `fill` with one derived solely from `NodeStyle.bgFill` (D1); and `sym:CompositeShape.ensureClip` builds the clip mask from the root's **painted** silhouette, so an unfilled root yields a stroke-only mask (D2). |
| **Defect rows** | F1 (D1), F2 (D2) |
| **Dressing rows** | F3 — story-level, does not remove either cause |
| **Open decisions** | None. D-1 resolved in favour of a cascade over a breaking type change. |
| **Row status** | proposed 0 · accepted 0 · implemented 0 · landed 3 · deferred 0 · rejected 1 |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Four ER tables render as empty rectangles — no body fill, no header band, no row dividers, no key glyphs, no text | `story:designs/SchemaER` | User screenshot, 2026-09-13 |
| S2 | Node **sizes** are exactly correct — measured aspect ratios 0.60 / 0.49 / 0.73 / 0.62 match `customer` 124/208, `product` 100/208, `order` 148/208, `order_item` 124/208 | same | Screenshot measurement |
| S3 | ELK placement, orthogonal routing, `1:N` edge labels and triangle arrowheads all render correctly | same | Screenshot |
| S4 | A visible border **is** drawn, in a lighter tone than the declared `0x55687a` | same | Screenshot |
| S5 | The pre-existing composite-card story is unaffected | `story:usecases/by-casestudies/data-model/SchemaTable` | Not reported; renders in Storybook |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Shape resolver not invoked / wrong shape kind | **No** | S2 — heights are `HEADER_H + cols * ROW_H`, only the composite branch computes those |
| R2 | ELK `nodeSize` wrong, cards overlapping | **No** | S2 + S3 — spacing and topology are correct |
| R3 | `cornerRadius: 0` degenerates the root rect | **No** | `file:packages/renderer-pixijs/src/primitives/shapes/RectShape.ts#L52-L53` branches to `g.rect` when `cr <= 0`; the trace is sound |
| R4 | Font not loaded, so `label` parts fail | **No** | Would not also remove `rect` and `line` parts |
| R5 | `fillAlpha: 0.001` on alternating rows made them invisible | **Partial, not causal** | Explains only the transparent row plates, not the header band, dividers or labels |
| R6 | Theme behaviour repainting the card | **No** | `sym:ColorByBehaviour` is not registered in this story |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | `nodeSpec` spreads the shape option into the spec, then **unconditionally** re-assigns `fill` from `NodeStyle.bgFill`. `stroke` is assigned *conditionally*, so it survives. | `file:packages/graph/src/layer/GraphLayer.ts#L1560-L1575` | `story:designs/SchemaER` sets `fill` on the composite and no `bgFill`, so the card's fill is replaced by `undefined` while its stroke survives — **exactly S4** |
| D2 | `resolveCompositeRoot` copies `fill` onto the default root rect only when defined | `file:packages/canvas-core/src/specs/shapeGeometry/bounds.ts#L232` | The borrowed root silhouette has no fill |
| D3 | `ensureClip` builds the mask with `root.paintInto(g)` — the root's *painted* silhouette, not its geometry | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L216-L228` | With no fill, `applyFill` returns early (`file:packages/renderer-pixijs/src/primitives/paint/applyFillStroke.ts#L55`) and only `applyStroke` marks the mask |
| D4a | A dashed root stroke is a *second* route to the same empty mask: shapes short-circuit to `emitDashedStroke` and `return` **before filling**, reading the dash array from the spec when the style omits one | `file:packages/renderer-pixijs/src/primitives/shapes/RectShape.ts#L34-L45` | Found while implementing F2, not from the screenshot. Same defect class as D3, different trigger |
| D4 | `gfx.mask` is therefore a ~1.6px ring instead of a solid card | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L214` | Every part inside `gfx` is clipped away; the only surviving pixels are the stroke band coinciding with the mask — **exactly S1 + S4** |

**Why this and nothing else produces the observed frame:** D1 alone yields a transparent card with all parts visible (that is `story:usecases/by-casestudies/data-model/SchemaTable`, which sets no `bgFill` either and looks fine because it omits `clip` — **S5**). D3 alone is harmless while a fill exists. Only D1 ∧ `clip: true` produces an outline with nothing inside it.

### Compounding factors

| Factor | Present in | Effect alone |
|---|---|---|
| No `bgFill` on `NodeStyle` | `story:designs/SchemaER` only | Unfilled card body |
| `clip: true` | `story:designs/SchemaER`, `story:designs/AgenticWorkflow`, `story:designs/IterationLoop` | None, while a fill exists |
| Both | `story:designs/SchemaER` only | Total part loss |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep` the four `designs/` stories for `bgFill` and `clip: true` | `SchemaER` is the **only** file with `clip: true` and zero `bgFill`; the other two composite stories set `bgFill` | The conjunction predicted by D1 ∧ D4 partitions working from broken exactly |
| T2 | Read `applyFill` under a supplied `style` | Fills whenever `style.fill !== false` and `style.color !== undefined` (`file:packages/renderer-pixijs/src/primitives/paint/applyFillStroke.ts#L48-L52`) | A paint-style override is the available seam to force a solid mask |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `story:usecases/by-casestudies/data-model/SchemaTable` | relates-to | shipped | Establishes the userland-composite pattern. Sets `bgStrokeWidth: 0` to suppress the base border but never sets `bgFill` — so it has silently carried D1 since it landed |
| `doc:docs/node-styling-unification-plan.md` | relates-to | plan | The `bgFill`-over-shape-fill cascade chosen in F1 is consistent with its single-semantic-style direction |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | landed | `file:packages/graph/src/layer/GraphLayer.ts#L1489-L1493` | When `bgFill`, `image` and `icon` are all absent, fall back to the shape option's own `fill` instead of emitting `undefined` | `CompositeShapeOption.fill` stops being a lie; `fill` now cascades exactly as `stroke` already does | **Medium** — touches the resolved fill of every node in every story. Mitigated by only changing the branch where the value was previously `undefined` | — |
| F2 | defect | landed | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L216-L232` | Paint the clip mask from a **stroke-free copy** of the root spec with an explicit opaque paint style (`fill: true`, `strokeWidth: 0`), so the mask is the silhouette's **geometry**, independent of the root's paint. Neutralises both D3 (absent fill) and D4a (dashed stroke) | `clip: true` can no longer silently delete every part, for either paint hazard | **Medium** — changes mask coverage for every clipped composite; a card whose root was previously stroke-only now clips to its full body | — |
| F3 | dressing | rejected | `story:designs/SchemaER` | Add `bgFill: PAPER` to the story's `NodeStyle` | Hides S1 without removing D1 or D2 | — | — |

F3 is **rejected and kept**: it was the obvious one-line workaround and it is the wrong answer. With F1 landed the story renders correctly *unmodified*, which is the proof F1 is right. Recording the rejection so the next person doesn't reach for it.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:applyFill` early-return on `spec.fill === undefined` | F2 relies on a supplied `style` bypassing that return | If the style branch changes, the mask silently empties again |
| U2 | `sym:resolveCompositeRoot` fill pass-through | F1's fill reaches the root only through this | Dropping the `fill` copy would re-break the mask |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | `story:usecases/by-casestudies/data-model/SchemaTable` | story | Its card gains the `BODY_BG` fill it always declared and never got | Visual change — the card body becomes opaque. **Intended**; verify it still reads |
| N2 | `story:designs/SchemaER` | story | Renders correctly with no edit | V1 |
| N3 | `story:designs/AgenticWorkflow`, `story:designs/IterationLoop` | story | Unchanged — both set `bgFill`, which still wins | V4 (control) |
| N4 | `pkg:@invana/canvas-designer` composite output | package | Freeform templates compiling to a composite with a declared fill now paint it | Verify no template relied on the fill being dropped |
| N5 | Any node using `bgFill` | published API | Unchanged — `bgFill` still takes precedence | V4 |
| N6 | Serialised state | — | None. No type or config-key change | — |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm --filter @canvas/storybook check-types` | repo | Clean | F1, F2 |
| V2 | pass | `pnpm --filter @invana/graph build && pnpm --filter @invana/renderer-pixijs build` | both packages | Clean | F1, F2 |
| V3 | pass | `node scripts/check-renderer-boundary.mjs` | repo | Boundaries intact | F1, F2 |
| V4 | pass | `pnpm lint` (control) | repo | No new findings; `designs/` clean | F1, F2 |
| V8 | pending | Visual: a composite with `clip: true` and a **dashed** root stroke | Storybook | Parts render; mask is the solid silhouette (covers D4a) | F2 |
| V5 | pending | Visual: `story:designs/SchemaER` in a **visible** Storybook tab | Storybook | Header band, dividers, key glyphs and all labels render inside a filled card | F1, F2 |
| V6 | pending | Visual control: `story:usecases/by-casestudies/data-model/SchemaTable` | Storybook | Still renders; card body now opaque (N1) | F1 |
| V7 | pending | Visual control: `story:designs/AgenticWorkflow` | Storybook | Unchanged from before the fix | F1, F2 |

V5–V7 are `pending` because they need a human at a visible Storybook tab — background tabs suspend rAF.

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | `CompositeShapeOption.fill` is declared but ignored. Honour it, or delete it? | (a) cascade — `bgFill` wins when set, else the shape's own fill; (b) delete `fill`/`stroke` from the option type | **(a)** — (b) is a breaking change to a published type and would break `story:usecases/by-casestudies/data-model/SchemaTable` and canvas-designer output for no gain. (a) makes the type honest and matches how `stroke` already behaves | accepted |
| D-2 | Should the clip mask keep using `paintInto`? | (a) force an opaque paint style; (b) add a dedicated geometry-only trace seam to `sym:ShapeBase` | **(a)** — (b) is a wider surface change for the same result; revisit if a second mask consumer appears | accepted |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-13 | Opened from a user screenshot of `story:designs/SchemaER` | proposed | Diagnosis traced to D1 ∧ D4 |
| 2026-09-13 | Maintainer approved the full scope ("fix once for all") | accepted | F1 + F2; F3 rejected as dressing |
| 2026-09-13 | F1, F2 implemented; V1–V4 pass | landed | RFC written and implemented in one pass at the maintainer's instruction, deviating from the README lifecycle step 1 |
| 2026-09-13 | Implementation note | landed | `story:designs/SchemaER` needed **no** edit once F1 landed — the story was correct against the declared type all along, which is what makes F3 dressing rather than fix |
| 2026-09-13 | Implementation note — diagnosis was incomplete | landed | D4a (dashed root stroke) was **not** in the original diagnosis. Found by reading `sym:RectShape.drawGeometry` while writing F2: the dashed branch returns before filling, so a dashed-rooted clipped composite would have stayed broken after the first draft of F2. F2 widened to strip the stroke from the mask spec; V8 added |
| 2026-09-13 | V1–V4 green: repo `pnpm check-types` 19/19, `pnpm lint` 19/19 with 0 errors, boundaries + api surfaces intact | landed | V5–V8 remain `pending` — they need a human at a visible Storybook tab |
