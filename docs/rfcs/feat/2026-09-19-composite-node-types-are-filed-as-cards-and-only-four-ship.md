---
id: feat-2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship
type: feat
title: Composite node types move to a home of their own, and four more ship
status: accepted
opened: 2026-09-19
decided: 2026-09-19
landed: null
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: relates-to, object: "rfc:fix-2026-09-13-composite-card-renders-as-bare-outline" }
  - { predicate: relates-to, object: "doc:docs/node-styling-unification-plan.md" }
  - { predicate: relates-to, object: "doc:docs/canvas-templates-plan.md" }
  - { predicate: manifests-in, object: "file:packages/graph/src/cards/index.ts" }
  - { predicate: depends-on, object: "sym:CompositeCard" }
---

## Summary

| | |
|---|---|
| **What it adds** | A single home for every node type built on the `composite` shape — `file:packages/graph/src/nodes/composite/` — and four new types in it: `sym:IDCard`, `sym:OrganisationCard`, `sym:ProductCard`, `sym:EventCard`. |
| **Why here** | `file:packages/graph/src/cards/` names one *look*, not the concept; the folder already holds a schema table, which is not a card. The catalogue ships four types and the two most-asked-for identities aren't among them. |
| **New surface** | 4 classes · 4 stock functions · 4 spec interfaces · 4 data interfaces · 1 promoted `sym:CardTag`. Additive — every existing export keeps its name. |
| **Not in scope** | Theme-role colouring (D-3 → `doc:docs/node-styling-unification-plan.md`), an editor (root rule 12 covers Behaviour/Layer/Layout, not shape builders). Stories were out of scope at proposal time and were **added on request** on 2026-09-19 — F12. |
| **Open decisions** | D-8 (three new case-study folders vs. the locked five) · F17 superseded by `rfc:fix-2026-09-19-composite-label-text-cannot-be-vertically-centred` F6 |
| **Row status** | proposed 0 · accepted 0 · implemented 18 · landed 0 · deferred 0 · rejected 0 · superseded 1 — every row is written and green on V1–V5; `landed` waits on V6/V7 (a visual pass) and on reaching `main` |

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The composite-node catalogue is filed under a name that describes one *look*. A schema/ER table is not a card, and it lives there anyway. | `file:packages/graph/src/cards/` | `file:packages/graph/src/cards/schemaTable.ts` sits beside `userCard.ts` under a `cards/` folder |
| M2 | Only four composite node types ship: user, schema table, stat, task. | `file:packages/graph/src/cards/index.ts#L26-L31` | Barrel exports exactly `sym:SchemaTableCard`, `sym:UserCard`, `sym:StatCard`, `sym:TaskCard` |
| M3 | The identity and organisation node types people ask for are absent, so each consumer re-authors them. | `story:usecases/SimpleAndCompositeNodes` | `file:apps/storybook/stories/usecases/SimpleAndCompositeNodes.stories.tsx#L158` declares an `orgBadge` freeform structure inline |
| M4 | "idCard" already exists, but as a **template structure**, not a class — the same word names two things at two different layers. | `file:packages/graph/src/template/structures.ts#L68-L85` | `const idCard: CardStructure` — a 220×96 row/slot layout, unrelated to `sym:CompositeCard` |
| M5 | `sym:CompositeCard` is a proven, spec-driven base; adding a type is subclass + spec, not new machinery. | `file:packages/graph/src/cards/base.ts#L37-L67` | `build()` already assembles `parts` + `frame` into a `CompositeShapeOption` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | This needs a separate templates package. | **No** | Root `CLAUDE.md` — single runtime consumer, revisit only if a second appears. Nothing here adds one. |
| R2 | Moving the folder changes the published API. | **No** | `pkg:@invana/graph` declares one `.` export (`dist/index.js`), no subpaths — the folder path is invisible to consumers |
| R3 | The move trips `pnpm check-api-surface`. | **No** | `api/` holds only `canvas-core` · `canvas-store` · `canvas` surface snapshots; `@invana/graph` is not pinned |
| R4 | New node types need a settings editor (root rule 12). | **No** | Rule 12 scopes to Behaviour / Layer / Layout. A card is a shape builder invoked from `node.style.shape` |
| R5 | Stories must ship with the new types. | **No** | Root rule 11 — land the code without one, don't offer unprompted |
| R6 | The engine primitive needs extending for these four. | **No** | `rect` · `circle` · `line` · `label` · `icon` (`file:packages/canvas-core/src/specs/shape.ts#L325-L385`) cover every element in §2.1 |

