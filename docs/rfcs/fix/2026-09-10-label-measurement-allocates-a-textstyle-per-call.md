---
id: fix-2026-09-10-label-measurement-allocates-a-textstyle-per-call
type: fix
title: measureLabelContent allocates a TextStyle on every call, once per node per re-project
status: proposed
opened: 2026-09-10
decided: 2026-09-10
landed: null
packages: [pkg:@invana/renderer-pixijs]
design_of_record: null
relations:
  - { predicate: caused-by, object: file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L106 }
  - { predicate: manifests-in, object: file:packages/graph/src/layer/GraphLayer.ts#L2531 }
---

**Summary:** `sym:measureLabelContent` builds `new TextStyle(...)` on every call. pixi
caches the *measurement* by style key, so the measuring is nearly free on repeat — but the
`TextStyle` is rebuilt regardless, and `sym:GraphLayer.fitShapeToLabel` calls it once per
fit-to-label node on every re-project. The instance is also retained by pixi's metrics LRU,
so it is allocation churn plus a bounded retention, not a pure transient.

| | |
|---|---|
| **What breaks** | Nothing visibly. This is a cost defect: wasted allocation on a per-node path, not a wrong result |
| **Root cause** | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L106` constructs the style inline inside the measure call, so nothing can reuse it |
| **Defect rows** | F1 |
| **Dressing rows** | None |
| **Open decisions** | None — D1 → (b), D2 → (a), both decided 2026-09-10 |

Row status: proposed 0 · accepted 2 · landed 0 · deferred 0 · rejected 0 · superseded 0

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| S1 | Every `sym:IElementRenderer.measureLabel` call constructs a fresh `TextStyle`, even when the previous call was for an identical style | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L105-L107` | `CanvasTextMetrics.measureText(content.text, new TextStyle(textStyleFor(...)))` |
| S2 | The call is per-node, not per-canvas: `sym:GraphLayer.fitShapeToLabel` calls it once for each node whose shape fits itself to its label, on each re-project | `file:packages/graph/src/layer/GraphLayer.ts#L2531` | `const measured = renderer.measureLabel(labelStyle.content, labelStyle.wrap)` |
| S3 | Constructing a `TextStyle` is not trivial: `EventEmitter` super-call, a `uid()`, a spread of `defaultTextStyle`, ~25 property assignments through setters, then `update()` | `file:node_modules/pixi.js/lib/scene/text/TextStyle.mjs#L14-L43` | Read at 8.20.1 |
| S4 | The instance outlives the call — pixi's metrics cache stores the `CanvasTextMetrics`, which holds `this.style = style` | `file:node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs#L49,L109,L146` | Retention is bounded: `_measurementCache = lru(1000)` (`#L430`) |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | The expensive part is the text measurement, and this re-measures per node | **No** — `CanvasTextMetrics.measureText` caches on `` `${text}-${style.styleKey}-wordWrap-${w}` ``, a *value* key. Fresh instances with identical properties still hit the cache | `file:node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs#L74-L77`. **This is why the fix is small: the waste is the allocation only** |
| R2 | It is an unbounded leak | **No** — the retaining cache is an LRU capped at 1000 entries, and nothing else holds the style | `_measurementCache = lru(1e3)` (`#L430`) |
| R3 | The fix is a single module-level `TextStyle` mutated per call | **No, and it would corrupt pixi's cache.** Cached `CanvasTextMetrics` objects retain the style *by reference* (S4). Mutating one shared instance would retroactively change `.style` on every cached measurement, including those backing real `Text` objects. Recorded because it is the obvious first fix and it is wrong | `this.style = style` at `#L49`, entries retained at `#L109`/`#L146` |
| R4 | pixi 8.20.1's "detach from shared `TextStyle` on destroy" (`#12159`) fixes this | **No** — that fix concerns a `Text` releasing listeners on a style it shares. We never share a style with a `Text`, and we never destroy these | 8.20.1 release notes |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D-1 | `sym:textStyleFor` returns a plain `TextStyleOptions` — a flat object of primitives derived only from `content` and `wrap` | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L116-L140` | Two calls with equal `content`/`wrap` produce structurally equal options, so a value-keyed cache is sound |
| D-2 | `CanvasTextMetrics.measureText` requires a `TextStyle` *instance*, not options, because it reads `style.styleKey` | `file:node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs#L74` | The instance cannot simply be skipped; it must be produced or reused |
| D-3 | The construction is inlined at the call site, so there is no seam at which an instance could be reused | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L106` | One allocation per call, unconditionally — the defect |
| D-4 | The caller is per-node and re-runs on re-project, while the *set of distinct label styles* in a graph is typically 1–3 | S2 + D-1 | The allocation count scales with node count; the number of *distinct* styles does not. That gap is the entire waste |

**Why this and not something else:** the chain predicts a cost that (a) scales with node
count rather than label count, (b) does **not** show up as re-measurement time, because R1's
cache absorbs it, and (c) produces correct output throughout. That matches S1–S4: there is
no visual or behavioural symptom to point at, which is why this is filed as a cost defect
and why D2 asks whether it is worth landing.

### Confirming test

| Test | Action | Result | Inference |
|------|--------|--------|-----------|
| T1 | Read `sym:measureLabelContent` | `new TextStyle(...)` inside the `measureText` argument list | S1 confirmed by construction |
| T2 | Read `CanvasTextMetrics.measureText`'s cache key | `` `${text}-${style.styleKey}-wordWrap-${w}` `` — value-keyed | R1 confirmed: measurement is already cached; allocation is not |
| T3 | Read `CanvasTextMetrics`'s constructor and the two `_measurementCache.set` sites | `this.style = style`, entry stored | S4 and R3 confirmed: the style is retained by reference, so mutation-in-place is unsafe |
| T4 | **skipped** — would have instrumented `sym:measureLabelContent` with a counter over `dataset:lesMiserables` (77 nodes) | Never run | D2 was decided (a) without it, so the mechanism (D-1…D-4) rests on reading alone; only its *magnitude* is unmeasured |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:packages/renderer-pixijs/CLAUDE.md` | relates-to | current | "Everything that touches `pixi.js` lives here" — the cache belongs in this package, beneath `sym:IElementRenderer.measureLabel`, so the contract is unchanged |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | accepted | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L99-L109` | Memoise the `TextStyle` in a module-level `Map` keyed by a value key over the resolved `TextStyleOptions` (D1). Instances are **never mutated** after construction, so R3's hazard does not apply. Landed as `sym:measureStyleFor` + `sym:measureStyleKey` | Allocation count drops from *per node per re-project* to *per distinct label style*. No change to any returned measurement | Low — pure function, same inputs, same outputs; the only new state is a private cache | D1 |
| F2 | defect | accepted | same | Bound the cache (small LRU or a plain size cap with clear-on-overflow), so a pathological graph with per-node fonts cannot grow it without limit. Landed as an insertion-order LRU at `MEASURE_STYLE_CACHE_LIMIT = 256` | Removes the one way F1 could become a leak of its own | Low | F1 |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | pixi's `CanvasTextMetrics` value-keyed cache | F1 is only worth doing *because* the measurement is already cached (R1). If pixi ever keyed on instance identity, F1 would become a correctness requirement rather than an optimisation | Low — stable since v8.0; re-verified at 8.20.1 |
| U2 | pixi's retention of `style` on cached metrics | F1 relies on instances being immutable after construction; R3 shows why | Low, but it is the reason F1 is a cache and not a scratch object — keep the comment |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| N1 | `sym:GraphLayer.fitShapeToLabel` | runtime | The only in-repo caller. Same values, fewer allocations | None |
| N2 | `sym:IElementRenderer.measureLabel` | published contract | Unchanged — F1 is entirely inside the backend | None |
| N3 | `sym:HeadlessRenderer.measureLabel` | test double | Returns `null` and does not measure (`file:packages/canvas-core/src/headless/HeadlessRenderer.ts#L163`) | None |
| N4 | Shapes that auto-fit to their label — `tabbed-rect` tabs, header bands, chips | visual | Must be pixel-identical. Any drift means F1 changed a measurement, which it must not | V1 is the control |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pending | **Control** — render a fit-to-label shape before and after, compare tab/band geometry | `story:Canvas/Concepts/Shapes/` tabbed-rect story, in a **visible** tab | Pixel-identical. A fit-to-label shape that changes size means F1 broke a measurement | F1 |
| V2 | skipped | T4's counter, re-run after F1 | `dataset:lesMiserables` | Skipped with T4 — the before-number was never taken, so an after-number has nothing to compare against | F1 |
| V3 | pass | `pnpm build && pnpm check-types && pnpm check-boundaries && node scripts/check-api-surface.mjs` | repo | All green, no surface change | F1, F2 |
| V4 | pending | Feed 200 distinct `fontSize` values through `sym:measureLabelContent` | unit-level | Cache size stays at its cap; no unbounded growth | F2 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D1 | What is the cache key? | (a) `JSON.stringify(options)`; (b) a hand-built template string over the ~10 fields `sym:textStyleFor` sets; (c) construct the `TextStyle` and key on its own `styleKey` | **(b)** — decided 2026-09-10. Carries a maintenance cost: a new field in `sym:textStyleFor` must be mirrored into `sym:measureStyleKey` or two styles differing only in it collide. The TSDoc on the key builder says so. (c) is circular — it needs the allocation the row exists to avoid. (a) is correct but its key-building cost is a meaningful fraction of what we are saving, on the same per-node path | decided |
| D2 | Is this worth landing at all? | (a) land F1+F2; (b) close as `rejected`, keeping the diagnosis; (c) run T4 first and decide on the number | **(c).** R1 means the measurement — the part that would have been expensive — is already cached, so the win is allocation churn only. T4 is cheap and turns this from a plausible optimisation into a measured one. If T4 shows a handful of calls per re-project, (b) is the honest outcome and the RFC still earns its keep as the record of *why* not | **decided → (a)** 2026-09-10: landed without the measurement, on the request to fix it. The cost is that the win is reasoned, not measured |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-09-10 | Landed F1+F2 in `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts`. D1 → (b) hand-built key; D2 → (a) land it, so T4/V2 (the counter) were skipped rather than run. V3 green — `check-api-surface`'s only drift (`RenderPreference`) belongs to `rfc:fix-2026-09-10-renderer-preference-canvas-never-reaches-the-backend`, in flight on the same branch. V1 (visual control) and V4 (cache bound) still pending — both need a browser | accepted | Rows stay `accepted`, not `landed`: the code is in, V1 is not |
| 2026-09-10 | Opened while auditing pixi 8.18.1 → 8.20.1. Found via 8.20.1's `#12159` (shared `TextStyle` detach), which does not apply to us (R4) but sent me to read our only `TextStyle` construction site | proposed | Two rows proposed. D2 is open on purpose: R1 undercuts the usual reason to care, and T4 should decide it |
