# CLAUDE.md — packages/canvas-ui (`@invana/canvas-ui`)

**The React UI kit for `@invana/canvas`.** Everything the user sees and clicks — components, toolbars, menus, panels, editors, view panels, and the `GraphCanvasApp` shell — built **on** `@invana/canvas-react`'s hooks/context. Because the UI reads/writes `@invana/canvas-store` through those hooks, it's **live by default**: a store change reflects in the UI with no manual wiring. ≈ React Flow's batteries UI (`<Controls>`, `<MiniMap>`, `<Panel>`, `<NodeToolbar>`) over the headless core.

**Split axis (with `@invana/canvas-react`) = headless vs pixels.** If it draws UI the user sees, it belongs here. If it renders `null` / provides a context / is a hook, it belongs in canvas-react. The dependency runs **one direction: canvas-ui → canvas-react** (never re-exported back — that would cycle).

> 🚧 **Migration in progress** (`docs/ui-consolidation-plan.md`). This package was historically "engine-agnostic, editors + views only"; it's absorbing all the React UI that lived in `canvas-react` (components, toolbars, menus, `GraphCanvasApp`, turnkey hooks) and gaining a `@invana/canvas-react` dependency. The rules below describe the **target**; folders fill in over the phased move.

## What this package may import

- ✅ `@invana/canvas-react` — hooks (`useStore`, `useGraphCanvasOptions`, `useGraphCanvasUpdate`, `useZoom`, `useSelection`, …), contexts, and the null-rendering wrappers (`<DevInfoLayer>`, `<MiniMapLayer>`) it re-exposes.
- ✅ `@invana/canvas-store` — **types only** (`CanvasView`, `ReactiveStore`, config shapes) for typing the state it reads.
- ✅ `@invana/graph` — **types only** (`NodeStyle`, `NodeTypeBinding`, `ColorRole`, …).
- ✅ Design kit — `@invana/ui` (chrome), `@invana/forms` (editor fields), `@invana/themes`, `@invana/styling`, `lucide-react` (icons).
- ✅ A specific **layout/behaviour/layer package as a value** *only* when a turnkey UI must instantiate one (e.g. `GraphControlsToolbar` does `new D3ForceLayout()`, so `@invana/graph-layout-d3-force` is a dep). Prefer taking such classes as props/factories; add the dep only when a self-wiring control genuinely constructs one.
- ❌ **Never `pixi.js`**, and never `@invana/canvas` for anything but types. The engine is reached **only** through canvas-react hooks. No `import 'pixi.js'` ever appears here.

## Package layout

```
src/
├─ components/   dumb building blocks — Panel, ToolbarItems, Tooltipped, ControlButton, OptionPicker…
├─ toolbars/     assembled *Toolbar (CanvasControlsToolbar, GraphToolbar, InspectorPanel…)
├─ menus/        context menus (GraphNodeContextMenu…)
├─ panels/       store-connected smart panels (CanvasSettingsPanel, status bars, detail views)
├─ editors/      per-instance schema state-editors — ONE folder per editable engine surface
│  ├─ field-helpers.ts   shared editor schema bits (roleField, SLOT_BINDING_FIELDS)
│  ├─ _shared/           shared editor sub-components (AdvancedSection…)
│  ├─ layers/            one folder per Layer surface (background-layer, minimap-layer, map-layer…)
│  ├─ layouts/           one folder per Layout surface (d3-force-layout, elk-layout…)
│  └─ behaviours/        one folder per Behaviour surface (drag-pan, click-select, *-lod…)
│     └─ <surface>/      each surface folder holds:
│        ├─ <Surface>EditorPanel.tsx   controlled form (defaults/fields/onSubmit)
│        ├─ fields.ts             @invana/forms FieldConfig[] (one array per tab)
│        ├─ mapping.ts            engine encoding ⇄ flat form fields
│        ├─ types.ts
│        └─ index.ts
├─ editor-panels/ high-level / non-1:1 editors (NOT one-per-instance) — the whole-canvas
│                 aggregate (canvas-settings) + graph-domain template editors that edit
│                 template JSON, not one engine instance (node-style{,/simple,/composite},
│                 node-style-overview, node-styling, node-structure, schema, hover-preview-card)
├─ view-panels/  presentational *ViewPanel surfaces (SchemaViewPanel, LayersViewPanel, CanvasFiltersViewPanel, CanvasPagesViewPanel, preview cards) — props in → JSX
├─ apps/         GraphCanvasApp (+ header/footer)
├─ hooks/        UI-only turnkey hooks (useSidePanels — activity-bar for GraphCanvasApp side panels: descriptors → shared-toolbar `items` + active-panel `region`, one docked at a time; useDevTool, useMiniMap)
└─ shared/       colour utils + presets used across tracks
```

