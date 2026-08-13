---
id: feat-2026-08-12-star-exports-hide-surface-drift
type: feat
title: Star exports hide public-surface drift — pin the surface with a snapshot check, not by expanding the stars
status: landed
opened: 2026-08-12
decided: 2026-08-12
landed: 2026-08-12
packages: [pkg:@invana/canvas-core, pkg:@invana/canvas-store, pkg:@invana/canvas]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-08-12-canvas-core-depends-on-the-kernel }
---

# Star exports hide surface drift

The barrels keep one `export *` each (the spec vocabulary — wholesale by design). The risk
isn't the star itself; it's that **surface changes ride through it with no reviewable diff**.
Fix the reviewability with a generated surface snapshot (the `check-boundaries` pattern),
keep the star, and de-duplicate the names that currently reach a barrel by two routes.

| | |
|---|---|
| Problem | `export * from …/specs` in three barrels means adding one type to `file:packages/canvas-core/src/specs/shape.ts` silently grows three public APIs; some names (`Point`, `Rect`, …) also arrive twice per barrel (explicit **and** star — explicit silently wins) |
| Non-goal | Expanding the star into ~150 named exports ×3 barrels — three hand-kept copies of one vocabulary is guaranteed drift; the curation point stays `file:packages/canvas-core/src/specs/index.ts` |
| Ranked `export *` risks | **(1)** two stars in one barrel → colliding names **silently omitted** (impossible today: one star per barrel — F3 keeps it that way) · **(2)** star-vs-explicit collision → explicit silently wins (happening benignly: `Point`/`Rect` — F2 removes it) · **(3)** invisible surface drift (the real problem — F1 solves it) |
| Row status | rows: **landed 3** · verification: **pass 4** · decisions: accepted 1 (D-1: the three engine barrels) |

## 2 Design

| Step | Mechanism | Consequence |
|---|---|---|
| G1 | The guarantee people want from named exports is a **reviewable surface diff**, not the names themselves | Generate the diff instead of hand-writing the names: snapshot the built `.d.ts` export list per package, fail `lint` when it changes |
| G2 | One vocabulary, one curation point, one star per barrel | The specs barrel stays the single source of truth; mirrors stay `export *`; a second star in any barrel is banned (risk 1) |
| G3 | One route per name | A name reaches a barrel either explicitly or via the star, never both — shadowing is confusion even when types are identical |

## 4 The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | new | **landed** | `file:scripts/check-api-surface.mjs` + `api/{canvas-core,canvas-store,canvas}.surface.txt` | Script reads each package's built `dist/index.d.ts` (+ `dist/specs/index.d.ts` for core), extracts exported names (TS compiler API), sorts, diffs against the checked-in snapshot; `--write` regenerates. Wired into root `pnpm lint` beside `check-boundaries` | Any surface change — starred *or* explicit, addition *or* deletion — becomes a red check and a one-line reviewable diff | low — read-only tooling; needs `^build` ordering in the lint task | — |
| F2 | fix | **landed** | the three root barrels | De-duplicate two-route names: drop `Point`/`Rect` from `file:packages/canvas/src/index.ts`'s explicit core block and from `file:packages/canvas-core/src/index.ts`'s Camera type block; drop `Point`/`Vec2`/`Size`/`Rect` from `file:packages/canvas-store/src/index.ts`'s explicit geometry line (keep `CameraTransform` — the star does not carry it). The star becomes the single route | zero surface change (V3 proves it) — the names still export, via one route | low — type-only, identical underlying declarations | F1 (snapshot first, so V3 is a diff against it) |
| F3 | docs | **landed** | root `CLAUDE.md` (global rules) + `file:packages/canvas-core/CLAUDE.md` | Standing rule: **at most one `export *` per barrel, and only for the specs vocabulary; everything else explicit.** Note the dual-star silent-omission semantics as the reason | risk 1 can never materialise unreviewed | low | — |

## 5 Blast radius

| ID | Consumer | Impact | Action |
|---|---|---|---|
| B1 | All packages importing the three barrels | none — F2 changes routes, not names (V3) | — |
| B2 | CI / `pnpm lint` | gains a build-dependent step; a legitimate surface change now requires regenerating the snapshot in the same PR | documented in the script header (`--write`) |

## 6 Verification

| ID | Status | Check | Expected | Covers |
|---|---|---|---|---|
| V1 | **pass** | `pnpm build && pnpm lint` on a clean tree | surface check passes with fresh snapshots | F1 |
| V2 | **pass** | mutation test: add a throwaway export to `specs/shape.ts`, run the check | **fails**, naming the added symbol; revert | F1 |
| V3 | **pass** | snapshot diff before vs after F2 | byte-identical — de-dup changed no surface | F2 |
| V4 | **pass** | `pnpm check-types` repo-wide | pass | F2 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Snapshot scope | the three engine barrels / every publishable package | start with the three (where the stars are); extending is one array entry per package once the pattern proves out | **accepted** |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-08-12 | Opened from maintainer review of `file:packages/canvas/src/index.ts` ("concerned about export *") | proposed | — |
| 2026-08-12 | Implemented — all rows landed; new global rule became root CLAUDE.md **rule 16** (rule 15 kept its number: it is cross-referenced) | **landed** | V2 mutation test: one canary type in `specs/shape.ts` tripped the check in all three packages (it rides the star through the whole chain) and named the symbol; revert → green. V3: snapshots byte-identical after the de-dup. Baselines: canvas-core 505 exports (root + ./specs), canvas-store 293, canvas 389 |
