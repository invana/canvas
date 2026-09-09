---
id: release-0.0.12-checklist
type: checklist
status: open
opened: 2026-09-10
version: 0.0.12
previous: v0.0.11 (2026-07-06)
packages: [pkg:@invana/canvas-core, pkg:@invana/renderer-pixijs, pkg:@invana/canvas-telemetry-otel, pkg:@invana/canvas, pkg:@invana/graph, pkg:@canvas/docs]
relations:
  - { predicate: gates, object: tag:v0.0.12 }
  - { predicate: relates-to, object: rfc:fix-2026-09-10-renderer-preference-canvas-never-reaches-the-backend }
  - { predicate: relates-to, object: rfc:fix-2026-09-10-nested-app-shells-collide-on-panel-group-ids }
  - { predicate: relates-to, object: doc:SECURITY-AUDIT-2026-07-19.md }
---

# Release checklist — v0.0.12

**Summary:** the tree is mechanically green (§1) and the three documentation/config
blockers are now closed (B3·B4·B5 fixed 2026-09-10). What remains is **not code**: three
package names publish for the first time and the npm token must be able to create them
(B1), and the branch isn't `main` (B2). Rows are append-only; status is **per row**.

Row status: blockers open **2 (B1·B2)** · **fixed 3 (B3·B4·B5)** · should-fix open 6 (S3·S5·S8·S10·S11) · **fixed 5 (S1·S2·S4·S6·S7)** · S9 fixed upstream

**Note (2026-09-10):** a `chore(release): v0.0.12` commit (`eaccb62c`) already landed —
all 18 publishable `package.json`s are at `0.0.12` and `CHANGELOG.md` was regenerated —
but **no `v0.0.12` tag exists**. `release.sh` re-runs `npm version --allow-same-version`,
so the bump half is a no-op and the changelog is regenerated with the new `cliff.toml`.

---

## 1. Snapshot — what is already green

Measured 2026-09-10 on `feat/architecture-redesign` @ `298491d9`. Re-run before tagging (§4).

| ID | Check | Result | Evidence |
|----|-------|--------|----------|
| G1 | `pnpm build` | ✅ | 20/20 tasks incl. `@canvas/docs` + `@canvas/storybook` |
| G2 | `pnpm check-types` | ✅ | 19/19 packages |
| G3 | `pnpm lint` | ✅ | 0 errors, 112 warnings (unused `_ctx`/`_worldX` args, stale eslint-disables) |
| G4 | `pnpm test` | ✅ (narrow) | 369 tests, 38 files — `canvas-core` 136 · `canvas-store` 91 · `graph` 111 · `canvas` 31. **Only those four packages have tests at all**; five others pass vacuously via `--passWithNoTests` (S5) |
| G5 | `pnpm check-boundaries` | ✅ | renderer · state · immer · core-purity · backend-detach all clean |
| G6 | `pnpm check-api-surface` | ✅ | `canvas-core` · `canvas-store` · `canvas` surfaces unchanged |
| G7 | Node ESM import of built `dist/` | ✅ | canvas 162 exports · core 142 · store 103 · graph 92 — `rfc:fix-2026-09-10-importing-canvas-in-node-throws-on-pixi-viewport` holds |
| G8 | `pnpm pack` dep rewrite | ✅ | `workspace:*` → exact `0.0.12` (`@invana/graph` peer on `@invana/canvas`) |
| G9 | Publish metadata | ✅ | every publishable package has `license` · `description` · `files:["dist"]` · `exports` · `types` · `publishConfig.access:public` |

---

## 2. Blockers — must clear before `./release.sh 0.0.12`

