# Designer Studio — plan

> **Status: DESIGN / ROADMAP — not shipped.** Plan for the **Designer** studio page
> and the editor UI it needs. The Designer is a **consumer** of the reactive state
> layer — that foundation (the data model, the `ReactiveStore` port, telemetry,
> collaboration) lives in **[canvas-state-plan.md](./canvas-state-plan.md)** and is
> **not** restated here. This doc owns what sits *on top*: the editor kit, the
> per-class editors, and the page.

## Goal

A **Designer** page in the Invana Studio — a sibling of **Explorer** — where the
user edits the *state of the visualisation*: its **layers, behaviours, and
layouts**. Both pages are **arrangements of `GraphCanvasApp`**
([graph-canvas-apps-plan.md](./graph-canvas-apps-plan.md)): the app owns the hard
part (engine lifecycle, `<Canvas>`, theme, layout, lifted context, the default
graph bundle); a *page* is `GraphCanvasApp` + the chrome composed around it.

- **Explorer** = `GraphCanvasApp` + *viewer* chrome (toolbar, minimap, a **read**
  inspector via `ClickViewBehaviour panel`, context menus).
- **Designer** = `GraphCanvasApp` + *authoring* chrome: a **Scene tree** (left), a
  **state Inspector** (right, the rule-12 editors), a **Data/Query dock** (bottom,
  later), **presence** (later). Same engine, different frame.

The defining idea: **a scene tree + an inspector, both bound to the one reactive
store** (`view` — see canvas-state-plan). Selecting a scene node resolves
to its editor; editing writes a declarative `update(patch, action)`; viewers
re-render. The Designer **writes only `view.definition`** — that's what
keeps editors engine- and renderer-agnostic.

## Decisions locked

| # | Decision |
|---|---|
| L1 | **Shell home = `@invana/canvas-designer`.** CLAUDE.md names it the planned home for the studio shell + the layout/behaviour/layer designers hosting `@invana/canvas-ui` editors. Designer joins the node-template surface in `src/templates/`. |
| L2 | **State foundation first.** The reactive store ([canvas-state-plan.md](./canvas-state-plan.md), branch `feat/canvas-state`) lands before any Designer UI — every scene-tree row and editor binds to it. |
| L3 | **Docks live in `canvas-designer`, not `GraphCanvasApp`.** The shared app keeps its header/main/footer regions; `DesignerPage` puts `<GraphCanvasApp>` in the centre cell of its own grid with Scene/Inspector columns flanking. (Adding `left`/`right` region slots to `GraphCanvasApp` — rejected for now.) |
| L4 | **Editors stay in `@invana/canvas-ui` (engine-agnostic, rule 12).** `canvas-designer` only *hosts* them. Layering: `canvas-designer` → `canvas-react` (`GraphCanvasApp`) + `canvas-ui` (editors) → `canvas-state` (the store). |
| L5 | **`canvas-designer` ships panels + an assembled `DesignerPage`.** The multi-page Studio shell (Explorer/Designer/Modeller switcher) lives in the product app, not this repo. |
| L6 | **Editors are draft + Apply by default, live opt-in.** Edits buffer and commit on Apply; only fields flagged `live` patch immediately. Init-only options remount via the canvas-react wrapper. |

## Milestones (consume canvas-state)

> Prereq: **canvas-state S1** (the reactive store) must land first — see
> [canvas-state-plan.md](./canvas-state-plan.md). The Designer milestones below sit
> on it. Telemetry (S2) and collaboration (S3) are foundation work, not Designer
> work — the Designer gets them for free once they land, no UI change.

### D1 — Editor kit (reusable pieces, `@invana/canvas-ui`)

Editors are schema-driven on `@invana/forms`, so **most controls are `FieldConfig`
entries, not React components** (see `node-style/fields.ts`). The genuinely-new
reusable pieces:

- **Tier 1 — domain field controls `@invana/forms` lacks:**
  - **Instance-reference picker** — rule-8 cross-layer fields (`targetLayerId`,
    `graphLayerId`, every `*LayerId`); options from the **live scene**, so not a
    static `select`. *The most important new control.*
  - **Palette editor** (color[]) — `ColorByLabelBehaviour.palette`, theme palettes.
  - **Color-role select** — promote the existing `roleField` / `COLOR_ROLE_OPTIONS`
    (`editors/field-helpers.ts`) from template-only to shared.
  - **Data-path / field binding** — generalize the existing `SlotBindingField`.
  - **Vector / point (x,y)** — offsets/anchors as one labelled row.
  - **Variant-group helper** — generalize the `shapeKind`→per-kind pattern
    (`geometryFields`) for layout/background discriminated unions.