---

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| S1 | `file:packages/graph/src/cards/` becomes `file:packages/graph/src/nodes/composite/`. The folder name states the *engine concept* (composite shape), not the look. | Sibling of `layer/` · `template/` · `theme/`, all lowercase | One home for every composite node type; the schema table stops being a misfiled "card" |
| S2 | The barrel re-points one import line. No export is renamed. | `file:packages/graph/src/index.ts#L331` — `} from './cards';` | Move is invisible downstream: stories import `sym:userCard` from `'@invana/graph'`, not from a path |
| S3 | `sym:CompositeCard` and `shared.ts` move unchanged. The four new types subclass the same base with the same `spec` discipline. | `file:packages/graph/src/cards/base.ts` · `file:packages/graph/src/cards/shared.ts` | No new machinery; a new type is one file + one barrel line |
| S4 | Each new type follows the shipped contract exactly: `interface XSpec` · `const X_DEFAULTS` · `class X extends CompositeCard<XSpec, XData, TOpts>` · `const x = (data) => …` stock function. | `file:packages/graph/src/cards/statCard.ts#L8-L30` is the template | Consumers restyle by editing `spec`, subclass only for structure — the documented promise holds for eight types, not four |
| S5 | Variable-height types (organisation, product) compute `height` in `frame()` from the parts they emitted, the way the schema table already does. | `sym:SchemaTableCard` grows with `fields.length` | Meta rows appear only when their data field is present; no empty gaps |
| S6 | Two shared helpers land in `shared.ts`: an icon+text meta row and a pill/chip, both used by three or more of the eight types. | Repeated inline in `sym:TaskCard` (tag pills) and `sym:UserCard` (contact rows) today | New types add ~60 lines each instead of ~140 |

### 2.1 The four new types