One barrel (`index.ts`), sectioned. The folder split is internal organisation — **no subpath exports**; consumers import from the package root, so internal moves don't change the public surface.

**Naming standard — `view-panels/` surfaces carry the `*ViewPanel` suffix.** Every presentational / store-connected view in `view-panels/` is a `*ViewPanel` (`SchemaViewPanel`, `LayersViewPanel`, `CanvasFiltersViewPanel`, `CanvasPagesViewPanel`), one folder per surface, with matching `*ViewPanelProps`. It's the counterpart to the `*Toolbar` / `*EditorPanel` suffixes — a stable, greppable name for "a dockable content surface". (`preview-cards.tsx` is the exception: `NodePreviewCard` / `EdgePreviewCard` are render-prop *content*, not dockable panels.)

**Naming standard — `editors/` surfaces carry the `*EditorPanel` suffix.** Every controlled editor in `editors/<surface>/` is a `*EditorPanel` (`CanvasSettingsEditorPanel`, `NodeStyleEditorPanel`, `HoverPreviewCardEditorPanel`, …), file basename matching the component, with matching `*EditorPanelProps`. It sits alongside the `*ViewPanel` / `*Toolbar` suffixes. (The store-connected wrapper that packages an editor's bridge keeps its own `*Panel` name — e.g. `CanvasSettingsPanel` wraps `CanvasSettingsEditorPanel`.)

## Two component flavours: dumb vs connected

- **Dumb building blocks** (`components/`) — props-in / callbacks-out, **engine-agnostic**, icon-agnostic (icons via a `ToolbarIcon` prop). No hooks, no store. `Panel`, `ToolbarItems`, `Tooltipped`, `ControlButton`, `OptionPicker`. The canvas equivalents of React Flow's `<Panel>` / `<ControlButton>`. Keep them dumb — they're the reusable primitives everything else composes.
- **Connected components** (`toolbars/`, `panels/`, `menus/`, `apps/`, connected editor wrappers) — **self-wiring**: they read live state via canvas-react hooks and write via `useGraphCanvasUpdate().update(...)`. Drop them in with no props and they're live. `CanvasControlsToolbar` self-wires zoom/fit/lock; `<CanvasSettingsPanel/>` reads the whole definition and applies edits. This is where the store coupling lives — so the consumer never hand-writes a bridge.

## Self-wiring: zero-config via context (and multiple canvases on one page)

The point of the connected components is that a consumer drops them into a canvas-react tree and **writes nothing** — they find their canvas themselves. **Every connected component carries its own hook + context resolution; the consumer never passes the store or the canvas in the common case.**

- **Resolution is by React context.** A connected component reads the active engine from `CanvasContext` / `GraphCanvasContext` (provided by canvas-react's `<Canvas>` / `<GraphCanvas>` root, and by `GraphCanvasApp`). Rendered anywhere inside that subtree it auto-binds — no `canvas` prop, no wiring:
  ```tsx
  <GraphCanvas data={graph}>
    <CanvasSettingsPanel />   {/* live, zero config */}
  </GraphCanvas>
  ```
- **Multiple apps on one page are safe — because context is per-provider, not global.** Each `<Canvas>` / `<GraphCanvas>` / `GraphCanvasApp` owns its own provider subtree, so a connected component binds to the **nearest enclosing** root. Two graphs side by side each get their own scoped context and their panels target the right instance automatically. This holds **only** while resolution stays context-based:
  - **Never a module-level / global "current canvas", singleton store, or shared mutable module state.** That is the single thing that breaks multi-instance (see Rules: no module-level state). All state is either the per-canvas store (read via hooks) or local widget state.
- **Explicit override for out-of-tree chrome.** Every connected component also accepts an optional `canvas` prop and resolves `useResolvedCanvas(explicit ?? context)` (helper in canvas-react). Pass it to drive a **specific** instance from *outside* any provider — e.g. one external toolbar controlling one of several canvases. This is a targeting override, not a required prop.
- **Context must be a singleton → `@invana/canvas-react` is a PEER dependency.** The provider (the root, in the host app) and the consumer (a canvas-ui component) must reference the **same** context object. A duplicate copy of canvas-react in the module graph = a different context object = `useCanvas()` returns `null` even inside a root. Keep canvas-react a **peer** (deduped, single version) so there is one shared instance; that is why it is a peer, not a bundled dependency.

New connected component checklist: (1) resolve via `useResolvedCanvas(props.canvas ?? context)` — never a global; (2) `canvas` prop optional; (3) no module-level state; (4) works unchanged with two instances mounted on one page.

## Editors: form-generator (fields + mapping, not hand-authored JSX)

Each editable surface is described by data, not bespoke fields. **Every Behaviour / Layer / Layout in the engine gets an editor here** (root rule 12) — its constructor options *are* the editable **state of the visualisation**.

- **`fields.ts`** — `@invana/forms` `FieldConfig[]` (one array per tab/section). `{ name, type: 'text'|'number'|'boolean'|'color'|'select'|'icon', label?, options?, min?, max?, step?, presetColors?, … }`. `<FormField.ObjectField control={control} name="style" fields={…}/>` renders the sub-form; leaf `name`s map 1:1 to the form-fields type and register at RHF path `style.<name>`.
- **`mapping.ts`** — the load-bearing bridge (`styleToForm` / `formToStyle`) between the engine encoding and flat scalar fields: colour `number (0xRRGGBB)` ⇄ hex string (via `shared/color`), dash tuple `[dash,gap]` ⇄ two fields, the shape **discriminated union** ⇄ a `shapeKind` select + per-kind geometry, with `typeof === 'number'` guards so non-colour fills round-trip untouched. Discriminated unions render via a watched discriminator → dynamic `fields` array (`geometryFields(shapeKind)` driven by `useWatch`).

Adding a control = one `FieldConfig` + one key in the fields type + one line each way in `mapping.ts`. No new JSX.

### Controlled editor + connected wrapper (the two layers)

Each surface ships a **controlled** editor and (where it edits live state) a **connected** wrapper:

- **Controlled** `<XEditorPanel>` — a self-contained form: owns `useForm`, loads `defaults` on mount, renders the schema inside `<FormProvider>`, and on **Apply** calls `onSubmit(getValues())`. Holds **no engine reference, does no commit** — pure `defaults`/`fields`/`onSubmit` (or `definition`/`onChange` for the aggregate `CanvasSettingsEditorPanel`). Testable/standalone in Storybook, no engine.
  ```tsx
  <NodeStyleEditorPanel defaults={styleToForm(style)} onSubmit={(v) => apply(formToStyle(v))} />
  ```
- **Connected** wrapper — a thin engine-aware component that seeds the controlled editor from the live store (canvas-react hooks) and writes patches back with `useGraphCanvasUpdate().update(...)`. Drop it in with no props → live. This packages the per-consumer bridge **once** (e.g. `<CanvasSettingsPanel/>` = the store-wired `CanvasSettingsEditorPanel`). See `node-style-live-binding-plan.md` for the `useNodeStyleEditor` precedent.

When applying to a graph store, spread before patching (`updateNode` replaces `style` wholesale):
```ts
store.updateNode(id, { style: { ...resolveNodeStyle(node), ...formToStyle(values) } });
```

## Design-kit styling (all components)

- **Chrome from `@invana/ui` / fields from `@invana/forms`.** No raw `<input>` / `<select>` / `<button>` in component code. Editors: `FormField.ObjectField`, `Field.*`; `Button` from `@invana/ui`.
- **No hand-rolled CSS (root rule 13).** No inline `style={{…}}` / `CSSProperties` consts for *static* presentation — use `@invana/ui` components (`Card`, `Separator`, `Badge`, …) + Tailwind design-token classes via `className` (`flex gap-4 p-4 bg-card text-muted-foreground`). Inline `style` is allowed **only** for a dynamic runtime value Tailwind can't express (computed colour, cursor coordinate, prop-driven pixel size). `view-panels/preview-cards.tsx` is the reference.
- **Default to the design-kit look** — `@invana/ui` chrome + its Tailwind design tokens (`primary`, `accent`, …). Assume the design-kit Tailwind theme is present; don't engineer around its absence.
- **Active / selected / toggled** toolbar buttons: reuse the shared `ACTIVE_CLASS` (`bg-primary/15 text-primary ring-1 ring-primary/25`) over a `'ghost'` Button — a subtle tint + ring, **not** a solid `'default'` fill. For the selected item inside a dropdown/radio picker use the lighter `ACTIVE_MENU_ITEM_CLASS` (`text-primary font-medium`) on the active `DropdownMenuRadioItem`. Both exported from `ControlButton`; don't hand-roll per-component active styles.
- **Tooltips:** every interactive control surfaces its `title`/`label` as a real `@invana/ui` (Radix) tooltip via the shared `Tooltipped` wrapper (self-contained `TooltipProvider`), with an optional `tooltipSide` prop.
- **Toolbar recipe:** a self-wiring toolbar consumes a hook, renders dumb components inside a `<Panel>`, accepts an optional `canvas` prop (drive an external canvas via `bare` + explicit `canvas`), and ends its name in `Toolbar`.

## Rules

- **No `pixi.js`; no `@invana/canvas` beyond types.** Reach the engine only through `@invana/canvas-react` hooks/context. `@invana/canvas-store` and `@invana/graph` are **types-only**.
- **Dumb blocks stay dumb** (`components/`): no hooks, no store, no engine — props in / callbacks out. Store wiring lives in the connected components (`toolbars/`, `panels/`, `menus/`, `apps/`, connected editor wrappers).
- **Connected components resolve the canvas via context, never a global.** `useResolvedCanvas(props.canvas ?? context)`; optional `canvas` prop for out-of-tree targeting. This is what makes multiple canvases on one page work — see the self-wiring section.
- **No module-level / shared mutable state.** Every component must be safe with N concurrent canvases on one page. No singleton store, no global "current canvas".
- **`@invana/canvas-react` stays a peer dependency** (single, deduped instance) so the context object is shared between the host's root and this package's consumers — a duplicate copy silently breaks `useCanvas()`.
- **Theme is global CSS tokens**, wired at the host app root — `@invana/themes/styles.css` then `@invana/ui/styles.css` (order matters). There is **no React `<ThemeProvider>`** in this package; don't add one. Storybook wires the stylesheets in `.storybook/preview.ts`.
- New Behaviour / Layer / Layout ⇒ new `editors/<category>/<surface>/` where `<category>` is `behaviours` / `layers` / `layouts` (root rule 12). High-level / non-1:1 editors (the whole-canvas aggregate, graph-domain template editors) live in the top-level `editor-panels/` (a sibling of `editors/`, not nested under it).

## No tests

Per `feedback_no_tests_canvas` — verify via Storybook. **Don't create or modify stories unless explicitly asked** (root `CLAUDE.md` rule 11); when a story *is* requested, it goes under `apps/storybook/stories/canvas-ui/`.
