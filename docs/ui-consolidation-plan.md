# UI consolidation plan — canvas-react (headless) + canvas-ui (pixels)

**Status:** 📋 planned. Design-of-record for reorganising all React UI in the
monorepo. No code has moved yet; this doc is the contract the move follows.

## Why

Two packages hold React UI today and the line between them is unclear:

- `@invana/canvas-react` holds engine bindings **and** UI (components, toolbars,
  menus, `GraphCanvasApp`).
- `@invana/canvas-ui` holds schema editors + presentational views, and is kept
  **engine-agnostic** ("no engine imports; `@invana/graph` for types only").

The current split axis is **"engine-agnostic vs engine-aware"**: editors (no
engine) in canvas-ui, toolbars (need hooks) in canvas-react. That axis is what
bites us:

1. *"Where does a new panel/toolbar go?"* has no clean answer — UI is scattered
   across both packages.
2. Because canvas-ui is engine-agnostic, its editors **cannot read the store**,
   so every consumer hand-writes a bridge (introspect the canvas → build a
   `definition` → wire `onChange` back). The `SettingsPanel` we had to inline in
   `CanvasSettingsEditor.stories.tsx` is exactly this tax, paid per consumer.

## The organizing principle: **headless vs pixels**

Re-split the two packages on **"does it draw application UI?"** — the React Flow
split (`@xyflow/react` core vs `<Controls>`/`<MiniMap>`/`<Panel>`):

- **`@invana/canvas-react` = the headless binding layer.** Make the imperative
  engine usable declaratively from React and expose its state reactively. Roots
  (`<Canvas>`/`<GraphCanvas>`), contexts, null-rendering wrappers
  (`<GraphLayer>`, `<DragPanBehaviour>`, …), and hooks (`useStore`,
  `useGraphCanvasOptions`, `useZoom`, `useSelection`). **Renders no application
  UI. Never imports `@invana/ui`.** ≈ React Flow's headless core.
- **`@invana/canvas-ui` = the React UI kit.** Everything the user sees and clicks
  — components, toolbars, menus, editors, views, status bars, the app shell —
  built **on** canvas-react's hooks/context, so it reads/writes `canvas-store`
  and is **live by default, no manual wiring**. ≈ React Flow's batteries UI.

**Litmus for any file:**

> Draws UI the user sees? → **canvas-ui**.
> Adapts the engine to React *without* drawing UI (renders `null`, provides a
> context, or is a hook)? → **canvas-react**.

This flips the axis from *agnostic-vs-aware* to *headless-vs-pixels*, and it
directly delivers the goal: the UI lives above the store hooks, so it reflects
store changes instantly.

## Dependency direction

**Chosen: `canvas-ui` → `canvas-react` (one direction).** canvas-ui depends on
canvas-react and consumes its hooks/context; contexts + store hooks stay in
canvas-react. Simplest, single clear direction, no cycle.

- Rejected for now (revisit if the layering feels wrong): *extract a shared
  React-core package* (hooks + context down into canvas-store or a new tiny
  package; canvas-react and canvas-ui stay siblings). Purer, but more upfront
  work for no functional gain today.

Consequence: **no back-re-export**. canvas-react cannot re-export canvas-ui
components (that would cycle), so consumers switch imports
`@invana/canvas-react` → `@invana/canvas-ui` in the same pass (§ Sweep).

## Move manifest

Concretely: **23 canvas-react files import `@invana/ui`; all are in
`components/`, `toolbars/`, `menus/`, `apps/`.** Nothing in roots / contexts /
wrappers / hooks touches `@invana/ui`, so once the pixels leave, canvas-react is
`@invana/ui`-free with no leftovers.

### Stays in `canvas-react` (headless bindings)

- Roots / lifecycle: `Canvas`, `GraphCanvas`, `useCanvasEngine`.
- Contexts: `CanvasContext`, `GraphCanvasContext`, `ClipboardContext`,
  `HistoryContext`, `ToolContext`.
- Providers: `providers/*` (`GraphClipboardProvider`, `GraphHistoryProvider`,
  `GraphToolProvider`).
- Engine wrappers (render `null`): `behaviours/*`, `layers/*`
  (incl. `DevInfoLayer`, `MiniMapLayer` — the overlays are drawn by the engine,
  not React), `layouts/*`.
