---
id: feat-2026-09-21-only-colour-can-be-driven-by-a-second-data-field
type: feat
title: A second data field can drive colour and nothing else, so size, labels, badges and card accents stay callbacks
status: landed
opened: 2026-09-21
decided: 2026-09-21
landed: 2026-09-21
packages: [pkg:@invana/graph, pkg:@invana/canvas-ui, pkg:@invana/graph-datasets, pkg:@canvas/storybook]
design_of_record: doc:docs/node-styling-unification-plan.md
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks }
  - { predicate: relates-to, object: rfc:feat-2026-09-21-a-cards-rows-come-from-a-record-list-and-only-a-resolver-can-say-it }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/code-kg/DotsForce }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/code-kg/HealthBadges }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/code-kg/CompositeCards }
  - { predicate: manifests-in, object: dataset:invanaCodeKg }
---

## Summary

| | |
|---|---|
| **Goal** | The three `code-kg` stories draw their picture with **no function in any engine setting** — the standing conversion brief of `file:apps/storybook/CLAUDE.md` § *"A story's settings are data"* |
| **Where it stands** | **Done, 2026-09-21.** All three `code-kg` stories have **no function in any engine setting**. Colour → `sym:ColorByBehaviour`; badges → `sym:NodeBadgeTemplate`; radius → `sym:NodeStylingTemplate.size`; the label → a type binding; the whole card → one `sym:FreeformStructure` |
| **The one question** | *"Which look does this record get?"* had exactly **two** declarative answers: `node.type` (via `sym:NodeTypeBinding`) and — for `bgFill` alone — any dotted path (via `sym:ColorByBehaviour.nodeValueKey`). A **second** field could drive **colour and nothing else**. It now drives size, badge text, badge colour, element colour, card border and element presence, through **one** construct: `sym:ValueLookup<T>` |
| **Scope of the hole** | `F1` size-by-field · `F2` the label taken hostage by it · `F3` bindable badges · `F4` value-keyed colour inside a card · `F5` text format · `F6` `fontVariant`/`lineHeight` parity |
| **What this is not** | Not a proposal to make resolvers serialisable, and not a second selector mechanism — every row widens a door that already exists |
| **Blocked on** | Nothing. `D1` decided **against** this RFC's own recommendation (template field, not a behaviour — see `D5`) · `D2` landed the lookup here and marked `R4` satisfied · `D3` answered by reusing the badge interpolation · `D4` converted |
| **Row status** | **landed 12 · rejected 0 · proposed 0** |

