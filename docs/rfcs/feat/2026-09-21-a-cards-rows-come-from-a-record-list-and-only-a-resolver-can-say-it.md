---
id: feat-2026-09-21-a-cards-rows-come-from-a-record-list-and-only-a-resolver-can-say-it
type: feat
title: A card whose rows come from a variable-length list on the record is only expressible as a shape resolver, so its structure cannot be data
status: proposed
opened: 2026-09-21
decided: null
landed: null
packages: [pkg:@invana/graph, pkg:@invana/graph-datasets, pkg:@invana/canvas-designer, pkg:@canvas/storybook]
design_of_record: doc:docs/node-styling-unification-plan.md
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/data-model/SchemaTable }
  - { predicate: manifests-in, object: dataset:starSchema }
  - { predicate: relates-to, object: doc:docs/node-styling-unification-plan.md }
---

## Summary

| | |
|---|---|
| **Goal** | `<GraphCanvasApp data={starSchema} config={starSchemaSettings} />` draws the ER tables with **no code in the story** — dataset JSON in, structure JSON in, pixels out |
| **Why it isn't today** | A table card is *n* rows, one per entry in that record's own `data.fields`. `sym:FreeformStructure` is a **fixed** list of absolutely-positioned elements at a **fixed** `height`. There is no way to say "repeat this group once per item of a bound array", so the only door left is `node.style.shape = (node) => CompositeShapeOption` |
| **Scope of the hole** | `R1` repeat · `R2` auto height · `R3` icon element · ~~`R4` value-keyed lookup~~ **(landed elsewhere)** · `R5` per-item `hitId` · `R6` per-row hover |
| **What this is not** | **Not** a `schema` / `table` structure kind. A repeater over a bound array is domain-free — see `P4` and `D3` |
| **Blocked on** | `D1` where the per-type header colour comes from · `D2` whether row hover stays story code · `D3` whether this reopens a settled decision |
| **Row status** | proposed 8 · **landed 1** (`R4`, landed by `rfc:feat-2026-09-21-only-colour-can-be-driven-by-a-second-data-field` on 2026-09-21) · rejected 0 |

`rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks` closed the
*per-type* half of this problem — a constant keyed by `type` now has a slot. This is the
other half: a value that is genuinely **per-instance and variable-length**, which that
RFC explicitly left to the resolver (`M1`'s honest exception). The claim here is that it
is not honest after all — it is a *repeater*, and a repeater is data.

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The dataset is already fully JSON, and already carries the whole table payload — `name` · `icon` · `headerColor` · an ordered `fields[]` of `{ name, type }` | `file:packages/graph-datasets/src/usecase-demos/star-schema/data.ts#L24-L94` | Nothing about the *data* half of the request is missing |
| M2 | `dataset:starSchemaSettings` documents the hole in its own TSDoc: *"composite cards built from each node's `fields` list, **which no serialisable setting can express** — a consumer supplies the `shape` resolver"* | `file:packages/graph-datasets/src/usecase-demos/star-schema/data.ts#L97-L110` | The dataset package already knows its recommended config is incomplete |
| M3 | So the story hand-builds the card: 130 lines of `sym:buildTable`, ~11 `CompositePart`s per node plus 5 per field | `file:apps/storybook/stories/usecases/by-casestudies/data-model/SchemaTable.stories.tsx#L209-L312` | The geometry constants (`WIDTH` `PAD` `RADIUS` `HEADER_H` `ROW_H` `BODY_BG` `NAME_COLOR` `TYPE_COLOR` `TYPE_CHIP`) live in a `useMemo` closure — unsaveable, uneditable, invisible to `sym:CanvasSettingsEditorPanel` |
| M4 | Every part `buildTable` emits already exists in the engine's `sym:CompositePart` vocabulary — `rect` `circle` `line` `label` `icon` | `file:packages/canvas-core/src/specs/shape.ts#L325-L400` | The gap is **not** in the renderer. It is in the authoring vocabulary above it |
| M5 | The list-bearing card is not one story's shape. A legend, a checklist, a properties panel, an agent-trace step list and an ER table are the same construct | — | A repeater pays for itself more than once |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| X1 | "Put the built `CompositeShapeOption` on each record as `style.shape`" | **Rejected.** It buys JSON by moving one story's presentation into a shared dataset, which `apps/storybook/CLAUDE.md` bans outright, and it would freeze the card — editing a field would have to rebuild the spec by hand | `file:apps/storybook/CLAUDE.md` § *A story's settings are data*, "Styling in the dataset" |
| X2 | "`sym:CardStructure` already does rows — use that" | **False.** `CardStructure.rows` is a **fixed authored list** of `CardRow`, laid out top→bottom from named slots. It has no binding to an array on the record and no per-item index | `file:packages/graph/src/template/types.ts#L60-L90` |
| X3 | "The engine can't draw it, so the renderer needs work" | **False** — see `M4`. `sym:compileFreeform` simply never emits an `icon` part, and has no repeat construct. All six rows below are in `pkg:@invana/graph`'s template layer | `file:packages/graph/src/template/compile.ts#L437-L516` |
| X4 | "This is the `G7` first-layout sizing gap wearing a different hat" | **No, and it helps it.** `sym:resolveNodeSize` already falls back to `sym:GraphLayer.boundsOfNode` → `renderer.boundsOfSpec(nodeSpec(node))`, which composes the spec without drawing. A declarative structure that computes its own height answers that call as well as the resolver does — same path, no regression | `file:packages/graph/src/layout/groups.ts#L338-L349`, `file:packages/graph/src/layer/GraphLayer.ts#L1149-L1152` |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | `sym:FreeformStructure.elements` is `CardElement[]` — one element, one part, authored position | `file:packages/graph/src/template/types.ts#L119-L170` | Cardinality is fixed at author time; a record with 6 fields and one with 3 cannot share a structure → `R1` |
| D-2 | `sym:FreeformStructure.height` is `number` and flows straight into the compiled `CompositeShapeOption.height` | `file:packages/graph/src/template/compile.ts#L403-L432` | A card cannot grow with its list → `R2` |
| D-3 | `sym:elementToParts` has no `icon` arm; `image` renders "a themed placeholder" (a flat disc/square) | `file:packages/graph/src/template/compile.ts#L504-L512` | The header's iconify glyph — an `icon` part the engine already has — is unreachable from a template → `R3` |
| D-4 | `CardElement` colour is a **pair**: a `*Role` or a literal `number`. Neither reads a value off the item | `file:packages/graph/src/template/types.ts#L122-L160` | The type chip (`integer`→green `123`, `date`→amber `◷`) is a dictionary keyed by the row's own value, and is unsayable → `R4` |
| D-5 | `CardElementCommon.hitId` is a literal `string` | `file:packages/graph/src/template/types.ts#L100-L112` | Every repeated row would carry the *same* `hitId`, so `shape:partover` could not say **which** row → `R5` |
| D-6 | Row hover is `fillAlpha: i === activeRow ? 0.13 : 0`, recomputed by re-running the resolver against a ref the story mutates on `shape:partover` | `file:apps/storybook/stories/usecases/by-casestudies/data-model/SchemaTable.stories.tsx#L157-L186` | With the resolver gone there is no per-frame hook left, so sub-part hover needs a declarative form or the highlight is lost → `R6` |

**Why a repeater and not a richer resolver.** Every one of `D-1`…`D-5` is *structure*, and
the record already states the content. The template system is already the structure index;
widening what one element may say is smaller than a second authoring mechanism — and it is
the same argument `rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks`
made for `nodeTypes`, one level down.

**Shape of the addition** (all in `file:packages/graph/src/template/types.ts` + `compile.ts`):

| Construct | Form | Row |
|---|---|---|
| Repeat | `{ type: 'repeat', bind: 'data.fields', step: 26, max?: number, template: CardElement[] }` — `template` is drawn once per item, translated by `index × step`, with bindings resolving **item-first then record** (`bind: 'name'` → the field's name) | `R1` |
| Auto height | `height: number \| 'auto'` — `'auto'` = the bottom edge of the lowest drawn element (repeats expanded) + `autoHeightPadding` | `R2` |
| Icon | `{ type: 'icon', size, icon: InsetFillLayer, background?, bindUrl? }` → the existing `part: 'icon'` | `R3` |
| Lookup | `fillLookup` / `textLookup`: `{ bind, map: Record<string, number\|string>, fallback? }` | `R4` |
| Indexed hitId | `hitId` gains `{index}` interpolation — `hitId: '{index}'` reproduces today's `String(i)` verbatim | `R5` |
| Sub-part hover | `hoverFill` / `hoverFillAlpha` on an element carrying a `hitId` | `R6` |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Grep the designer's element switches for exhaustiveness | `file:packages/canvas-designer/src/templates/mapping.ts` — every switch has a `default:` arm | Adding union members will **not** fail `check-types` in `pkg:@invana/canvas-designer`; it will silently not author them, which is `B3` |
| T2 | Compare `sym:buildTable`'s emitted parts against `sym:CompositePart` | Every one of `rect` · `label` · `icon` is in the union, with `hitId` and `fillAlpha` already on `rect` | The work is entirely above the renderer — `X3` |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks` | relates-to | landed (6 of 8 rows) | The precedent and the method: widen the declarative door rather than make the resolver door serialisable. That RFC left the per-*instance* case to the resolver; this one argues one shape of it is really a repeater |
| `doc:docs/node-styling-unification-plan.md` | design-of-record | open | One semantic node style across simple + composite. This is another **subset landing** — the structure vocabulary, not the style unification |
| `doc:docs/self-service-card-designer` *(as recorded in the designer's remit)* | relates-to | in progress | `sym:FreeformStructure` is what `pkg:@invana/canvas-designer` emits. A repeat element is a new thing for it to author — `B3` |
| — | supersedes-in-part | — | The standing decision *"the schema/ER table node is built in userland via a composite shape resolver; no schema template kind in core"*. **That decision is not being reversed** — no `schema` kind is proposed. What is proposed is a generic repeater, which happens to make the ER card expressible. See `D3` |

## 4. The work

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| R1 | feature | proposed | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | `repeat` member on `CardElement`; `sym:elementToParts` expands it — resolve `bind` to an array, draw `template` per item at `y + index × step`, with an item-first binding scope | A card's row count comes from the record. **This is the row the whole RFC is about** | **medium** — a new recursion in the compiler and a second binding scope; a bad `bind` must degrade to zero rows, never throw | — |
| R2 | feature | proposed | same | `height: number \| 'auto'` + `autoHeightPadding?: number` on `sym:FreeformStructure` | The card grows with its list. Feeds `sym:boundsOfNode` unchanged, so layout sizing is unaffected (`X4`) | low — additive, `number` stays the default | R1 |
| R3 | feature | proposed | same | `icon` member on `CardElement` → the existing `part: 'icon'`, incl. `background` (the chip) and `bindUrl` for a path-built `svg-url` | The header glyph and the type chip become template elements. Closes the `image`-is-a-placeholder gap for icons | low — maps 1:1 onto a part that already ships | — |
| R4 | feature | **landed elsewhere** | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | Landed as `sym:ValueLookup<T>` (`bind` + `map` + `bands` + `fallback`) by `rfc:feat-2026-09-21-only-colour-can-be-driven-by-a-second-data-field` `F4`, reached through `fillLookup` on `rect`/`circle`, `colorLookup` on `text`/`line`, and `strokeLookup` on the structure | `TYPE_CHIP` becomes a dictionary in the config instead of a closure const — **available now**, ahead of `R1`. `D1`'s `fillBind` is subsumed: `{ bind: 'data.headerColor' }` with no `map` reads the value straight off the record | low — additive, `undefined` = today's behaviour | — |
| R5 | feature | proposed | same | `{index}` interpolation in `hitId` | `shape:partover` still reports which row. Preserves `Number(e.partId)` in the story verbatim | low | R1 |
| R6 | feature | proposed | `file:packages/graph/src/template/types.ts` + `pkg:@invana/graph` state overlay | `hoverFill` / `hoverFillAlpha` on a `hitId`-bearing element, applied on `shape:partover` | Per-row hover survives without a resolver. **Not optional for parity** — without it the story visibly loses its row highlight, which the conversion brief forbids | **medium** — sub-part hover is currently a consumer concern; this moves a slice of it into the layer. Needs to not re-compose the whole card per pointer move | R1, D2 |
| R7 | feature | proposed | `file:packages/graph-datasets/src/usecase-demos/star-schema/data.ts` | `dataset:starSchemaSettings` gains `nodeStructureTemplates` · `nodeStylingTemplates` · `nodeTypes` for the table card; its TSDoc's "no serialisable setting can express" paragraph is deleted | `<GraphCanvasApp data={starSchema} config={starSchemaSettings} />` draws tables with nothing else supplied — **the deliverable** | low in code, it is the proof | R1–R6 |
| R8 | feature | proposed | `file:apps/storybook/stories/usecases/by-casestudies/data-model/SchemaTable.stories.tsx` | Delete `sym:buildTable` and its 9 closure constants; take the structure from `dataset:starSchemaSettings`. Keep the React interaction (context menus, `<SchemaEditorPanel>`, the direction picker) — those are the story's own component, not engine settings | The story's config is JSON end to end; the `GraphNode` / `CompositePart` / `CompositeShapeOption` imports go unused | low | R7 |
| R9 | dressing | proposed | `file:apps/storybook/stories/usecases/by-casestudies/data-model/SchemaTable.stories.tsx#L209` | Revert the justification comment added today (the resolver it justifies is gone) | Removes a comment that would otherwise describe code that no longer exists | low | R8 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CompositePart` (`pkg:@invana/canvas-core`) | Every row compiles down to it; `R3` depends on `part: 'icon'` and `R5`/`R6` on `hitId` already being carried on `rect` | None expected — nothing in core changes. If it did, `pkg:@invana/renderer-pixijs` moves with it |
| U2 | `sym:resolveText` / the dotted-path binder | `R1`'s item-first scope and `R4`'s `bind` reuse it | A second resolution scope is new behaviour for it; must not change what a record-scoped path means today |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| B1 | `story:usecases/by-casestudies/data-model/SchemaTable` | story | Rewritten by `R8`. Every interaction must survive: whole-card hover ring, per-row band, both context menus, `<SchemaEditorPanel>` write-back, the direction picker | Page it through — `V1`–`V6` |
| B2 | `dataset:starSchemaSettings` (`pkg:@invana/graph-datasets`) | published API | Gains three registries. Any consumer already passing it now gets the full card instead of unstyled nodes — **a visible change for them, and the intended one** | Note it in the dataset's TSDoc |
| B3 | `pkg:@invana/canvas-designer` (`sym:NodeCardDesigner`, `CardElementView`, `mapping.ts`) | package | `T1` confirms it compiles — every switch has a `default:`. But a `repeat`/`icon` element authored by hand then opened in the designer renders as nothing and **can be silently dropped on save** | Must at minimum round-trip unknown elements untouched. Authoring UI for them is out of scope here |
| B4 | `sym:NodeStylingEditorPanel` (`pkg:@invana/canvas-ui`) | package | Structures are not in its remit (it edits stylings) — unaffected. But `sym:formToStyling`'s "carries unmodelled fields verbatim" fix (`rfc:…-callbacks` row `G8`) is what stops an edit deleting this | None; noted so the dependency is on the record |
| B5 | `pkg:@invana/graph` public types | published API | `CardElement` is an exported union — adding members is additive for consumers reading it, **breaking for any consumer that switches on it exhaustively** | `pkg:@invana/graph` has **no** `api/*.surface.txt` snapshot, so `pnpm check-api-surface` will not flag this. Call it out in the changeset instead |
| B6 | `file:packages/graph/tests/template/compile.test.ts` + `freeformTheme.test.ts` | tests | Existing freeform coverage must stay green; new rows need their own cases | Extend, don't rewrite |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | **Control** — the card looks identical to `80e69963` | `story:usecases/by-casestudies/data-model/SchemaTable` | Same width, header band with top-only rounding, icon, title, 3–6 rows, chip + name + right-aligned type. **A refactor must not change the picture** | R1–R8 |
| V2 | pending | Hover a row | same | The band lights at 13%; leaving clears it; the whole-card ring still traces the silhouette | R5, R6 |
| V3 | pending | Right-click a row, then right-click the card | same | The per-field menu (add below / delete) and `<GraphNodeContextMenu>` both open, positioned correctly | R5 |
| V4 | pending | *Edit schema…* → add a field → save | same | The card grows by one row and re-lays out. **This is the auto-height proof** and it is what the resolver did for free | R1, R2 |
| V5 | pending | **Control** — a *fixed* freeform card elsewhere | `story:usecases/by-casestudies/code-explainability/CodeExplainability` and any `canvas-designer` card story | Unchanged. Proves `height: number` and the fixed element path are untouched | R2 |
| V6 | pending | `<GraphCanvasApp data={starSchema} config={starSchemaSettings} />` with nothing else | a scratch render | Draws complete tables — **the deliverable, stated as a test** | R7 |
| V7 | pending | Open a hand-authored `repeat` card in `sym:NodeCardDesigner`, save, diff | `pkg:@invana/canvas-designer` | The `repeat` element survives the round trip | B3 |
| V8 | pending | `pnpm build && pnpm check-types && pnpm lint` | repo | 0 errors, boundaries intact, api surfaces unchanged (`B5`: `pkg:@invana/graph` is not snapshotted) | all |
| V9 | pending | `pnpm --filter @invana/graph test` | `pkg:@invana/graph` | Existing freeform/compile tests green, new rows covered | B6 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does the per-type header colour come from? `data.headerColor` is `0x2563eb` on the three `Dimension` tables and `0x7c3aed` on the `Fact` | (a) two freeform structures differing in one number — ~40 duplicated elements; (b) a `fillBind` dotted path, symmetric with `text.bind`, reading the value the dataset already carries; (c) a styling-template override reaching into the structure | **(b)** — and it is **already available**: `fillLookup: { bind: 'data.headerColor' }` with no `map` resolves the record's own value | **decided 2026-09-21** |
| D2 | Does row hover (`R6`) go declarative, or stay story code? | (a) `hoverFill*` in the template — generic, but puts sub-part hover state in the layer; (b) leave it to the consumer via `shape:partover` + a per-node state overlay; (c) drop the highlight | **(a)**. (c) changes the picture, which the brief forbids. (b) needs a per-node overlay carrying a row index — that is the resolver again, wearing state's clothes | open |
| D3 | Does this reopen the settled *"no schema template kind in core; the ER card is userland"* decision? | (a) yes, and it should stay settled — close this RFC; (b) no — a `repeat` over a bound array is domain-free, and the settled decision was about a **`schema` kind**, which nothing here adds | **(b)**, and the distinction is the test: if the proposal names a domain (`schema`, `table`, `erd`), it is the thing that was rejected. `repeat` · `icon` · `lookup` name constructs. `M5` is the check that it pays for itself outside this story | open |
| D4 | Land all nine rows, or the minimum picture first? | (a) all nine; (b) `R1`–`R5` + `R7`/`R8` first and defer `R6`, accepting a visibly different story until it lands; (c) `R1`+`R2` only, as a spike | **(a)**. `R6` is small once `R5` exists, and (b) leaves `main` with a story the brief says must not change | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-21 | `R4` landed out-of-band by the sibling RFC, which needed the same construct for `story:usecases/by-casestudies/code-kg/CompositeCards` | landed (1 row) | `D2` of that RFC asked which document owned the lookup and answered "land it once". It landed there because that story shipped first; the construct is `sym:ValueLookup<T>` and is general. `D1` here is answered by it |
| 2026-09-21 | Opened | proposed | Raised while converting `story:usecases/by-casestudies/data-model/SchemaTable` under the settings-are-data brief. The file had been reported as the honest per-instance exception; the maintainer's request — *"full JSON dataset for the schema, and the structure settings as style"* — is the claim that it is a repeater instead |
| 2026-09-21 | `X4` recorded | proposed | Checked whether this collides with `G7` (first-layout sizing). It does not — `sym:resolveNodeSize` already falls back to `sym:boundsOfNode`, which composes the spec without drawing, so a declarative card answers it exactly as the resolver does |