- Headless hooks: `useStore`, `useGraphCanvasOptions`, `useGraphCanvasUpdate`,
  `useCamera`, `useZoom`, `useFitContent`, `useSelection`, `useLayout`,
  `useHistory`, `useClipboard`, `useTool`, `useCanvasEvent`, `useGraphEvent`, … —
  everything in `hooks/` **except** the two turnkey UI hooks below.

### Moves to `canvas-ui` (pixels)

- **all** `components/*` — dumb blocks (`Panel`, `ToolbarItems`, `Tooltipped`) +
  smart bars (`CanvasMessageBar`, `GraphStatusBar`, `PropertiesEditor`,
  `DetailCard`, `PropertyDetailView`, `ContextMenuOverlay`, `ExportImagePanel`,
  `ExportStatePanel`, `HoverElementPreviewCard`, `CanvasSettingsBrowser`,
  `EdgeEndpoints`, `PanelContent`, `propertyRenderers`, `styles`, `types`,
  `ToolbarItem`).
- **all** `toolbars/*` — every `*Toolbar` + `InspectorPanel`, `NodeDetailView`,
  `EdgeDetailView`, `detailView`.
- **all** `menus/*` — context menus.
- `apps/*` — `GraphCanvasApp` (+ `GraphCanvasAppHeader` / `GraphCanvasAppFooter`).
- Turnkey UI hooks `useDevTool`, `useMiniMap` — their **button** is a pixel
  component (`ToolbarItems` → `@invana/ui`); they re-import the headless
  `DevInfoLayer` / `MiniMapLayer` wrappers back from canvas-react.

## Target `canvas-ui` structure

```
canvas-ui/src/
  components/   dumb building blocks (Panel, ToolbarItems, Tooltipped, ControlButton)
  toolbars/     assembled *Toolbar
  menus/        context menus
  panels/       store-connected smart panels (InspectorPanel, CanvasSettingsPanel, status bars)
  editors/      schema editors (controlled) + their connected wrappers
  views/        presentational (preview cards, layers panel, canvas pages)
  apps/         GraphCanvasApp (+ header/footer)
  hooks/        UI-only turnkey hooks (useDevTool, useMiniMap)
  shared/       colour utils + presets
```

Still one barrel (`index.ts`); the folder split is internal organisation, not
subpath exports.

## Editors: controlled inner + connected wrapper

Keep both layers — this is already the established direction (see
`node-style-live-binding-plan.md`):

- **Controlled editor** (unchanged): `defaults`/`fields`/`onSubmit` (or
  `definition`/`onChange` for `CanvasSettingsEditor`). Pure, engine-free,
  testable/standalone in Storybook.
- **Connected wrapper** (new, engine-aware): a thin component that reads the live
  state from the store via canvas-react hooks, seeds the controlled editor, and
  writes patches back with `useGraphCanvasUpdate().update(...)`. Drop it in with
  **no props** and it's live. This is the packaged, reusable form of the
  `SettingsPanel` bridge — e.g. `<CanvasSettingsPanel/>`.

So the "why must I write a SettingsPanel" tax is paid **once, in the package**,
not per consumer.

## Self-wiring + multiple canvases on one page

Connected components must be **zero-config** (drop into a canvas-react subtree,
write nothing) *and* correct with **N canvases on one page**. Both fall out of one
rule: **resolve the canvas from React context, never a global.**

- Each `<Canvas>` / `<GraphCanvas>` / `GraphCanvasApp` owns its own provider
  subtree (`CanvasContext` / `GraphCanvasContext`), so a connected component binds
  to the **nearest enclosing** root — two graphs side by side each drive their own
  panels automatically.
- **No module-level "current canvas", singleton store, or shared mutable state** —
  that is the only thing that breaks multi-instance.
- Optional `canvas` prop (`useResolvedCanvas(explicit ?? context)`) targets a
  specific instance from **outside** any provider (external chrome).