The conversion that prompted this is already in the tree and is **not** part of the rows
below: `story:usecases/by-casestudies/code-kg/HealthBadges` and
`story:usecases/by-casestudies/code-kg/DotsForce` lost their `bgFill` resolvers to
`sym:ColorByBehaviour`, `HealthBadges` lost `labelText` to a type binding, and
`story:usecases/by-casestudies/code-kg/CompositeCards` lost its ELK `nodeSize` callback to
`defaultNodeSize`. This RFC is what is left after that.

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | `sym:ColorByBehaviour` already proved the pattern: a **root-relative dot path** (`nodeValueKey`) + a pinned `valueColors` map replaces a `bgFill` resolver, survives a save, and shows up in the settings panel | `file:packages/graph/src/behaviours/ColorByBehaviour.ts#L13-L27` | Two of the three stories converted with no visual change |
| M2 | Nothing does the same for **size**. `sym:NodeCentralityBehaviour` sizes by *degree* (`weightKey` is an **edge** weight), not by a node field | `file:packages/graph/src/behaviours/NodeCentralityBehaviour.ts` — options are `direction`/`minSize`/`maxSize`/`scale`/`sizeFn`/`weightKey`/`weightBy` | `DotsForce`'s radius reads `data.complexity`; no behaviour can say it |
| M3 | The label is **hostage to `M2`**. The only declarative label-text is `sym:NodeTypeBinding.bindings.label`; a binding must name a structure, `sym:compileSimple` always writes that structure's `shape`, and a binding out-ranks the layer template | `file:packages/graph/src/template/compile.ts#L89-L95`, `file:packages/graph/src/layer/GraphLayer.ts#L1044-L1058` | Adding the binding to `DotsForce` would replace a per-complexity radius with a per-*type* one — a visible change, so both resolvers stay |
| M4 | `data.complexity` is genuinely orthogonal to `type` — it is not a per-type constant wearing a function's clothes | `dataset:invanaCodeKg` cross-tab: `file` splits 116/91/35 across simple/moderate/complex, `class` 53/22/14 | The "tell" in `file:apps/storybook/CLAUDE.md` does not apply; this is a second dimension |
| M5 | `sym:NodeStyle.badges` is `readonly NodeBadge[]` — a list of already-decided badges. No binding, no value→colour banding, no "omit when the field is absent" | `file:packages/graph/src/layer/types.ts#L1170` | `HealthBadges`'s coverage pill needs all three |
| M6 | A `sym:CardElement`'s colour is a `*Role` **or** a literal number. Neither reads a value off the record | `file:packages/graph/src/template/types.ts#L124-L182` | `CompositeCards`' *Colour by → Cluster* mode (9 values on `data.cluster`) has no declarative form, so the whole card stays a resolver |
| M7 | The engine's `label` part carries `fontVariant` and `lineHeight`; the template element that compiles to it does not | `file:packages/canvas-core/src/specs/shape.ts#L377-L379` vs `file:packages/graph/src/template/types.ts#L124-L141` | The authoring vocabulary trails the renderer — same finding as `X3` of `rfc:feat-2026-09-21-a-cards-rows-come-from-a-record-list-and-only-a-resolver-can-say-it` |
| M8 | `dataset:invanaCodeKgSettings` still documents the colour hole as open: *"a consumer that would rather colour by cluster supplies its own `bgFill` resolver, since `data.cluster` can't be reached from serialisable settings"* | `file:packages/graph-datasets/src/usecase-demos/invana-code-kg/data.ts#L98-L102` | **False since `nodeValueKey` landed.** The recommended settings now understate what they can do |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| X1 | "Derive a composite `type` (`file:complex`) when building `data`, then key bindings off it" | **Rejected.** `type` is the entity kind — the **types** picker filters on it, `nodeValueKey: 'type'` colours by it, and edge semantics read it. Overloading it moves one story's presentation into the record, which `file:apps/storybook/CLAUDE.md` bans | `file:apps/storybook/stories/usecases/by-casestudies/code-kg/DotsForce.stories.tsx` — the `labels` filter |
| X2 | "Put `style.shape` / `style.badges` on each record" | **Rejected**, same ban, same reason as `X1` of the sibling RFC — it freezes the look and makes a shared dataset carry one story's presentation | `file:apps/storybook/CLAUDE.md` § *Styling in the dataset* |
| X3 | "`style.size` is applied last (`file:packages/graph/src/layer/GraphLayer.ts#L1080-L1090`), so it escapes the binding's `shape` — use that" | **True, and it is the mechanism `F1` should use** — but only a *behaviour* can write it without a callback. As a layer-template field it is still a resolver | `sym:GraphLayer.resolveNodeStyle` applies `merged.size` after the type binding |
| X4 | "Editing colour-by in `sym:CanvasSettingsEditorPanel` will drop the pinned `valueColors` the conversion introduced" | **False.** `sym:formToOptions` emits only the fields the form set, and `sym:ColorByBehaviour.resolveOptions` merges with `??`, so an unedited `valueColors` survives. It is **not editable** there (no map `FieldType`), which is declared future work | `file:packages/canvas-ui/src/editors/behaviours/color-by/mapping.ts#L52-L71`, `file:packages/canvas-ui/src/editors/behaviours/color-by/types.ts#L18-L27` |
| X5 | "`CompositeCards` could convert its *type* mode now and leave cluster mode behind" | **Rejected as a partial.** The header switch would then work in one position and not the other — a functional regression, not a refactor | `story:usecases/by-casestudies/code-kg/CompositeCards` header `Colour by` |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | A look is selected by `node.type` and only `node.type`: `sym:GraphLayer.resolveNodeStyle` indexes `this.nodeTypes[node.type]` | `file:packages/graph/src/layer/GraphLayer.ts#L1053-L1055` | Any second field needs either a behaviour that writes the template, or a value-keyed lookup *inside* a template |
| D-2 | The behaviour door is open and proven — `sym:ColorByBehaviour` writes `bgFill` via `setNodeDefaults`, so new items are coloured as they arrive, with no per-item loop | `file:packages/graph/src/behaviours/ColorByBehaviour.ts#L44-L52` | `F1` copies it verbatim for `size`, with `sym:readValueKey` reused for addressing |
| D-3 | `merged.size` is applied **after** the type binding and normalises whatever shape survived (`sym:normalizeShapeSize`) | `file:packages/graph/src/layer/GraphLayer.ts#L1080-L1090` | A size-by-field behaviour **composes with** type bindings instead of fighting them — which is exactly what frees `F2` |
| D-4 | `sym:NodeBadge` is consumed per node in `sym:GraphLayer` badge projection; the layer already re-projects on data change | `file:packages/graph/src/layer/GraphLayer.ts#L3300-L3400` | A badge *template* (bind + lookup + omit-when-absent) can compile to the same `NodeBadge` with no renderer change |
| D-5 | `sym:elementToParts` resolves each element's colour once, per node, with the record in hand | `file:packages/graph/src/template/compile.ts#L437-L516` | A `fillLookup` / `textLookup` is a local change at the point the record is already bound — `F4` |
| D-6 | A binding resolves **one** path to a string via `sym:resolveText`; `data.lineRange` is `[123, 187]`, so it stringifies to `123,187` | `file:packages/graph/src/template/bindings.ts#L21-L27` | `L123–187` needs a format template (`F5`), not a second path |
| D-7 | **Badges are not projected from `sym:GraphLayer.resolveNodeStyle`.** `sym:GraphLayer.resolveNodeBadges` builds its own list by **concatenating** layer template → per-node → state overlays, and it never consulted the type binding | `file:packages/graph/src/layer/GraphLayer.ts#L2256-L2290` (pre-change) | Compiling badges into the binding fragment alone renders **nothing**. `F9` is the row that discovery created — without it `F3` is inert, which no amount of type-checking would have caught |
| D-9 | **A styling template can already carry a data-bound field** — that is what `F3`'s badges proved. So the "second field" door does not have to be a behaviour: a field on the template selected by `node.type` may itself `bind` to any path | `sym:compileBadges`, landed as `F3` | `D1` reverses. `M2`'s "no behaviour can say it" was true and beside the point — the *template* can, and `merged.size` being applied after the merge means it composes (`D-3`) rather than clashing (`M3`) |
| D-10 | One lookup construct serves every case: badge fill, node size, card element colour, card border. The value type varies (`number` for size, `TemplateColor` for colour); the addressing does not | `sym:ValueLookup<T>` in `file:packages/graph/src/template/types.ts` | `F12`. Two vocabularies for one idea is drift — `fillBands` / `fillValues` shipped with `F3` in the morning and were folded in the same day, with one consumer and no release between |
| D-8 | A badge list *concatenates* where every other style field *overrides* — so a type-template badge composes with a layer-template one rather than replacing it | `sym:GraphLayer.resolveNodeBadges` dedupes by `id`, later wins | Give every template an `id`; `F3`'s TSDoc says so |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Convert `bgFill` → `behaviours.color` in two stories, run `tsc --noEmit` + `eslint` | Both clean; no visual change expected (every value pinned in `valueColors`) | The colour half of the brief is already satisfiable — the remainder is a real capability gap, not a conversion that was not attempted |
| T2 | Cross-tab `type` × `complexity` over `dataset:invanaCodeKg` | 12 non-empty cells; every entity kind spans 2–3 complexities | `M4` — a type binding provably cannot say the radius |
| T3 | Add a `nodeTypes` binding to `DotsForce` on paper and trace precedence | Binding's `struct.shape` lands after the layer resolver in `sym:GraphLayer.resolveNodeStyle`, so the per-complexity radius is overwritten | `M3` — the label cannot convert alone |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks` | relates-to | landed (6 of 8 rows) | The method: widen the declarative door rather than make the resolver door serialisable. It closed the **per-type** case; this is the **second-field** case |
| `rfc:feat-2026-09-21-a-cards-rows-come-from-a-record-list-and-only-a-resolver-can-say-it` | relates-to | proposed | Its `R4` (`fillLookup` / `textLookup`) is the same construct `F4` needs, and its `R3`/`R2` are adjacent. **Overlap is deliberate and must be resolved by `D2`, not duplicated** |
| `doc:docs/node-styling-unification-plan.md` | design-of-record | open | One semantic node style across simple + composite. `F1` is a subset landing of "size is a semantic channel" |
| `file:apps/storybook/CLAUDE.md` § *A story's settings are data* | relates-to | landed | The conversion table and the honest-exception clause these rows are measured against |

