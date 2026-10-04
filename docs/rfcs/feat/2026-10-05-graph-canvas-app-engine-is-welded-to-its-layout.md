---
id: feat-2026-10-05-graph-canvas-app-engine-is-welded-to-its-layout
type: feat
title: GraphCanvasApp's engine half is separable from its AppLayoutV2 half
status: accepted
opened: 2026-10-05
decided: 2026-10-05
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: blocks, object: rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas }
  - { predicate: relates-to, object: rfc:feat-2026-10-04-canvas-ui-uses-the-kit-workbook }
---

**Summary:** `sym:GraphCanvasApp` does two jobs in one function: it **owns the engine** (bundle, config merge, telemetry, lifted context, theme + keyboard scope) and it **lays it out** (`AppLayoutV2`: header, footer, right, bottom). A board needs the first without the second. This RFC splits them into `sym:GraphCanvasAppRoot` + `sym:GraphCanvasAppSurface`. `GraphCanvasApp` becomes those two plus `AppLayoutV2`, and **its public API does not change**.

| | |
|---|---|
| **What's missing** | A way to mount the graph engine, with the app's defaults, scope and lifted context, inside a layout other than `AppLayoutV2` |
| **Constraint** | The engine element must render **inside** the layout's main cell, while the context it publishes must wrap that cell's **siblings** (header, side regions). So this is a root plus a surface, not one provider |
| **Breaking?** | No. `GraphCanvasApp` keeps every prop. 3 exports added |
| **Open decisions** | none (maintainer go-ahead 2026-10-05) |

Row status: proposed 0 · accepted 0 · implemented 4 · landed 0 · deferred 0 · rejected 0 · superseded 0

## 1. Motivation

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| M1 | A board panel that renders `GraphCanvasApp` gets a second header and second side regions inside the board's own | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L526-L688` | `AppLayoutV2` is hard-wired into the only component that owns the engine |
| M2 | Panels beside the canvas (inspector, table) can't find the engine: the lifted context lives inside `GraphCanvasApp` | same, `#L647-L684` | Context providers wrap only the app's own layout |

## 2. Design

| Step | Mechanism | Consequence |
|------|-----------|-------------|
| 1 | `GraphCanvasAppRoot` takes every engine prop (`data`, `config`, `bundle`, `instanceKey`, `onReady`, `telemetry`, `preference`, `debug`, `controlPanels`) plus the box props (`width`, `height`, `style`, `className`, `wrap`). It owns the `canvas` state, reads `useTheme`, merges the config, and renders the lifted `CanvasContext`/`GraphCanvasContext` and the scoped theme/keyboard root around `children` | Any layout can go inside |
| 2 | It also publishes an internal surface context: `{ data, config, bundle, instanceKey, onReady, telemetry, preference, controlPanels }` | The surface needs no props |
| 3 | `GraphCanvasAppSurface` reads that context and renders the existing `GraphCanvasAppMain`. Its `children` are in-canvas extras (layers, `<ControlPanel>`s) | Place it once, anywhere under the root |
| 4 | `useGraphCanvasApp()` returns the existing `GraphCanvasAppControlContext` (`canvas`, `themeKind`, `toggleTheme`) | Chrome built outside `GraphCanvasApp` gets the same handle the header slots get |
| 5 | `GraphCanvasApp` = `<GraphCanvasAppRoot …><Layout/></GraphCanvasAppRoot>`, where `Layout` is the old `AppLayoutV2` body with `mainSection` = `<GraphCanvasAppSurface>{children}</GraphCanvasAppSurface>` | Same DOM, same props |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | implemented | `file:packages/canvas-ui/src/apps/GraphCanvasAppRoot.tsx` (new) | Root + surface + hook, moved out of `GraphCanvasApp.tsx`; `BASE_CONFIG`, `CanvasReady` and `GraphCanvasAppMain` move with them | Engine half is reusable | **medium**: moves the engine path every canvas-ui story runs through | — |
| F2 | defect | implemented | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx` | Rebuilt on F1. Keeps every prop, `toSection` and the header/footer builders | No API change | **medium**: same | F1 |
| F3 | defect | implemented | `file:packages/canvas-ui/src/index.ts` | Export `GraphCanvasAppRoot`, `GraphCanvasAppSurface`, `useGraphCanvasApp` and their props types | Public | low: additive | F1 |
| F4 | defect | implemented | `file:packages/canvas-ui/CLAUDE.md` | One line under `apps/` | Docs match | low | F1 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| D1 | Every story that mounts `GraphCanvasApp` (all of `story:canvas-ui/apps/*`, most `canvas-demos`) | stories | None intended: same tree, same props | V2 |
| D2 | invana/studio (`GraphCanvasApp` user) | external | None: API unchanged | — |
| D3 | `pkg:@invana/canvas-boards` (new) | package | Builds its `canvas` panel on F1 | rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | `pnpm check-types` + `pnpm lint` | repo | pass → **check-types 20/20, lint 20/20 (boundaries + surfaces intact), build 20/20** | F1–F3 |
| V2 | pass | Screenshot before vs after | `story:canvas-ui/apps/GraphCanvasApp/Default`, `…/RightInspector`, `…/ControlPanels`, `…/NoChrome` (control) | Pixel-identical to the pre-split build (noise floor 0 for these) → **Default, RightInspector, ControlPanels, NoChrome, CommandPalette, CanvasBoards: 0 px vs the pre-split build. FullFeatured and AppLayoutV2 differ, but each also differs from itself run-to-run (645k / 31.6k px): a first-paint race in those stories, before and after** | F1, F2 |

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-10-05 | Opened, with go-ahead to implement | accepted | Maintainer: "yes, make the code changes" after choosing option B (split, don't rewrite) |
| 2026-10-05 | F1–F4 implemented, V1–V2 pass | implemented | `GraphCanvasApp` now = `GraphCanvasAppRoot` + `GraphCanvasAppSurface` + `AppLayoutV2`. Also memoised the `debug` telemetry object (lint caught it re-creating per render). Not committed |
