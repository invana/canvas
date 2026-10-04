---
id: feat-2026-10-05-a-board-cannot-hold-a-canvas
type: feat
title: A board can hold a canvas, its inspector, its layers and its table, next to dashboard panels
status: accepted
opened: 2026-10-05
decided: 2026-10-05
landed: null
packages: [pkg:@invana/canvas-boards, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: superseded-by, object: rfc:feat-2026-10-05-canvas-board-is-a-separate-package }
  - { predicate: depends-on, object: rfc:feat-2026-10-05-graph-canvas-app-engine-is-welded-to-its-layout }
  - { predicate: depends-on, object: pkg:@invana/boards }
  - { predicate: relates-to, object: rfc:feat-2026-10-04-canvas-ui-uses-the-kit-workbook }
---

> **Partly superseded** by rfc:feat-2026-10-05-canvas-board-is-a-separate-package: the code now lives in `pkg:@invana/canvas-ui` at `@invana/canvas-ui/boards`, and `@invana/canvas-boards` is deleted (D-3). The design (§2), D-1, D-2 and the deferred F7 still hold.

**Summary:** The design kit's `@invana/boards` draws a board from JSON, and **deliberately ships no `canvas` panel**: "the consumer registers a renderer for `kind: "canvas"`" (design-kit `packages/boards/src/types.ts`, `CustomOptions`). Canvas has never registered one. This RFC adds **`@invana/canvas-boards`**: a `canvas` panel plus `canvas-inspector`, `canvas-layers` and `canvas-table`, so a board page can be a canvas, a dashboard (kit panels), or both.

| | |
|---|---|
| **What's missing** | Any way to put a canvas on a kit board |
| **Why a new package** | canvas-ui stays free of `@invana/boards`, whose types pull in blocks, charts, tables and editor. The same split the kit made to keep PixiJS out of boards |
| **Blocker** | `@invana/boards`, `@invana/blocks` and `@invana/charts` are **not on npm**. Like `@invana/ui@0.0.32`, they come from the local design-kit through the temporary overrides (rfc:feat-2026-10-04-canvas-ui-uses-the-kit-workbook D-1) |
| **Open decisions** | none: D-1 to D-3 taken by the maintainer 2026-10-05 |

Row status: proposed 0 · accepted 0 · implemented 6 · landed 0 · deferred 1 · rejected 0 · superseded 0

## 2. Design

