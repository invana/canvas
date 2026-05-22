# CLAUDE.md — packages/canvas-react-ui-components (`@invana/canvas-react-ui-components`)

React UI components — style editors, panels, controls — for tools that use `@invana/canvas-react`. Every primitive comes from the `@invana/ui` design-kit so the visual language is consistent across all Invana tools.

## Pattern

Each editor ships in **two flavours**:

1. **Headless controlled form** — `<XStyleForm value onChange />`. Pure React, no engine awareness. Use this when:
   - the host is outside any `<Canvas>` tree (centralised inspector targeting multiple canvases),
   - the host wants custom commit logic (e.g. write to an undo stack),
   - you're previewing styles without a live engine (screenshot tooling, docs).

2. **Opinionated wrapper** — `<XStyleEditor layerId? canvasRef? nodeId? />`. Wraps the form, owns Apply/Reset/Dirty state, and commits via `layer.options.<x>.style` field-level resolvers + `layer.rerenderAll()`. Resolves its target in this order:
   - `props.canvasRef?.current` — explicit ref wins,
   - `useCanvas()` from the surrounding `<Canvas>` context — falls back to whichever canvas owns the editor's React tree,
   - throws otherwise.

   This is the **multi-canvas-safe** path. Multiple `<Canvas>` instances on the same page each get their own `CanvasContext`, so an editor *inside* a Canvas tree always addresses that Canvas; an editor *outside* every tree must pass `canvasRef` explicitly.

## Apply model — pending + apply

Edits do **not** stream into the engine. The form buffers them in local state. `Apply` commits; `Reset` restores the last-applied snapshot.

The commit walks every node in `layer.store.nodes()` and calls `store.updateNode(id, { style: { ...resolveNodeStyle(node), ...formPatch } })`. The spread-before-patch is mandatory: per `feedback_updatenode_replaces_style`, `updateNode`'s `style` patch replaces the prior style wholesale; without spreading the resolved style first, every field the form didn't touch would be wiped.

**Known v1 limitation.** `GraphLayer.nodeOption` is **private** with no public setter, and there is **no `rerenderAll()`** method. So we can't edit the layer-level template — only per-node concrete styles. Implication: after Apply, the patched fields no longer flow through layer-level resolvers (e.g. `bgFill: (n) => groupColors[...]`). Resolver-driven styling is overridden by the baked literals. Nodes inserted later still pick up the original template until they are patched. A public `GraphLayer.setNodeOption()` would unlock template-level editing — flagged as a follow-up.

## Rules

- **All form chrome comes from `@invana/ui`.** No raw `<input>`, `<select>`, or `<button>` in editor code — wrap design-kit primitives. The one exception is `<ColorField>`, which is a placeholder shim around `<input type="color">` until a real ColorPicker lands in design-kit.
- **No `pixi.js` imports.** Engine access goes through `@invana/canvas` / `@invana/canvas-react` / `@invana/graph` public types.
- **No module-level state.** Components must be safe with N concurrent `<Canvas>` instances on one page.
- **Theme provider is the host's job.** Editors assume `@invana/themes`'s provider is set up at the app root. Storybook stories wire it via a decorator.
- **Forms are controlled.** Never read engine state mid-form. The wrapper reads it *once* on mount to seed initial values and *once* on Reset.
- **Apply uses `store.updateNode` per node** — see "Apply model" above. The engine currently has no public layer-template setter, so per-node patching is the only path; switch to template editing if `GraphLayer.setNodeOption()` ever lands.

## Scope (v0)

- `<NodeStyleForm>` / `<NodeStyleEditor>` — Geometry, Background, Stroke, Label tabs covering the 80% NodeStyle field set. Icon/image/badges/decorations/effects deferred.
- Primitives: `<ColorField>`, `<NumberField>`, `<SliderField>`, `<SelectField>`, `<SwitchField>`, `<TextField>`, `<DashArrayField>`.

Later: EdgeStyleEditor, behaviour-config editors, layout-config editors, layer-config editors, plus non-editor components (Inspector, CameraControls, LayerStack, Legend, StatusBar, SearchBox, ContextMenu, ToastHost, AppShell).

## No tests

Per `feedback_no_tests_canvas` — verify via Storybook. New editors must ship with a `.stories.tsx` under `apps/storybook/stories/canvas-react-ui-components/`.
