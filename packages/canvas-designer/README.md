# @invana/canvas-designer

The visual **designer** for `@invana/canvas` — design a graph visualization by editing its
definition in place. Today it ships one surface: the **node template** designer — WYSIWYG
composite-card authoring (drag elements, layers, undo/redo, save/load) that emits a
`FreeformStructure` (pure JSON) rendered as the engine's `composite` shape.

> **Today:** node template authoring (in `src/templates/`), headless. **Planned:** edge
> templates + the studio shell and per-surface designers for layouts / behaviours / layers
> (each hosting an `@invana/canvas-ui` editor). See [`roadmap.md`](../../roadmap.md).

## Where it fits

This is the **authoring** layer of the card/template stack — most apps only ever *render*
templates, which needs nothing here (just `@invana/graph`'s `FreeformStructure` +
`compileFreeform`). Install this package **only** when end-users should *design* their own
node cards:

```
CompositeShape  (engine primitive, @invana/canvas)
   ▲ rendered by
FreeformStructure + compileFreeform  (template model, @invana/graph)
   ▲ authored by
@invana/canvas-designer     ← this package (emits FreeformStructure JSON)
```

## Install

```bash
pnpm add @invana/canvas-designer
# peers: react, react-dom, react-hook-form, @invana/graph, @invana/ui, @invana/forms, @invana/canvas-ui
```

## Usage

It's headless: it emits a `FreeformStructure` via `onChange` / `onSubmit`, and the host
applies it to the live canvas.

```tsx
import { NodeCardDesigner, NodeTemplateList } from '@invana/canvas-designer';

// pick a starter template, then design it
<NodeTemplateList onEdit={(t) => setTemplate(t)} /* … */ />

<NodeCardDesigner
  defaults={template}
  dataFields={FIELDS[type]}      // bindable data fields for the node type
  palette={palette}              // theme colours for the live preview
  onChange={(structure) => {
    // apply live — the designer never touches the engine itself
    canvas.update({ layers: { graph: { nodeStructureTemplates, nodeTypes } } });
  }}
/>
```

## Exports

- **`NodeCardDesigner`** — the WYSIWYG builder: element palette (text / rect / circle / line /
  image), drag canvas with themed live preview, layers panel (z-order, show/hide, delete),
  undo/redo (⌘/Ctrl+Z), save/load JSON.
- **`NodeTemplateList`** — gallery of built-in starter templates (authoring presets) with live
  thumbnails and an edit action.
- **`CardPreview` / `CardElementView`** — read-only renderers for a `FreeformStructure`.
- **`useHistory`** — generic undo/redo hook (transient `set` vs recorded `commit`).
- **Field schemas + mappers** — `CARD_FIELDS`, `elementFields`, `cardToForm` / `applyFormToCard`,
  `elementToForm` / `applyFormToElement`, `templateToJson` / `parseTemplate`, `newElement`, etc.

## Notes

- **Headless / engine-agnostic** — no `@invana/canvas` / `@invana/canvas-react` / `pixi.js`
  imports; the only `@invana/graph` use is its types. Output is JSON via callbacks; the host
  applies it (`canvas.update({ layers: { graph: { nodeStructureTemplates, nodeTypes } } })`).
- Property panels come from `@invana/forms`; shared form helpers from `@invana/canvas-ui`.

See the repo [`roadmap.md`](../../roadmap.md) for direction and status.
