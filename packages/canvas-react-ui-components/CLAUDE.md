# CLAUDE.md — packages/canvas-react-ui-components (`@invana/canvas-react-ui-components`)

React UI components — style editors, panels, controls — for tools that use `@invana/canvas-react`. Forms are **generated from declarative schemas** with the `@invana/forms` design-kit form-generator; chrome comes from `@invana/forms` / `@invana/ui` so the visual language is consistent across all Invana tools.

**Components are headless & engine-agnostic.** They edit a **style object** against a consumer-owned react-hook-form instance and know nothing about where that style comes from or goes — no `Canvas`, no engine, no commit. The consumer seeds the form and reads edits back, then applies the result however it likes (live, behind an Apply button, an undo stack, a preview). Keep it that way: no `@invana/canvas` / `@invana/canvas-react` / `pixi.js` imports — the only `@invana/graph` use is the `NodeStyle` *type*.

## Package layout

```
src/
├─ utils/color.ts        numberToHex / hexToNumber (engine 0xRRGGBB ↔ #rrggbb)
├─ presets/colors.ts     COLOR_PRESETS — shared swatch palette
├─ editors/<surface>/    one folder per editable surface (node-style, …)
│  ├─ <Surface>Editor.tsx
│  ├─ fields.ts          @invana/forms FieldConfig[] (one array per tab)
│  ├─ mapping.ts         Partial<NodeStyle> ⇄ flat form fields (styleToForm / formToStyle)
│  ├─ types.ts
│  └─ index.ts
└─ index.ts
```

Shared things (colour utils, presets) live at package level; everything specific to one surface lives in its `editors/<surface>/` folder.

## Form-generator: fields + mapping, not hand-authored JSX

Each editable surface is described by data, not bespoke fields:

- **`fields.ts`** — `@invana/forms` `FieldConfig[]` (one array per tab / section). A `FieldConfig` is `{ name, type: 'text'|'number'|'boolean'|'color'|'select'|'icon', label?, options?, min?, max?, step?, presetColors?, … }`. `<FormField.ObjectField control={control} name="style" fields={…} />` renders the whole sub-form. Field `name`s match the form-fields type 1:1, and `<ObjectField name="style">` registers each leaf at the RHF path `style.<name>`.
- **`mapping.ts`** — the load-bearing bridge (`styleToForm` / `formToStyle`) between the engine's encoding and the flat scalar fields the generator renders. It is **not optional polish**:
  - colour `number (0xRRGGBB)` ⇄ hex string (the swatch emits `#rrggbb`) — via `utils/color`,
  - dash tuple `[dash, gap]` ⇄ two number fields,
  - the shape **discriminated union** ⇄ a `shapeKind` select + per-kind geometry numbers,
  - `typeof === 'number'` guards so non-colour fills (image / glyph / stacked layers) round-trip as `undefined` and are left untouched.
- Discriminated unions render via a **watched discriminator → dynamic `fields` array** (see `geometryFields(shapeKind)` driven by `useWatch('style.shapeKind')`). `FieldType` has no array/point type, so `polygon.vertices` and custom shapes stay out of the generated fields (escape hatch / future work).

Adding a control = one `FieldConfig` in `fields.ts` + one key in the `NodeStyleFields` type + one line each way in `mapping.ts`. No new JSX.

## The component API — `defaults` + `fields` + `onSubmit`

Each surface ships **one** `<XStyleEditor>` that is a self-contained form:

```tsx
<NodeStyleEditor
  defaults={styleToForm(someStyle)}                 // initial values (loaded once)
  onSubmit={(values) => apply(formToStyle(values))} // your logic — runs on Apply
  // fields={…}                                      // optional; overrides the schema
/>
```

- It **owns** the `useForm` internally, loads `defaults` on mount, renders the schema with `<FormField.ObjectField>` inside `<FormProvider>` (required — `@invana/forms`' leaf fields read `useFormContext()`), tracks edits, and on **Apply** calls `onSubmit(getValues())`.
- `fields` defaults to the built-in grouped NodeStyle schema (`nodeStyleFields`, which renders Geometry/Background/Stroke/Label as accordion sections). It accepts a `FieldConfig[]` **or** a `(values) => FieldConfig[]` function — the function form is how the geometry inputs vary with the watched `shapeKind`.
- It holds **no engine reference** and does **no commit** — it just produces values in the shape the `fields` define.

## The consumer owns seed + submit logic

The package gives two pure mappers over `Partial<NodeStyle>`; everything else is the consumer's:

- **Seed**: `styleToForm(someStyle)` → `NodeStyleFields` → pass as `defaults`. (To reload, remount via `key`.)
- **Submit**: inside `onSubmit(values)`, `formToStyle(values)` → a pruned `Partial<NodeStyle>` (only the fields the form set, safe to spread).

What `onSubmit` does with that style is out of scope here — preview it, store it, push to an undo stack, or apply to a graph. *If* applying to an `@invana/graph` store, spread before patching (per `feedback_updatenode_replaces_style`, `updateNode` replaces `style` wholesale):
```ts
store.updateNode(id, { style: { ...resolveNodeStyle(node), ...formToStyle(values) } });
```
The Storybook story is the reference — a standalone editor whose `onSubmit` feeds a live preview, no engine.

## Rules

- **All form fields come from `@invana/forms`** (`FormField.ObjectField`, `Field.*`); the `Button` comes from `@invana/ui`. No raw `<input>`, `<select>`, or `<button>` in component code.
- **The component owns its form but nothing else.** It creates the `useForm` from `defaults`, but holds **no engine/layer/commit logic** — output is via the `onSubmit` callback only.
- **No engine imports.** No `@invana/canvas`, `@invana/canvas-react`, or `pixi.js`. The only `@invana/graph` use is the `NodeStyle` **type** (in `types.ts` / `mapping.ts`).
- **No module-level state.** Components must be safe with N concurrent instances on one page.
- **Theme provider is the host's job.** Theming is global CSS tokens — `@invana/themes/styles.css` then `@invana/ui/styles.css` (order matters), wired at the app root. There is **no React `<ThemeProvider>`**; don't introduce one. Storybook wires the stylesheets in `.storybook/preview.ts`.

## Scope (v1)

- `<NodeStyleEditor>` — Geometry (shape-kind select + dynamic per-kind geometry + unified `size`), Background, Stroke, Label sections (accordion) covering the 80% `NodeStyle` field set. Icon / image / badges / decorations / effects deferred.
- `fields.ts` (`nodeStyleFields`, `geometryFields`, `BACKGROUND_FIELDS`, `STROKE_FIELDS`, `LABEL_FIELDS`) + `mapping.ts` (`styleToForm`, `formToStyle`, `defaultShapeFor`) + shared `presets/colors.ts` (`COLOR_PRESETS`) and `utils/color.ts` are exported for custom hosts.

Later (each = fields + mapping + engine + editor, same pattern): `EdgeStyleEditor` (mirror of node — `store.updateEdge` + `resolveEdgeStyle`), canvas/background editor (target `BackgroundLayer.setOptions`), layout-config editors (recreate-and-rerun until `Layout.setOptions` lands), behaviour-config editors (`setOptions` where it exists, else re-register), plus non-editor components (Inspector, CameraControls, LayerStack, Legend, StatusBar, SearchBox, ContextMenu, ToastHost, AppShell). Toolbars are **not** forms — they'll be a separate `@invana/ui`-actions track.

## No tests

Per `feedback_no_tests_canvas` — verify via Storybook. New editors must ship with a `.stories.tsx` under `apps/storybook/stories/canvas-react-ui-components/`.
