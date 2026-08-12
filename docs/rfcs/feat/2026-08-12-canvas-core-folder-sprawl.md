---
id: feat-2026-08-12-canvas-core-folder-sprawl
type: feat
title: canvas-core has 13 top-level folders + 4 loose root files — group them into 6 concerns
status: landed
opened: 2026-08-12
decided: 2026-08-12
landed: 2026-08-12
packages: [pkg:@invana/canvas-core]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-08-12-canvas-core-depends-on-the-kernel }
  - { predicate: relates-to, object: rfc:feat-2026-08-12-engine-package-structure }
---

# canvas-core folder sprawl

Two landings in one day moved modules *into* core without regrouping them: 13 top-level
folders + 4 loose root files. They are really **six concerns**. Internal-only change —
no external import site, subpath, or export name moves.

| | |
|---|---|
| Problem | `src/` = `abstracts` `animation` `contracts` `data` `events` `geometry` `headless` `port` `registries` `specs` `svg` `theme` `view` + `Camera.ts` `CanvasStore.ts` `frame.ts` `geom.ts` at root |
| Target | **6 folders + index.ts**, one per concern; zero loose root files |
| Blast radius | `canvas-core` internals + its tests + its two barrels only — every other package imports via `@invana/canvas-core` / `./specs`, both unchanged |
| Row status | rows: **landed 6** · verification: **pass 4** · decisions: 0 |

## 1 Target

```
packages/canvas-core/src/
├── index.ts
├── specs/          THE VOCABULARY (./specs subpath, unchanged name + entry)
│   └── + geom.ts   ← src/geom.ts — specs/geometry.ts already declares it canonical
├── state/          the state LANGUAGE (the machinery lives in canvas-store)
│   ├── CanvasStore.ts   ← root      the store interface
│   ├── frame.ts         ← root      FrameTick/FrameStats (the bus's tick payload)
│   ├── port/            ← src/port      ReactiveStore contract + select
│   ├── view/            ← src/view      CanvasView + createActions
│   ├── data/            ← src/data      ColumnStore · LayerData · DirtyBatcher · flush
│   ├── events/          ← src/events    bus + emitter classes
│   └── theme/           ← src/theme     resolved-theme signal
├── contracts/      the renderer seam (unchanged)
├── abstracts/      the extension-facing surface
│   ├── (Layer · Behaviour · Layout · CanvasContext · GestureArbiter — unchanged)
│   ├── Camera.ts        ← root      reached as ctx.camera; part of the same surface
│   └── registries/      ← src/registries  they manage the abstracts
├── lib/            pure helpers — spec in → path/markup/number out
│   ├── geometry/        ← src/geometry   connectors/ + badges/
│   ├── svg/             ← src/svg
│   └── animation/       ← src/animation
└── headless/       reference implementation (unchanged)
```

## 2 The change

| ID | Kind | Status | Move | Note | Risk |
|---|---|---|---|---|---|
| F1 | move | **landed** | `geom.ts` → `specs/geom.ts` | `specs/geometry.ts`'s "canonical home" comment finally true | low |
| F2 | move | **landed** | `CanvasStore.ts` · `frame.ts` · `port/` · `view/` · `data/` · `events/` · `theme/` → `state/` | siblings move together, so most intra-group relative imports survive verbatim | low |
| F3 | move | **landed** | `Camera.ts` · `registries/` → `abstracts/` | one folder = the whole `ctx` surface an extension programs against | low |
| F4 | move | **landed** | `geometry/` · `svg/` · `animation/` → `lib/` | pure functions, no state, no contracts | low |
| F5 | sweep | **landed** | fix relative imports inside core + `tests/` + the two barrels (`src/index.ts`, `src/specs/index.ts` untouched by name) | contained; `tsup` entries keep the same paths (`src/index.ts`, `src/specs/index.ts`) | low |
| F6 | docs | **landed** | `packages/canvas-core/CLAUDE.md` layout table; §4.0 tree in `rfc:feat-2026-08-12-engine-package-structure` gets a pointer note | — | low |

## 6 Verification

| ID | Status | Check | Expected |
|---|---|---|---|
| V1 | **pass** | `pnpm build` + `pnpm check-types` | pass; external packages untouched |
| V2 | **pass** | `pnpm check-boundaries` | pass (core-purity prefix unaffected) |
| V3 | **pass** | core + store + canvas vitest | 258 pass |
| V4 | **pass** | `@invana/canvas` public-surface diff | identical |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-12 | Opened from maintainer screenshot review ("why so many folders in core? group them") | proposed | — |
| 2026-08-12 | Implemented — all rows landed | **landed** | Verified: build 20/20 · check-types 19/19 · boundaries incl. `core-purity` · tests 258 (core 136 / store 91 / canvas 31) · purity grep = 0. External surface untouched by construction (both tsup entries kept their paths) |
