---
id: feat-2026-08-13-backends-still-depend-on-the-engine
type: feat
title: renderer-pixijs and the layout packages still peer on @invana/canvas — detach them onto canvas-core
status: landed
opened: 2026-08-13
decided: 2026-08-13
landed: 2026-08-13
packages: [pkg:@invana/renderer-pixijs, pkg:@invana/graph-layout-d3-force, pkg:@invana/graph-layout-d3-hierarchy, pkg:@invana/graph-layout-d3-sankey, pkg:@invana/graph-layout-elkjs, pkg:@invana/graph-layout-geometric, pkg:@invana/canvas]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-08-12-canvas-core-depends-on-the-kernel }
  - { predicate: relates-to, object: rfc:feat-2026-08-11-canvas-core-structure }
---

# Backends still depend on the engine

`canvas-core` exists precisely so a backend or extension depends on a small frozen package —
but `renderer-pixijs` and all five layout packages still peer on the whole engine and import
through its barrel. Cash it in: repoint their imports, swap the peers, and make the detachment
a **boundary row** so it can't regress. This executes the acceptance test written in
`rfc:feat-2026-08-11-canvas-core-structure` (`grep "@invana/canvas'" packages/renderer-pixijs/src` → 0).

| | |
|---|---|
| Problem | `pkg:@invana/renderer-pixijs` (37 files) + `graph-layout-*` import from `@invana/canvas`, whose surface is 389 exports of mostly orchestrator; everything they actually use is core (specs, contracts, `Layer`/`Layout`, geometry) or store (`HitGeometrySource` et al) |
| Out of scope | `pkg:@invana/graph` — it *legitimately* needs the engine (`GraphCanvas` constructs `Canvas`; `GraphLayer extends WorldLayer`); it stays peered on `@invana/canvas` |
| Payoff | a `renderer-threejs` (or new layout package) builds against `canvas-core` + `canvas-store` only; the engine can churn without touching backends |
| Row status | rows: **landed 5** · verification: **pass 5** · decisions: 0 |

## 4 The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| R1 | sweep | **landed** | `packages/renderer-pixijs/src` (37 files) | `from '@invana/canvas'` → `from '@invana/canvas-core'`; the picking seam names (`HitGeometrySource`, `HitPolyline`, …) → `from '@invana/canvas-store'` (they live with the rbush index) | acceptance grep → 0 | low — same underlying modules, source swap only | — |
| R2 | deps | **landed** | `packages/renderer-pixijs/package.json` (+ tsup externals) | peer `@invana/canvas` → `@invana/canvas-core` (keep `@invana/canvas-store`); devDeps mirrored | the backend's contract dependency is the frozen floor | medium — peer change is consumer-visible at install | R1 |
| R3 | sweep | **landed** | `graph-layout-{d3-force,d3-sankey}` (+ audit the other three) | `Layout` / `LayoutOptions` / context types → `@invana/canvas-core`; if a package ends with zero engine imports, swap its `@invana/canvas` peer → `@invana/canvas-core` | layout packages extend the abstracts, not the engine | low | — |
| R4 | pin | **landed** | `file:scripts/check-renderer-boundary.mjs` | new `backend-detach` row: `@invana/canvas` may not be imported under `packages/renderer-pixijs/src` or `packages/graph-layout-*/src` | the acceptance test becomes permanent, not a one-time grep | low | R1, R3 |
| R5 | docs | **landed** | `packages/renderer-pixijs/CLAUDE.md`, root `CLAUDE.md` dependency graph + workspace rows | peers read canvas-core; "implements the contract from `@invana/canvas-core`" without the re-export hedge | docs match the layering | low | R2, R3 |

## 6 Verification

| ID | Status | Check | Expected |
|---|---|---|---|
| V1 | **pass** | `grep -rn "@invana/canvas'" packages/renderer-pixijs/src packages/graph-layout-*/src` | **0 import hits** |
| V2 | **pass** | `pnpm build` + `pnpm check-types` | pass — incl. the storybook static build (bundles every story against the new import graph) |
| V3 | **pass** | `pnpm check-boundaries` with R4 | pass; mutation: a canvas import in pixi fails |
| V4 | **pass** | root `pnpm test` | 28/28 |
| V5 | **pass** | `pnpm check-api-surface` | the three pinned surfaces unchanged |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-13 | Opened; maintainer pre-approved via "fix them all" (the option list named this repoint) | proposed | — |
| 2026-08-13 | Implemented — all rows landed | **landed** | The picking-seam names (`PickingIndex`, `HitGeometrySource`, `*HitRecord`) were the only store-owned imports in pixi, exactly as designed; every other symbol resolved from core on the blanket repoint. All five layout packages type-check with `canvas-core` peers (the three OneShot-based ones had zero engine imports already). `backend-detach` also forbids the store/core from importing the engine — the row reads "the engine may only be imported above it" |
