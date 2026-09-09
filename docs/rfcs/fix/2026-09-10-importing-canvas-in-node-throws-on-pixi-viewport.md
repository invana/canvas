---
id: fix-2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport
type: fix
title: Importing @invana/canvas in plain Node throws on pixi-viewport's named export
status: landed
opened: 2026-09-10
decided: 2026-09-10
landed: 2026-09-10
packages: [pkg:@invana/renderer-pixijs, pkg:@invana/canvas, pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: caused-by, object: file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L20 }
  - { predicate: manifests-in, object: file:packages/canvas/src/engine/Canvas.ts#L42 }
  - { predicate: relates-to, object: rfc:feat-2026-08-14-renderer-as-dependency }
---

**Summary:** `import '@invana/canvas'` throws in Node before any user code runs.
`pixi-viewport@6.0.3` publishes no `exports` map, so Node resolves its `main` (a UMD
CommonJS bundle) while bundlers resolve `module` (real ESM). `sym:PixiRenderer` imports
`Viewport` **by name**, which only the ESM build provides — so every bundler-based check
passes and only plain Node fails.

| | |
|---|---|
| **What breaks** | Any pure-Node consumer of `pkg:@invana/canvas` — SSR, a Node script driving `io/` SVG or state export, a plain `node` test — at import time, even when it supplies its own renderer or never renders |
| **Root cause** | `pixi-viewport@6.0.3` ships `main` = UMD CJS, `module` = ESM, and **no `exports` map**; Node ignores `module`, so the named import `Viewport` is unresolvable |
| **Defect rows** | F1 |
| **Dressing rows** | F3 |
| **Open decisions** | None — D1, D2, D3 all accepted |

Row status: proposed 0 · accepted 0 · landed 4 · deferred 0 · rejected 0 · superseded 0

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| S1 | `import '@invana/canvas'` throws `SyntaxError: The requested module 'pixi-viewport' does not provide an export named 'Viewport'` before any user code runs | `node` against `file:packages/canvas/dist/index.js` | Reproduced 2026-09-10 while running V7 of `rfc:feat-2026-08-14-renderer-as-dependency` |
| S2 | The failure is unconditional — it fires even when the consumer passes their own `IRenderer` or never calls `init()` | same | `sym:Canvas` imports `sym:createDefaultRenderer` at module scope (`file:packages/canvas/src/engine/Canvas.ts#L42`), so the pixi graph loads on import |
| S3a | `pkg:@invana/graph` is affected too — it re-exports through `pkg:@invana/canvas`, so it inherits the throw. Found by F4's guard, not by hand | `file:packages/graph/dist/index.js` | `node scripts/check-node-import.mjs` before the fix: 3 of 5 barrels fail (`canvas`, `renderer-pixijs`, `graph`) |
| S3 | Every check in the repo is green: `pnpm build`, `pnpm check-types` (19/19), `pnpm test` (28/28), `pnpm check-boundaries`, and both smoke-tested stories render | CI + `story:graph-layouts/d3-force/CollisionDetection`, `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` | The repo has no check that imports a built package in plain Node — see D2 |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | `pixi-viewport` is simply a CommonJS package | **No** — it declares `"type": "module"` and ships a real ESM build at `dist/pixi_viewport.js` that exports `Viewport` by name | `node --input-type=module -e "import * as m from '…/dist/pixi_viewport.js'"` → `'Viewport' in m === true` |
| R2 | Bumping `pixi-viewport` picks up a fixed manifest | **No** — `6.0.3` is the latest published version | `npm view pixi-viewport versions` → `[…, 6.0.0, 6.0.1, 6.0.3]` |
| R3 | The default-import interop (`import pkg from 'pixi-viewport'; const { Viewport } = pkg`) fixes it | **No, and it would break the bundlers that work today** — the ESM build has **no default export** (16 named exports, `'default' in m === false`), so under Vite/Rollup `pkg` is `undefined` and `Viewport` is `undefined` | `node --input-type=module -e "import * as m from '…/pixi_viewport.js'; console.log('default' in m)"` → `false`. Recorded because this was the first fix proposed in chat and it is wrong |
| R4 | `rfc:feat-2026-08-14-renderer-as-dependency` introduced the defect | **No — it widened its reach.** The unresolvable named import predates it; that RFC changed it from *lazily reachable* (only on `init()` with no renderer) to *unconditional* (on import) | `sym:Canvas._resolveDefaultRenderer` was a `await import()` before `commit:fc8c46a3` |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D-1 | `pixi-viewport@6.0.3`'s manifest has `main: ./dist/pixi_viewport.umd.cjs`, `module: ./dist/pixi_viewport.js`, and **no `exports` field** | `node -p` on its `package.json` | Resolution is left to each consumer's algorithm rather than pinned by the package |
| D-2 | `module` is a bundler convention Node has never implemented. With no `exports` map, Node's ESM loader falls back to `main` | `require.resolve('pixi-viewport')` → `…/dist/pixi_viewport.umd.cjs` | **Node loads the UMD CommonJS build; bundlers load the ESM build.** The two disagree about what the module's named exports are |
| D-3 | Node cannot statically determine named exports of a CJS module. cjs-module-lexer fails on the UMD wrapper, so no named binding is created for `Viewport` | The thrown `SyntaxError` names `Viewport` specifically | A named import of `Viewport` is a link-time error in Node — thrown during module instantiation, before evaluation |
| D-4 | `file:packages/renderer-pixijs/src/renderer/PixiRenderer.ts#L20` imports it by name: `import { Viewport } from 'pixi-viewport'` | grep | The defect is latent in `pkg:@invana/renderer-pixijs` alone |
| D-5 | `tsup` externalizes everything in `dependencies` by default, so the published `file:packages/renderer-pixijs/dist/index.js` still carries the bare specifier `from 'pixi-viewport'` — the `external` array in `file:packages/renderer-pixijs/tsup.config.ts` only *adds* to that default | `grep -oE "from '…'" dist/index.js` → `@invana/canvas-core`, `@invana/canvas-store`, `pixi-viewport`, `pixi.js` | The resolution is deferred to the *consumer's* loader, so the package works under a bundler and fails under Node |
| D-6 | `file:packages/canvas/src/engine/Canvas.ts#L42` imports `sym:createDefaultRenderer` at module scope | `commit:fc8c46a3` | The latent defect becomes reachable from `import '@invana/canvas'` — exactly S1 and S2 |

**Why this and not something else:** the chain predicts a failure that is (a) a `SyntaxError` rather than a runtime `undefined`, (b) naming `Viewport` specifically, (c) thrown at import rather than at `init()`, and (d) invisible to every bundler-based check. All four match S1–S3.

### Confirming test

| Test | Action | Result | Inference |
|------|--------|--------|-----------|
| T1 | `node -e "import('…/packages/renderer-pixijs/dist/index.js')"` | Same `SyntaxError` | The defect is in `pkg:@invana/renderer-pixijs`, not `pkg:@invana/canvas` — confirms D-4 |
| T2 | `require.resolve('pixi-viewport')` from `pkg:@invana/renderer-pixijs` | `…/dist/pixi_viewport.umd.cjs` | Node picks `main`, not `module` — confirms D-2 |
| T3 | `import * as m` from the ESM build directly | `'Viewport' in m === true`, `'default' in m === false` | The ESM build is fine; only the *resolution* is wrong. Also rules out R3 |
| T4 | `require()` the UMD build | `typeof m.Viewport === 'function'` | The CJS build does carry `Viewport` — it is only unavailable to a *static named* import |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| `rfc:feat-2026-08-14-renderer-as-dependency` | relates-to | landed | Its row B7 records this blast radius; its V7 was blocked on this RFC and passes as of V2 here. Its decision DEC2 (module-scope import) is not re-litigated here |
| `doc:docs/renderer-split-design.md` | relates-to | current | The backend owns its drawing deps — that boundary is what makes F1 the right home for the fix |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | landed | `file:packages/renderer-pixijs/tsup.config.ts` | Add `noExternal: ['pixi-viewport']` so tsup inlines it | esbuild resolves `module` at **build** time and the published dist carries no bare `pixi-viewport` specifier, so no consumer loader ever has to choose. Fixes Node and leaves bundlers on the same ESM build they already get | **Medium** — cross-package, and it changes what `pkg:@invana/renderer-pixijs` ships. `pixi-viewport` (~40 KB) moves into the dist; a consumer that also depends on `pixi-viewport` directly would carry two copies. `pixi.js` stays external, so the singleton that actually matters is untouched | — |
| F2 | defect | landed | `file:packages/renderer-pixijs/package.json` | Move `pixi-viewport` from `dependencies` to `devDependencies` | Consistent with F1: once inlined it is a build-time input, not a runtime resolution consumers must satisfy | Low, but only correct **with** F1 — alone it breaks the runtime import | F1 |
| F3 | dressing | landed | `file:packages/canvas/tsup.config.ts` | Rewrite the `external` comment — it still says the backend is "an *optional peer*, resolved by a lazy import at runtime — never bundled" | Comment matches reality. **Does not affect behaviour**: tsup externalizes `dependencies` by default, so the entry stays external either way | Low | — |
| F4 | defect | landed | `file:scripts/check-node-import.mjs` (new) + root `lint` | Import each built engine barrel in a plain `node` subprocess and fail on throw; wire into `pnpm lint` beside `check-boundaries` | Closes the hole in S3 — this entire class of defect is invisible to bundler-based checks, which is why it shipped green | Low — new script, no source change. Requires `pnpm build` first, like `check-api-surface` | D2 |

**Not proposed, recorded deliberately:** reverting to the lazy import would hide S1 for consumers who pass their own renderer while leaving D-4 intact — the symptom would return the moment anyone called `init()` with no renderer. That is dressing sold as a fix; if it is wanted as a stopgap it gets its own row.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| B1 | `pkg:@invana/canvas` | The only in-repo consumer of `sym:createDefaultRenderer`; it is what surfaces the defect | **None** — no source change. Its dist stops throwing under Node |
| B2 | `pkg:@invana/canvas-react` | Re-exports capability probes (`sym:hasWebGPUApi`, `sym:canUseWebGPU`) from `pkg:@invana/renderer-pixijs` | **Low** — F1 changes packaging, not the export surface. `pnpm check-api-surface` covers it |
| B3 | `apps/storybook` | Bundles the backend through Vite today | **Low** — Vite already resolves the ESM build; after F1 it gets the same code inlined. V3 is the control |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|------------------|
| B4 | Published `@invana/renderer-pixijs` | Published API | Ships ~40 KB more; `pixi-viewport` leaves its `dependencies` (F2) | Release note. Same version lockstep as the rest |
| B5 | A consumer importing `pixi-viewport` directly alongside the backend | Runtime | Two `Viewport` classes in one app; `instanceof` across the boundary would fail | None in-repo — no package does this. Worth a release note |
| B6 | Serialised state, stories, docs | — | No change — packaging only, no spec or API surface touched | None |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | `node -e "import('…/packages/canvas/dist/index.js')"` | `pkg:@invana/canvas` | Resolves; no `SyntaxError` | F1, F2 |  <!-- 5/5 barrels clean -->
| V2 | pass | Re-run V7 of `rfc:feat-2026-08-14-renderer-as-dependency`: `Canvas.init({ renderer })` with a `sym:HeadlessRenderer` in plain Node | `pkg:@invana/canvas` | The supplied renderer is used and the default is never constructed | F1 |
| V3 | pass | **Control:** `pnpm --filter @canvas/storybook build`, then render `story:graph-layouts/d3-force/CollisionDetection` and `story:canvas-ui/apps/GraphCanvasApp/FullFeatured` | Storybook | Both still render (200 nodes; 77 nodes / 254 edges + minimap), no console errors — pan/zoom still works, which is what exercises `sym:Viewport` | F1, F2 |
| V4 | pass | `pnpm check-api-surface` | all engine barrels | Unchanged — F1 is packaging, not surface | F1, F2 |
| V5 | pass | `pnpm build && pnpm check-types && pnpm test && pnpm check-boundaries` | monorepo | All green | F1, F2, F3 |
| V6 | pass | `node scripts/check-node-import.mjs` against the tree **before** F1 | `pkg:@invana/canvas` | **Fails** — proves the new guard actually catches this defect rather than passing vacuously | F4 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D1 | How to resolve the interop? | **A)** `noExternal` — inline pixi-viewport at build time (F1) · **B)** deep-import the ESM build: `from 'pixi-viewport/dist/pixi_viewport.js'` · **C)** `pnpm patch` an `exports` map onto the dependency · **D)** upstream a PR adding `exports` | **A** — accepted. B pins an internal path no `exports` map protects, and breaks silently on any upstream reshuffle. C fixes only this workspace — published consumers still get the broken resolution, so it does not fix B4/B5. D is right long-term and worth doing anyway, but cannot gate our release: `6.0.3` is latest and the repo has no upstream cadence to wait on. Landed as F1; the built dist no longer carries a bare `pixi-viewport` specifier (`pixi.js` still external) | accepted |
| D2 | Add the Node-import guard (F4)? | **A)** Yes, in `pnpm lint` · **B)** No — rely on review | **A.** S3 is the argument: every existing check was green while the package was broken. A guard that costs one subprocess per barrel closes the class, not just the instance. Landed as F4; V6 ran it before F1 and it failed on 3 barrels, so it is not vacuous | accepted |
| D3 | Does anything actually consume the engine from plain Node today? | **A)** No — then this is latent and F4 matters more than F1 · **B)** Yes — SSR or a Node export script | **Unknown, and I did not find one in-repo.** Answering this sets the urgency but not the fix: `sym:HeadlessRenderer` and the renderer-free `io/` paths are advertised surfaces, so the promise exists whether or not it is currently exercised. **Answered:** no in-repo consumer found; F4 now guards the promise regardless of whether anyone exercises it today | accepted |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-09-10 | Found while running V7 of `rfc:feat-2026-08-14-renderer-as-dependency` | proposed | Not found by any existing check — see S3 |
| 2026-09-10 | RFC opened | proposed | Diagnosis confirmed by T1–T4. R3 records that the first fix proposed in chat (default-import interop) is wrong: the ESM build has no default export and it would break the bundlers that work today |
| 2026-09-10 | Approved and implemented | landed | F1-F4 landed. V6 run **before** F1 as designed: 3 of 5 barrels failed (`pkg:@invana/canvas`, `pkg:@invana/renderer-pixijs`, and `pkg:@invana/graph` — the third was not predicted, added as S3a). After F1 all 5 import cleanly and the built backend no longer carries a bare `pixi-viewport` specifier. V2 closes V7 of `rfc:feat-2026-08-14-renderer-as-dependency`. |
| 2026-09-10 | V3 control checked against a rebuilt pre-fix baseline | landed | Synthetic wheel/drag in the automation harness move neither zoom nor pan — **identically before and after F1**, so this is the harness, not a regression. Camera control was exercised instead through the story's own "Fit to content", which drives `sym:Viewport` and works post-fix. Both stories render unchanged; no console errors. |