- **Tier 2 — editor scaffolding** (abstract from the 4 existing editors):
  - **`<StateEditor>`** — `{ defaults, fields, mapping, value, onChange }`; renders
    the `@invana/forms` form, maps form-shape ↔ options-shape via `mapping.ts`.
  - **`EnabledHeader`** — toggle + title (every behaviour has `enabled`, rule 7).
  - **Live vs draft apply** (L6) — a scaffold mode; `init-only` fields force draft.
- **Tier 3 — the resolver that makes the Inspector generic:**
  - **Editor registry** — `{ kind, type, id }` → `{ defaults, fields, mapping }`;
    `ThemeBehaviour` is the reference entry.
  - **`useEditorFor(node)`** — resolves the entry, binds it to that node's
    `view.definition` slice (`useStore` read + `update` write).

Build the **instance-ref picker** + **`<StateEditor>`** first (they unblock
everything), with 2–3 reference editors (`ThemeBehaviour`, `GraphLayer`,
`D3ForceLayout`) proving the end-to-end loop.

### D2 — Per-class editor fan-out (rule 12)

One `editors/<surface>/` (`fields.ts` + `mapping.ts` + `<Editor>`) per remaining
Layer / Behaviour / Layout — each a `<StateEditor>` + a schema. Volume, not new
primitives. New behaviour/layer/layout from here on ships its editor with it.

### D3 — Designer page (`@invana/canvas-designer`)

- **`SceneTreePanel`** (+ `SceneTreeGroup` / `SceneTreeRow`) — Layers / Behaviours /
  Layouts / Data outliner; enable+visibility toggles; select-to-edit. Reads
  `view` via `useStore`; writes via `update`.
- **`InspectorHost`** — `useEditorFor(selected)` + `<StateEditor>` + empty state.
- **`DesignerPage`** — assembled page: `<GraphCanvasApp>` centre cell, Scene /
  Inspector columns flanking (L3), optional `DataQueryDock` (later).
- The existing **`NodeCardDesigner`** (`src/templates/`) becomes one tool/tab inside
  the page.

## Component inventory at a glance

| Component | Package | Role |
|---|---|---|
| `DesignerPage` | canvas-designer | assembled page (GraphCanvasApp + docks) |
| `SceneTreePanel` / `SceneTreeGroup` / `SceneTreeRow` | canvas-designer | left outliner; select-to-edit |
| `InspectorHost` | canvas-designer | hosts the resolved editor |
| `DataQueryDock` | canvas-designer | bottom query/pipeline (backend-coupled, later) |
| `PresenceBar` | canvas-designer | collaboration cursors/status (later) |
| `NodeCardDesigner` *(exists)* | canvas-designer | template surface, now a tool inside the page |
| `<StateEditor>` / `EnabledHeader` / editor registry / `useEditorFor` | canvas-ui | the editor kit (D1) |
| instance-ref picker / palette editor / vector / variant-group | canvas-ui | domain field controls (D1) |
| per-class `editors/<surface>/` | canvas-ui | the rule-12 fan-out (D2) |

## Open questions

1. **`DesignerPage` deliverable scope** — ship the assembled one-liner page *and*
   the panel pieces (lean: both — the one-liner is how Explorer is consumed).
2. **Live-apply granularity** — which options are safe live vs `init-only`? Needs a
   per-option flag in the editor registry (L6).
3. **Explorer = the existing Visualiser arrangement?** Confirm so Designer mirrors
   its assembly. *Lean: yes.*
4. **Data/Query dock** — deferred until the collaboration/backend channel
   (canvas-state S3); first Designer cut is Scene + Inspector only.

## Relationship to other docs

- **[canvas-state-plan.md](./canvas-state-plan.md)** — the state foundation the
  Designer consumes (data model, port, telemetry, collaboration). **Read first.**
- [graph-canvas-apps-plan.md](./graph-canvas-apps-plan.md) — the `GraphCanvasApp`
  both Explorer and Designer sit on.
</content>