- **`@invana/canvas-react` is a PEER dependency** so the provider and the
  consumer share one context object; a duplicate copy → different context →
  `useCanvas()` returns null even inside a root. (Reason it's peer, not bundled.)

## Package.json changes

- **canvas-react**: remove `@invana/ui` (peer + dev) and `lucide-react` (once
  icons leave with the UI). Keeps: `@invana/canvas-store` (dep), `@invana/canvas`
  (peer), `@invana/graph` (peer), `@invana/themes` (dep),
  `@invana/graph-layout-d3-force` (peer), `pixi.js` (peer).
- **canvas-ui**: add `@invana/canvas-react` (peer + dev) — brings `@invana/canvas`
  + `@invana/canvas-store` transitively. Keeps `@invana/ui`, `@invana/forms`,
  `@invana/themes`, `@invana/styling`, `@invana/graph`, `lucide-react`,
  `react-hook-form`. Drop the "engine-agnostic" rule. **pixi still never enters
  canvas-ui** — it reaches the engine only through canvas-react hooks +
  canvas-store types.
- Keep every in-repo package on the same version when bumping (root rule).

## Sweep (consumers)

After the move, switch UI imports `@invana/canvas-react` → `@invana/canvas-ui`
in: `apps/storybook/stories/**`, `packages/canvas-designer` (uses the shared
field helpers + possibly components), `apps/docs` examples if any. Engine
wrappers/hooks stay imported from canvas-react. Storybook `package.json` already
depends on both.

## Phased execution (each phase: `pnpm build` + `check-types` + storybook build green)

- **P0 — instructions + plan (this).** Update root + `canvas-react` +
  `canvas-ui` CLAUDE.md and memory; land this doc. No code moves.
- **P1 — wire the dependency.** Add `@invana/canvas-react` to `canvas-ui` deps;
  prove canvas-ui can import a canvas-react hook. Nothing moves yet.
- **P2 — atomic UI move.** ⚠️ **Revised from the original P2/P3/P4 split.**
  Verified import graph: canvas-react's `components/` are imported **only** by its
  own `toolbars/*` (17), turnkey `hooks/*` (`useDevTool`/`useMiniMap`), and the
  barrel — i.e. only by other UI that is *also* moving. Nothing in the headless
  core (roots/contexts/wrappers/store hooks) imports them. Because **canvas-react
  may never import upward from canvas-ui**, the UI can't move in leaf-first slices
  (each slice would leave a canvas-react file importing a moved component). So the
  whole cluster moves as **one atomic phase**: `components/` + `toolbars/` +
  `menus/` + `apps/` (`GraphCanvasApp`) + turnkey `hooks/` → `canvas-ui`, rewiring
  all intra-cluster imports to canvas-ui-internal, and dropping UI from
  canvas-react's `index.ts`. The cluster is closed (no inbound edges from the
  core), so the move is clean — just large.
- **P5 — de-UI canvas-react.** ✅ **Done with P2.** `@invana/ui` dropped from
  `canvas-react` (zero imports remain — headless confirmed). `lucide-react`
  **stays** — 4 section-builder hooks emit lucide icon components as descriptor
  *data* (not chrome).
- **P6 — sweep consumers.** Repoint story/designer/docs imports.
- **P7 — connected editor wrappers.** Add `<CanvasSettingsPanel/>` and the other
  store-connected editor wrappers so consumers drop them in with no bridge.

Phases are independently revertible; keep the build green between each.

## P2 outcome (landed 2026-07-21)

Atomic move done, full build green, `canvas-react` has zero `@invana/ui` imports.
Three deviations from the pure plan, all forced by the no-cycle rule:

- **`HoverElementPreviewBehaviour` (the wrapper) moved to `canvas-ui/behaviours/`.**
  It registers an engine behaviour *and* renders a `@invana/ui` card → it's
  pixels. Hence a new `canvas-ui/src/behaviours/` track for UI-rendering wrappers.
- **`canvas-react/src/uiModel.ts`** — a private (non-exported) mirror of the
  toolbar-descriptor types (`ToolbarItem` family, `ToolbarIcon`,
  `PropertiesEditorValues`) that 6 staying section-builder hooks reference.
  Structural typing bridges these to canvas-ui's public `ToolbarItem`; avoids a
  canvas-react → canvas-ui type import. Mild duplication — a candidate to hoist
  into a shared types module later.
- **`canvas-ui` gained `@invana/canvas` (types) + `@invana/graph-layout-d3-force`
  (value)** — the latter because `GraphControlsToolbar` constructs a
  `D3ForceLayout`. `pixi` still never enters canvas-ui.

## Open questions / risks

- **`menus/*`** straddle UI + a context-menu behaviour registration. They move to
  canvas-ui (pixels), but confirm none need to *stay* as a headless wrapper.
- **`lucide-react` in canvas-react**: verify no headless file imports it before
  dropping the dep (icons should all leave with the UI).
- **`@invana/themes` in canvas-react**: it's a `dependency` today (theme tokens).
  Confirm what still needs it once UI leaves — it may become UI-only too.
- **Designer** (`@invana/canvas-designer`) currently peers on `canvas-ui`; the
  new canvas-ui → canvas-react edge must not create a cycle (it won't — designer
  is a leaf consumer).
