---
id: fix-2026-11-18-status-bar-reads-destroyed-camera-safari
type: fix
title: GraphStatusBar throws reading camera.scale from a destroyed pixi viewport (Safari only)
status: accepted
opened: 2026-11-18
decided: null
landed: null
packages: [pkg:@invana/renderer-pixijs, pkg:@invana/canvas-core, pkg:@invana/canvas-react]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis" }
  - { predicate: caused-by, object: "file:packages/renderer-pixijs/src/renderer/PixiViewportBinding.ts#L37-L43" }
---

# GraphStatusBar reads a destroyed camera (Safari)

| Item | Value |
|---|---|
| What breaks | `story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis` shows the error boundary in Safari; Chrome is fine |
| Proximate cause | `viewport.position` is `null` ⇒ the pixi `Viewport` was already destroyed when `sym:Camera.scale` read it |
| Root cause | **Unconfirmed** — what destroys the engine in Safari before the status bar reads it. Leading suspect: WebGL context loss (pixi + MapLibre = two contexts; Safari evicts), not a WebGPU crash |
| Defect rows | F1a, F1c, F3 (F1b, F1d deferred) |
| Row status | implemented 10 · deferred 2 · landed 0 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | `null is not an object (evaluating 'this.viewport.position.x')` | `file:packages/renderer-pixijs/src/renderer/PixiViewportBinding.ts#L39` | pasted Safari + Chrome-style stack |
| S2 | Thrown from a mount effect of `GraphStatusBar` (`useZoom`) | `file:packages/canvas-react/src/hooks/useZoom.ts` (`useState(() => resolved.camera.scale)` + effect) | stack: `scale` → canvas-react `useZoom` → `commitHookEffectListMount` |
| S3 | `WebGL: context lost` logged immediately before, and a maplibre `AbortError` after | Safari console | pasted log |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Story config / data wrong | no | identical in Chrome, which works |
| R3 | WebGPU render-crash fallback fired | unlikely | the guard's `[canvas] WebGPU renderer crashed at render time` warning is absent from the log; the throw is in a React effect, outside `renderer.render`, so the guard cannot see it; log says `WebGL: context lost` ⇒ backend probably WebGL, where the guard rethrows |
| R2 | `AbortError` is the cause | no | logged *after* the render error; maplibre aborts in-flight tile fetches on teardown |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `sym:PixiRenderer.destroy` destroys the `Viewport` (`_world.destroy`), pixi nulls `position` | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L191-L203` | any later `getTransform()` throws |
| 2 | `sym:Camera.scale` reads the binding live and never checks it is disposed | `file:packages/canvas-core/src/abstracts/Camera.ts#L213` | a destroyed canvas is unreadable, not inert |
| 3 | `useZoom` reads `camera.scale` from React state init and an effect | canvas-react `useZoom` | a status bar holding a destroyed canvas crashes the tree |
| 4 | **Open:** something tears the engine down while a child still holds it. Leading suspect: WebGL context loss (S3); see `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts` for the earlier WebKit destroyed-`GpuProgram` crash | S3, R3 | not yet proven |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Safari, add a `console.trace` in `Canvas.destroy` and log `canvas:renderer:fallback` | pending | names the teardown trigger |
| T2 | Safari with `preference="webgl"` forced on the story | pending | if the error vanishes ⇒ WebGPU crash/fallback path (step 4) |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/renderer-split-design.md` | relates-to | landed | binding is the single source of truth for the transform |

## 4. The fix

| ID | Kind | Status | File | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1a | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts` (`sym:PixiRenderer.tick`) | skip frames while the WebGL context is lost | no shader-compile flood on a dead context | low | none |
| F1c | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts` (`sym:PixiRenderer.installContextLossGuard`) | context not restored within 2 s ⇒ emit `canvas:renderer:fallback`; `useCanvasEngine` remounts on a fresh context | labels/annotations return after eviction | medium — lifecycle | F1a |
| F1e | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts` (`sym:PixiRenderer.tick`, `installContextLossGuard`) | loss detection is state-driven: `gl.isContextLost()` is checked at attach and every tick; events are only a fast path. A context lost before the listeners attached (or during `init`) is no longer missed | guard engages in the trace where events never arrived | low | F1a |
| F4 | defect | implemented | `file:packages/canvas-react/src/useCanvasEngine.tsx` | a failed `init()` is torn down and retried up to 3 times with backoff before the error is surfaced | context lost during init recovers instead of throwing `TypeError` | medium — lifecycle | none |
| F5 | defect | implemented | `file:packages/canvas-react/src/useCanvasEngine.tsx` | consecutive fallback remounts capped at 3 (count resets after 15 s stable) | no flicker loop on a browser that cannot hold a context | low | F1c |
| F6 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts` (`sym:PixiRenderer.mount`, `destroyFailedApp`) | destroying a half-initialised pixi `Application` after a failed `init()` no longer throws (pixi `ResizePlugin.destroy` calls an undefined `_cancelResize`); the real init error is logged and the WebGL retry proceeds | WebGPU-init failure (Safari: `requestAdapter()` returns none) now falls back to WebGL instead of aborting `Canvas.init()` | low | none |
| F7 | defect | implemented (revised: cap alone did not fix Safari; see F8) | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts` (`sym:capBatchTextures`, once per page, called from `mount`) | wrap pixi's `GlLimitsSystem.contextChange` so `maxBatchableTextures` is clamped to 8 **before** the first renderer builds the page-wide default batch shader | Safari computed a 22-slot batch shader against a 16-unit link-time limit ⇒ the program failed to link and nothing drew; the shader is now 8 slots on every GPU | medium — changes pixi's batching limit for all WebGL canvases (slightly more batch breaks with many distinct textures) | none |
| F8 | defect | implemented | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts` (`sym:capBatchTextures`, wrap of `BatcherPipe.buildStart`) | before each batch build on a WebGL renderer, any batcher whose shader slot count differs from that renderer's own `maxBatchableTextures` is rebuilt via `_updateMaxTextures` | in the user's live Safari the shared batch shader had 22 slots while the renderer limit was 8 and the context enforces 16 ⇒ link failure; origin of the 22 not identified, so the fix makes the shared shader agree with the renderer instead of preventing one source | medium — uses pixi's `@internal` `_updateMaxTextures` | F7 |
| F1b | defect | deferred | pixi / layers | redraw on `webglcontextrestored` (re-raster labels, invalidate surfaces) | in-place recovery | medium | unblocks if restore proves reliable in Safari |
| F1d | defect | deferred | `pkg:@invana/graph-layer-maplibre` / stories | reduce live contexts (the likely eviction cause) | removes the cause | unknown | V1 confirms eviction |
| F2 | dressing | implemented | `file:packages/renderer-pixijs/src/renderer/PixiViewportBinding.ts#L37-L55` | `getTransform` returns the last known transform once the viewport is destroyed | status bar no longer crashes; **hides** F1 if F1 is the cause | low | none |
| F3 | defect | implemented | `file:packages/canvas-react/src/hooks/useZoom.ts` | skip the read when `!canvas.isInitialised` | hook safe on a torn-down canvas | low | none |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action |
|---|---|---|---|---|
| B1 | every `GraphCanvasApp` story | story | F2/F3 only add guards | smoke-test one |
| B2 | `pkg:@invana/canvas-core` `ICameraBinding` | contract | none (F2 is inside the pixi binding) | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | T1 + T2 in Safari | ZoneAnalysis | trigger identified | F1d |
| V2 | pending | Safari load | ZoneAnalysis | story renders, no boundary, labels draw | F1a, F1c, F2, F3 |
| V3 | pending | control: Chrome load | ZoneAnalysis | still renders | F1a, F1c, F2, F3 |
| V5 | pass (real Safari 27.2: stale build ⇒ batch shader `uTextures[22]`, `Could not initialize shader` ×2 in ~100 story switches; fresh build ⇒ 0 errors in ~22; WebKit + Chromium headless ⇒ `uTextures[8]`, draws) | batch shader slot count + console errors after F7 | story switching, ZoneAnalysis | slot count 8, no shader errors | F7 |
| V4 | pass (WebKit, WebGL-only, eviction + forced loss) | forced loss: `canvas.loseContext()` via `WEBGL_lose_context` on the pixi canvas, in Chrome | ZoneAnalysis | frames pause, no shader errors; no restore ⇒ remount within ~2 s and labels draw | F1a, F1c |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Land F2/F3 now, or wait for V1? | A) guards now · B) diagnose first | B: F2/F3 alone would hide a teardown bug | accepted (user: "write it and fix it") — F2/F3 now, F1 after V1 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-18 | opened | proposed | root cause unconfirmed; Safari not runnable in the writing session |
| 2026-11-18 | diagnosis revised | proposed | WebGPU-fallback theory downgraded (R3); context loss is the lead |
| 2026-11-18 | F2, F3 written; F1 deferred | implemented | pixijs + canvas-react build and type-check pass; V2/V3 need a browser |
| 2026-11-18 | labels missing in Safari after F2/F3: pixi context lost, shader errors | implemented | F1a + F1c written, F1b/F1d deferred; build, types, api-surface pass; V1–V4 need a browser |
| 2026-11-18 | guard missed a context lost before it attached; init could throw | implemented | F1e (state-driven check), F4 (init retry), F5 (remount cap) written. WebKit: normal load, eviction, forced loss ×3, and loss-during-init all recover and draw; V1–V3 still need real Safari |
| 2026-11-18 | ran in the user's real Safari 27.2 via AppleScript: remount made `Canvas.init()` fail with `this._cancelResize is not a function`; F6 fixes it and the remount now succeeds. One capture also showed pixi `getProgramInfoLog`: `FRAGMENT shader texture image units count exceeds MAX_TEXTURE_IMAGE_UNITS(16)` — not reproduced in 6 further remounts; root cause open (suspect: page-wide shared default batch shader across overlapping renderers, see `file:packages/renderer-pixijs/src/renderer/rendererSupport.ts` history) | implemented | V1–V3 partly exercised in real Safari |
| 2026-11-18 | root cause of the shader error found in the user's real Safari | implemented | the default batch shader was built with 22 texture slots (pixi probed a limit larger than the 16 the context enforced at link time) ⇒ link failure ⇒ no nodes/labels. F7 caps it at 8. Earlier context-loss rows stay as separate, correct hardening; F2/F3 remain workarounds to revisit |
| 2026-11-18 | recorder in user's real Safari: failing program is `batch-fragment` with `uTextures[22]` on a 16-unit context even with F7 loaded (cap confirmed installed in the live page; pixi's own probe returns 16) | implemented | F8 added; automated story cycling does not reproduce, the user's manual sidebar clicks do; awaiting their confirmation that vessels draw |
