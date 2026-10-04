---
id: feat-2026-10-05-canvas-board-is-a-separate-package
type: feat
title: CanvasBoard and its panels ship from canvas-ui; @invana/canvas-boards is deleted
status: accepted
opened: 2026-10-05
decided: 2026-10-05
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@invana/canvas-boards, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: supersedes, object: rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas }
  - { predicate: depends-on, object: pkg:@invana/boards }
---

**Summary:** `CanvasBoard` is a canvas-ui component in all but address: every panel it registers wraps a canvas-ui view panel or `GraphCanvasAppRoot`/`Surface`. This RFC folds all of `pkg:@invana/canvas-boards` into `pkg:@invana/canvas-ui` and **deletes the package outright, with no re-export shim**. It supersedes D-3 of rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas.

| | |
|---|---|
| **What changes** | `CanvasBoard`, `CANVAS_PANELS`, `CanvasBoardProvider`, `useBoardCanvas`, the 4 panel renderers and the option types move to `file:packages/canvas-ui/src/boards/` |
| **Why not move `CanvasBoard` alone** | It needs the provider, the panels and the types, and the package already imports canvas-ui. Moving one file would make the two packages import each other |
| **Cost that D-3 avoided** | canvas-ui gains `@invana/boards`, and `CanvasTablePanel` imports `BlockPanel` **at runtime**, not just its types. `@invana/boards`/`blocks`/`charts` are **not on npm** yet |
| **How the cost is contained** | Subpath export `@invana/canvas-ui/boards`; `@invana/boards` is an **optional** peer. The main barrel never imports `boards/`, so non-board consumers need nothing new (D-1) |
| **Open decisions** | none: D-1 to D-3 accepted 2026-10-05 |

Row status: proposed 0 · accepted 0 · implemented 7 · landed 0 · deferred 0 · rejected 0 · superseded 0

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | Maintainer wants `CanvasBoard` to ship from canvas-ui as a component | chat 2026-10-05 | — |
| M2 | Every canvas-boards panel is a thin binding over canvas-ui | `file:packages/canvas-boards/src/panels/` | Imports `ElementInspectorViewPanel`, `LayersViewPanel`, `GraphCanvasAppRoot`, `GraphCanvasAppSurface` from `@invana/canvas-ui` |
| M3 | `@invana/canvas-boards` was never published, so deleting it breaks no npm consumer | npm registry | `npm view @invana/canvas-boards` → 404 |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | Move only `file:packages/canvas-boards/src/CanvasBoard.tsx` | rejected | Imports `./provider`, `./panels/*`, `./types`; canvas-boards → canvas-ui already, so this makes a cycle |
| R2 | Keep `@invana/canvas-boards` as a re-export shim | rejected | Maintainer: delete outright (no backward-compat shims) |

## 2. Design

| Step | Mechanism | Consequence |
|------|-----------|-------------|
| 1 | `git mv packages/canvas-boards/src/*` → `packages/canvas-ui/src/boards/` (`index.ts`, `CanvasBoard.tsx`, `provider.tsx`, `types.ts`, `panels/*`) | History is kept; same file layout |
| 2 | Rewrite the 3 `from '@invana/canvas-ui'` imports in `panels/` to relative paths (`../../view-panels/…`, `../../apps/…`) | canvas-ui doesn't import itself |
| 3 | `file:packages/canvas-ui/tsup.config.ts`: entry `{ index: 'src/index.ts', boards: 'src/boards/index.ts' }`; add `@invana/boards`, `@invana/canvas`, `@invana/canvas-react` to `external` | Builds `dist/boards.js` + `dist/boards.d.ts`. `@invana/canvas*` are external, so no engine code is bundled twice. `splitting: false` means modules shared by the two entries are copied into both bundles (see risk F3) |
| 4 | `file:packages/canvas-ui/package.json`: `exports["./boards"]`; `@invana/boards` in `peerDependencies` + `peerDependenciesMeta: { optional: true }` + `devDependencies` (with the kit devDeps canvas-boards needed: `blocks`, `charts`, `editor`, `tables`) | `import { CanvasBoard } from '@invana/canvas-ui/boards'` |
| 5 | The main barrel `file:packages/canvas-ui/src/index.ts` does **not** re-export `boards/` | No-boards consumers never resolve `@invana/boards` |
| 6 | `boards/` panels reach the engine only via `CanvasBoardProvider` context, as today | No new coupling inside canvas-ui |

## 3. Prior art

