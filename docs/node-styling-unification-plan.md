# Node styling unification plan — simple + composite

**Status:** planned. Goal: one tiny, semantic styling API in the **graph layer**
that styles **both** simple shapes and composite (card/template) nodes, hiding
the verbose canvas `NodeStyle` / `CompositeSpec`. The unifying knob is
`primaryColor`.

Related: [`node-edge-options-plan.md`](./node-edge-options-plan.md) (render-shape
decisions), [`canvas-templates-plan.md`](./canvas-templates-plan.md) (templates
+ theming), [`data-types-instances.md`](./data-types-instances.md) (NodeData /
NodeOption split).

---

## 1. Motivation

A graph has two node kinds today, styled two different ways:

- **Simple shapes** — `node.style.shape = { kind: 'circle', radius }` + ~40 flat
  `NodeStyle` fields (`bgFill`, `bgStrokeColor`, `labelText`, …).
- **Composite / template nodes** — a `composite` shape built from `parts` by a
  spec-driven builder (the `CompositeCard`/template classes in
  `packages/graph/src/cards/`).

Both are more surface than a typical user wants. The ask: a **semantic layer on
top** — a handful of knobs that mean the same thing for a circle and a card, so
`node.style = { primaryColor: 0x2563eb }` recolours either. The full `NodeStyle`
stays as a power-user escape hatch; the canvas specs stay untouched underneath.

## 2. Decisions (design review, 2026-07-10)

1. **One `GraphLayer`.** Node *kind* is a per-node property (shape `kind`, group
   flag), **not** a layer split. In this engine a Layer is a *rendering surface*
   (`WorldLayer` vs `ScreenLayer`; background / minimap / overlays) chosen by
   "moves with the world vs glued to screen" — not by node type. Splitting
   simple / composite / group into layers would fragment edges, selection,
   hover, drag and layout for no rendering benefit.
2. **Composite is a shape kind extending `CompositeShape`** (which extends
   `ShapeBase`) — an *extended* simple shape, registered in the same shape
   registry (`registerShape`). It is not a separate concept.
3. **Size model differs, by design.** Simple shapes carry a scalar `size`
   (mapped to radius / w-h, scalable 2×/3× by `NodeSizeLODBehaviour`). Composite
   shapes have **explicit `width`/`height`** and no scalar scale —
   `normalizeShapeSize` passes composite through untouched and it implements no
   `scaleSpec`, so the size-LOD scaler skips it. Uniformly scaling a structured
   card is meaningless; you set its dimensions. This split is intended.
4. **Templates = spec-driven code classes** (the current `CompositeCard`
   pattern): structure in overridable `protected` section methods, styling in a
   typed spec. A fully **declarative** template form (parts-in-spec, no code) is
   deferred (§7).
5. **Content-LOD is composite-specific and lives in the template.** Hiding
   columns/rows at low zoom is *semantic zoom* — a different axis from geometric
   size-LOD. Modelled as per-part zoom ranges (`minZoom`/`maxZoom`, mirroring the
   existing label LOD) and/or discrete template tiers, driven by a small
   `CompositeLODBehaviour`. Deferred (§7).
6. **Simple knob set:** `primaryColor`, `label`, `showLabel`, `size`, `icon`,
   `shape`. `primaryColor` accepts a raw `number` **or** a `ColorRole` resolved
   against the active theme.

## 3. Design

### 3.1 `NodeStyleSimple` (graph, opt-in, additive)

```ts
interface NodeStyleSimple {
  /** Simple kind (`'circle'` / `'rect'` / …) OR a registered composite template name. */
  shape?: string;
  /** THE unifying knob — raw 0xRRGGBB or a ColorRole ('accent' etc.). */
  primaryColor?: number | ColorRole;
  /** Label text (simple) / card title (composite). String or resolver. */
  label?: string | ((data: unknown) => string);
  /** Show the label — simple nodes only. */
  showLabel?: boolean;
  /** Scalar size — simple nodes only (composite uses explicit w/h). */
  size?: number;
  /** Optional glyph / svg-url icon. */
  icon?: string;
}
```

`options.node.style` and per-node `style` accept **`NodeStyleSimple` OR the full
`NodeStyle`** (escape hatch). Detection: presence of any `NodeStyleSimple`-only
field (e.g. `primaryColor`) routes through the simple resolver; otherwise the
value is treated as the full `NodeStyle` as today. (Exact discrimination — a
`kind`/marker vs structural sniffing — settled in Phase 1.)