## 4. The work

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | **landed, as `D1(b)` not `D1(a)`** | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | **`sym:NodeStylingTemplate.size`: `number \| ValueLookup<number>`**, resolved by `sym:compileSize` in the type binding. *Not* the proposed `sym:SizeByBehaviour` — see `D1`/`D-9`: a template field costs ~40 lines over machinery `F3` already built, where a behaviour costs a public class, an editor folder and a slot in `GraphCanvasApp`'s fixed bundle | `DotsForce`'s radius becomes JSON. **The row the RFC is about** | low as landed (was **medium** as a behaviour) | — |
| F2 | feature | **landed** | `file:apps/storybook/stories/usecases/by-casestudies/code-kg/DotsForce.stories.tsx` | One `dot` structure + one `dot` styling carrying `size` + five `nodeTypes` entries; both resolvers, the `GraphNode` / `NodeShapeOptions` imports and the local payload interface deleted | The story is JSON end to end | low — proven identical by `V11`, which also confirms the binding writes **only** `labelText` + `shape`, leaving `bgFill` (colour-by) and `labelColor` / `bgStrokeColor` (theme) on the layer template where `U2` requires | F1 |
| F3 | feature | **landed** | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | `sym:NodeBadgeTemplate` + `sym:BadgeFillBand` on `sym:NodeStylingTemplate.badges`, compiled per node by `sym:compileBadges`: `bind` names the field, `whenGreaterThan`/`whenLessThan`/`whenEquals` gate the badge, `labelText` interpolates `{}` (the bound value) and `{dotted.path}`, `fillBands` (first match wins, half-open `from`/`to`) and `fillValues` map value→colour, and every colour gains its `*Role` pair. A bound field that is absent drops the badge; `0` and `''` are values | `HealthBadges`' last resolver goes. Reusable by every health/status dashboard | **medium** — the omit-when-absent rule is a new per-node decision inside template compilation | — |
| F4 | feature | **landed** | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | `sym:ValueLookup<T>` (`bind` · `map` · `bands` · `fallback`) + `sym:TemplateColor` (a literal **or** a role, told apart by `typeof`), reached through `fillLookup` on `rect`/`circle`, `colorLookup` on `text`/`line`, and `strokeLookup` on `sym:FreeformStructure` | `CompositeCards`' cluster accent becomes data; the *Colour by* switch works in **both** positions from one structure, by re-pointing the lookup's `bind` | low — additive; an absent lookup is exactly today's behaviour. **Landed once**, and `R4` of the sibling RFC is marked satisfied by it (`D2`) | D2 |
| F5 | feature | **landed, simpler than proposed** | same | **No `format` field and no path array.** A `text` element's existing `text` became a template over `{}` / `{dotted.path}` — the *same* `sym:interpolate` the badge labels already used — so `'L{data.lineRange.0}–{data.lineRange.1}'` works with one rule instead of two syntaxes | `L123–187` is sayable | low — a string with no `{` passes through untouched, so every existing literal is unaffected | D3 |
| F6 | feature | **landed, +1 field** | same | `fontVariant` + `lineHeight` **+ `align`** on a text element, passed straight through to the `label` part that already accepts all three. `align` was not in the original row and is load-bearing: the card's 2-line summary sets it | Closes the vocabulary/renderer gap `M7` | low — pass-through of fields `file:packages/canvas-core/src/specs/shape.ts#L357-L379` already has | — |
| F7 | feature | **landed, one structure not five** | `file:apps/storybook/stories/usecases/by-casestudies/code-kg/CompositeCards.stories.tsx` | **One** `sym:FreeformStructure` of eight elements + five `nodeTypes` entries. Five literals are unnecessary once the accent is a lookup: the *Colour by* switch swaps the lookup's `bind` between `type` and `data.cluster`, so one structure serves both modes and all five kinds. `accentOf` and `props` deleted; `CARD`, `LABEL_FILL`, `CLUSTER_FILL` stay — they are data the lookup reads | The third story's config is JSON | **medium** — a 165 px card re-expressed element by element. `V12` is the guard and it passed on all 602 records in **both** modes | F4, F5, F6 |
| F9 | feature | **landed** | `file:packages/graph/src/layer/GraphLayer.ts` | Two wirings: `sym:GraphLayer.resolveTypeBinding` merges the compiled badges into the style fragment, and `sym:GraphLayer.resolveNodeBadges` contributes them **between** the layer template and per-node style — the precedence `sym:GraphLayer.resolveNodeStyle` already uses | Without this `F3` compiles badges nobody projects (`D-7`). The badge path reads the styling map directly rather than re-running `resolveTypeBinding`, so a type with no badge templates costs one map read, not a second structure compile per node | **medium** — touches the projection path every node goes through on install *and* rerender | F3 |
| F10 | fix | **landed** | `file:packages/canvas-ui/src/editor-panels/node-styling/mapping.ts#L66` | `sym:formToStyling` carries `badges` through from `base`, beside `group` | Closes a data-loss path **as it opens**: the form is a role-and-typography editor, so without this an unrelated colour edit would silently delete a type's whole badge list. Same defect class as the `group` drop closed in `5c9fe5d9` | low | F3 |
| F11 | feature | **landed** | `file:apps/storybook/stories/usecases/by-casestudies/code-kg/HealthBadges.stories.tsx` | The `badges` resolver, the `GraphNode` / `NodeBadge` imports and the local `InvanaCodeNodeProperties` interface deleted; two `sym:NodeBadgeTemplate` entries added to `nodeStylingTemplates.fileNode` | **The story's config is JSON end to end** — no function anywhere in it | low — proven byte-identical by `V7` | F3, F9 |
| F12 | refactor | **landed** | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | Fold `F3`'s badge-only `fillBands` / `fillValues` / `BadgeFillBand` into the shared `sym:ValueLookup<T>`, as `fillLookup` whose `bind` defaults to the badge's own | One construct instead of two for the same idea (`D-10`). Done the same day `F3` shipped, with one consumer and no release between — the cheapest this is ever going to be | low — `V7` re-run after the fold, still 242/242 identical | F3, F4 |
| F13 | feature | **landed** | `file:packages/graph/src/template/types.ts` (`sym:CardElementCommon.requires`) | Draw an element only when a dotted path resolves non-nullish. **Not in the original scope** — found while converting: `'L{a}–{b}'` renders `L–` for the **253 of 602** records with no `lineRange` (every `file`, every `config`, the one `document`) | `F5` is honest. The card equivalent of a badge's presence rule, so the two read the same | low | F5 |
| F14 | feature | **landed** | `file:packages/graph/src/template/types.ts` (`sym:FreeformStructure.strokeLookup`) | A record-driven **border** on the structure itself. **Not in the original scope** — `F4` covers elements, and the card's accent also traces the silhouette, which is not an element | `CompositeCards`' frame follows the accent. Deliberately **no `bgLookup`**: no caller needs a per-record card fill, and an unused door is a door to maintain | low | F4 |
| F8 | dressing | **landed** | `file:packages/graph-datasets/src/usecase-demos/invana-code-kg/data.ts` | Delete the "`data.cluster` can't be reached from serialisable settings" paragraph — false since `nodeValueKey`, and now doubly so | The dataset stops advertising a hole that closed. **Dressing, not a defect** — it changes no pixel | low | — |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.resolveNodeStyle` precedence (layer → type binding → per-node → states) | `F1` relies on `merged.size` being applied *after* the binding (`D-3`); `F3`/`F4` compile inside the binding step | Reordering it silently changes which of two writers wins — the exact trap the `HealthBadges` conversion had to route around for `labelColor` |
| U2 | `sym:ThemeBehaviour` → `sym:paletteToNodeDefaults` writes `labelColor` + `bgStrokeColor` on the **layer** template | Anything moved into a styling template out-ranks the theme | A styling template that declares those two freezes a story's light/dark behaviour. Recorded in the `HealthBadges` conversion comment |
| U3 | `sym:readValueKey` / `sym:resolvePath` | `F1`, `F3`, `F4`, `F5` all address records by dot path | A change in path semantics (root-relative vs data-relative) breaks every row at once |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `pkg:@invana/canvas-ui` editors | rule 12 | `F1` is a new behaviour, so it ships `packages/canvas-ui/src/editors/behaviours/size-by/` (`fields.ts` + `mapping.ts` + panel) and `override readonly kind = 'size-by'` | Part of `F1`, not optional |
| C2 | `sym:CanvasSettingsEditorPanel` | UI | `valueSizes` (`F1`) and `valueColors` (already) are **maps**, and `FieldType` has no map kind | Either a map field type, or these stay config-only — say which in `D1` |
| C3 | `pkg:@invana/canvas-designer` | authoring | `F4`–`F6` widen `sym:CardElement`, which the designer authors. Its mapping switches have `default:` arms, so new members compile but are silently un-authorable | Same finding as `T1` of the sibling RFC; track it there |
| C4 | `story:usecases/by-casestudies/code-kg/*` (3 stories) | stories | `F2` and `F7` rewrite two of them | The picture must not change — `V2`, `V4` |
| C5 | `dataset:invanaCodeKg` consumers | published data | `F8` touches only TSDoc / recommended settings, never the records | None |
| C7 | `sym:formToStyling` / `sym:NodeStylingEditorPanel` | UI | A new `NodeStylingTemplate` field the form does not model — it would be dropped on every save | Done as `F10`. **The panel still cannot *edit* badges** (no repeater field type), exactly as it cannot edit `group`. Declared, not hidden |
| C6 | Every other story under `apps/storybook/stories/usecases/` | stories | 21 of 28 files still carry function-valued settings (`doc:docs/handoff-2026-09-21.md` §5); `F1`/`F3`/`F4` are likely to unblock several | Re-audit after landing, don't pre-convert |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `tsc --noEmit` + `eslint stories/usecases/by-casestudies/code-kg/` after the colour conversion | `pkg:@canvas/storybook` | 0 errors | the landed conversion (not a row) |
| V2 | pending | Open `story:usecases/by-casestudies/code-kg/DotsForce`, compare against `80e69963` in **both** themes; toggle *Colour by* through both positions; zoom past 0.6× for labels | rendered canvas | Dots identical in size and colour; cluster mode unchanged; labels appear at the same zoom | the colour conversion, F1, F2 |
| V3 | pending | Open `story:usecases/by-casestudies/code-kg/HealthBadges`, hover a file, switch theme | rendered canvas | Cluster fills identical; **label colour still follows the theme** (the `U2` trap); coverage/error badges unchanged | the label conversion, F3 |
| V4 | pending | Open `story:usecases/by-casestudies/code-kg/CompositeCards`, first layout with ~600 nodes filtered to each entity kind | rendered canvas | **Control:** cards do not overlap on first layout after the `nodeSize` callback was deleted — the `G7` risk of `doc:docs/handoff-2026-09-21.md` §4, shared with `story:usecases/by-casestudies/code-explainability/CodeExplainability` | the ELK conversion, F7 |
| V5 | pending | **Control:** edit colour-by in `sym:CanvasSettingsEditorPanel`, save, and confirm the pinned colours survive | `pkg:@invana/canvas-ui` | Fills unchanged after an unrelated edit — the `X4` claim, proven rather than reasoned | the colour conversion |
| V7 | **pass** | Compile `sym:compileBadges` against all 242 `file` records of `dataset:invanaCodeKg` and diff each result field-for-field against the deleted resolver's output | `pkg:@invana/graph` (built `dist`) | **242 identical, 0 different** — 242 coverage pills, 25 error circles. The `F11` conversion provably changes no badge | F3, F9, F11 |
| V8 | **pass** | Edge cases the dataset does not contain: absent field, `coverage: 0`, `errors: 0`, unmatched `fillValues` key, static (unbound) badge, `*Role` resolution, `{}` + `{dotted.path}` interpolation | `pkg:@invana/graph` (built `dist`) | Badge dropped only on absence; `0` renders (`0%`, red band); `whenGreaterThan: 0` drops the error circle; unmatched lookup falls back to the template's own fill; a template declaring badges that all miss yields `[]`, one declaring none yields `undefined` | F3 |
| V11 | **pass** | Compile `sym:compileSimple` + `sym:compileSize` over all **602** records and diff the radius and label against the two deleted resolvers; also list every field the binding writes | `pkg:@invana/graph` (built `dist`) | **602/602 identical** on both. The binding writes only `labelText` + `shape` — so `bgFill` (colour-by) and `labelColor` / `bgStrokeColor` (theme) are untouched, which is the `U2` trap cleared | F1, F2 |
| V12 | **pass** | Compile `sym:compileFreeform` over all **602** records in **both** *Colour by* positions and diff the composite root + every part, field by field, against the deleted `shape` resolver | `pkg:@invana/graph` (built `dist`) | **602/602 identical in both modes.** The only textual difference is an explicit `anchor: 'left'`, which is the renderer's own default (`file:packages/canvas-core/src/specs/shape.ts#L357`, `file:packages/renderer-pixijs/src/primitives/shapes/CompositeShape.ts#L302`) | F4, F5, F6, F7, F13, F14 |
| V13 | pending | Open `story:usecases/by-casestudies/code-kg/CompositeCards`, toggle *Colour by* through **both** positions, and compare against `80e69963` | rendered canvas | Identical cards. Two things `V12` cannot see: `sym:compileFreeform` additionally asserts `bgFill` + `bgStrokeWidth: 0` at binding precedence, which the resolver never set (expected inert — `bgFill` equals the card's own fill and nothing else writes it, `behaviours.color` being disabled here), and the hover / select ring still overriding the card's border | F7 |
| V14 | pending | Open `story:usecases/by-casestudies/code-kg/DotsForce`, switch theme, zoom past 0.6× | rendered canvas | Dot radii unchanged; labels appear at the same zoom **and still follow the theme** — the `U2` trap, which `V11` checks statically and this checks live | F2 |
| V9 | pending | Open `story:usecases/by-casestudies/code-kg/HealthBadges` in Storybook and compare against `80e69963` | rendered canvas | Same pills on the same nodes, same colours, same positions. **This is the check `V7` cannot make** — `V7` proves the *compiler* agrees, `D-7` is the reminder that projection is a separate path | F9, F11 |
| V10 | pending | Edit `fileNode` in `sym:NodeStylingEditorPanel` (change a role), save | `pkg:@invana/canvas-ui` | Both badges survive the save — the `F10` carry-through, proven rather than reasoned | F10 |
| V6 | pending | Round-trip a converted config through save → reload | `sym:CanvasSettingsEditorPanel` | Identical picture from JSON alone — the point of the whole exercise | F2, F7 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Is size-by-field a **behaviour** (`F1`) or a template/binding field? | (a) behaviour, mirroring `ColorByBehaviour`; (b) a `sizeKey` on the styling template; (c) both | **(b) — the RFC's own recommendation was wrong.** The argument for (a) rested on (b) re-creating `M3`'s clash; it does not, because `merged.size` is applied *after* the merge (`D-3`), so a size on the binding composes with that binding's own structure. And `F3` had meanwhile shown a template field can bind to any path (`D-9`). (a) would have cost a public class, an editor folder (`C1`) and a slot in a fixed bundle, for a door (b) opens in 40 lines. **(a) remains the right answer for a graph with no type bindings** — reopen it when one needs this | **decided 2026-09-21: (b)** |
| D2 | `F4` here, or `R4` of `rfc:feat-2026-09-21-a-cards-rows-come-from-a-record-list-and-only-a-resolver-can-say-it`? | (a) land it there, cite it here; (b) land it here; (c) split | **(b)**, on sequencing alone: this story shipped first and the construct is general, so waiting would have meant a second vocabulary in the meantime. `R4` is marked *landed elsewhere* and that RFC's `D1` (`fillBind`) is subsumed — `fillLookup: { bind }` with no `map` reads the record's own value | **decided 2026-09-21: (b)** |
| D3 | How far does text formatting (`F5`) go? | (a) positional template over an array of paths; (b) a single path + a printf-ish pattern; (c) a named formatter registry | **Neither (a) nor (b): `{dotted.path}` interpolation**, which `F3` had already shipped for badge labels. It covers `L{data.lineRange.0}–{data.lineRange.1}` with no second field and no path array, and it is one rule across badges and cards. (c) stays rejected — a registry re-introduces a code seam in a config | **decided 2026-09-21** |
| D4 | Convert `CompositeCards` at all, or accept a card that stays a resolver? | (a) convert once `F4`–`F6` land; (b) leave it as the documented honest exception | **(a)**, and **not** after the repeater work — ahead of it. The two touch the same compiler but different members (`elementToParts`' colour resolution vs. its expansion), and `R1` will expand an element list this conversion does not change | **decided 2026-09-21: (a), now** |
| D5 | Was folding `F3`'s badge bands into `sym:ValueLookup` (`F12`) worth churning a row that landed hours earlier? | (a) yes, fold now; (b) keep both, deprecate later; (c) keep both forever | **(a)**. One consumer, no release, and the alternative is two spellings of one idea in the same file — the drift `pnpm check-api-surface` exists to catch after it is too late to fix cheaply | **decided 2026-09-21** |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-21 | Opened while converting `story:usecases/by-casestudies/code-kg/*` to JSON settings | proposed | Colour + ELK sizing converted in the same pass; the five remaining resolvers are what this documents |
| 2026-09-21 | `F1`·`F2`·`F4`–`F8` landed, plus `F12`–`F14`, closing the RFC | **landed** | Asked for "the same treatment for the other two stories". `D1` was decided **against this RFC's own recommendation** (see the row) and `D2`/`D3`/`D4` all resolved smaller than proposed — `F3`'s machinery answered three of them. Two capabilities were found during conversion, not design: `F13` (`requires`) and `F14` (`strokeLookup`). `V11`/`V12` pass on all 602 records; `V9`·`V10`·`V13`·`V14` need a browser |
| 2026-09-21 | `F3` accepted and landed with `F9`–`F11`, after the question *"can the badge functions go and the badges come from node data?"* | landed (4 rows) | The answer turned on **which** data: `style.badges` **on the records** was re-rejected (`X2` — `dataset:invanaCodeKg` is shared with `DotsForce` + `CompositeCards`, which would both sprout pills), and the badges were bound to `data.coverage` / `data.errors`, which the dataset already carries, instead. `D-7` was found during implementation and became `F9`; `F10` closed a data-loss path in the same change. `V7`/`V8` pass; `V9`/`V10` need a browser |