| Doc | Relation | Status | What survives |
|-----|----------|--------|---------------|
| rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas | supersedes (D-3 only) | accepted | Everything except *where the code lives*: design steps 1–7, options as JSON, the provider, D-1/D-2, deferred F7 |
| `file:packages/canvas-boards/CLAUDE.md` | moved | — | Its rules move into `file:packages/canvas-ui/CLAUDE.md` as a `boards/` section |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | implemented | `file:packages/canvas-ui/src/boards/` | Design steps 1, 2, 5 | Code lives in canvas-ui | low: same code, imports rewritten | — |
| F2 | defect | implemented | `file:packages/canvas-ui/package.json`, `file:packages/canvas-ui/tsup.config.ts` | Design steps 3, 4 | `@invana/canvas-ui/boards` subpath | **medium**: new public entry point. The optional peer must stay out of the main entry, or no-boards consumers fail to resolve it | F1 |
| F3 | defect | implemented | build output | `splitting: true` in tsup. With `splitting: false` the `boards` bundle carried its own `SurfaceContext` + `AppContext` (GraphCanvasApp's contexts), a second identity; with splitting they live once in a shared chunk | One context identity | **medium**: a duplicated context would silently break `GraphCanvasAppRoot` ↔ `Surface` | F2 |
| F4 | defect | implemented | `file:packages/canvas-boards/` | Delete the package (src, configs, CLAUDE.md, `.turbo`, `dist`) | One package fewer | low: never published (M3) | F1 |
| F5 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/GraphCanvasApp/CanvasBoards.stories.tsx#L29`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L83` + comments `#L4`, `#L675`; `file:apps/storybook/package.json#L17`; `file:apps/storybook/tailwind.config.cjs#L32` | Import from `@invana/canvas-ui/boards`; drop the canvas-boards dep and tailwind glob (canvas-ui's glob already covers `src/boards`) | Stories unchanged visually | low: import path only | F2, F4 |
| F6 | defect | implemented | `file:scripts/check-renderer-boundary.mjs#L94`, `#L128` | Remove `packages/canvas-boards` from the `core-purity` and `backend-detach` allow-lists | Boundary list matches the workspace | low | F4 |
| F7 | defect | implemented | `file:CLAUDE.md#L68`, `#L132`; `file:packages/canvas-ui/CLAUDE.md`; `file:docs/storybook-namespace-migration-plan.md#L79` (check only); rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas | Root CLAUDE: remove the workspace row and layering line; mention `boards/` + subpath in canvas-ui's row. canvas-ui CLAUDE gains the boards rules. Prior RFC: D-3 → `superseded`, History line + banner | Docs match code | low | F1–F4 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | `pkg:@invana/boards` (+ blocks, charts, tables, editor), local packs | Now a (optional) peer of canvas-ui | canvas-ui's publish is gated on the kit publishing these **if** D-1 = main barrel; with the subpath, only `boards` users are |
| U2 | `pkg:@invana/canvas-ui` view panels + `GraphCanvasAppRoot`/`Surface` | Imported relatively now | A rename breaks `boards/` at compile time, in the same package |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| D1 | `story:canvas-ui/apps/GraphCanvasApp/CanvasBoards` | story | Import path changes | F5, V3 |
| D2 | `story:canvas-ui/apps/AppLayoutV2` | story | Import path changes | F5, V3 |
| D3 | `pkg:@invana/canvas-boards` npm name | published API | None: never published | — |
| D4 | `pkg:@invana/canvas-ui` main entry | published API | Unchanged: no new exports in `.` | V2 |
| D5 | invana/studio | external | Would import `@invana/canvas-ui/boards` instead; nothing adopted yet | — |
| D6 | `pnpm-lock.yaml` | lockfile | canvas-boards importer removed, canvas-ui gains kit devDeps | `pnpm install` |
| D7 | `api/*.surface.txt` | snapshot | canvas-ui has no surface snapshot | — |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | `pnpm install && pnpm check-types && pnpm lint && pnpm build` | repo | pass → **install ok; check-types 19/19; lint 19/19 (0 errors), boundaries intact; build 20/20** | F1, F2, F4, F6 |
| V2 | pass | `grep -c "@invana/boards" packages/canvas-ui/dist/index.js` and `dist/index.d.ts` | build output | 0 → **0 in `index.js`, `index.d.ts` and the shared chunk; 1 in `boards.js`. `SurfaceContext` defined once (shared chunk), 0 in `boards.js`** | F2 |
| V3 | pass | The canvas board story still works: canvas draws, a click updates the inspector, a table row click selects, dashboard renders, AppLayoutV2 Overview page switches | `story:canvas-ui/apps/GraphCanvasApp/CanvasBoards`, `story:canvas-ui/apps/AppLayoutV2` | Same as rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas V3 → **headless Chromium: Team canvas + inspector render; Build pipeline row click selects Install on the canvas (row marked); Overview dashboard renders; AppLayoutV2 Overview page renders. 0 console / page errors. The inspector click-to-follow was not re-driven** | F1, F3, F5 |
| V4 | pass | Control: a non-board canvas-ui story is unchanged | `story:canvas-ui/apps/GraphCanvasApp` (default) | Renders, no console errors → **renders, 0 errors** | F2, F3 |
| V5 | pass | `grep -rn "canvas-boards" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=storybook-static --exclude-dir=.turbo .` | repo | Only RFC/history mentions → **only `docs/rfcs/`, build logs/`storybook-static` artefacts** | F4–F7 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D-1 | How `boards/` is exported | subpath `@invana/canvas-ui/boards` + optional peer · main barrel + required peer | **Subpath**: keeps canvas-ui's main entry free of the unpublished kit packages; main barrel would gate every canvas-ui consumer on them | accepted |
| D-2 | Folder inside canvas-ui | `src/boards/` · `src/apps/boards/` | **`src/boards/`**: it's a separate entry point with its own registry and provider, not one app | accepted |
| D-3 | Delete `@invana/canvas-boards` | delete outright · re-export shim | delete outright | accepted |

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-10-05 | Opened | proposed | Maintainer asked to move `CanvasBoard` into canvas-ui and confirmed deleting the package outright (D-3). D-1/D-2 open |
| 2026-10-05 | Approved whole (D-1 subpath, D-2 `src/boards/`) | accepted | Maintainer: go ahead, on this branch |
| 2026-10-05 | F1–F7 implemented, V1–V5 pass | implemented | F3's risk was real: `splitting: false` duplicated GraphCanvasApp's contexts into `boards.js`; splitting on fixed it. The main entry now imports a shared chunk. Not committed |
