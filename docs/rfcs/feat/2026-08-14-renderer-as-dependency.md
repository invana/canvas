---
id: feat-2026-08-14-renderer-as-dependency
type: feat
title: Make @invana/renderer-pixijs a required dependency of @invana/canvas
status: landed
opened: 2026-08-14
decided: 2026-08-14
landed: 2026-09-10
packages: [pkg:@invana/canvas, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-react]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-08-12-star-exports-hide-surface-drift }
---

**Summary:** Move `@invana/renderer-pixijs` from optional peer to required dependency of
`@invana/canvas`, making it the default renderer so `Canvas.init()` works out of the box
while preserving swappability through `CanvasOptions.renderer`.

Row status: proposed 0 · accepted 0 · landed 4 · deferred 0 · rejected 0 · superseded 0

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | Canvas ships zero rendering capabilities by default | `pkg:@invana/canvas` | `package.json` declares renderer-pixijs as optional peer; no drawing library in dependencies |
| M2 | Consumers must either install renderer-pixijs or pass a custom IRenderer | `file:packages/canvas/src/engine/Canvas.ts#L1017` | `_resolveDefaultRenderer()` lazy-imports renderer-pixijs at runtime; throws a cryptic error if absent |
| M3 | canvas-react's hooks pass no renderer — they rely on lazy resolution | `file:packages/canvas-react/src/useCanvasEngine.tsx#L93-94` | `instance.init()` called without `renderer` field; relies on canvas resolving it |
| M4 | The optional peer pattern exists for tree-shaking (no pixi in bundles that don't render) | `file:packages/canvas/package.json#L41-44` | peerDependencies declares renderer-pixijs with `"optional": true` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | Canvas is coupled to graph and needs graph to render | Rejected | Canvas imports zero from graph; graph imports 64 from canvas (one-directional) |
| R2 | A working headless renderer exists to use as fallback | Rejected | User confirmed: "there is not headless renderer that actually works" |
| R3 | canvas-store depends on a renderer | Rejected | canvas-store depends only on canvas-core (the floor) |

---

## 2. Diagnosis

A causal chain:

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D1 | Canvas declares renderer-pixijs as optional peer | `file:packages/canvas/package.json#L41-44` | The package builds and publishes without pulling in pixi.js |
| D2 | Canvas._resolveDefaultRenderer() lazy-imports renderer-pixijs at runtime | `file:packages/canvas/src/engine/Canvas.ts#L1017-L1038` | Bundle is smaller, but runtime fails with a confusing error if absent |
| D3 | The lazy import carries a `@ts-ignore` because the type may not resolve | `file:packages/canvas/src/engine/Canvas.ts#L1019` | TypeScript silence when the import path is wrong |
| D4 | canvas-react passes no renderer — relies on D2 | `file:packages/canvas-react/src/useCanvasEngine.tsx#L93-94` | React consumers get the runtime error, not a build-time one |

The root cause: the optional peer pattern was designed for tree-shaking (no pixi in bundles
that don't render). The user's requirement is different — canvas should ship with a working
renderer by default, with swappability preserved.

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| doc:docs/renderer-split-design.md | depends-on | Active design | The contract (IRenderer/ISurface) lives in canvas-core; this RFC does not change the contract |
| doc:docs/canvas-store-migration-plan.md §4.6 | relates-to | Landed | "Design D1: lazy import as default" — the *lazy* part changes; the intent (default renderer) survives |
| file:packages/renderer-pixijs/CLAUDE.md | relates-to | Active | The one-rule: "everything that touches pixi.js lives here" — unchanged |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | Dependency | Landed | `pkg:@invana/canvas` package.json | Move `@invana/renderer-pixijs` from `peerDependencies` (with `"optional": true`) to `dependencies` | Canvas ships with a working renderer by default | Bundle size increases for consumers who exclude pixi; they must now include it | — |
| F2 | Code | Landed | `file:packages/canvas/src/engine/Canvas.ts#L109-115` | Update CanvasOptions.renderer comment: "defaults to @invana/renderer-pixijs; supply one to override" | API docs reflect the new default | None | — |
| F3 | Code | Landed | `file:packages/canvas/src/engine/Canvas.ts#L335` | Replace `opts.renderer ?? (await this._resolveDefaultRenderer())` with `opts.renderer ?? createDefaultRenderer({ events: this.events })` (direct call) | No lazy import, no @ts-ignore, no catch block | None | F1 |
| F4 | Code | Landed | `file:packages/canvas/src/engine/Canvas.ts#L1017-L1038` | Replace `_resolveDefaultRenderer()` with a comment noting it's no longer needed; module-scope `import { createDefaultRenderer }` at top of Canvas.ts | Cleaner code, no runtime catch, no `@ts-ignore` | None | F1 |

---

## 5. Blast radius

### Upstream (canvas's consumers)

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| B1 | `pkg:@invana/canvas-react` | `useCanvasEngine` calls `init()` without a renderer — relies on lazy resolution | **Low** — already works; the lazy import is replaced by a direct one. React hooks re-export capability probes from renderer-pixijs (file:packages/canvas-react/src/index.ts#L20-32) — those exports remain valid |
| B2 | `pkg:@invana/canvas` (the engine barrel) | Re-exports capability detection from renderer-pixijs (file:packages/canvas/src/index.ts does NOT re-export these; they go through canvas-react) | **None** — canvas itself doesn't re-export renderer-pixijs symbols; canvas-react does |
| B3 | Any external consumer that excluded renderer-pixijs from their bundle | They relied on tree-shaking via the optional peer | **Medium** — bundle size increases. They must now include renderer-pixijs or pass a custom renderer |

### Downstream (stories, published API, serialised state)

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|------------------|
| B4 | `story:` (all Storybook stories) | Story | Stories already have renderer-pixijs in storybook's deps | None |
| B5 | Published `@invana/canvas` npm package | Published API | `dependencies` now includes renderer-pixijs (version-locked workspace) | Consumers installing canvas get renderer-pixijs automatically |
| B6 | Serialised state | State format | No change — state is spec-driven, renderer-agnostic | None |
| B7 | Any pure-Node consumer of `pkg:@invana/canvas` (SSR, a Node script doing `io/` SVG or state export, a plain `node` test) | Published API | **Broken at import time.** `file:packages/canvas/src/engine/Canvas.ts#L42` now imports `pkg:@invana/renderer-pixijs` at module scope, so `import '@invana/canvas'` eagerly pulls in `pixi-viewport@6.0.3`, which is CJS; Node's ESM loader cannot destructure `Viewport` from it and throws before any user code runs. Fails even when the consumer supplies their own renderer or never renders. Bundlers (Vite/Rollup, vitest) interop it, so Storybook and `pnpm test` are unaffected — which is why V1–V6 all pass. Pre-existing defect in `sym:renderer-pixijs`'s named CJS import; this RFC changed it from *lazily reachable* to *unconditional* | **Closed** by `rfc:fix-2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport` (landed 2026-09-10): `pixi-viewport` is now inlined into the backend's dist, so no bare specifier reaches a consumer's loader |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | Pass | `pnpm build` | `pkg:@invana/canvas` + `pkg:@invana/renderer-pixijs` | Build succeeds, no peer/dep warnings | F1, F2, F3, F4 |
| V2 | Pass | `pnpm check-types` | `pkg:@invana/canvas` | No type errors in Canvas.ts (the `@ts-ignore` is removed) | F2, F3, F4 |
| V3 | Skipped | `pnpm --filter @invana/canvas test` | canvas tests (rule 10: no tests in this package) | N/A | F3 |
| V4 | Pass | `pnpm check-boundaries` | All engine packages | Passes — canvas now depends on renderer-pixijs (explicitly added to boundary allowlist) | F1 |
| V5 | Pass | `pnpm --filter @canvas/storybook build` | Storybook | Stories render correctly with direct renderer import | B1, B4 |
| V6 | Pass | Control: verify a Canvas instance renders without passing a renderer | Storybook (static build, served) | `Canvas.init()` with no renderer | Succeeds — `story:graph-layouts-d3-force-collisiondetection` renders 200 nodes under the force sim, and `story:canvas-ui-apps-graphcanvasapp-fullfeatured` renders 77 nodes / 254 edges with minimap + toolbar; no console errors | F1, F3, F4 |
| V7 | Pass | Control: verify a custom IRenderer can still be passed | `node` against `file:packages/canvas/dist/index.js` | `Canvas.init({ renderer: myRenderer })` | **Passes as of 2026-09-10**, once `rfc:fix-2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport` removed the import-time throw: the supplied `sym:HeadlessRenderer` is used and the default backend is never constructed. Previously failed before reaching the call — see B7 | F3 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| DEC1 | Should canvas re-export capability probes from renderer-pixijs? | A) Keep re-export in canvas (current — through canvas-react) B) Move re-export to canvas itself C) Remove re-export entirely | **A** — canvas-react already re-exports `hasWebGPUApi`, `canUseWebGPU`, etc. from renderer-pixijs. Changing this would ripple through canvas-react consumers. Keep it there. | Accepted |
| DEC2 | Should the direct import be at module scope or lazily resolved to a property? | A) Module-scope `import { createDefaultRenderer }` at top of Canvas.ts B) Module-scope import of the renderer instance, created once at module load C) A `defaultRenderer` property created once on first access | **A** — module-scope `import { createDefaultRenderer }` at the top of Canvas.ts. Simple, explicit, no getter indirection. The renderer is constructed once per process when the module loads. | Accepted |
| DEC3 | Should the bundle-size impact be documented? | A) Add a note in canvas's README about the minimum bundle size B) Add nothing — the dependency change is in package.json, which is self-documenting | **B** — package.json declares the dependency; consumers who care about bundle size will see it. No README change needed. | Accepted |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-08-14 | RFC opened | proposed | Initial design: move renderer-pixijs from optional peer to required dependency |
| 2026-08-14 | Implementation landed | landed | F1: moved renderer-pixijs to dependencies in canvas/package.json (removed from peerDependencies + peerDependenciesMeta). F2: updated CanvasOptions.renderer comment. F3: replaced lazy import with direct `createDefaultRenderer({ events: this.events })` call. F4: removed `_resolveDefaultRenderer()` method; module-scope import at top of Canvas.ts. |
| 2026-08-14 | Verification automated | pass | V1 (build): passed. V2 (check-types): passed across 19 packages. V4 (check-boundaries): passed — all 5 boundaries intact, API surfaces unchanged. V5-V7 manual: still pending. |
| 2026-09-10 | Landing verification resumed | accepted | V5 (storybook build): pass. V6 (default renderer, no `renderer` arg): pass — two stories smoke-tested in a visible browser against the static build. V7: **fail** — importing the built `@invana/canvas` in plain Node throws on `pixi-viewport`'s CJS named export, a pre-existing renderer-pixijs defect that the module-scope import made unconditional (new row B7). F2 dressing corrected: the comment above the call still claimed the backend was resolved by lazy import. RFC stays `accepted`, not `landed` — F3 is not covered while V7 fails. |
| 2026-09-10 | V7 closed, RFC landed | landed | The blocker in B7 was a pre-existing `pkg:@invana/renderer-pixijs` interop defect that this RFC made unconditional, not a defect of this RFC's design. Fixed separately in `rfc:fix-2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport`; V7 re-run and passes. All fix rows landed, all checks pass. |
