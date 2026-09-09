---
id: fix-2026-09-10-renderer-preference-canvas-never-reaches-the-backend
type: fix
title: The 'canvas' render preference never reaches the backend, and three declarations of the option disagree
status: landed
opened: 2026-09-10
decided: 2026-09-10
landed: 2026-09-10
packages: [pkg:@invana/canvas, pkg:@invana/canvas-core, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-react]
design_of_record: null
relations:
  - { predicate: caused-by, object: file:packages/canvas/src/engine/Canvas.ts#L337 }
  - { predicate: manifests-in, object: file:packages/renderer-pixijs/src/renderer/rendererSupport.ts#L80-L84 }
  - { predicate: relates-to, object: rfc:feat-2026-08-14-renderer-as-dependency }
---

**Summary:** `sym:CanvasOptions.preference` publicly offers `'canvas'`, and
`sym:bestRenderPreference` can return it — but `sym:Canvas.init` rewrites it to `'webgl'`
one line before it crosses the renderer seam, so the canvas backend is unreachable
through the engine. The same option is declared three times with three different unions,
and the one value the kernel contract names (`'auto'`) is unreachable from the public
option.

| | |
|---|---|
| **What breaks** | A consumer cannot select pixi's canvas backend at all. On a device with neither WebGPU nor WebGL, `preference: bestRenderPreference()` — the call the TSDoc recommends — resolves to `'canvas'` and is then rewritten to the one backend that cannot work |
| **Root cause** | `file:packages/canvas/src/engine/Canvas.ts#L337` maps `'canvas'` → `'webgl'` because `sym:RendererInitOptions.preference` never had a `'canvas'` member; the mapping was a type-fit, not a decision |
| **Defect rows** | F1, F2, F3, F4 — all `landed` 2026-09-10 |
| **Dressing rows** | None |
| **Open decisions** | None — D2 accepted (`'auto'` dropped); D1 (pixi's array-valued `preference`) **deferred** to a follow-up `feat/` RFC |

Row status: proposed 0 · accepted 0 · landed 4 · deferred 0 · rejected 0 · superseded 0

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| S1 | `new Canvas().init({ preference: 'canvas' })` mounts a **WebGL** renderer. No warning, no error, no trace of the request | `file:packages/canvas/src/engine/Canvas.ts#L337` | `opts.preference === 'canvas' ? 'webgl' : opts.preference` — the value is discarded at the seam |
| S2 | `sym:bestRenderPreference` returns `'canvas'` when neither WebGPU nor WebGL is available, and its TSDoc directs the caller to feed it to a canvas — where S1 then discards it | `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts#L80-L84` | "Use it to default a canvas / a backend picker to the fastest option the device supports" |
| S3 | The option is declared three times, with three different unions, across three packages | see D-1 | `'webgpu'\|'webgl'\|'canvas'` (engine), `'webgpu'\|'webgl'\|'auto'` (kernel contract), `'webgpu'\|'webgl'\|'canvas'` (backend) |
| S4 | `'auto'` — the only value the kernel contract names that the engine does not — is unreachable: nothing in the repo ever produces it | `grep -rn "'auto'"` over `packages/*/src` | Only `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L93` *consumes* it, mapping it to `'webgpu'` |
| S5 | `sym:RenderPreference` is re-exported as public API from `pkg:@invana/canvas-react`, so the divergence is on the published surface, not internal | `file:packages/canvas-react/src/index.ts#L33` | `export type { RenderPreference } from '@invana/renderer-pixijs'` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | pixi 8 has no canvas backend, so `'canvas'` is meaningless and the mapping is correct | **No** — pixi declares `RendererPreference = 'webgl' \| 'webgpu' \| 'canvas'` and accepts it | `file:node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.d.ts#L10` |
| R2 | The backend would reject `'canvas'` anyway, so the engine is defending it | **No** — `sym:resolveRenderPreference` is typed to accept `'canvas'` and documents that it "passes through unchanged". The backend is ready; the engine never lets it arrive | `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts#L21,L68-L71` |
| R3 | This is a regression from `rfc:feat-2026-08-14-renderer-as-dependency` | **No** — that RFC changed how the backend is *resolved*, not how the preference is typed. The mapping predates it | `file:packages/canvas/src/engine/Canvas.ts#L337` is unchanged by `commit:fc8c46a3` |
| R4 | Bumping pixi to 8.20.1 introduced or fixed this | **No** — the divergence is entirely ours. 8.18.0 did *add* array-valued `preference`, which is the mechanism D1 proposes, but it changes nothing on its own | pixi 8.18.0 release notes, `#11963` |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D-1 | The option is declared independently at each layer, and the declarations were never reconciled: engine `'webgpu'\|'webgl'\|'canvas'`, kernel contract `'webgpu'\|'webgl'\|'auto'`, backend `'webgpu'\|'webgl'\|'canvas'` | `file:packages/canvas/src/engine/Canvas.ts#L107` · `file:packages/canvas-core/src/contracts/RendererInitOptions.ts#L23` · `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts#L21` | The engine's union and the contract's union are not assignable to one another |
| D-2 | To make the call type-check, `sym:Canvas.init` rewrites the one member the contract lacks rather than widening the contract | `file:packages/canvas/src/engine/Canvas.ts#L337` | `'canvas'` is silently destroyed at the seam — the defect in S1 |
| D-3 | Symmetrically, the contract's extra member `'auto'` has no producer, because `sym:CanvasOptions` is the only public way to set the option and it does not offer `'auto'` | S4 | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L93`'s `opts.preference === 'auto' ? 'webgpu' : …` is dead code |
| D-4 | `sym:bestRenderPreference` is typed on the *backend's* union, which does include `'canvas'`, so it can legally return a value the *engine* will discard | `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts#L80-L84` | The recommended way to pick a backend is the way that hits the defect — exactly S2 |
| D-5 | Neither backend nor engine can express "WebGL, then canvas, never WebGPU" — the union is single-valued, so a fallback *chain* has no representation | `file:packages/canvas-core/src/contracts/RendererInitOptions.ts#L23` | The `'canvas'` request has no correct destination even if D-2 were removed; see D1 |

**Why this and not something else:** the chain predicts a failure that is (a) silent rather
than an error, (b) confined to `'canvas'` while `'webgpu'` and `'webgl'` work correctly,
(c) reachable through the documented `sym:bestRenderPreference` path, and (d) invisible to
`pnpm check-types`, because each layer type-checks against its own union and the lossy
mapping at the seam is what makes them agree. All four match S1–S5.

### Confirming test

| Test | Action | Result | Inference |
|------|--------|--------|-----------|
| T1 | `grep -n "=== 'canvas'" file:packages/canvas/src/engine/Canvas.ts` | One hit, line 337, rewriting to `'webgl'` | The value cannot reach `sym:IRenderer.mount`; S1 confirmed by construction |
| T2 | `grep -rn "'auto'" packages/*/src` | Consumed at `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L93`, produced nowhere | S4 confirmed — the branch is unreachable |
| T3 | `pnpm check-types` on the tree as it stands | 19/19 pass | The divergence is invisible to the type checker; only the lossy mapping keeps it quiet |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/renderer-split-design.md` | relates-to | current | §5 — a geometry/capability answer must not require a specific backend. `sym:RenderPreference` living in `pkg:@invana/renderer-pixijs` while `pkg:@invana/canvas` re-declares it is the seam this RFC tidies |
| `rfc:feat-2026-08-14-renderer-as-dependency` | relates-to | landed | Established that the backend is a required dependency resolved through `sym:createDefaultRenderer`; does not touch the option's type |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | landed | `file:packages/canvas-core/src/contracts/RendererInitOptions.ts#L23` | Widen `preference` to `'webgpu' \| 'webgl' \| 'canvas'` — one union, owned by the contract | The contract can carry every backend the engine offers; the seam becomes lossless | **Not low** — public type surface on `pkg:@invana/canvas-core`; requires `pnpm check-api-surface --write` in the same change | D2 |
| F2 | defect | landed | `file:packages/canvas/src/engine/Canvas.ts#L337` | Delete the `'canvas' → 'webgl'` rewrite; pass `opts.preference` straight through | `preference: 'canvas'` reaches pixi and mounts the canvas backend — S1 fixed | Low once F1 lands | F1 |
| F3 | defect | landed | `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts#L21` | Re-declare `sym:RenderPreference` as an alias of the contract's type rather than a third independent union | One declaration, three consumers; the divergence cannot silently reopen | Low — same members, so `pnpm check-api-surface` sees no change | F1 |
| F4 | defect | landed | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L93` | Drop the dead `'auto'` branch, or keep `'auto'` as a documented alias for "let pixi choose" per D2 | Removes unreachable code, or gives `'auto'` a producer | Low | D2 |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | pixi's `RendererPreference` | F1's union must stay a subset of what `autoDetectRenderer` accepts | Low — pixi 8.20.1 accepts all three; the type has been stable since v8.0 |
| U2 | `sym:resolveRenderPreference` | Already accepts `'canvas'` and passes it through; F2 makes that path live for the first time | Low, but the `'canvas'` path has never actually executed — V3 covers it |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| N1 | `pkg:@invana/canvas-core` API surface | published types | `sym:RendererInitOptions` gains a union member | Regenerate `file:api/@invana-canvas-core.surface.txt` in the same change |
| N2 | `pkg:@invana/canvas-react` | published types | Re-exports `sym:RenderPreference` (`file:packages/canvas-react/src/index.ts#L33`); F3 changes where it is declared, not what it means | None — verify with V2 |
| N3 | `sym:useCanvasEngine` | runtime | `file:packages/canvas-react/src/useCanvasEngine.tsx#L91` forces `'webgl'` after a WebGPU render-crash. Unaffected by F1–F4 (it forces a value that always worked) | None |
| N4 | Serialised canvas state / `io/` state export | data | If `preference` is persisted anywhere, a stored `'canvas'` currently round-trips to WebGL and would begin honouring itself | Confirm under V4 whether `preference` is part of exported state |
| N5 | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` and every other story | visual | All stories use the default (`undefined` → `'webgpu'`), which F1–F4 do not touch | None — V1 is the control |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | **Control** — mount with no `preference` | `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` in a **visible** tab | Renders exactly as today on WebGPU; `renderer:initialised` reports `webgpu` | F1, F2, F3, F4 |
| V2 | pass | `pnpm build && pnpm check-types && pnpm check-boundaries && node scripts/check-api-surface.mjs` | repo | All green; the only surface diff is N1, regenerated in the same change | F1, F3 |
| V3 | pass | Mount with `preference: 'canvas'` and read `sym:IRenderer.backend` | any story | Reports the canvas backend, not `webgl` — S1 no longer reproduces | F2 |
| V4 | pass | `grep -rn "preference" packages/canvas/src/io/` | `pkg:@invana/canvas` | Determines whether N4 is a real consumer or empty | F1 |
| V5 | pass | `grep -rn "'auto'" packages/*/src` after F4 | repo | No unreachable branch remains, or `'auto'` has a producer per D2 | F4 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D1 | Should `preference` accept an **array** (pixi 8.18.0's `RendererPreference[]`), so a consumer can express "WebGL then canvas, never WebGPU"? | (a) single value only, as today; (b) accept `T \| T[]` and pass arrays through | **(b), but as a follow-up `feat/` RFC, not here.** It is a new capability, not a broken promise — and F1–F4 are worth landing on their own. Recording it here because D-5 shows it is the real answer to "how do I ask for a fallback chain" | **deferred** — still the recommendation; a `feat/` RFC when someone wants a fallback chain |
| D2 | Keep `'auto'` as a fourth member, or drop it? | (a) drop it — no producer, dead branch; (b) keep it and give `sym:CanvasOptions` an `'auto'` member meaning "let pixi choose" | **(a) drop it.** `undefined` already means "let the backend choose" and is the documented default; `'auto'` is a second spelling of the same thing. Dropping it removes S4 outright | **accepted 2026-09-10** — dropped; V5 confirms no `'auto'` branch remains |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-09-10 | Opened while auditing pixi 8.18.1 → 8.20.1 for release-note items touching our code. The upgrade did not cause this; it surfaced it, because 8.18.0's array `preference` was the note that sent me to read the option's chain | proposed | Four rows proposed, two decisions open |
| 2026-09-10 | Landed F1–F4. `sym:RenderPreference` now has **one declaration** (`file:packages/canvas-core/src/contracts/RendererInitOptions.ts`), re-exported by `pkg:@invana/canvas` and aliased by `pkg:@invana/renderer-pixijs`; the `'canvas' → 'webgl'` rewrite at `file:packages/canvas/src/engine/Canvas.ts#L337` is deleted; `'auto'` dropped per D2. Verified in a live browser (V3): `preference: 'canvas'` mounts pixi's `CanvasRenderer` (`type 4`) and `IRenderer.backend` reports `'canvas'`, while the no-preference control still resolves WebGPU. Build 20/20 · types 19/19 · boundaries · 369 tests · `api/canvas-core.surface.txt` + `api/canvas.surface.txt` regenerated (N1) | landed | D1 deferred to a follow-up feat RFC |