| Step | Mechanism | Consequence |
|------|-----------|-------------|
| 1 | Panel options are JSON. The `canvas` panel carries `dataRef` (a string), not data. The host turns it into a graph with a `resolveData(ref)` it passes to `CanvasBoardProvider` | A board spec stays serialisable and storable |
| 2 | `CanvasBoardProvider` holds the live engines in React state, keyed by `canvasId` (default `"canvas"`). The `canvas` panel registers its engine on ready; the other kinds look it up | Panels beside the canvas bind to it. No module-level state, so N boards on a page are safe |
| 3 | The `canvas` panel = `GraphCanvasAppRoot` + `GraphCanvasAppSurface` (the split RFC) | Same defaults, scope and theme as `GraphCanvasApp`, with no second chrome |
| 4 | `canvas-inspector` → `ElementInspectorViewPanel`; `canvas-layers` → `LayersViewPanel`, each given the engine from step 2 | Reuses canvas-ui; nothing redrawn |
| 5 | `canvas-table` projects the graph layer's nodes into the kit's own `table` block (`BLOCK_PANELS.table`), refreshed off the store's node/edge events, one frame at most | A dashboard table of the live graph with no new table component. A row click is reported as the board action `select` |
| 6 | `CanvasBoard` = provider + kit `Board` with the canvas registry merged under the consumer's | One-liner for a single board. `CANVAS_PANELS` + the provider stay public for `BoardPages` users |
| 7 | `CanvasPanelKinds` maps each kind to its options type, so `BoardSpec<CanvasPanelKinds>` type-checks a spec | A mistyped option is a compile error, as the kit intends |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | implemented | `../design-kit/.local-packs/` + `file:pnpm-workspace.yaml` | Build and pack `@invana/boards`, `blocks`, `charts`, `tables`, `editor`; extend the temporary overrides | Installable here | **high**: 3 more unpublished packages. The branch still can't merge until they are on npm | rfc:feat-2026-10-04-canvas-ui-uses-the-kit-workbook F1 |
| F2 | defect | implemented | `file:packages/canvas-boards/` (new package, 0.0.14) | package.json, tsconfig, tsup, eslint, CLAUDE.md. Peers: canvas-ui, canvas-react, graph (types), boards, ui, react | New workspace package | medium: new published package; versions in lockstep | — |
| F3 | defect | implemented | `file:packages/canvas-boards/src/` | `CanvasBoardProvider`, `useBoardCanvas`, the 4 renderers, `CANVAS_PANELS`, `CanvasBoard`, options types | Feature | medium | F2, split RFC F1 |
| F4 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/GraphCanvasApp/CanvasBoards.stories.tsx` | Each board is a `CanvasBoard`: a canvas with an inspector column, a canvas + live table, and a dashboard (metric tiles, ranked list, table) with no canvas. The `Workbook` and its page menu stay | Shows canvas, mixed and dashboard pages | medium: changes how the story looks | F3 |
| F5 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Adds a dashboard page to the workbook, built as a `CanvasBoard` | Mixed workbook in the shell story | medium: story change | F3 |
| F6 | defect | implemented | `file:apps/storybook/package.json`, `file:apps/storybook/.storybook/tailwind.css` | Add the new deps; `@source` the kit packages so their classes are generated | Story builds and styles | low | F2 |
| F7 | defect | deferred | `pkg:@invana/canvas-boards` | Several canvases on one board (needs a `canvasId` picker in the inspector/table UI), and `canvas-find` / `canvas-selection` kinds | — | — | maintainer D-1, D-2 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| D1 | `story:canvas-ui/apps/GraphCanvasApp/CanvasBoards` | story | Rebuilt on boards (F4) | V3 |
| D2 | `story:canvas-ui/apps/AppLayoutV2` | story | Gains a dashboard page (F5); its workbook `activeId` now honours the page id (it was forced to a canvas board) | V3 |
| D3 | invana/studio | external | None yet. It can adopt `CanvasBoard` once the kit packages are published | Follow-up |
| D4 | `pkg:@invana/canvas-ui` | package | None: canvas-boards depends on it, not the reverse | — |
| D5 | design kit `PanelBox` | upstream | A `fill` row gives a panel's card the height, but `PanelBox`'s body has no `flex-1`, so the body never grows. The canvas panel therefore takes an explicit `height` (default 520) | Kit fix: `flex-1 min-h-0` on the `PanelBox` body; then `height` can default to fill |
| D6 | `story:canvas-ui/apps/GraphCanvasApp/CanvasBoards` | story | Its canvases lost their per-board ELK / hierarchy layouts: a JSON spec can't name a layout class, and the bundle registers only force | Follow-up: a `layout` option naming a layout the canvas panel registers |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | `pnpm check-types` + `pnpm lint` + `pnpm build` | repo | pass → **check-types / lint / build 20/20 each; `check-boundaries` passes with canvas-boards added to two allow-lists** | F2, F3 |
| V2 | pass | A spec with a wrong option type fails to compile | `CanvasPanelKinds` | type error → **a probe spec with `dataRef: 42, inspect: "yes"` fails with two TS2322 errors. The first version passed (an index signature made every kind permissive); fixed by making `CanvasPanelKinds` a type alias** | F3 |
| V3 | pass | Each page renders: canvas draws, inspector follows a click, table lists nodes and a row click selects, dashboard tiles render | `story:canvas-ui/apps/GraphCanvasApp/CanvasBoards`, `story:canvas-ui/apps/AppLayoutV2` | All four → **CanvasBoards: Team canvas + inspector (click Frank → inspector shows him), Build pipeline canvas + table (click row "Build" → node selected on canvas, row marked), Overview dashboard renders. AppLayoutV2 Overview page opens and switches back. No page errors beyond the headless WebGPU `popErrorScope` flake** | F3–F6 |
| V4 | pass | Camera kept across a page switch (`keepMounted`) | same | Pixel-identical after switching back → **board canvas zoomed (33k px changed), switched away and back: 0 px** | F4 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D-1 | Canvases per board | one · many | One in v1 (`canvasId` already keys the registry, so many is additive) | accepted |
| D-2 | Which canvas-ui panels become kinds in v1 | inspector, layers, table · more | inspector, layers, table | accepted |
| D-3 | Where the panels live | new package · canvas-ui · stories | New `@invana/canvas-boards` | superseded |

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-10-05 | Opened, with go-ahead to implement | accepted | Maintainer confirmed pages = boards, canvas as a registered panel kind, the new package, both stories, and local packing |
| 2026-10-05 | `BoardPages` not used in stories | — | The kit's `BoardPages` has no page menu, header actions or `keepMounted` switch, which both stories use. They keep `Workbook`, with a `CanvasBoard` as each page's body |
| 2026-10-05 | F1–F6 implemented, V1–V4 pass | implemented | Labels need a structure template (a bare `bindings.label` yields nothing), so the story specs carry small `simple` structures. Not committed |
| 2026-10-05 | D-3 superseded | — | Package folded into canvas-ui as `@invana/canvas-ui/boards` and deleted: rfc:feat-2026-10-05-canvas-board-is-a-separate-package |
