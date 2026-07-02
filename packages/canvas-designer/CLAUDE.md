# CLAUDE.md — packages/canvas-designer (`@invana/canvas-designer`)

The **canvas designer** — visual authoring for the visualisation's *definition*. Today it ships one surface: the **node template** designer (in `src/templates/`) — WYSIWYG composite-card authoring that emits `FreeformStructure` JSON. **Planned:** the studio shell + per-surface designers for **layouts / behaviours / layers**, each hosting the matching `@invana/canvas-ui` editor (see root `CLAUDE.md` rule 12 + `roadmap.md`). Kept *opt-in* and split from `@invana/canvas-ui` so render-only consumers stay light — most consumers only **render** templates (just `@invana/graph`'s `FreeformStructure` + `compileFreeform`).

The template surface is one layer of a three-layer stack (see root `CLAUDE.md` → "The card / template stack"): the engine `CompositeShape` primitive (in `@invana/canvas`) ← the `FreeformStructure` template model + `compileFreeform` (in `@invana/graph`) ← **this designer**, which authors `FreeformStructure` JSON. Don't fold graph/engine concerns into the template surface.

## Structure

`src/templates/` is today's surface (the node template designer + its fields/mapping/history). Future surfaces — the studio shell (scene tree + inspector) and `layers/` / `layouts/` / `behaviours/` designers — sit alongside it and host `@invana/canvas-ui` editors. Note: that shell will be **engine-coupled** (it drives a live canvas via `@invana/canvas-react`), unlike the headless template tool below.

## Scope

- `NodeCardDesigner` — WYSIWYG builder: element palette (text / rect / circle / line / image), drag-to-position canvas with a themed live preview, **layers** panel (z-order, show/hide, delete, select), **undo/redo** (`useHistory`, with coalescing + ⌘/Ctrl+Z), **save/load** (JSON). Emits a `FreeformStructure` (pure JSON) via `onChange` / `onSubmit`.
- **Default / starter node templates** — this package ships its own gallery of ready-made `FreeformStructure` presets (pure JSON) as starting points for authoring, surfaced via `NodeTemplateList`. These are **authoring presets** and are distinct from `@invana/graph`'s `BUILT_IN_STRUCTURES` (runtime fallbacks) — don't merge the two.
- `useHistory` — generic undo/redo hook (transient `set` vs recorded `commit`/`record`, a `version` that bumps only on external jumps so uncontrolled forms re-seed after undo/redo/load without resetting mid-typing).
- Field schemas + mappers (`CARD_FIELDS`, `elementFields`, `cardToForm`/`applyFormToCard`, `elementToForm`/`applyFormToElement`, `templateToJson`/`parseTemplate`, `newElement`, `previewColor`, `elementLabel`).

## Rules

- **Engine-agnostic & headless.** No `@invana/canvas` / `@invana/canvas-react` / `pixi.js`. The only `@invana/graph` use is its **types** (`FreeformStructure`, `CardElement`). Output is JSON via callbacks; the host applies it (`canvas.update({ layers: { graph: { nodeStructureTemplates, nodeTypes } } })`).
- **Reuse `@invana/canvas-ui`** for shared form chrome + helpers (`roleField`, `asRole`, `NO_ROLE`, `numberToHex`) and `@invana/forms` for the property panels. Don't duplicate them.
- **Property panels come from `@invana/forms`**; `Button` from `@invana/ui`. The **design canvas** (absolutely-positioned element divs, drag) and the **dense layer-row controls** + the hidden file `<input>` are bespoke tool affordances and may be native elements — that's the one place the "no raw input/button" rule of `canvas-ui` doesn't apply (it's a canvas tool, not a schema form).
- **No module-level state** — safe with N concurrent instances.
- **No tests** (per repo convention); verify via Storybook (`canvas-designer/Card Designer Studio`). Don't add stories unless asked.

## Build

`tsup` → ESM + `.d.ts`, externals: `react`, `react-dom`, `react-hook-form`, `@invana/canvas-ui`, `@invana/graph`, `@invana/ui`, `@invana/forms`.
