---
id: feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks
type: feat
title: A node type's frame, alpha and layout size can only be said with a callback, so a config that uses them cannot be serialised
status: proposed
opened: 2026-09-21
decided: null
landed: null
packages: [pkg:@invana/graph, pkg:@invana/graph-layout-elkjs, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: doc:docs/node-styling-unification-plan.md
relations:
  - { predicate: relates-to, object: rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/code-explainability/CodeExplainability }
  - { predicate: relates-to, object: doc:docs/node-styling-unification-plan.md }
---

## Summary

| | |
|---|---|
| **Goal** | Every setting in a story's `CanvasConfig` is JSON. No callback anywhere in `layers` / `layouts` / `behaviours` |
| **Why it isn't today** | The config has **two doors** into node presentation. `nodeTypes` + templates is declarative and per-type; `node.style` is resolver-based. Three things can only be said through the *second* door, so the moment a visualisation needs one, its config stops being data |
| **The three** | `G1` fill / stroke **alpha** · `G2` **`group`** (what makes a node a frame) · `G3` a **layout size** that differs for containers |
| **Blocked on** | `D1` where `group` belongs · `D2` whether `G3` is a defect or an option |
| **Row status** | proposed 1 · accepted 0 · implemented 0 · landed 6 · rejected 1 — `G1` `G2` `G3` `G5` `G6` `G8` landed; `G4` **rejected**; `G7` open |

`story:usecases/by-casestudies/code-explainability/CodeExplainability` is the worked
example: **7 resolvers + 1 layout callback**, every one of the form
`node.type === 'package' ? X : undefined` — a per-type constant wearing a function's
clothes, because there is no per-type slot to put it in.

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | 7 of the story's node-presentation settings are callbacks; all 7 branch on `node.type` alone | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx#L216-L262` | `group` · `shape` · `bgFill` · `bgStrokeColor` · `bgStrokeAlpha` · `bgStrokeWidth` · `labelText` |
| M2 | The 8th is the ELK `nodeSize` callback, which the story's own comment flags as the reason it rides `options` rather than the serialisable config | same, the `sym:ElkLayout` child | *"`nodeSize` is a function, so it rides the `options` prop rather than the serialisable config"* |
| M3 | A callback cannot be saved, diffed, sent to a collaborator, or edited in `sym:CanvasSettingsEditorPanel` — the editors mirror only the serialisable subset | `file:packages/canvas-ui/src/editors/behaviours/hover-activate/types.ts#L18-L22` | Same argument that replaced the `enable` predicate in `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes` |
| M4 | The declarative door already exists and this story already uses it — for the 12 *content* types | same file, `nodeTypes` / `structures` / `stylings` | So the gap is not "no template system"; it is three holes in the one there is |

### What already works — do not rebuild it

| ID | Setting | Declarative today? | Route |
|---|---|---|---|
| A1 | `shape` (the frame's `rect`) | **yes** | `sym:SimpleStructure.shape` — `NodeShapeOptions` verbatim (`file:packages/graph/src/template/types.ts#L50-L57`) |
| A2 | `bgStrokeColor` | **yes** | `sym:NodeStylingTemplate.stroke` / `strokeRole` |
| A3 | `bgStrokeWidth` | **yes** | `sym:NodeStylingTemplate.strokeWidth` |
| A4 | `labelText` | **yes** | `sym:NodeTypeBinding.bindings.label` → a dotted path; `'id'` gives `node.id` (`file:packages/graph/src/template/compile.ts#L112-L113`) |
| A5 | `bgFill` **colour** | **yes** | `sym:NodeStylingTemplate.fill` / `fillRole` |

Four of the seven resolvers are already redundant — they exist because the *other three*
forced the author into `node.style`, and once you are there it is simpler to keep going
than to split one type's presentation across two mechanisms. **That is the real cost:
one hole pulls the whole type through it.**

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | `sym:NodeStylingTemplate` pairs every colour as `*Role` **or** a literal number — and stops there. No alpha on either | `file:packages/graph/src/template/types.ts#L218-L239` | A tint (`{ kind: 'solid', color, alpha: 0.14 }`) is unsayable → `G1` |
| D-2 | The story needs alpha specifically because a **theme-agnostic** frame fill has to composite against whichever backdrop is behind it — a literal picked for dark mode is wrong in light | the `bgFill` comment in the story | `G1` is not cosmetic; it is what makes one value work in both themes |
| D-3 | `sym:GroupOptions` is reachable only at `NodeStyle.group`, and `NodeStyle` is the resolver door. No structure or styling template mentions groups | `file:packages/graph/src/template/types.ts` (no `group` field anywhere) | "this type is a frame" is unsayable per type → `G2` |
| D-4 | ~~`sym:resolveNodeSize` makes ELK reserve room for a container *and* its children~~ **WRONG — see `X1`.** `sym:ElkLayout.buildElkNode` already discards a container's own box | `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L288-L295` | The real group/ELK defect is next door, in `sym:groupSizeFloor` — see `X2` |
| D-5 | `sym:ElkLayoutOptions.nodeSize` is the only override, and it is `(node) => NodeSize` | `file:packages/graph-layout-elkjs/src/types.ts#L154` | The escape hatch is itself a callback; there is no data form |

**Why a per-type map rather than richer resolvers.** Every one of `M1`'s callbacks is a
constant keyed by `type`. The template system is *already* the per-type index
(`sym:NodeTypeRegistry`), so the fix is to widen what a type may declare — not to invent
a second keying mechanism, and not to make `node.style` serialisable (it is a resolver
surface by design, and layouts / behaviours legitimately need it).

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/node-styling-unification-plan.md` | design-of-record | open | One semantic node style across simple + composite. This RFC is a **subset landing**: the three fields that block serialisation, not the whole unification |
| `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes` | relates-to | accepted | Established the pattern: a serialisable option beside a callback, with the callback kept for what no list can say. Same shape here |
| `file:packages/graph/src/template/structures.ts` | relates-to | shipped | `BUILT_IN_STYLINGS` is where a new styling field must also be defaulted |

### Correction — what the implementation of `G3` disproved

| ID | Claim in the first draft | Verdict | Evidence |
|---|---|---|---|
| X1 | "ELK reserves room for the container *and* for the children inside it" | **False.** For any group with children, `sym:ElkLayout.buildElkNode` overwrites the `sizeOf` result with `sym:groupSizeFloor`, or `delete`s `width`/`height` so ELK sizes the container from its children alone | `file:packages/graph-layout-elkjs/src/ElkLayout.ts#L288-L295` |
| X2 | — | The real defect is the **opposite**: `sym:groupSizeFloor` returned `undefined` for every `autoFit` group, so a declared floor never reached ELK at all | `file:packages/graph/src/layout/groups.ts` |
| X3 | "the story's `nodeSize` callback exists to zero the containers" | **False.** The package branch is dead code — a container with children never uses it. The callback's real job is sizing the **leaf cards**, which `sym:resolveNodeSize` gets wrong only on the *first* run, before `node.boundingBox` is populated | `file:packages/graph/src/layout/groups.ts`, `resolveNodeSize` |
| X4 | — | So `G6` cannot drop the ELK callback by fixing groups. Removing it needs the leaf-sizing gap (`X3`) answered instead — a different problem, now `G7` | — |

## 4. The work

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| G1 | feature | landed | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/template/compile.ts` | `fillAlpha?: number` and `strokeAlpha?: number` on `sym:NodeStylingTemplate`; compile to `bgAlpha`-free form — `fillAlpha` onto the **fill layer** (`{ kind: 'solid', color, alpha }`), `strokeAlpha` onto `bgStrokeAlpha` | A tint is sayable per type, and lands on the fill only — not on the border, which is the bug the story's own comment documents | low — additive, both default to opaque | — |
| G2 | feature | landed | `file:packages/graph/src/template/types.ts` + `file:packages/graph/src/layer/GraphLayer.ts` | `group?: GroupOptions` on **`sym:NodeStylingTemplate`** (`D1`(c), chosen by the maintainer). Applied in `sym:GraphLayer.resolveTypeBinding` rather than inside a compiler, so it reaches `simple`, `card` and `freeform` on identical terms | "this type is a container" becomes data. This is the row that unblocks the other six resolvers | **medium** — `GroupOptions` is a 15-field surface and this is its second home; a type declaring `group` changes hit-testing, z-order and auto-fit for every node of that type | — |
| G3 | fix | **landed** | `file:packages/graph/src/layout/groups.ts` | `sym:groupSizeFloor` rewritten. Three defects, all group-specific, all reaching every layout: **(a)** it bailed out on `autoFit`, on a rationale that is factually wrong — the fit is computed into a local in `sym:GraphLayer.nodeSpec` (`file:packages/graph/src/layer/GraphLayer.ts#L1510`) and never written back, so `style.shape` is the author's declared value and no ratchet is possible; **(b)** it read only `style.shape`, ignoring `group.width`/`height`/`radius`, which `projectGroupShape` treats as the *primary* floor — so the documented way to declare a floor was invisible to every layout; **(c)** it quoted the floor in **content** terms while ELK needs the **outer** box, under-reserving by exactly the insets | `group: { autoFit: true, width: 400 }` now reserves in ELK what it paints at, instead of being packed against by its siblings and overlapping them | **medium** — moves layout output for any group that declares a floor. Groups that declare none are untouched (still `undefined` → ELK sizes from children) | — |
| G4 | feature | **rejected** | `file:packages/graph-layout-elkjs/src/types.ts` | `nodeSizeByType?: Record<string, NodeSize>` | **Not needed, and the rejection is the record.** Removing the story's `nodeSize` callback needed no new API: containers never consulted it (`X1`), leaves resolve from their declared structure, and the remaining fallback is the **existing** serialisable `defaultNodeSize`. Reopen only if a type must lay out at a size other than its drawn one | — | — |
| G7 | fix | proposed (unconfirmed) | `file:packages/graph/src/layout/groups.ts` | **Opened by `X3`.** `sym:resolveNodeSize` falls back to `defaultNodeSize` (40 × 40) for a node that has not yet rendered, because `node.boundingBox` is only written after a draw — so the *first* layout of composite cards packs them as if they were 40 px and they overlap. This is what the story's `nodeSize` callback is really working around | A one-shot layout would place cards correctly on the first run, with no per-story callback | **medium** — needs a pre-render size path for composite shapes; possibly `layer.boundsOfNode` should serve it | — |
| G5 | feature | landed | `file:packages/canvas-ui/src/editor-panels/node-styling/` | The two alpha fields. **`group` is not surfaced** — 15 nested fields in a panel built for roles and typography | The alphas are editable | low | G1, G2 |
| G8 | fix | landed | `file:packages/canvas-ui/src/editor-panels/node-styling/mapping.ts` + `NodeStylingEditorPanel.tsx` | **Found while landing `G2`.** `sym:formToStyling` rebuilds the template from the fields the form models, silently dropping everything else — the literal colour pairs and the rest of `label`'s typography, both **pre-existing**. `G2` gave that teeth: an unrelated colour edit would have dropped `group` and un-framed every container. `formToStyling(values, base)` now carries the unmodelled fields verbatim | An editor can no longer delete what it cannot show | low — but it fixes a live data-loss path, and per-slot extras are still dropped (noted in the TSDoc) | G2 |
| G6 | feature | landed | `file:apps/storybook/stories/usecases/by-casestudies/code-explainability/CodeExplainability.stories.tsx` | Add a `packageFrame` structure + styling + a `package` entry in `nodeTypes`; **delete all 7 resolvers and the ELK `nodeSize` callback** from both configs | The whole config becomes JSON — the deliverable | low in code, **it is the proof** — if any resolver survives, the feature is incomplete | G1–G4 |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GroupOptions` | `G2` makes it reachable from a second place | Every future field must work from both doors, or they diverge |
| U2 | `sym:resolveNodeSize` | Shared by `sym:ElkLayout` **and** `sym:SubgraphPositionLayout` (`file:packages/graph/src/layout/SubgraphPositionLayout.ts#L176`) | `G3` changes both. Subgraph layouts with groups are in scope, not just ELK |
| U3 | `sym:NodeStylingTemplate` precedence (`*Role` wins over literal) | `G1` adds fields that are neither | Alpha must apply to whichever colour won, not re-open the choice |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:graph/Groups/*` (9 stories) + `story:graph/Behaviours/CollapseExpand` · `GroupResize` · `DragNode` | story | All declare groups through `node.style.group`; **unchanged**, `G2` is additive | None |
| C2 | Every ELK story with a group — incl. `story:usecases/by-casestudies/code-explainability/*` and `story:usecases/by-casestudies/agent-harness/Architecture` | story | `G3` changes computed positions. Layouts will differ, hopefully tighter | **Visual re-check each one**; this is the row that can regress pictures |
| C3 | `sym:SubgraphPositionLayout` consumers | runtime | `G3` via `U2` | Re-check any subgraph story with groups |
| C4 | `sym:BUILT_IN_STYLINGS` | published data | New optional fields; existing entries stay opaque | None |
| C5 | `sym:NodeStylingTemplate` · `sym:SimpleStructure` · `sym:ElkLayoutOptions` | published API | Additive optional fields | None; no `api/` snapshot covers these packages |
| C6 | Saved `CanvasConfig` JSON | state | Additive. **The point**: configs that previously *could not* round-trip now can | None |
| C7 | `pkg:@invana/canvas-designer` | UI | A designer that emits per-type presentation gains three things it can express | None now; unblocks later work |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `grep '=>'` and `grep 'function'` across the story | `story:…/CodeExplainability` | **Zero** functions in `layers` / `layouts` / `behaviours` / the template registries. The six remaining arrows are all React (`useMemo`, `useCallback`, two render props, one `onChange`) | G6 |
| V2 | **pass** (by construction) | Every config value is a literal — no factory call, no arrow, no `function` | same | `CARD_CONFIG`, `DOT_CONFIG`, `structures`, `stylings`, `FRAME_*` and `nodeTypes` are plain data | G6 |
| V11 | pending | Visual: ELK spacing is unchanged after dropping the `nodeSize` callback, in **both** looks | same | Identical layout. The callback pinned leaf boxes; measurement now supplies them, and `defaultNodeSize` only covers failure. **If cards overlap, `G7` is real and this is how it shows** | G6 |
| V3 | pending | Visual: the package frames look as they do today — same tint, same border, same header band, in **both** themes | same, Cards + Dots | Indistinguishable from `edd0a133`. **The load-bearing check**: the rewrite moved the frame from a layer-level resolver to a type binding, which sits at a different precedence (layer → **type** → per-node → states) | G1, G2, G6 |
| V10 | pending | Edit any styling in `sym:NodeStylingEditorPanel` for a type that declares `group`, save, and confirm the frame survives | Storybook | The container is still a container; literal colours survive too | G8 |
| V4 | pending | Visual: ELK spacing | same | **Unchanged** — the story's packages declare no `group.width`/`height`, so `sym:groupSizeFloor` still returns `undefined` for them. This story is a *control* for `G3`, not a demonstration | G3 |
| V9 | pending | Visual: a group that declares a floor — `story:graph/Groups/FixedSizeGroup` (`autoFit: false`) and a hand-made `autoFit: true` + `group.width` case | those stories | The frame reserves its painted size; siblings no longer crowd or overlap it. **This is the row that proves `G3`** | G3 |
| V5 | pending | **Control** — `story:graph/Groups/RectGroup`, which declares `group` the old way | that story | Unchanged | G2 |
| V6 | pending | **Control** — an ELK story with no groups | `story:graph-layouts/elkjs/*` | Byte-identical positions | G3 |
| V7 | pending | Settings panel shows and edits the two alphas | same | Live | G5 |
| V8 | pending | `pnpm build` · `check-types` · `lint` | repo | pass | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does `group` go? | (a) `sym:SimpleStructure.group` · (b) `sym:NodeTypeBinding.group` · (c) `sym:NodeStylingTemplate.group` | **(c)** — maintainer's call, and the better reading: the data states the hierarchy (`parentId`), and whether that hierarchy *renders* as a frame is presentation, the same class of decision as fill and stroke. It also leaves the skeleton reusable — two types can share one structure and disagree about being containers, which was the exact objection to (a) | **accepted** |
| D2 | Is `G3` a fix or a feature? | (a) fix · (b) feature behind a flag | **(a)** — accepted by the maintainer 2026-09-21 ("fix ELK for the groups once for all"). The *content* of the row changed after the decision: the defect is `sym:groupSizeFloor` ignoring declared floors, not double-reserving. Still a fix, still moves shipped pictures (`C2`), so it lands only with `V4`/`V6` green | accepted |
| D3 | Does `G1` need `bgAlpha` too (whole-shape opacity)? | (a) no — `fillAlpha` + `strokeAlpha` cover it, and `bgAlpha` multiplies the border, which is the trap the story documents · (b) yes, for completeness | **(a)**. Adding the footgun to the declarative surface would propagate it | open |
| D4 | Scope of `G6` | (a) the one story · (b) audit every story for `node.style` resolvers that are really per-type constants | **(a) now**. (b) is a follow-up worth doing once the surface is proven, not a precondition | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-21 | Opened — maintainer asked that the story's settings be JSON-serialisable throughout | proposed | Follows `rfc:fix-2026-09-21-group-frames-hover-and-select-as-nodes`, which made the *behaviour* settings serialisable; this is the layer/layout half |
| 2026-09-21 | Surveyed the template system: 4 of the 7 resolvers are already expressible; 3 gaps + 1 layout callback remain | proposed | `A1`–`A5` recorded so the implementation doesn't rebuild what exists |
| 2026-09-21 | Maintainer accepted `D2` — fix ELK for groups | accepted | — |
| 2026-09-21 | **`G3`'s diagnosis disproved before implementing** (`X1`–`X4`). Re-diagnosed to `sym:groupSizeFloor`; three defects found and fixed | accepted | `G3` landed. `G7` opened for the leaf-sizing gap the old diagnosis had misattributed to groups. `V4` demoted to a control; `V9` added as the real proof |
| 2026-09-21 | `D1` answered: `group` goes on the **styling** template — *"use the node styling options instead of adding styling to each node and edge data"* | accepted | Rules out routes 1 and 2 (per-node `style`, `states[]` overlay), both of which bought JSON by moving the selector into the data |
| 2026-09-21 | `G1`, `G2`, `G5`, `G6` landed | accepted | The story's `layers` block is now pure JSON: all 7 `node.style` resolvers deleted. `G8` opened and landed alongside, because `G2` turned a pre-existing editor round-trip bug into a data-loss path |
| 2026-09-21 | Maintainer: *"only jsons not methods to be passed in settings or graph data"* — the `card()` / `bind()` factories and ELK's `nodeSize` still counted | accepted | Factories expanded to literals (4 stylings, 12 type bindings). `nodeSize` deleted in favour of the existing `defaultNodeSize`, which **rejected `G4`** — the data escape hatch already existed. `V1` / `V2` now pass; `V11` added, since dropping `nodeSize` is the one change whose correctness rests on `G7` being unreal |