| ID | Blocker | Status | Where | Do this | Why it blocks |
|----|---------|--------|-------|---------|---------------|
| B1 | **Three package names publish for the first time at 0.0.12** — `@invana/canvas-core`, `@invana/renderer-pixijs`, `@invana/canvas-telemetry-otel` are all 404 on npm | open | `file:.github/workflows/publish.yml#L47` | Confirm `NPM_TOKEN` can *create* new names under the `@invana` scope (`npm access` / a `--dry-run` publish of one new name), **before** tagging | `pkg:@invana/canvas@0.0.12` hard-depends on `canvas-core` + `renderer-pixijs`. `pnpm -r publish` is **not atomic**: a token that can update existing names but not create new ones lands `@invana/canvas@0.0.12` on npm pointing at two packages that do not exist — an unusable version that cannot be cleanly withdrawn |
| B2 | **Releases must be cut from `main`; HEAD is `feat/architecture-redesign`, 19 commits ahead** | open | `file:release.sh#L30-L34` | Merge the 19 commits to `main`, then cut from there | `release.sh` exits non-zero off `main` |
| B3 | **13 breaking commits since `v0.0.11`, and git-cliff has no breaking-change group** | ✅ **fixed 2026-09-10** | `file:cliff.toml#L52-L57` | Add a `commit_parsers` row (or `{ message = "!:", group = "…Breaking" }` ahead of the `^feat` row) so `!` commits surface in their own section; sanity-check `pnpm changelog` output. **Done:** a `{ message = '^[a-z]+(\([^)]*\))?!:', group = "<!-- 0 -->Breaking Changes" }` row now leads `commit_parsers`, the type rows renumbered 1–5 behind it. Rendering `git-cliff --tag v0.0.12` puts all 13 in a leading **Breaking Changes** section. Matching on `!:` rather than a `BREAKING CHANGE` body regex deliberately keeps `chore(release)` commits out (their footers summarise the breakage); they stay skipped. Side finding: only **2** commits in the range are non-conventional (`CanvasFilterView added`, `story(canvas-ui): …`) — the 89 parse-error skips are older history | Consumers upgrading 0.0.11 → 0.0.12 get no signal that `type` is now **required** on `GraphNode`/`GraphEdge`, that `ColorByBehaviour` renamed `'category'`→`'categorical'`, or that `graph-datasets` restructured. 0.x permits the breakage; hiding it is the defect |
| B4 | **`apps/docs` is wrong, not merely stale** — zero mentions of `canvas-core` or `renderer-pixijs` site-wide | ✅ **fixed 2026-09-10** | `file:apps/docs/guide/packages.md#L5-L6` · `file:apps/docs/guide/getting-started.md#L12-L19,L28,L64` | Correct three things at minimum: the "Skeleton packages … currently export `{}`" warning (false — `graph`, the layouts and `graph-datasets` all ship), the `@invana/canvas/primitives` subpath (**gone** — the exports map has only `.`), and `npm install @invana/canvas pixi.js` (pixi arrives via `renderer-pixijs`). Carry the ESM-only note from S7/`file:README.md` onto getting-started while rewriting it. **Done:** `file:apps/docs/guide/getting-started.md` rewritten — single-entry-point import table (no `/primitives`), `npm install @invana/canvas` alone with pixi arriving transitively through `pkg:@invana/renderer-pixijs`, the ESM-only support matrix carried over, the layer example moved to `this.surface.primitives` + paint-object `fill`, the renderer event corrected to `canvas:renderer:ready`, and a second track showing the React `<GraphCanvas>` path. `file:apps/docs/guide/packages.md` replaced wholesale — the false "skeleton packages export `{}`" warning and the per-export status tables are gone (they duplicate TSDoc and rot; root rule *don't hand-author API docs*), replaced by a choosing-what-to-install matrix plus a one-line-per-package map pointing at `/api/`. **API reference regenerated**: `typedoc.json` already globs `packages/*/src/index.ts`, so the five missing packages (`canvas-core`, `canvas-store`, `renderer-pixijs`, `canvas-telemetry-otel`, `canvas-designer`) now generate — 18 packages, up from 13. `file:apps/docs/CLAUDE.md` corrected too (it claimed `api/` was gitignored — it is committed — and pointed code samples at a `packages/canvas/src/primitives/index.ts` that no longer exists) | A new user following getting-started fails at import. This is the published site |
| B5 | **`README.md` + root `CLAUDE.md` describe an architecture that changed** | ✅ **fixed 2026-09-10** | `file:README.md#L32` · `file:CLAUDE.md#L39,L110` | Say `@invana/renderer-pixijs` is a **required `dependency`, statically imported** (`file:packages/canvas/src/engine/Canvas.ts#L42` — the change is deliberate, the comments say so); add the missing `@invana/canvas-core` / `@invana/canvas-store` rows to the README table (the `@invana/canvas-telemetry-otel` row landed with S4); move `GraphCanvasApp` + toolbars off the `canvas-react` row | Both docs claim "optional peer, resolved lazily" and "imports no drawing library". A consumer planning a renderer swap plans against a package layout that does not exist. **Done:** the optional-peer claim is corrected in **four** places — `file:README.md#L50`, `file:CLAUDE.md#L39` (workspace-map row + dep list), `file:CLAUDE.md#L118` (layering diagram), and `file:roadmap.md#L56,L91`, which carried the same falsehood and was outside the row's original scope. All now say *required `dependency`, imported at module scope*, and name `new Canvas({ renderer })` as the real swap seam. README gained `pkg:@invana/canvas-core` + `pkg:@invana/canvas-store` rows; the `canvas-react` row is now headless-only and `GraphCanvasApp` + toolbars moved to the `canvas-ui` row |

---

## 3. Should fix — re-verified against the code 2026-09-10

Every row below was checked in the source, not read off an RFC status field. `S2` is
**fixed**; `S4` is fixed (its question was settled by `D2`); the rest stand, with the fix effort named.

| ID | Item | Status | Verified how | Where it stands |
|----|------|--------|--------------|-----------------|
| S1 | `preference: 'canvas'` never reaches the backend; three declarations disagree | ✅ **fixed 2026-09-10** | Landed F1–F4; verified in a live browser | One declaration now — `sym:RenderPreference` in `file:packages/canvas-core/src/contracts/RendererInitOptions.ts`, re-exported by `pkg:@invana/canvas`, aliased by `pkg:@invana/renderer-pixijs`. The `'canvas'`→`'webgl'` rewrite is deleted and `'auto'` dropped (D2). **V3 evidence:** `preference: 'canvas'` mounts pixi's `CanvasRenderer` (`type 4`) with `IRenderer.backend === 'canvas'`; the no-preference control still resolves WebGPU. Surfaces regenerated (N1) |
| S2 | Nested app shells collide on panel-group ids | ✅ **fixed** | Read the *installed* `@invana/themes@0.0.23` dist | `dist/index.js#L569-L571` derives `ns = idPrefix ?? \`app-v2-${useId()}\`` and routes every group **and** panel id through `panelId(name)`. The remaining `main-layout` / `editor-horizontal` strings are suffix arguments, not ids. Every workspace package declares `^0.0.23` and the lockfile has no `0.0.22` (the `0.0.22` folder in the pnpm store is a stale worktree leftover). RFC `V1`–`V5` all `pass`. Only `F5` (a `layoutIdPrefix` pass-through on `sym:GraphCanvasApp`) is outstanding, and it is `deferred` by decision — needed only for *stable* ids |
| S3 | `measureLabelContent` allocates a `TextStyle` per call | open — **by decision** | Read the call site | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L104-L110` still builds `new TextStyle(...)` inline. Perf-only, no wrong result, and the RFC's `D2` deliberately holds "is this worth landing at all?" open pending measurement. Not a release concern |
| S4 | `@invana/canvas-telemetry-otel` ships undocumented | ✅ **fixed** (docs only) | Grepped usage; re-read `file:packages/canvas-telemetry-otel/src/index.ts` | It is a **real, consumed package**: imported by `story:canvas-react/Canvas/WithTelemetry` + `…/GraphCanvas/WithTelemetry`, declared in `file:apps/storybook/package.json#L20`, and referenced from the TSDoc of `sym:CanvasStore`, `sym:Canvas` and `sym:GraphCanvasApp`. **Documented 2026-09-10** (D2): workspace-map row + layering-diagram branch + the vendor-free-kernel note on the telemetry bullet in `file:CLAUDE.md`; a packages-table row in `file:README.md`; a new `file:packages/canvas-telemetry-otel/CLAUDE.md` (why it is a separate package · the OTLP/HTTP + CORS-safe-headers + singleton-provider + delta-temporality constraints · deps · the two stories); and `file:roadmap.md` flipped "OpenTelemetry over state mutations" 📋 → ✅ (it ships). **Deliberately not covered:** `apps/docs` (B4 rewrites those pages wholesale), a `check-boundaries` row pinning `@opentelemetry/*` to this package (code — see the new `D4`), and the duplicate tracer the docs turned up in `apps/` (new `S11`) |
| S5 | Zero tests across half the publishable surface | open — cannot close pre-release | Counted test files | `canvas-core` 14 · `canvas-store` 14 · `graph` 7 · `canvas` 3 — and **zero** in `renderer-pixijs` (1.4 MB dist), `canvas-react`, `canvas-ui`, `canvas-designer`, `canvas-telemetry-otel`, every layout and every layer package. **New nuance:** five packages run `vitest run --passWithNoTests`, so part of G4's "28 successful tasks" is a vacuous pass — the green is narrower than the task count suggests |
| S6 | Missing `package.json` fields | ✅ **fixed** | Re-checked all 18, then patched them | `homepage` · `bugs` · `repository` (with `directory`) · `author` · `sideEffects: false` added to **all 18 publishable** `package.json`s; the 4 private ones (`@repo/*`, `@canvas/*`) left alone. Field shape follows the sibling design-kit (`@invana/ui@0.0.23`). `sideEffects: false` confirmed safe by re-grep — no CSS import and no bare `import 'x';` anywhere in `packages/*/src`. Verified: all 18 carry the fields, each `repository.directory` matches its own path, and `npm pack --dry-run` in `pkg:@invana/canvas-core` still resolves |
| S7 | ESM-only, no `require` condition | ✅ **fixed 2026-09-10** (docs only) | Re-read every `exports` map + `tsup.config.ts`; **ran** `require()` against the built `dist/` on Node 24 | All **17 publishable** packages are `"type": "module"`, `format: ['esm']`, `{types, import, default}` — no `require` condition (the 18th map, `pkg:@repo/eslint-config`, is private and a different shape). Two things the row had wrong, corrected by measurement: it is **not inherited** (`pixi.js@8.20.1` publishes both conditions, so ESM-only is our choice), and `require()` does **not** hard-fail — the `default` condition resolves to the ESM file and Node ≥20.19/≥22.12 loads it via `require(esm)` (`require('@invana/canvas')` → 162 exports, `canvas-core` 142, `canvas-store` 103 on Node 24). It breaks only on Node 18–20.18/22.0–22.11 (`ERR_REQUIRE_ESM`) or a CJS-emitting build. **Kept** (D5) and **documented** — a *Module format — ESM only* section in `file:README.md` with that support matrix and the dual-package-hazard reason. **Not covered:** `apps/docs` (B4 rewrites getting-started wholesale and should carry the same line) |
| S8 | Security S1/S2 open | **split** | Read the workflow | **S8a (npm-side, blocks nothing here):** `file:.github/workflows/publish.yml#L52` still uses a standing `NODE_AUTH_TOKEN`; `id-token: write` + `--provenance` are already wired, so the switch is configuration on npmjs.com, not code. **S8b (in-repo, mechanical):** all 9 `uses:` across both workflows are tag-pinned (`actions/checkout@v6`, `softprops/action-gh-release@v2`, …), not SHA-pinned — the audit records this as accepted by preference |
| S9 | `CLAUDE.md` claims `canvas-store` is the only home of `rbush` | ✅ **fixed** (commit `3659627a`) | Read both sides | `file:CLAUDE.md#L99` vs `file:packages/graph/src/behaviours/LabelCollisionBehaviour.ts#L42`, where `pkg:@invana/graph` imports `RBush` as a direct dependency. `file:scripts/check-renderer-boundary.mjs` **permits** it (the `core-purity` row restricts core only), so the code is right and the prose is wrong |
| S10 | Root rule 10 says "do not write tests for `packages/canvas`" — there are three | open — **decide which is right** | Listed them | `file:packages/canvas/tests/layers/WorldLayer.test.ts` · `engine/assertSerialisable.test.ts` · `engine/Canvas.smoke.test.ts`, and its `test` script is plain `vitest run` (no `--passWithNoTests`). Same shape as S9: either the rule has been superseded in practice and should say so, or the tests are strays |
| S11 | A second, hand-rolled OTel tracer lives in `apps/` | open — **not a release item** (private app) | Grepped `@opentelemetry` across `packages/` + `apps/` while writing the S4 docs | `file:apps/storybook/stories/canvas-store/otel.ts` builds its own `WebTracerProvider` + OTLP/HTTP exporter for `story:canvas-store/Playground`, and its header still claims it is "the concrete OTel adapter the kernel deliberately does not ship" — true when written, false since `pkg:@invana/canvas-telemetry-otel` landed. Same six `@opentelemetry/*` deps duplicated in `file:apps/storybook/package.json#L33-L38`. It only injects a bare `Tracer` (no metrics/logs), so `otelTelemetry({ traces: true, console: true })` covers it. Collapsing it is a **story** change — root rule 11, ask first |

## 4. Pre-tag verification — re-run on `main` after B1–B5

| ID | Check | Command | Status |
|----|-------|---------|--------|
| V1 | Clean tree on `main` | `git status --porcelain` (must be empty) | pending |
| V2 | Full build | `pnpm build` | pending |
| V3 | Types | `pnpm check-types` | pending |
| V4 | Lint + boundaries + API surface | `pnpm lint` | pending |
| V5 | Tests | `pnpm test` | pending |
| V6 | Node ESM import smoke of built `dist/` (the control that works today — G7) | `node -e "import('./packages/canvas/dist/index.js')"` | pending |
| V7 | Changelog shows a breaking-change section (covers B3) | `pnpm exec git-cliff --tag v0.0.12 \| head -60` | **pass on branch** 2026-09-10 — 13 rows under **Breaking Changes**; re-run on `main` |
| V8 | New names are creatable (covers B1) | `npm publish --dry-run` in `packages/canvas-core` | pending |
| V9 | Live Storybook smoke in a **visible** tab (background tabs suspend rAF) | `pnpm --filter @canvas/storybook dev` | pending |

---

## 5. Release sequence

| # | Step | Gated by |
|---|------|----------|
| 1 | Verify npm can create the three new names | B1 / V8 |
| 2 | ~~Land or delete the renderer-preference option~~ — **done 2026-09-10** | S1 ✅ |
| 3 | ~~Add breaking-change grouping to `cliff.toml`~~ — **done 2026-09-10** | B3 ✅ |
| 4 | ~~Correct `README.md` + `CLAUDE.md` on the renderer dependency; add the missing package rows~~ — **done 2026-09-10** (+ `roadmap.md`) | B5 ✅ |
| 5 | ~~Correct `apps/docs` getting-started + packages pages~~ — **done 2026-09-10** (+ API reference regenerated for all 18 packages) | B4 ✅ |
| 6 | Merge to `main` | B2 |
| 7 | Re-run V1–V9 on `main` | §4 |
| 8 | `./release.sh 0.0.12` → `git push origin main --follow-tags` | all |

---

## 6. Decisions

| ID | Question | Decision | Date |
|----|----------|----------|------|
| D1 | Is 0.0.12 the right number for 13 breaking commits? | Yes — 0.x, lockstep across all packages, and `release.sh` assumes it. The fix is B3 (surface the breakage), not a bigger number | 2026-09-10 |
| D2 | Ship `@invana/canvas-telemetry-otel` in this cut? | **Yes** — it is already imported by two stories and named in three packages' TSDoc; hiding it would break `@canvas/storybook`. Document it instead (S4, folded into B5) | 2026-09-10 |
| D3 | Block the release on S1 (dead `'canvas'` preference)? | **Open** — step 2 assumes yes | — |
| D4 | Pin `@opentelemetry/*` to `pkg:@invana/canvas-telemetry-otel` with a `check-boundaries` row, the way `renderer` / `state` are pinned? | **Open** — after S4 the invariant exists only as prose in `file:CLAUDE.md` + the package `CLAUDE.md`, which is exactly how the `state` boundary drifted before. Cheap (one `BOUNDARIES` row + one `no-restricted-imports` entry) but it is a code change, so it stayed out of the S4 doc fix | — |
| D5 | Dual-publish a CJS build (`require` condition) at 0.0.12? | **No — stay ESM-only and say so.** Not inherited (`pixi.js@8.20.1` ships both conditions), so it is a choice: the stack targets the browser and WebGPU, Node 20.19+/22.12+ can `require()` ESM, and every bundler handles it. A second build across 17 lockstep packages would also mean a consumer mixing `require` and `import` gets **two copies** of the registries and the spec store. Revisit only if a real CJS consumer appears (S7) | 2026-09-10 |

---

## 7. History

| Date | Change |
|------|--------|
| 2026-09-10 | Opened. Snapshot G1–G9 measured on `feat/architecture-redesign` @ `298491d9`; blockers B1–B5 and should-fix S1–S9 recorded |
| 2026-09-10 | §3 re-verified row-by-row against the source. **S2 confirmed fixed** in the installed `@invana/themes@0.0.23`. S4 settled (ship + document). S1 strengthened — pixi 8.20.1 does accept `'canvas'`. New rows: S10 (rule 10 vs three `packages/canvas` tests) and the `--passWithNoTests` nuance on G4/S5 |
| 2026-09-10 | New row **S11** — writing the S4 docs turned up a second OTel tracer hand-rolled in `story:canvas-store/Playground`, duplicating `sym:otelTelemetry` |
| 2026-09-10 | **S7 fixed** (docs only) — ESM-only kept by decision `D5`; a *Module format — ESM only* section added to `file:README.md`. Verified `pixi.js@8.20.1` is dual-published (the constraint is ours, not inherited) and that `require()` of the built `dist/` **succeeds** on Node 24 via `require(esm)` — so the row's "CJS consumers are surprised" framing narrowed to Node <20.19/<22.12 and CJS-emitting builds. `apps/docs` left to B4 |
| 2026-09-10 | **S4 fixed** — `pkg:@invana/canvas-telemetry-otel` documented: `file:CLAUDE.md` (workspace map · layering diagram · the kernel telemetry bullet), `file:README.md` packages table, a new package `CLAUDE.md`, and `file:roadmap.md` (📋 → ✅). B5 narrowed to the two remaining README rows + the renderer-dependency wording. New decision `D4` — should a boundary row enforce the OTel invariant? |
| 2026-09-10 | **S6 landed** — publish metadata (`homepage`/`bugs`/`repository`/`author`/`sideEffects: false`) added to all 18 publishable `package.json`s. Side effect of rewriting the JSON: `\uXXXX` escapes in a few `description` fields are now literal UTF-8 (em dash, `é`) — same value, and consistent with the rest of the repo |
| 2026-09-10 | **API-reference churn removed** — `disableSources: true` in `file:apps/docs/typedoc.json`. TypeDoc was baking the current commit SHA into every "Defined in" line (`blob/<40-char sha>/…`): **3,642 such lines across 684 files**, generated at `ee4faae6` while HEAD had moved to `0321fdbb`, so every regeneration rewrote all of them with zero API change — noise that buries real surface movement exactly when cutting a release. Output is now **deterministic** (two consecutive runs byte-identical; `find api -name '*.md' | xargs cat | shasum` matches), so `api/` changes only when the API does. Trade-off accepted: no click-through to source. Rationale recorded in `file:apps/docs/CLAUDE.md` so it is not reverted. Alternatives considered and not taken: pin `gitRevision: "main"` (links drift to wrong lines), or stop tracking `api/` entirely (viable — nothing in CI consumes it, `file:.github/workflows/publish.yml#L40` builds with `--filter=!@canvas/docs`) |
| 2026-09-10 | **B3 · B4 · B5 fixed** — the three documentation/config blockers. `cliff.toml` gained a leading breaking-change parser (13 commits now surface); `README.md` + `CLAUDE.md` + `roadmap.md` corrected on the renderer dependency (required, module-scope — not an optional lazy peer) with the missing `canvas-core` / `canvas-store` rows added and the react/ui split fixed; `apps/docs` getting-started + packages pages rewritten against the real API and the TypeDoc reference regenerated for all 18 packages (was 13). **Verified:** both new code samples typechecked against the *built* packages under `apps/storybook`'s tsconfig (engine track + React track, `tsc --noEmit`, 0 errors) and `pnpm --filter @canvas/docs build` completes. Also recorded: the `v0.0.12` version bump already landed as `eaccb62c` with no tag, and `S9` was fixed upstream by `3659627a`. **Remaining blockers are not code — B1 (npm can create the three new names) and B2 (merge to `main`)** |
| 2026-09-10 | **S1 fixed.** F1–F4 of `rfc:fix-2026-09-10-renderer-preference-canvas-never-reaches-the-backend` landed and the RFC closed; `'canvas'` reaches pixi's real `CanvasRenderer`, confirmed in a live browser. `CLAUDE.md` gained the `canvas-telemetry-otel` row (half of S4) |