### 3.2 Resolution — same knob, per kind

| Knob | Simple shape | Composite template |
|---|---|---|
| `primaryColor` | `bgFill` | the template's primary/accent (header band, accent bar, …) |
| `label` | `labelText` | card title |
| `showLabel` | label on/off | — (content *is* the card) |
| `size` | scalar → radius / w-h | — (explicit w/h) |
| `icon` | inset glyph | header icon |
| `shape` | shape `kind` | template name (registered composite kind) |

`primaryColor`: `number` → used directly; `ColorRole` → resolved via the
existing theme role palette (`themePalette`). The graph layer's
`resolveNodeStyle` runs this simple → concrete `NodeStyle` pass **before** the
existing merge, so the flat fields remain the internal representation the
renderer sees.

### 3.3 Composite templates take `primaryColor`

Each template's styling spec gains a `primaryColor` input; the template derives
its palette from it (e.g. `header = primaryColor`, `accent = primaryColor`, chip
colours fixed/semantic). So one knob restyles the whole card. Templates are
registered as shape kinds:

- `compositeTemplateCtor(template): ShapeCtor` — a class `extends CompositeShape`
  whose `draw(spec)` calls `template.build(spec.data, spec.config)` → composite →
  `super.draw`; `static boundsOf(spec)` returns the built size (data-dependent →
  recomputed) so ELK/layouts size it.
- `registerCompositeTemplate(kind, template)` sugar over `registerShape`.
- `GraphLayer` auto-registers the built-in templates on mount; consumers register
  their own the same way.
- Per-node usage: an explicit data resolver
  `shape: (n) => ({ kind: '<template>', data: n.data, config })`, **or** the
  simple style `shape: '<template>'` + `primaryColor` (graph builds the spec).

Data reaches the shape via the resolver (per-node `data` → the shape spec) — the
inherent bridge for data-driven composites; no auto-injection magic.

## 4. Layering summary

```
NodeStyleSimple  (6 semantic knobs — the everyday surface)      ← NEW
      │ resolve (per kind; roles → theme)
      ▼
NodeStyle  (flat ~40 fields — power-user escape hatch)          ← unchanged
      │ project
      ▼
canvas shape spec  (RectSpec / CircleSpec / CompositeSpec)       ← unchanged
```

## 5. Implementation phases

1. **`NodeStyleSimple` + resolver (graph), simple shapes.** Type + the
   simple→`NodeStyle` mapping (primaryColor→bgFill incl. role resolution,
   showLabel, size, label, icon, shape kind). `options.node.style` accepts either
   form. Editor-agnostic; renderer untouched.
2. **Composite templates as shape kinds.** `compositeTemplateCtor` +
   `registerCompositeTemplate` + built-in auto-registration + `static boundsOf`.
   Add `primaryColor` to the template specs; derive palettes.
3. **Wire simple → composite.** `shape: '<template>'` + `primaryColor` resolves
   into the composite shape spec + config.
4. **Simple editor (canvas-ui, rule 12).** A tiny `NodeStyleSimpleEditor` —
   primaryColor swatch (+ role select), showLabel toggle, size, shape picker
   (simple kinds + registered templates). Emits `NodeStyleSimple`.
5. **Stories.** One `primaryColor` knob restyling a circle **and** a composite
   side by side; the simple editor in `GraphCanvasApp`.
6. **(Later) Content-LOD.** Per-part `minZoom`/`maxZoom` on composite parts +
   `CompositeLODBehaviour` (or template tiers) for semantic zoom.

## 6. Risks / open

- **`NodeStyleSimple` vs `NodeStyle` on one field** — need unambiguous precedence
  / detection so a user isn't surprised which wins (Phase 1).
- **`primaryColor` → composite palette** — each template must define how the one
  colour maps to its elements; document the convention.
- **`boundsOf` recompute** — cheap (builds the spec, reads w/h), but note it runs
  per layout query.

## 7. Deferred (not this plan)

- **Declarative template form** — a composite type defined entirely by a spec
  (`parts` + style + data/colour bindings, no code). Generalises/ revives
  `FreeformStructure`; needs colour bindings. Revisit after the code-template +
  simple-styling surface lands.
- **Content-LOD** — phase 6 above; its own follow-up.
- **More knobs** — `secondaryColor` / `borderColor` / `labelPosition` as needed.
