---
id: fix-2026-09-19-composite-label-text-cannot-be-vertically-centred
type: fix
title: A composite label can be centred horizontally but not vertically, so every pill sits low
status: accepted
opened: 2026-09-19
decided: 2026-09-19
landed: null
packages: [pkg:@invana/canvas-core, pkg:@invana/renderer-pixijs, pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/canvas-core/src/specs/shape.ts#L357" }
  - { predicate: caused-by, object: "file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L295-L297" }
  - { predicate: manifests-in, object: "story:graph/Nodes/Types/Composite Shapes/Product Card" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship" }
---

## Summary

| | |
|---|---|
| **What breaks** | Text inside every pill / chip / badge sits **below** its centre — visibly more space above the glyphs than below. Same for the schema-table row text, the avatar monogram and the ID-card header band. |
| **Root cause** | `sym:CompositePart`'s label has `anchor` for the **horizontal** axis and **no vertical counterpart**, and the renderer places `y` verbatim. A builder that wants centred text must therefore *guess* the rendered block height, and every call site guesses `fontSize` — which is ~20–40 % short of the real line box, so the offset overshoots downward. |
| **Why it looks like a card bug** | It is reported per-card (the pills), but no card can fix it: the information needed (measured text height) exists only in the renderer. |
| **Defect rows** | F1 (spec gap) · F2 (renderer) — the cause. F3–F5 convert the guesses. F6 folds in the `align` default from `rfc:feat-…-only-four-ship` F17. |
| **Dressing rows** | F9 — a fudge factor, **rejected**, kept as the record of what not to do |
| **Open decisions** | None — approved whole 2026-09-19; D-1 `vAnchor`, D-2 `'top'`, D-3 fold in, D-4 delegate |
| **Row status** | proposed 0 · accepted 0 · implemented 8 · landed 0 · deferred 0 · rejected 1 — green on V1–V3; `landed` waits on the visual checks V4–V7 |

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | "In stock" and "Wireless" sit low in their pills — the gap above the glyphs is visibly larger than below | `story:graph/Nodes/Types/Composite Shapes/Product Card` | User screenshot, 2026-09-19 18:40 |
| S2 | Every pill in the repo shares it — they all route through two builders | `sym:chip` (`file:packages/graph/src/nodes/composite/shared.ts`), `sym:TaskCard.pill` | Both position the label at `y + (h - fontSize) / 2` |
| S3 | Not only pills. Six further sites centre text in a box the same way | `file:packages/graph/src/nodes/composite/schemaTableCard.ts#L101,L114,L117,L118` · `idCard.ts#L85,L96` · `organisationCard.ts#L63` | All compute `(BOX - fontSize) / 2` |
| S4 | The horizontal axis is correct everywhere — only the vertical is wrong | same cards | `anchor: 'center'` measures the real block; nothing measures height |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The pill rect is drawn at the wrong `y` | **No** | The rect is at `o.y` with height `h`; the screenshot shows the *rect* correctly placed and the text low inside it |
| R2 | `lineHeight` is unset so the block collapses | **No** | Unsetting `lineHeight` changes the block height but not the builder's *guess*; the mismatch is the guess, not the value |
| R3 | It's the `align` defect already logged as F17 | **No** — separate axis | F17 is horizontal (`?? 'center'` on a wrapped label). These pills are single-line and already `anchor: 'center'`. Same family, different defect |
| R4 | A card can fix it by itself | **No** | Rendered text height is known only after `mountLabelContent` measures it, inside the renderer. This is why the ask is "at primitive/shape level" |
| R5 | Only the new cards are affected | **No** | `sym:SchemaTableCard` and `sym:TaskCard` shipped 2026-07-10 with the same pattern |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | The label part declares `anchor?: 'left' \| 'center' \| 'right'` — **horizontal only**. There is no vertical field in the vocabulary. | `file:packages/canvas-core/src/specs/shape.ts#L357` | A spec author cannot *ask* for vertical centring |
| D2 | The renderer measures the block for the horizontal axis and ignores the vertical: `const w = view.display.width; const dx = …; position.set(p.x + dx, p.y)` | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L295-L297` | `p.y` is always the **top** of the line box. `view.display.height` is measured and never read |
| D3 | So a builder wanting centred text must supply a pre-offset `y`, which needs the block height — unavailable at build time. Every call site substitutes `fontSize`. | `sym:chip`: `y: o.y + (h - fontSize) / 2` | The estimate is the defect |
| D4 | A Pixi line box is ascent + descent + line gap ≈ **1.2–1.4 × fontSize**, not `1.0 ×`. | Standard font metrics; `lineHeight` defaults from the font when unset | The guess is short by ~0.2–0.4 × fontSize |
| D5 | Being short makes the offset **too large**: `(h − fontSize)/2 > (h − blockHeight)/2`. | arithmetic | Text is pushed **down** by ~`0.1–0.2 × fontSize`, and the gap above exceeds the gap below — **exactly S1** |

A mechanism that would produce a different symptom is not the diagnosis: note this predicts the error grows with `fontSize`, and is *zero* for a box sized exactly to the line height. Both hold — see C2.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| C1 | Compare the two axes in `sym:chip` | Horizontal uses the **measured** `w`; vertical uses the **guessed** `fontSize` | The axis that measures is correct; the axis that guesses is wrong. Root cause is the missing measurement, not a bad constant |
| C2 | Check the 18 px pill at `fontSize: 11` | Guessed offset `(18−11)/2 = 3.5`; true block ≈ `11 × 1.3 ≈ 14.3`, so true offset ≈ `1.85`. Text sits **~1.65 px low** in an 18 px pill | Matches the screenshot's proportions, and predicts the schema-table's `fontSize: 8` chip is off by less — consistent with it looking subtler |
| C3 | Grep for the pattern repo-wide | 8 sites across 5 cards | Not a one-off typo: the vocabulary gap forces it |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship` | `relates-to` | accepted | Its **F17** (renderer defaults `align` to `'center'`) is the horizontal sibling of this defect. D-3 asks whether to land them together |
| `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` | `relates-to` | landed | Precedent for a two-package composite fix (graph + renderer) landing as one RFC |
| `doc:docs/renderer-split-design.md` | `depends-on` | current | Governs the rule this obeys: a capability the engine needs from a backend is added to the **contract** in canvas-core, then implemented in the backend. F1 → F2 is exactly that order |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-core/src/specs/shape.ts#L357` | Add `vAnchor?: 'top' \| 'middle' \| 'bottom'` to the label part, **default `'top'`**, TSDoc'd as the vertical partner of `anchor` | Gives the vocabulary a way to *ask* for vertical centring | low — additive optional field; `'top'` preserves every existing label | D-1, D-2 |
| F2 | defect | implemented | `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L295-L297` | Read `view.display.height` and apply `dy` symmetrically with `dx` | Removes the cause: the renderer now measures **both** axes | low — no-op unless `vAnchor` is set | F1 |
| F3 | defect | implemented | `sym:chip` (`file:packages/graph/src/nodes/composite/shared.ts`) | Place the label at the pill's centre with `vAnchor: 'middle'`; delete the `fontSize` guess | Fixes S1 for every pill in the repo through one builder | low | F2 |
| F4 | defect | implemented | `sym:TaskCard.pill` (`file:packages/graph/src/nodes/composite/taskCard.ts`) | Same; ideally **delete** it and delegate to `sym:chip` | One pill implementation instead of two | low — changes how `story:…/Task Card` looks | F3 |
| F5 | defect | implemented | `schemaTableCard.ts#L101,L114,L117,L118` · `idCard.ts#L85,L96` · `organisationCard.ts#L63` | Convert the six remaining `(BOX − fontSize) / 2` sites to `vAnchor: 'middle'` | S3 fixed; no hand-rolled vertical centring left in the repo | medium — changes how four shipped stories look | F2 |
| F6 | defect | implemented | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L206` | `align: content.align ?? 'center'` → `?? 'left'` (was F17 of the feat RFC) | Horizontal sibling fixed at source, so card authors stop needing `align: 'left'` | **high** — touches every composite label *and* the decorations sharing `mountLabelContent` | D-3 |
| F7 | defect | implemented | `file:packages/graph/tests/nodes/composite/cards.test.ts` | Assert every box-centred label declares `vAnchor`, mirroring the existing `align` guard | The vocabulary gap can't silently reopen | low | F3–F5 |
| F8 | defect | implemented | `api/canvas-core.surface.txt` | Regenerate **if** the snapshot moves | Keeps `pnpm check-api-surface` green | low — an optional field on an existing interface should not change the export *list*; verify, don't assume | F1 |
| F9 | dressing | **rejected** | `sym:chip` | Multiply the guess by a 1.3 fudge factor instead of measuring | Would hide S1 at one call site while leaving the vocabulary gap and the other seven sites | Kept as the record: it is font-dependent, wrong at other sizes, and does not survive a font change | — |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | Pixi text metrics via `sym:mountLabelContent` | `view.display.height` is the measurement F2 depends on | If a future backend reports height differently, `'middle'` drifts |
| U2 | `sym:applyLabelResolution` (text-resolution LOD) | It rescales the view; F2 must read height **after** it, as the existing `dx` does | Measuring before → offset scales with zoom tier |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | All 8 composite node types | package | Every pill, monogram, chip glyph and row label shifts up by 1–3 px | Intended — that *is* the fix |
| D2 | `story:…/Composite Shapes/*` (10 stories) | stories | Visual change | Re-check in the visual pass; no code edit |
| D3 | `story:usecases/by-casestudies/org-directory/OwnershipChain` · `commerce/StockExposure` · `events/SpeakerClashes` | stories | Visual change | Same |
| D4 | `story:usecases/by-casestudies/code-kg/CompositeCards` | story | Hand-positions labels with fixed `y` and **no** `vAnchor` | **None** — the `'top'` default keeps it byte-identical. This is what D-2 buys |
| D5 | `story:usecases/SimpleAndCompositeNodes` | story | Freeform `orgBadge` composite | None, same reason |
| D6 | `sym:compileFreeform` / `sym:compileCard` | package | Emit label parts from templates; may want `vAnchor` for slot centring later | None now — out of scope, noted |
| D7 | `pkg:@invana/canvas-designer` | package | Authors `FreeformStructure`, not raw label parts | None |
| D8 | Published `@invana/canvas-core` type surface | API | New optional field | Additive, non-breaking. F8 verifies the snapshot |
| D9 | Any userland composite with hand-computed vertical centring | userland | Unchanged by default; the fix is opt-in per label | Document `vAnchor` in the F1 TSDoc so authors stop guessing |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` across the monorepo | 19 packages | **19/19 successful** | F1–F5 |
| V2 | pass | `pnpm --filter @invana/graph test` | `cards.test.ts` | **187 pass** (3 new). The `anchor:'center' ⇒ vAnchor:'middle'` sweep test **failed first** and caught a real miss — see L1 | F3–F5, F7 |
| V3 | pass | `pnpm check-boundaries` + `pnpm check-api-surface` | monorepo | Boundaries intact; **all three surfaces unchanged**, so F8 needed no regeneration — an optional field on an existing interface does not move the export list, as predicted | F1, F8 |
| V4 | pending | Re-shoot the `Product Card` pills at the screenshot's zoom | `apps/storybook` | Equal optical space above and below "In stock" / "Wireless" | F1–F3 |
| V5 | pending | **Control** — `story:usecases/by-casestudies/code-kg/CompositeCards` | `apps/storybook` | **Pixel-identical**, because it sets no `vAnchor` and the default is `'top'` | F1, F2 |
| V6 | pending | **Control** — a single-line label with no box, e.g. the stat-card value | `apps/storybook` | Unmoved | F2 |
| V7 | pending | Only if F6 lands: sweep every composite + decoration label for horizontal shift | `apps/storybook` | No unintended re-alignment | F6 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | What to call the field | (a) `vAnchor`; (b) `baseline`; (c) rename the pair to `anchorX` / `anchorY` | **(a) `vAnchor`** — pairs readably with the existing `anchor` and needs no migration. **(b) is actively wrong**: "baseline" already means the line glyphs sit on, which is not what `'middle'` does. (c) is the tidiest long-term and a breaking rename of a shipped field | accepted — 2026-09-19 |
| D-2 | Default for `vAnchor` | (a) `'top'`; (b) `'middle'` | **(a) `'top'`** — it is today's behaviour, so nothing existing moves, and it is what makes D4/D5 no-ops and V5 a usable control. `'middle'` would silently shift every label in the repo | accepted — 2026-09-19 |
| D-3 | Land F6 (the `align` default) with this, or separately | (a) together; (b) separate RFC; (c) drop it | **(a)** — same family, same files, and one visual sweep instead of two. It is the highest-risk row here, so it is also the first to cut if you want this narrow | accepted — 2026-09-19 |
| D-4 | Should `sym:TaskCard.pill` be deleted in favour of `sym:chip` (F4) | (a) delete and delegate; (b) keep both, fix both | **(a)** — two pill implementations is how they drifted apart in the first place | accepted — 2026-09-19 |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-19 | Reported from a screenshot of the product-card pills | proposed | Diagnosed as a vocabulary gap, not a card bug: the label part has no vertical anchor, so all 8 call sites guess the block height as `fontSize` and land ~1–3 px low |
| 2026-09-19 | Approved whole; F1–F8 implemented | accepted | D-1 `vAnchor` · D-2 `'top'` · D-3 F6 folded in · D-4 `sym:TaskCard.pill` deleted and delegated to `sym:chip`. V1–V3 pass; V4–V7 are visual and still pending |

---

## 9. What implementation taught us

| ID | The document said | What was actually true | Action |
|---|---|---|---|
| L1 | 8 call sites guess the block height (F3–F5) | **12**, across 6 cards. The RFC's grep missed `sym:metaRow`, `sym:UserCard`'s avatar initials, `sym:TaskCard`'s assignee initials, and `sym:EventCard`'s date chip — the last because its `y` was hand-nudged (`padding + 8`) rather than written as an `(H − fontSize) / 2` expression, so it matched no pattern | All 12 converted. The F7 sweep test — *every `anchor:'center'` label must pair with `vAnchor:'middle'`* — is what found the date chip, by failing. Worth more than the grep |
| L2 | F4 delegates `sym:TaskCard.pill` to `sym:chip` | The title also read the pill's width from a **duplicated** `text.length * 6.5 + 16` literal, a third copy of the estimate | `pill()` now returns the shared width and the title consumes it, so one estimate serves all |
| L3 | F8 may need an API-surface regeneration | Not needed — `vAnchor` is an optional property on an existing interface, and the snapshot diffs export *lists* | F8 closed with no file change; the RFC's "verify, don't assume" wording was the right hedge |
| L4 | `sym:EventCard`'s date chip was out of scope | Its day/month were hand-tuned pixel offsets that break as soon as `dateChipSize` changes | Rewritten as two bands at `S * 0.38` / `S * 0.78` with `vAnchor: 'middle'`, so the chip now scales with its spec |