| ID | Type | Data (`XData`) | Layout | Height |
|---|---|---|---|---|
| T1 | `sym:IDCard` / `sym:idCard` | `name` · `title?` · `idNumber` · `org?` · `photo?` · `initials?` · `validUntil?` · `status?` · `accent` | Accent header band carrying `org` → photo chip (icon, or `initials` label on a rounded rect) left of name + title → divider → `idNumber` bottom-left, status pill bottom-right | fixed |
| T2 | `sym:OrganisationCard` / `sym:organisationCard` | `name` · `kind?` · `logo?` · `monogram?` · `location?` · `headcount?` · `founded?` · `accent` | Logo chip (accent-tinted `icon` background) beside name + `kind` tag → divider → meta rows: `lucide/map-pin` location · `lucide/users` headcount · `lucide/calendar` founded | grows per present meta row |
| T3 | `sym:ProductCard` / `sym:productCard` | `title` · `price` · `image?` · `icon?` · `rating?` · `reviews?` · `tags?` · `stock?` · `accent` | Media band (`clip: true`, so it follows the corners) → 2-line title with ellipsis → price left, `lucide/star` + `4.6 (128)` right → tag chips | grows with the tag row |
| T4 | `sym:EventCard` / `sym:eventCard` | `title` · `day` · `month` · `time?` · `venue?` · `attendees?` · `accent` | Date chip (rounded rect in `accent`; `day` bold over `month` uppercase) left of a 2-line title → meta rows: `lucide/clock` · `lucide/map-pin` · `lucide/users` | fixed |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| C1 | Read the part vocabulary the four layouts need against `sym:CompositePart` | `rect` · `circle` · `line` · `label` · `icon` all present; `label` carries `maxWidth` / `maxLines` / `overflow` for the 2-line titles | No engine change; the design is expressible today |
| C2 | Check `clip: true` behaviour for T3's media band | `file:packages/canvas-core/src/specs/shape.ts` documents clip as exactly this case ("a full-width header follows the rounded corners") — and `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` fixed the mask defect | T3's edge-to-edge band is safe on the current renderer |
| C3 | Check whether `idCard` collides as an export | `file:packages/graph/src/template/structures.ts#L68` is a module-local `const`; only `BUILT_IN_STRUCTURES` / `BUILT_IN_STYLINGS` are exported | The overlap is conceptual, not a compile error — D-1 is a naming judgement, not a blocker |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/canvas-templates-plan.md` | `relates-to` | implemented | Layer-2 template model (`CardStructure` / `compileCard` / `BUILT_IN_STRUCTURES`). Untouched here — this RFC is the *class* catalogue beside it, not the template compiler |
| `doc:docs/node-styling-unification-plan.md` | `relates-to` | planned | The eventual `primaryColor` semantic styling for simple + composite. This RFC keeps baked colour defaults so it doesn't pre-empt that design (D-3) |
| `rfc:fix-2026-09-13-composite-card-renders-as-bare-outline` | `depends-on` | landed | Composite `fill` + `clip` now work; T3's media band depends on that fix |
| `doc:docs/node-record-types-rfc.md` | `relates-to` | proposed | `GraphNode.data` is the payload the stock functions read. No change |
| Root `CLAUDE.md` § "The card / template stack" | `relates-to` | current | Three layers stay separate: engine `CompositeShape` · graph templates + classes · designer. This RFC moves nothing between layers |

---

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph/src/cards/` → `file:packages/graph/src/nodes/composite/` | `git mv` the folder; `base.ts` · `shared.ts` · `types.ts` · `index.ts` unchanged in content | One home named for the concept | low — internal path, no subpath export | — |
| F2 | dressing | implemented | `file:packages/graph/src/nodes/composite/schemaTable.ts` → `schemaTableCard.ts` | Rename the one file that breaks the `*Card.ts` convention | Filenames match their exports | low | F1 |
| F3 | defect | implemented | `file:packages/graph/src/index.ts#L303-L331` | `from './cards'` → `from './nodes/composite'`; add the new exports | Barrel points at the new home | low — names preserved | F1 |
| F4 | defect | implemented | `file:packages/graph/src/nodes/composite/shared.ts` | Add `metaRow()` (icon + text) and `chip()` (pill) helpers | S6 — new types stay short, existing inline copies can follow later | low | F1 |
| F5 | defect | implemented | `file:packages/graph/src/nodes/composite/types.ts` | Promote `sym:TaskTag` to `sym:CardTag`; keep `TaskTag` as an alias | T3 reuses the tag shape without importing a task type | low — alias keeps it non-breaking | D-4 |
| F6 | defect | implemented | `file:packages/graph/src/nodes/composite/idCard.ts` (new) | `sym:IDCardSpec` · `ID_CARD_DEFAULTS` · `sym:IDCard` · `sym:idCard` · `sym:IDCardData` per T1 | Ships the identity type | low | F1, F4, D-1 |
| F7 | defect | implemented | `file:packages/graph/src/nodes/composite/organisationCard.ts` (new) | Same five per T2, variable height | Ships the organisation type; retires the story-local `orgBadge` pattern | low | F1, F4, D-2 |
| F8 | defect | implemented | `file:packages/graph/src/nodes/composite/productCard.ts` (new) | Same five per T3; media band uses `clip: true` | Ships the product type | medium — `clip` + edge-to-edge band is the combination that broke once (`rfc:fix-2026-09-13-composite-card-renders-as-bare-outline`) | F1, F4, F5 |
| F9 | defect | implemented | `file:packages/graph/src/nodes/composite/eventCard.ts` (new) | Same five per T4 | Ships the event type | low | F1, F4 |
| F10 | defect | implemented | `file:packages/graph/tests/nodes/composite/cards.test.ts` (new) | Geometry invariants for all eight builders: positive box, every part inside the frame, optional fields omit their rows | Catches layout regressions without a story | low | F6–F9 |
| F11 | dressing | implemented | `file:packages/graph/CLAUDE.md` | One line: composite node types live in `src/nodes/composite/`, one file per type, spec-driven | The next session doesn't recreate `cards/` | low | F1 |
| F12 | defect | implemented | `file:apps/storybook/stories/graph/Nodes/Types/composite-shapes/` (4 new) | One story per new type, filed beside the existing four per root rule 11's path map (graph node feature → `Graph/Nodes/`) | Each new type is visible and draggable; the auto-sizing types show a populated *and* a bare node so the height difference is the story | low — additive, no existing story touched | F6–F9 |
| F13 | defect | implemented | `file:apps/storybook/stories/graph/Nodes/Types/composite-shapes/MixedTypes.stories.ts` · `Restyling.stories.ts` | Two **usage** showcases: all eight types in one graph dispatched on `node.type`, and the three ways to use a card (stock fn / configured spec / subclass override) | Covers the two things per-type stories can't show — heterogeneous dispatch, and the spec-driven restyling promise in `sym:CompositeCard`'s TSDoc, which had no story at all | low — additive | F6–F9, F12 |
| F14 | defect | implemented | `file:apps/storybook/stories/usecases/by-casestudies/org-directory/OwnershipChain.stories.tsx` · `commerce/StockExposure.stories.tsx` · `events/SpeakerClashes.stories.tsx` | Three **applied case studies** on `sym:GraphCanvasApp` + `sym:ElkLayout`, each meeting the `file:apps/storybook/CLAUDE.md` bar: a named analyst, a question they own, a decision they defend | The cards in a domain picture rather than a type reference; each feeds ELK its **real auto-sized box** via `nodeSize`, which is the integration nobody had written down | medium — adds three folders under `usecases/by-casestudies/`, which `doc:docs/casestudies-rfc.md` locks to five case studies (see D-8) | F6–F9 |
| F15 | defect | implemented | the three F14 case studies | Mount `sym:TextResolutionLODBehaviour` (kind `label-resolution-lod`) via the declarative `pkg:@invana/canvas-react` wrapper, beside `sym:ElkLayout` | Card text stays crisp through zoom. The ten `composite-shapes` stories already registered it imperatively; the `sym:GraphCanvasApp` case studies had **no** LOD behaviour at all, which is the real gap this closes | low | F14 |
| F16 | defect | implemented | `file:packages/graph/src/nodes/composite/productCard.ts#L84` · `eventCard.ts#L73` · `idCard.ts#L107` · `taskCard.ts#L70` | Declare `align: 'left'` on every **wrapping** (`maxLines: 2`) title | Two-line titles read left-aligned. `sym:TaskCard` carried the same latent defect since 2026-07-10 and is fixed with them | medium — changes how `story:graph/Nodes/Types/Composite Shapes/Task Card` and every task-card consumer *looks*; per §4's standing rule a visual change is never low | — |
| F18 | defect | implemented | `sym:ChipOptions` (`file:packages/graph/src/nodes/composite/shared.ts`) + `sym:ProductCardSpec` · `sym:IDCardSpec` · `sym:OrganisationCardSpec` · `sym:TaskCardSpec` | Expose chip corner radius: `ChipOptions.cornerRadius` (default `height / 2`) and a `chipRadius` spec field on the four cards that draw chips | Chips are restylable without subclassing — closes the last hard-coded value in the catalogue, which contradicted the cards' "every radius lives in `spec`" promise | low — default preserves the current pill exactly | — |
| F19 | defect | implemented | the 8 session stories that render chip-bearing cards | Set `chipRadius: 1` per story via a configured instance (`new ProductCard({ chipRadius: 1 })`), leaving the library defaults as pills | Squared chips in our stories without changing what the package ships. The three `.tsx` case studies memoise the instance — building one per render churned `cardOf` and with it the whole canvas `config` | low | F18 |
| F17 | defect | superseded | `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L206` | Moved to `rfc:fix-2026-09-19-composite-label-text-cannot-be-vertically-centred` **F6**, where it sits with its vertical sibling and shares one visual sweep | — | — | — |

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CompositePart` (`file:packages/canvas-core/src/specs/shape.ts#L325`) | Every part the eight types emit | A part-kind change rewrites all eight builders |
| U2 | `sym:CompositeShapeOption` (`file:packages/graph/src/layer/types.ts`) | The return type of `sym:CompositeCard.build` | Signature change touches the base, not each type |
| U3 | `sym:CompositeShape` clip/fill semantics (`pkg:@invana/renderer-pixijs`) | F8's media band | Regressing the landed clip fix makes T3 render empty |
| U4 | iconify CDN (`sym:iconifyUrl`) | T2/T3/T4 meta icons | Offline/blocked CDN → missing glyphs across the catalogue, existing types included |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `file:packages/graph/src/index.ts#L331` | barrel | The only file importing `./cards` | Edit — F3 |
| D2 | `story:graph/Nodes/Types/composite-shapes/UserCard` · `StatCard` · `TaskCard` · `SchemaTable` | stories | Import from `'@invana/graph'` (`file:apps/storybook/stories/graph/Nodes/Types/composite-shapes/UserCard.stories.ts#L22`), not from a path | **None** — names preserved; they are the control (V6) |
| D3 | `story:usecases/by-casestudies/code-kg/CompositeCards` · `HealthBadges` | stories | Name-match only on the word "CompositeCards"; no card export imported | None |
| D4 | `story:usecases/SimpleAndCompositeNodes` | story | Its inline `orgBadge` is now redundant with `sym:organisationCard` | **None this RFC** — rule 11. Noted for a future ask |
| D5 | Published `@invana/graph` API | package surface | Single `.` export, no subpaths (`packages/graph/package.json`) | None for the move; additive for F6–F9 |
| D6 | `pkg:@invana/canvas-designer` | package | Imports `sym:FreeformStructure` from `@invana/graph`, never the card classes | None |
| D7 | `pnpm check-api-surface` | tooling | No `api/graph.surface.txt` exists | None — no snapshot to regenerate |
| D8 | Serialised canvas state | persistence | Cards are build-time shape resolvers invoked from `node.style.shape`; nothing stores a class reference | None |
| D9 | Root `CLAUDE.md` § "card / template stack" | doc | Names `packages/graph/src/template/`, never `src/cards/` | None |
| D10 | `story:graph/Nodes/Types/Composite Shapes/ID Card` · `Organisation Card` · `Product Card` · `Event Card` | stories | New, added on request after approval | Land with F12; `apps/storybook` gains no dependency |
| D11 | `story:graph/Nodes/Types/Composite Shapes/Mixed Types` · `Restyling` | stories | New usage showcases | Land with F13. Filed under `graph/`, **not** `usecases/` — `file:apps/storybook/CLAUDE.md` rules that an engine-capability demo wearing a use-case costume belongs to its owning package's namespace, and neither meets the case-study bar (a named analyst, a question they own, a decision they defend) |
| D12 | `story:usecases/by-casestudies/org-directory/OwnershipChain` · `commerce/StockExposure` · `events/SpeakerClashes` | stories | Three new case-study folders | Land with F14. Each meets the analyst/question/decision bar, so they are case studies rather than dataset demos — but they widen the locked set of five (D-8) |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm --filter @invana/graph check-types` | `pkg:@invana/graph` | Clean — no dangling `./cards` import | F1–F9 |
| V2 | pass | `pnpm --filter @invana/graph build` | `dist/index.d.ts` | Declares the 4 classes, 4 stock functions, 4 spec + 4 data types, `sym:CardTag` | F3, F5–F9 |
| V3 | pass | `pnpm --filter @invana/graph test` | `file:packages/graph/tests/template/` | **Control** — the template suite passes exactly as it does today; the move touches no template code | F1, F2 |
| V4 | pass | `pnpm --filter @invana/graph test` | `file:packages/graph/tests/nodes/composite/cards.test.ts` | Every builder returns `width`/`height` > 0 with all parts inside the box; absent optional fields emit no row | F6–F10 |
| V5 | pass | `pnpm lint` (root — includes `check-boundaries`) | monorepo | No new boundary violation; no drawing or state library reaches `pkg:@invana/graph` | F1–F11 |
| V6 | pending | Render `story:graph/Nodes/Types/composite-shapes/UserCard` in a **visible** tab (background tabs suspend rAF) | `apps/storybook` | **Control** — unchanged pixels; the folder move is invisible to it | F1, F3 |
| V6a | pass | `pnpm --filter @canvas/storybook check-types` | `apps/storybook` | **Control**, headless half of V6 — all four existing card stories compile unchanged against the moved package, proving the move is invisible to consumers short of pixels | F1, F3 |
| V7 | pending | Render each new type in a **visible** tab via its story (F12) | `apps/storybook` | Parts land where §2.1 says; T3's media band follows the corner radius; the bare node of each auto-sizing type is visibly shorter | F6–F9, F12 |
| V8 | pass | `pnpm --filter @canvas/storybook check-types` + `lint` with the four new stories present | `apps/storybook` | Clean typecheck, 0 lint errors — supersedes V7's "scratch story, not committed": the render check now has committed stories to run against | F12 |
| V9 | pass | `check-types` + `lint` + `check-boundaries` with the two showcase stories present | `apps/storybook` | Clean typecheck; 0 lint errors and the warning count unchanged at 65 (none in `composite-shapes/`); boundaries intact | F13 |
| V10 | pass | `check-types` + `lint` with the three case studies present | `apps/storybook` | Clean typecheck; 0 lint errors, warning count still 65 (none in the new folders). `sym:CompositeShapeOption` assigns to the node `shape` slot with **no cast** — `story:usecases/by-casestudies/code-kg/CompositeCards` needed `as unknown as NodeShapeOptions` only because it built a raw literal | F14 |
| V11 | pass | `check-types` + `lint`, and an audit of the label behaviour across all 13 stories | `apps/storybook` | Clean; warning count still 65. All ten `composite-shapes` stories carry `new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph', enabled: true })`; the three case studies now mount `<TextResolutionLODBehaviour />` | F15 |
| V12 | pass | `pnpm --filter @invana/graph test` — new case: every wrapping label declares `align` | `file:packages/graph/tests/nodes/composite/cards.test.ts` | 184 tests pass (8 new). Guards against the renderer default silently re-centring a future card | F16 |
| V13 | pass | `pnpm --filter @invana/graph test` + `check-types` + `check-api-surface` | `cards.test.ts` | **190 pass** (3 new): chip defaults to a pill, honours an explicit radius, and a card spec restyles its chips. Surfaces unchanged | F18 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | `sym:IDCard` / `idCard()` overlaps the template structure key `idCard` (`file:packages/graph/src/template/structures.ts#L69`). | (a) ship `IDCard`/`idCard()` anyway — C3 shows no export collision; (b) name it `BadgeCard`/`badgeCard()`; (c) rename the template structure | **(a)**, with a TSDoc cross-reference on both so the two are distinguishable at the call site. They are different layers of the same stack, and `idCard` is the honest name for both | accepted — 2026-09-19 |
| D-2 | `OrganisationCard` or `OrganizationCard`? `dataset:topicCartography` and `dataset:computingPioneers` both use `Organization` as a node **type string**. | (a) `OrganisationCard` as asked; (b) `OrganizationCard` matching the datasets; (c) both, one aliased | **(a)** — the dataset strings are *data*, not API, so nothing conflicts. One name, no alias | accepted — 2026-09-19 |
| D-3 | Baked colour defaults, or theme roles, for the four new types? | (a) baked dark defaults matching the shipped four; (b) `ColorRole` resolution like `BUILT_IN_STYLINGS` | **(a)** — `file:packages/graph/src/nodes/composite/shared.ts` already documents theme-role colouring as a later enhancement, and `doc:docs/node-styling-unification-plan.md` owns that design. Converting four types now forks the catalogue mid-flight | accepted — 2026-09-19 |
| D-4 | Promote `sym:TaskTag` to `sym:CardTag`? | (a) promote + alias; (b) leave it, T3 imports `TaskTag`; (c) T3 declares its own `ProductTag` | **(a)** — a `{ label, color }` chip is not a task concept; the alias keeps it non-breaking | accepted — 2026-09-19 |
| D-5 | Folder name and scope of the move. | `nodes/composite/` with all eight types vs. leaving `cards/` in place | **`nodes/composite/`, everything moves** | accepted — answered 2026-09-19 |
| D-6 | Which new types to ship. | ID · Organisation · Product · Event, or a subset | **All four** | accepted — answered 2026-09-19 |
| D-7 | Rename the existing exports to `*Node`? | Rename vs keep | **Keep** — `sym:UserCard` etc. unchanged, so the move is non-breaking | accepted — answered 2026-09-19 |
| D-8 | Three new folders under `usecases/by-casestudies/` vs. the five case studies `doc:docs/casestudies-rfc.md` locks (CS1–CS5), which also says the folders there today are dataset demos "being rewritten into" the bar. | (a) keep all three as written; (b) fold `OwnershipChain` into **CS1** (financial crime — its substrate is already a Wikidata *corporate ownership chain* with named officers) and keep the other two; (c) re-home all three under `graph/Nodes/` | **(b)** — `OwnershipChain` is CS1's onboarding beat wearing a different name, and merging it stops the set drifting past five. Built as (a) on request; the merge is a follow-up, not a rewrite | open |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-19 | Opened after an inventory of the composite catalogue | proposed | Asked what ships as composite node types; found four classes + one `idCard` template structure, and a story-local `orgBadge` |
| 2026-09-19 | D-5 · D-6 · D-7 answered | accepted | Move everything to `nodes/composite/`; add all four new types; keep existing export names |
| 2026-09-19 | Approved whole; D-1 … D-4 accepted as recommended | accepted | `IDCard`/`idCard()` ships with a TSDoc cross-reference; `OrganisationCard` spelling; baked dark defaults; `CardTag` + deprecated `TaskTag` alias |
| 2026-09-19 | F1–F11 implemented | implemented | V1–V5 + V6a pass (176 tests, 23 new). V6/V7 pending — `apps/storybook` has no headless screenshot tooling, so the pixel pass needs a visible tab |

