---
id: feat-2026-09-21-a-diagram-definition-lives-in-resolver-functions
type: feat
title: A card's size can come from its node, so a diagram's definition is data rather than resolver functions
status: accepted
opened: 2026-09-21
decided: 2026-09-21
landed: null
packages: [pkg:@invana/graph, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/agent-harness/Architecture" }
  - { predicate: relates-to, object: "story:designs/IterationLoop" }
  - { predicate: relates-to, object: "story:designs/AgenticWorkflow" }
  - { predicate: relates-to, object: "doc:docs/rfcs/feat/2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship.md" }
---

## Summary

| | |
|---|---|
| **What this adds** | `story:usecases/by-casestudies/agent-harness/Architecture` is re-expressed as literal registries + literal node records and loses every resolver function. **No engine change**: F1–F3 (`FreeformStructure.widthBind` / `heightBind`) were implemented, then **rejected on review** — the maintainer chose the no-new-API route. Fixed-size marks (gate · frame · note) are templated; the thirteen boxes, which are ten different sizes, carry a literal `style.shape`. |
| **Why** | The diagram's look currently lives in five `(node) => value` closures on the layer template (`file:apps/storybook/stories/usecases/by-casestudies/agent-harness/Architecture.stories.tsx#L222-L291`). A closure cannot be stored, diffed, sent to the designer, or round-tripped through `io/` state export — so the drawing is code, not a document. |
| **The one blocker** | Everything else in that story is already expressible as data. The exception is size: 13 cards carry **10 distinct `w × h` pairs**, a `FreeformStructure`'s box is fixed at the template (`file:packages/graph/src/template/compile.ts#L410-L421`), per-node `style.shape` *replaces* a compiled shape rather than patching it (`file:packages/graph/src/layer/GraphLayer.ts#L3048-L3056`), and `style.size` no-ops on `composite` (`file:packages/graph/src/layer/GraphLayer.ts#L3179-L3183`). |
| **Rows** | F1–F3 engine (`pkg:@invana/graph`) · F4–F6 story · F7–F9 deferred |
| **Open decisions** | None — D-2 revisited 2026-09-21 and settled on option (b); D-4 fell away with it |
| **Row status** | proposed 0 · accepted 0 · implemented 3 · landed 0 · deferred 3 · rejected 3 |

**The engine already has the other four answers.** Per-type structures (`nodeTypes` + `nodeStructureTemplates`), per-node `style`, per-node `state` overlays and per-node `style.group` are all plain data today and all outrank the surfaces a theme publish rewrites. Only size has no data path.

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Node geometry is a `switch` on `node.type` inside a closure — 30 lines of TS that no tool can read | `file:apps/storybook/stories/usecases/by-casestudies/agent-harness/Architecture.stories.tsx#L222-L251` | The story source |
| M2 | Group-frame options are a second closure, fed from `node.data.group` — data smuggled through `data` because the option field wanted a function | `file:…/Architecture.stories.tsx#L252-L256` | Same |
| M3 | Every colour in the drawing is five more closures under a synthetic `look` state, keyed by `node.id` string equality | `file:…/Architecture.stories.tsx#L261-L291` | Same |
| M4 | The repo already has the function-free idiom for exactly this kind of plate — literal `STRUCTURES` / `TYPES` / `DATA`, commented *"The definition — literal JSON, top to bottom"* | `story:designs/IterationLoop`, `story:designs/AgenticWorkflow` | `file:apps/storybook/stories/designs/IterationLoop.stories.tsx#L61-L125` |
| M5 | `sym:FreeformStructure` is what `pkg:@invana/canvas-designer` emits — a story that cannot be written in it is a story the designer could never have produced | `file:packages/canvas-designer/src/templates/mapping.ts#L9-L31` | Designer round-trip is spread-based |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The story needs closures because per-node style has no home | **No** | `sym:GraphNode.style` and `sym:GraphNode.state` are first-class per-instance fields (`file:packages/graph/src/store/types.ts#L88-L103`), merged at `file:packages/graph/src/layer/GraphLayer.ts#L1051-L1065` |
| R2 | Colours must ride a resolver to survive the theme publish | **No** | The publish rewrites the **layer template** for ordinary nodes (`sym:paletteToNodeDefaults`, `file:packages/graph/src/theme/roles.ts#L30-L35`) and only per-node `style` for **group** nodes (`file:packages/graph/src/layer/GraphLayer.ts#L636-L644`). A per-node `state` overlay outranks both |
| R3 | Per-node `style.shape` could carry the compiled card, so no engine change is needed | **Possible, rejected** | It works (D-2 option b) but repeats both label parts on all 13 boxes and makes the template registry pointless. Kept as the fallback if F1–F3 are rejected |
| R4 | `style.size` already resizes a card | **No** | `sym:normalizeShapeSize` has no branch for `composite` and returns the shape untouched (`file:packages/graph/src/layer/GraphLayer.ts#L3179-L3183`) |
| R5 | The story's imperative `onReady` is part of the same problem | **Separate** | Raising connectors above filled frames is interaction state (`view.interaction.raised`), not definition. Out of scope by D-3 — see F7 |

---

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | A node type selects a **structure**; the structure is the skeleton, the node's `data` is the content | `file:packages/graph/src/layer/GraphLayer.ts#L658-L669` | `shape` closures become one registry entry per kind — `box` · `gate` · `frame` · `note` |
| D2 | `sym:compileFreeform` binds *text* per node (`bind: 'data.title'`) but not *size* — `struct.width` / `struct.height` go straight into the composite and into `sym:frameToRoot` | `file:packages/graph/src/template/compile.ts#L394-L421` | One template per size, or no template at all. This is the whole blocker |
| D3 | `sym:resolvePath` already reads an arbitrary dotted path off a node and returns `unknown`; only the string-coercing `sym:resolveText` is exposed to the compiler | `file:packages/graph/src/template/bindings.ts#L11-L27` | A numeric sibling is ~6 lines, no new concept |
| D4 | Give the structure `widthBind` / `heightBind`. When present and the path resolves to a finite number, that node's card uses it; otherwise the template's own `width` / `height` stand | F1–F3 | One `box` structure serves all 13 boxes; each node carries `data: { w, h, title, sub }` |
| D5 | Frames stay group nodes. `style.group` moves from `node.data.group` + a closure onto each frame node verbatim; colours move to a per-node `state.look` because the theme publish is the one writer that outranks per-node `style` on a group | `file:packages/graph/src/layer/GraphLayer.ts#L636-L644`, `#L1051-L1065` | The `look` overlay survives — but as four literal objects, not five closures |
| D6 | Ordinary nodes (box · gate · note) need **no** `look` state: their colours come from the structure (`bg` / `stroke` / element `color`) or per-node `style`, both of which outrank the template the publish rewrites | `sym:paletteToNodeDefaults` writes template-level only | `states: ['look']` drops from 20 nodes to 4 |

### The one conversion trap

| Item | Today (composite part) | As a `CardElement` | Why |
|---|---|---|---|
| Box title | `{ part: 'label', x: 14, y: 9, fontSize: 11 }` | `{ type: 'text', x: 14, y: -2, fontSize: 11 }` | `sym:compileFreeform` emits the part at `el.y + fontSize` (`file:packages/graph/src/template/compile.ts#L442`) |
| Box subtitle | `{ part: 'label', x: 14, y: 27, fontSize: 9 }` | `{ type: 'text', x: 14, y: 18, fontSize: 9 }` | Same |
| Box border | node-level `bgStrokeColor` + `bgStrokeWidth: 1`, alignment `'outside'` | the structure's own `stroke` / `strokeWidth`, alignment **centred** | `sym:GraphLayer.nodeSpec` pins `'outside'` on a node-level stroke (`file:packages/graph/src/layer/GraphLayer.ts#L1597-L1604`); a composite root stroke carries no alignment and `sym:alignmentFor` defaults to centred (`file:packages/renderer-pixijs/src/primitives/paint/applyFillStroke.ts#L264`). A half-pixel outward shift on the 1px card outline — the only known non-parity in F5. `sym:FreeformStructure` has no alignment field; adding one is a follow-up, not this RFC |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read `sym:GraphLayer.resolveNodeStyle` merge order | template → type binding → per-node `style` → layer state → **per-node state** | Everything the story's closures decide has a higher-precedence data seat |
| T2 | Read `sym:assignNodeStyle` | `shape` is last-write-wins; only `group` merges field-by-field | Per-node size cannot be a partial `style.shape` patch — F1–F3 is the only compact route |
| T3 | Count distinct card boxes in the story | 10 `w × h` pairs across 13 `box` nodes | One-structure-per-size (D-2 option c) would mean 10 near-identical registry entries |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `story:designs/IterationLoop` · `story:designs/AgenticWorkflow` | relates-to | landed | The target shape of the file: literal `STRUCTURES` / `TYPES` / `DATA`, variants as separate types. This RFC adopts it and adds the size axis it lacked |
| `rfc:feat-2026-09-19-composite-node-types-are-filed-as-cards-and-only-four-ship` | relates-to | — | Same surface (`pkg:@invana/graph` composite node types); no overlap with the size binds |
| `doc:docs/node-styling-unification-plan.md` | relates-to | plan | "One node style for simple + composite." A data-bound box is consistent with it; nothing here pre-empts it |
| `sym:ElkLayoutOptions.nodeSize` | relates-to | landed | Precedent for per-node size reaching a template-level concern |

---

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | rejected | `file:packages/graph/src/template/types.ts#L191` | `widthBind?: string` · `heightBind?: string` on `sym:FreeformStructure`, with TSDoc naming the fallback | The template can say "my box comes from the node" | Low — two additive optional fields; `pnpm check-api-surface` tracks export *names*, not members, so no snapshot churn | — |
| F2 | feature | rejected | `file:packages/graph/src/template/bindings.ts` | `sym:resolveNumber(node, path)` — `sym:resolvePath` + finite-number guard, `undefined` otherwise | A bind that misses is inert, never `NaN` | Low | — |
| F3 | feature | rejected | `file:packages/graph/src/template/compile.ts#L394-L421` | `sym:compileFreeform` resolves `width` / `height` through F2 before building the composite **and** before `sym:frameToRoot`, falling back to `struct.width` / `struct.height` | One structure, many sizes; a bound `frame` silhouette scales with the box | Medium — touches the compile path every freeform story renders. Inert when both binds are unset (identical object) | F1, F2 |
| F4 | feature | implemented | `story:usecases/by-casestudies/agent-harness/Architecture` | `structures` — `gate` (freeform, polygon `frame`) · `frame` (simple, 40×24 floor rect) · `note` (simple, 2×2 rect) — plus `types` and a `note` styling template pinning the invisible stroke. **Revised 2026-09-21:** the `box` structure was dropped with F1–F3 | The fixed-size marks become three registry entries | Low | — |
| F5 | feature | implemented | same story | `data` literal — nodes keep `position`; **the 13 boxes carry a literal `composite` on `style.shape`** (D-2 b); frames carry `style.group` + `state.look`; notes keep `style.label*` and gain `style.labelColor` | The drawing is a document | Medium — **this is the row that can change how the story looks**; every colour and coordinate is re-seated | F4 |
| F6 | feature | implemented | same story | Delete the `node.style.shape` / `node.style.group` / `node.state.look` resolvers from `config`; keep `labelFontSize`, the edge template and the behaviours block | Zero functions in the config | Low | F5 |
| F7 | dressing | deferred | same story, `onReady` | Unchanged — `store.actions.raise` for connectors and the post-publish colour re-assert stay imperative | The remaining imperative island is named, not hidden | — | Unblocked by a declarative connector z-order (`EdgeStyle.zIndex` or a layer-level `raised`), not proposed here |
| F8 | feature | deferred | `file:packages/canvas-designer/src/templates/fields.ts` | Surface `widthBind` / `heightBind` in the card form | The designer can author a data-sized card | — | Unblocked by F1–F3 landing; the round-trip already preserves them (spread, `file:packages/canvas-designer/src/templates/mapping.ts#L19-L31`) |
| F9 | feature | deferred | `file:packages/graph/src/template/compile.ts` (`sym:compileCard`) | Same binds for `sym:CardStructure` | Parity across structure kinds | — | Only if a consumer asks; `CardStructure` auto-lays-out rows, so a variable box also moves content |

**F5 is the risky row, not F3.** The engine change is additive and inert by default; the story rewrite re-seats ~200 literal values and is where a wrong `y` or a dropped `strokeWidth` shows up. Verification V4/V5 exist for that reason.

---

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.resolveNodeStyle` precedence (template → binding → node style → node state) | D5/D6 rest on per-node `state` outranking the theme's per-node group write | A reorder repaints every frame in the drawing with the palette's `cardBg` |
| U2 | `sym:paletteToGroupStyle` writing `bgFill` / `bgStrokeColor` onto each group node's `style` | It is *why* frames still need `state.look` | If it moved to the template, F5's four overlays become plain `style` and simplify |
| U3 | `sym:compileFreeform` emitting text at `el.y + fontSize` | Every `y` in F4 is converted through it | A change to that convention shifts every label in the story by one font size |
| U4 | `sym:BackgroundLayer` honouring a pinned `backgroundColor` over any role | The literal `#0a0a0e` backdrop must keep winning | A role reaching past a pinned colour repaints the page |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| N1 | `sym:FreeformStructure` — exported from `pkg:@invana/graph` | published API | Two additive optional fields; no existing template changes meaning | None |
| N2 | Every existing freeform story — `story:graph/Nodes/Types/FreeformStructure/*` (Anatomy · Elements · DataBinding · Theming · Frames · SubParts · ServerRack · Cartoons/*), `story:designs/IterationLoop`, `story:designs/AgenticWorkflow`, `story:usecases/by-casestudies/tasks-panel/RunFlow` | story | **None** — binds unset ⇒ `sym:compileFreeform` builds the same object | V5 (control) |
| N3 | `pkg:@invana/canvas-designer` template round-trip | package | None — `sym:applyFormToCard` spreads the template, so unknown fields survive a save | F8 (deferred) |
| N4 | `pkg:@invana/canvas-ui` — `story:canvas-ui/editors/TemplateStudio`, `story:canvas-ui/view-panels/StylingViewPanel` | package | None — they read structures, they do not enumerate their fields | None |
| N5 | `story:usecases/by-casestudies/agent-harness/Architecture` | story | Intended rewrite; the render must be pixel-identical | V4 |
| N6 | Serialised canvas state (`io/` export) | serialised state | Improves: the story's node/edge records now carry their own look, so an export round-trips the drawing | None |
| N7 | `api/*.surface.txt` snapshots | build gate | None expected (member-level change) | V3 |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm build` | repo | All packages build | F1–F6 |
| V2 | pass | `pnpm check-types` | repo | Clean | F1–F6 |
| V3 | pass | `pnpm lint` (incl. `check-boundaries` + `check-api-surface`) | repo | 0 errors, snapshots intact | F1–F6 |
| V4 | pending | Screenshot `story:usecases/by-casestudies/agent-harness/Architecture` before / after, in a **visible** tab | Storybook, dark | Pixel-identical: card boxes, the two text tones, the diamond, the four frame fills + the dashed harness, every edge route and label | F4, F5, F6 |
| V5 | pending | **Control:** screenshot `story:designs/IterationLoop`, `story:designs/AgenticWorkflow`, `story:graph/Nodes/Types/FreeformStructure/Anatomy`, `…/DataBinding` | Storybook | Unchanged — proves F3 is inert without binds | F3 |
| V6 | pending | **Control:** toggle the Theme/Variant toolbar off this story's pinned `ThemeProvider` is not possible (`selfThemed`), so instead re-publish a palette via `canvas.update` in the story's `onReady` path | Storybook | Frame fills and the drawing's strokes hold — the `look` overlay still outranks the publish | F5 |
| V7 | pass | A `box` node with `data.w` absent, and one with `data.w: 'wide'` / `data.h: NaN` | `sym:compileFreeform` against the built dist | Both fall back to 130×54; a bound node compiles to 356×54 with its title part at `y: 9` — the value the hand-built composite used | F2, F3 |
| V8 | pending | Auto-fit frames still wrap their members after the rewrite | Storybook | `harness` / `loop` / `memory` / `llm-ops` hug their contents as today (bound sizes reach `sym:boundsOfNode` through the same resolved style) | F3, F5 |
| V9 | pass | **Control:** compile a structure with **no** binds twice, with and without `data.w` | `sym:compileFreeform` against the built dist | Byte-identical output (`JSON.stringify` equal), 130×54 both times — the change is inert unless a bind is declared | F3 |
| V10 | pass | A bound `polygon` frame scales with the resolved box | same | `150×96 → 300×192` yields vertices `±150 / ±96` | F3 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | How serializable — literals in the `.tsx`, or a real `.json` file? | (a) function-free TS literals; (b) `architecture.json`; (c) both | **(a)** — matches `story:designs/IterationLoop`, keeps hex colours and the authoring comments. JSON would force decimal ints (`0x16161d` → `1447453`) and lose every comment | accepted |
| D-2 | How does a card get a per-node size? | (a) `widthBind` / `heightBind` on the structure; (b) a literal `style.shape` composite per node; (c) one structure per size / snap to size classes | **(a)** — one template for 13 cards, and it generalises past this story. (b) stays the fallback if F1–F3 are rejected; (c) means 10 near-identical entries | accepted |
| D-3 | Does `onReady` become data too? | (a) keep it imperative; (b) add a declarative connector z-order; (c) move only the edge colours to per-edge `state.look` | **(a)** — paint-order semantics are never a low-risk change, and the raise is interaction state, not definition | accepted |
| D-4 | A width-bound card's centred text does not track the width — `el.x` is authored, so `anchor: 'center'` at `x = width/2` is wrong for any other width | (a) document the limit; (b) allow a fractional `x` (`0..1` of the box); (c) re-anchor centred elements to the resolved width | **(a)** for this RFC — the story's only centred card is the fixed-size `gate`; the 13 bound cards are all left-anchored at `x: 14`. (c) is the principled fix and wants its own RFC | open |

---

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-21 | Opened | proposed | Investigation found four of five closures already have a data seat; only card size does not |
| 2026-09-21 | D-1 · D-2 · D-3 answered by the maintainer before drafting | accepted | Literal TS · data-bound size · `onReady` unchanged |
| 2026-09-21 | Approved whole | accepted | F1–F6 to implement; F7–F9 stay deferred |
| 2026-09-21 | F1–F6 implemented | implemented | V1–V3 · V7 · V9 · V10 pass. V4/V5/V8 need a browser and could not run in the implementing session — the rows stay `implemented`, not `landed` |
| 2026-09-21 | Asked whether `CardStructure` could replace `freeform` | — | No: card rows have no centre anchor (`file:packages/graph/src/template/compile.ts#L334-L337`), so the diamond can't be a card at all; and `sym:compileCard` fixes its box the same way, so the size problem would survive the swap. Card auto-layout would also move the two text lines from `y: 9 / 27` to `y: 25 / 44` — a single `padding` drives both axes |
| 2026-09-21 | **F1–F3 rejected on review; D-2 re-decided as (b)** | rejected | The maintainer asked for `widthBind`/`heightBind` to come out after seeing the rendered story. `pkg:@invana/graph` is back to its `main` state; the 13 boxes now carry a literal `composite` on `style.shape`. Cost, as the RFC predicted: the card design repeats on every box node (+81 lines) and a design change is 13 edits. Benefit: no new public API on `sym:FreeformStructure`, nothing for the designer to catch up with (F8 moot), and the `y + fontSize` compile trap no longer applies to the boxes — their parts are authored, not compiled |
| 2026-09-21 | What the implementation taught | — | (a) `sym:resolveNumber` was deliberately **not** exported from the barrel, so `check-api-surface` saw no change — the RFC predicted no snapshot churn and that only held because of this. (b) A composite **root** stroke and a **node-level** stroke are not the same paint: `sym:resolveCompositeRoot` ignores a composite's top-level `fill`/`stroke` whenever an explicit `root` exists (`file:packages/canvas-core/src/specs/shapeGeometry/bounds.ts#L223-L224`), which is why the gate's indigo comes from its root and the node-level `0x5a54c4` in the old story never painted. (c) The border-alignment row added to §2 is the one known non-parity |