---

## 9. What implementation taught us

| ID | The document said | What was actually true | Action |
|---|---|---|---|
| L1 | F4 adds helpers to `shared.ts` | `shared.ts` held only colours + `sym:iconifyUrl` and imported nothing — it needed a `sym:CompositePart` import before it could build parts at all | Added the import; its module docblock also named only the original four builders and was rewritten to name the folder |
| L2 | F5 promotes `sym:TaskTag` to `sym:CardTag` | `sym:TaskCardData.tags` also had to switch to `CardTag[]`; the alias alone doesn't move the field's type | Both changed; `TaskTag` kept as a `@deprecated` alias so no import breaks |
| L3 | V6 renders a story to prove the move is invisible | `apps/storybook` carries no playwright / puppeteer / test-runner, so nothing renders headlessly | Split: V6a (`check-types` over all four card stories) runs in-session and passes; V6 (pixels) stays pending |
| L4 | `sym:chip` lays chips out left → right | Text is measured by the renderer, not in the builder, so chip width is estimated from character count — the same approximation `sym:TaskCard.pill` already makes | Documented on `sym:chip`; a long chip label can overhang. Revisit only if a measured-text seam reaches the spec layer |
| 2026-09-19 | Stories requested and added (F12) | implemented | Four stories beside the existing four; V8 passes. V7 now runs against committed stories rather than a scratch one |
| 2026-09-19 | Asked whether these belong in `pkg:@invana/canvas` or `pkg:@invana/graph` | accepted | **graph**, unchanged: `sym:CompositeCard.build` returns `sym:CompositeShapeOption` (a graph type) and they're consumed through `node.style.shape`; the domain-free floor rule bans domain nouns in canvas primitives; and the 2026-07-10 decision already settled it. If a canvas-only consumer ever needs them, extract the *generic* composer (`sym:metaRow` / `sym:chip` / a row-stack helper) to canvas and leave the domain-named types here — a separate RFC |
| 2026-09-19 | Usage showcases requested and added (F13) | implemented | `Mixed Types` (dispatch on `node.type`) + `Restyling` (stock / spec / subclass). Filed under `graph/Nodes/`, not `usecases/`, per the storybook namespacing rule |
| 2026-09-19 | Applied case studies requested and added (F14) | implemented | Three on `sym:GraphCanvasApp` + `sym:ElkLayout`, each with a named analyst, an owned question and a defended decision. Raised D-8: they widen `doc:docs/casestudies-rfc.md`'s locked five, and `OwnershipChain` overlaps CS1 |
| 2026-09-19 | `label-resolution-lod` added to the case studies (F15) | implemented | Audit found the ten `composite-shapes` stories (MixedTypes included) already registered it; only the three `sym:GraphCanvasApp` case studies lacked one |
| 2026-09-19 | Wrapped card titles rendered centred; fixed at card level (F16) | implemented | Root cause is `file:packages/renderer-pixijs/src/primitives/paint/labelContent.ts#L206` defaulting an unset `align` to `'center'` — it only shows on a label that wraps, which is why single-line card text looked fine. Fixed in the four affected cards per instruction ("card level, not story level"); the renderer default itself is raised as F17, unlanded |
| 2026-09-19 | F17 superseded | superseded | The `align` default moved into the vertical-centring fix RFC — same files, same visual sweep |
| 2026-09-19 | Chip corner radius exposed (F18) | implemented | Landed directly without its own RFC — an optional field with a back-compatible default, recorded as a row here instead |
| 2026-09-19 | Chips squared in the stories only (F19) | implemented | Library defaults stay pills. `story:…/Restyling`'s **stock** variants deliberately keep the pill — they are labelled "Stock — productCard(data)", so configuring them would make the story's own caption false |
