---
id: fix-2026-09-19-design-stories-ignore-the-theme-they-mount
type: fix
title: The designs/ stories mount a ThemeBehaviour, then paint a pinned light palette over it
status: proposed
opened: 2026-09-19
decided: 2026-09-19
landed: null
packages: [pkg:@canvas/storybook, pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: blocked-by, object: rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode }
  - { predicate: manifests-in, object: story:designs/NetworkMap }
  - { predicate: manifests-in, object: story:designs/SchemaER }
  - { predicate: manifests-in, object: story:designs/AgenticWorkflow }
  - { predicate: manifests-in, object: story:designs/IterationLoop }
  - { predicate: relates-to, object: story:usecases/by-casestudies/tasks-panel/PlanFlow }
---

# The `designs/` stories ignore the theme they mount

The four plate-book stories each mount `sym:ThemeBehaviour` with `mode="document"` and then hardcode
an eleven-constant light palette. Switch the Storybook toolbar to **Dark** and the backdrop flips
while every card stays `0xffffff` — the diagram is a white sheet on a black desk. The fix gives the
stories the *published* palette instead of a pinned one, and repairs the two mechanisms that stop a
mounted `sym:GraphLayer` from ever being restyled.

| | |
|---|---|
| Problem | `story:designs/*` pin `PAPER`/`INK`/`BODY`/`MUTED`/`RULE`/`LINE` + four status hues as module constants (`file:apps/storybook/stories/designs/NetworkMap.stories.tsx#L55-L61` and the three siblings). Nothing recolours on `theme:change` |
| Root cause | Two, compounding. (a) The stories never *read* the published palette — there is no React surface that hands it to them. (b) Even if they computed one, `node`/`edge` are **init-only** props on the canvas-react `sym:GraphLayer` wrapper (`file:packages/canvas-react/src/layers/GraphLayer.tsx#L39-L52`), so a recomputed template can never reach a mounted layer |
| Third mechanism, already diagnosed elsewhere | `sym:GraphLayer.applyTheme` merges the palette **into the author's own template** (`file:packages/graph/src/layer/GraphLayer.ts#L631-L646`). That is why the stories carry comments saying "colour resolvers came back `idle` for every edge" — the sampled `#64748b` is `palette.muted` from `sym:paletteToEdgeDefaults`, not a resolver failure. `rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both` F7 is the real fix; this RFC works *with* today's behaviour instead of waiting for it |
| The ask | "Make the stories in `designs/` use the responsive theme colours" |
| Non-goal | New palette roles in `pkg:@invana/graph` (status hues stay story-local — D-3), landing F7 of the prior RFC, touching `story:usecases/*`, or changing any engine default pixel |
| Row status | rows: **implemented 7** (F4–F7 · F9 · F12–F14) · **rejected 4** (F1 · F2 · F3 · F8 — superseded by D-6, the role path) · **deferred 2** (F10 · F11, moot without F8) · verification: **pass 3** (V4 · V6 · V10) · **pending 6** · decisions: **accepted 6** (D-1 … D-5 as recommended, then **reversed by D-6**) |
| ⚠️ Reversal | D-6: the maintainer pointed at `story:usecases/by-casestudies/tasks-panel/*`, which already solves this with **`FreeformStructure` + colour roles** — the engine recompiles the card against the live palette, no React involved. F1–F3's React read-path was **unnecessary** and is reverted; the plates now follow the corpus pattern. §3 Prior art missed it because it searched `docs/rfcs/`, not the story corpus |

## 1 Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | In Dark, the backdrop is `surface` (`0x0f172a`) and every card body is still `0xffffff`; titles stay `0x0f172a` — near-invisible ink on a near-black desk is avoided only because the card is white | `story:designs/SchemaER` · `story:designs/AgenticWorkflow` · `story:designs/IterationLoop` | `PAPER = 0xffffff` (`file:apps/storybook/stories/designs/SchemaER.stories.tsx#L57`) vs `sym:BackgroundLayer` adopting `surface` on `theme:change` (`file:packages/canvas/src/layers/BackgroundLayer.ts#L481`) |
| S2 | Switching **family** (Forest / Ocean / Gold / Rose) changes nothing in the diagram either — the accent, the divider and the stroke are all pinned slates regardless of the selected family | all four | `file:packages/graph/src/theme/themes.ts#L17-L45` defines six families the stories never read |
| S3 | The stories *assert* they follow the page: each mounts `<ThemeBehaviour id="theme" mode="document" />` — the mode whose whole purpose is tracking the host's `data-theme` | `file:apps/storybook/stories/designs/NetworkMap.stories.tsx#L195` (+ `#L336`, `#L317`, `#L279` in the siblings) | The behaviour publishes a full named palette; only `sym:BackgroundLayer` consumes it |
| S4 | The identical 11-line palette block, comments included, is copy-pasted into all four files | `#L52-L63` in each | Four copies of one design decision; a contrast fix has to be made four times |
| S5 | Two stories carry comments recording that colour **resolvers** "resolved every edge to the default", and both worked around it by pinning colour on each edge record instead | `file:apps/storybook/stories/designs/AgenticWorkflow.stories.tsx#L96-L103` · `file:apps/storybook/stories/designs/IterationLoop.stories.tsx#L110-L115` | The workaround moved colour into `edge.style`, which is *below* the theme's reach — so those edges are the only ones that survive a theme publish today, by accident |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `sym:ThemeBehaviour` isn't publishing in `'document'` mode, so there is nothing to read | **No** | The backdrop tracks the toolbar (S1), which only happens via `theme:change`; and `mode: 'document'` resolves family *and* kind (`file:packages/graph/src/behaviours/ThemeBehaviour.ts#L28-L41`) |
| R2 | The palette is empty because the stories use the single-layer shorthand | **No** | The shorthand needs `targetLayerId` + `light`/`dark` patches; none of the four passes any (`#L195` etc.) — they take the named-palette path |
| R3 | `sym:GraphLayer` simply doesn't recolour, so the engine is at fault | **No** | It does, on every publish (`file:packages/graph/src/layer/GraphLayer.ts#L598-L600`). It recolours the *base* roles only — `labelColor`, `bgStrokeColor`, edge stroke + arrowheads (`file:packages/graph/src/theme/roles.ts#L30-L50`) — and the stories pin all of those, plus the composite `parts` fills it cannot reach |
| R4 | The composite card fills could follow the theme without the story knowing the palette | **No** | `sym:CompositePart` fills are concrete numbers produced by the story's own shape resolver (`file:apps/storybook/stories/designs/SchemaER.stories.tsx#L155-L200`). No role vocabulary reaches a part; `compileFreeform` resolves roles only for *template*-authored structures |
| R5 | Edge colour resolvers are broken in `pkg:@invana/graph` (what S5's comments claim) | **No** — misdiagnosed | `sym:resolveEdgeStyleFields` (`file:packages/graph/src/layer/GraphLayer.ts#L3561-L3571`) resolves every function field against the stored edge, `data` included (`file:packages/graph/src/store/GraphStore.ts#L1627`). The observed `#64748b` is `palette.muted` written *over* the resolver by `applyTheme` — see T1 |

## 2 Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | `sym:ThemeBehaviour` resolves family + kind and publishes a full `sym:ResolvedTheme` on every toolbar change | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L2-L13` | A correct, live palette exists on the bus the whole time |
| D2 | The only React-side readers of that palette are engine internals (`sym:BackgroundLayer`, `sym:MiniMapLayer`, `sym:GraphLegendLayer` read `ctx.theme.current()`). `pkg:@invana/canvas-react` exports **no** theme hook | `file:packages/canvas-react/src/hooks/index.ts` (37 hooks, none for theme) | A story that wants to *compose* with the palette — build a composite part, pick a status hue for the current kind — has nothing to call. Pinning is the only path left, so all four pinned |
| D3 | The stories therefore express every colour decision as a module constant, evaluated once at import | `#L52-L63` in each file | The palette cannot change after import: not on a theme switch, not on a family switch (S1 · S2) |
| D4 | Even a story that computed a palette could not deliver it: the canvas-react wrapper builds `new graph.GraphLayer({ options })` inside a `useEffect` keyed on `[canvas, id]` only, and documents `node`/`edge` as init-only | `file:packages/canvas-react/src/layers/GraphLayer.tsx#L39-L52` | The only way to restyle is to remount the layer (`key`), which drops the store, reloads `data`, re-runs the layout and replays the entrance — a full reflow per theme toggle |
| D5 | The engine *does* have the live path — `sym:GraphLayer.setOptions` dispatches `node.style` → `setNodeDefaults`, `edge.style` → `setEdgeDefaults`, then re-renders | `file:packages/graph/src/layer/GraphLayer.ts#L934-L958` | The capability exists; only the React wrapper withholds it. This is the whole of F3 |
| D6 | `applyTheme` writes the palette into that same `nodeOption.style` / `edgeOption.style` object — the author's tier | `file:packages/graph/src/layer/GraphLayer.ts#L631-L646` → `#L863-L890` | Any authored `labelColor` / `bgStrokeColor` / edge `strokeColor` — resolver **or** constant — is destroyed by the first publish. This is S5's "resolvers don't work", and today it silently overrides `story:designs/IterationLoop`'s teal `accept` / crimson `escalate` label colours (`file:apps/storybook/stories/designs/IterationLoop.stories.tsx#L246-L250`) |
| D7 | Because both the theme and F3's re-push write the *same* tier, **last write wins**, and the story's write — triggered by the same `theme:change` — lands after `applyTheme` | D5 + D6 | The stories get their colours back without waiting for F7 of the prior RFC, at the cost of depending on event ordering. F7 makes this ordering irrelevant; it does not make F3 unnecessary |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Compare the `#64748b` the story author sampled (S5) against `sym:paletteToEdgeDefaults` | `out.strokeColor = p.muted`, and `DEFAULT_THEME.light.muted === 0x64748b` (`file:packages/graph/src/theme/roles.ts#L44-L46` · `file:packages/graph/src/theme/themes.ts#L23`) | The edges were painted by the **theme**, not by a failed resolver. R5 confirmed, D6 confirmed |
| T2 | Read `sym:GraphStore.addEdge`'s cold-field copy | `if (edge.data !== undefined) cold.data = edge.data` (`file:packages/graph/src/store/GraphStore.ts#L1627`) | `edge.data.status` is available to a resolver; nothing about the story's data shape was wrong |
| T3 | Grep the canvas-react barrel for a theme reader | `file:packages/canvas-react/src/index.ts` exports `ThemeBehaviour` + `CanvasThemeSync` (writers), no reader | D2 confirmed: the missing surface is a *read* surface |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both` | blocked-by (soft) | F1–F6 implemented, **F7–F11 proposed** | F7 (theme as tier 0 *under* the author) is the durable fix for D6. This RFC is written so it lands either way — F7 turns D7's ordering dependency into a no-op |
| `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode` | relates-to | landed | The Theme × Variant toolbar and the single `ThemeProvider` these stories react to |
| `rfc:fix-2026-09-11-canvas-react-ui-stories-freeze-against-the-theme` | relates-to | landed | Same failure shape one layer up: a React surface seeded once at mount stops tracking the toolbar |
| `doc:docs/node-styling-unification-plan.md` | relates-to | plan | Semantic node styling; the status-hue gap (D-3) is a candidate for it, not for this RFC |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | new | **rejected** | `file:packages/canvas-react/src/hooks/useCanvasTheme.ts` + barrel | `useCanvasTheme(): ResolvedTheme \| null` — seeds from `canvas.context?.theme.current()`, subscribes to `theme:change` via the existing `sym:useCanvasEvent`, re-renders on publish | The missing read surface (D2). Any React consumer — a story, a `pkg:@invana/canvas-ui` panel — can compose with the live palette | low — additive, 25 lines, no `api/*.surface.txt` entry for `pkg:@invana/canvas-react` | D-1 |
| F2 | new | **rejected** | `file:apps/storybook/stories/designs/palette.ts` (new) | One shared module: `useDesignPalette()` → `{ kind, paper, ink, body, muted, rule, line, accent, hoverRing, status: { success, warn, danger, actor }, categorical }`, built from F1 with the plate-book's contrast rules and a light/dark status pair table | Kills the four-way copy-paste (S4); one place to change a contrast decision | low — story-local | F1 · D-2 · D-3 |
| F3 | fix | **rejected** | `file:packages/canvas-react/src/layers/GraphLayer.tsx#L39-L57` | Make `node` / `edge` **reactive**, with `data`'s documented semantics: an effect keyed on the prop reference calls `layer.setOptions({ node, edge })` | A mounted layer can be restyled in place (D4 · D5) — no remount, no reflow, no entrance replay. Also the first repair path for D6 | **medium** — a consumer passing an inline object literal now pushes a `setOptions` + redraw on every render. Mitigated by the reference-keyed effect and matching TSDoc; it is a behaviour change for every `pkg:@invana/canvas-react` consumer | D-4 |
| F4 | fix | implemented | `file:apps/storybook/stories/designs/NetworkMap.stories.tsx` | Delete the pinned palette and every colour on the templates; cluster fill ← `sym:ColorByBehaviour` (`nodeValueKey: 'type'`, `colorEdges: false`); border / label / edge stroke ← the theme's own defaults; `<CanvasThemeSync/>` added | The one plate with no cards: it now declares **no colour at all**. Bridges are told apart by weight, alpha and `bundle` route rather than hue | low — the paper label halo and cut-out ring are dropped until the role map covers them (F12 of `rfc:feat-2026-09-11…`) | D-6 |
| F5 | fix | implemented | `file:apps/storybook/stories/designs/SchemaER.stories.tsx` | Rewrite as four `FreeformStructure`s (one per table — a free-form element list is fixed, so a 4-column and a 5-column table are two structures), header strip + zebra rows as `muted` at 0.14 / 0.05 / 0.001 alpha, `hitId` per row, key glyph literal amber | The card is now data the designer could have emitted, and it re-themes with no story code. Needs F12–F14 | low, given F12–F14 | F12 · F13 · F14 · D-6 |
| F6 | fix | implemented | `file:apps/storybook/stories/designs/AgenticWorkflow.stories.tsx` | Four structures (terminal pill · polygon-`frame` diamond · agent card · tool card) with role chrome; the three run-state channels declared per edge as literal JSON, `idle` left to the themed default | The diamond needs no `polygon` resolver and the cards no `CompositePart` builder; ELK sizes from the structures, so `nodeSize` disappears | low | D-6 |
| F7 | fix | implemented | `file:apps/storybook/stories/designs/IterationLoop.stories.tsx` | Four structures (step card · diamond · two exit pills, one per outcome colour); the badge, the retry hue and both exits declared per edge as literal JSON | The accept/escalate colours are no longer on the layer template, so D6 can't overwrite them — the defect is *avoided* rather than fought | low | D-6 |
| F8 | fix | **rejected** | the three flow stories | Fold the **colour** channels of `statusStyle` / `flowStyle` back into the layer edge template as resolvers over `edge.data.status` / `.flow`; keep only `strokeDashArray` (and the badge) on the edge record | Per-item styles live *below* the theme and can't be restyled without a `setData` reload. With resolvers in the template, F3 restyles them for free. Deletes the two misleading comments from S5 | **medium** — reverts a documented workaround; only correct if T1's diagnosis holds under a live check (V4) | F3 · V4 |
| F10 | new | **deferred** | `file:apps/storybook/stories/designs/palette.ts` | `UNSET = undefined as never` — the resolver return meaning "leave this field unset" | A label plate can be painted only on the edges that *have* a label. Found while implementing F8: the runtime already skips an `undefined` resolver result (`file:packages/graph/src/layer/GraphLayer.ts#L3566-L3569`), but `Resolvable<T, D>` types the resolver as returning `T`, so the only way to express it is a `never`-typed sentinel | low — story-local, and it documents an engine gap rather than hiding it | F8 |
| F11 | new | **deferred** | `file:packages/graph/src/layer/types.ts` (`sym:Resolvable`) | Widen a resolver's return to `T \| undefined`, matching what `resolveNodeStyleFields` / `resolveEdgeStyleFields` already do at runtime | No consumer needs F10's sentinel; "this field is unset for this item" becomes expressible in the type system | medium — it is a published type change on every resolvable style field, and it makes a previously-impossible value legal everywhere | F10 landing first |
| F12 | new | implemented | `file:packages/graph/src/template/types.ts` (`sym:CardElementCommon`) + `file:packages/graph/src/template/compile.ts` | `hitId?: string` on every element, passed through to the `rect` / `circle` composite part | A template-authored card keeps `story:designs/SchemaER`'s addressable columns (`shape:partover` per row) — without it the move to structures *loses* a shipped grammar point. The engine spec already carried `hitId`; only the template vocabulary withheld it | low — one optional field, no existing template changes behaviour | D-6 |
| F13 | new | implemented | same files | `fillAlpha?: number` on `rect` / `circle` elements | A tint **of a themed fill** (the header strip at 0.14, zebra rows at 0.05) instead of a pinned grey — the alpha is what lets a role carry two weights | low — additive | D-6 |
| F14 | new | implemented | same files | `strokeRole` / `stroke` / `strokeWidth` on `rect` / `circle` elements | An outlined glyph (the hollow foreign-key square). Without it the pk/fk distinction collapses to two fills | low — additive | D-6 |
| F9 | doc | implemented | the four story docblocks + `file:apps/storybook/CLAUDE.md` | State that `designs/` follows the **same contract as `tasks-panel`**: structures carry roles, the layer template carries no colour, only meaning stays literal, `ThemeBehaviour` + `CanvasThemeSync` | The convention survives the next plate | low | F4–F7 |

## 5 Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:ThemeBehaviour` as sole publisher | F1 returns `null` until the first publish; the stories must render correctly from a fallback for one frame | A canvas with no `ThemeBehaviour` gets the fallback palette forever — acceptable, and the case every non-`designs/` story is in |
| U2 | `canvas.context` being assigned in `_wireScene`, after init (`file:packages/canvas/src/engine/Canvas.ts#L1323`) | F1's seed read must tolerate `undefined` | A throw on first render if read eagerly |
| U3 | `sym:GraphLayer.setOptions` merge semantics (`#L934`) | F3's contract is "merge a style patch", not "replace the template" — a removed field is **not** unset | A story that stops emitting a colour keeps the previous one until remount. Documented, not fixed here |
| U4 | `rfc:feat-2026-09-11…` F7 landing later | It moves the theme *below* the author, making D7's ordering dependency moot | No breakage either way; F8's resolvers become robust rather than order-dependent |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| B1 | Every `pkg:@invana/canvas-react` consumer of `<GraphLayer>` — `story:canvas-react/**`, `story:graph/**`, `sym:GraphCanvasApp`, `pkg:@invana/canvas-ui` panels | published API | F3 changes `node`/`edge` from init-only to reactive. A consumer passing an inline literal (most stories do) now re-pushes `setOptions` whenever its own render re-runs | V5 is the control: a story that re-renders for unrelated reasons must not flicker or lose per-item styles |
| B2 | `sym:GraphCanvasApp` (`pkg:@invana/canvas-ui`) | published API | Mounts `<GraphLayer>` with props derived from its own state; those objects are already memoised, so F3 is a no-op there | V6 |
| B3 | The four `designs/` stories' screenshots in `doc:docs/` plate material | docs | Light-mode pixels change wherever a pinned hex differs from its role (`divider` `0xe2e8f0` vs today's `RULE 0x94a3b8`; `stroke` vs `LINE`) | D-2 decides how far to bend; V1 is the light-mode control |
| B4 | `story:usecases/**` and every other story with a pinned palette | stories | **None** — out of scope, and F3 leaves them alone unless their props change identity | None |
| B5 | `file:packages/canvas-react/src/index.ts` | published API | One new export (F1) | `pkg:@invana/canvas-react` has no `api/*.surface.txt` snapshot, so no regeneration; `pnpm check-types` covers it |
| B6 | `sym:ElkLayout` / `sym:D3ForceLayout` `nodeSize` options in the stories | stories | Unchanged — geometry stays pinned; only colour moves to the palette | V3 confirms no re-layout on a theme switch |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | **Control.** Light mode, Invana family, before/after screenshots | all four stories | Only the deliberate role-mapping deltas of D-2; layout, geometry and typography identical | F4–F7 |
| V2 | pending | Toolbar → Dark, then Forest-dark, Ocean-dark | all four | Card bodies, ink, dividers, outlines and label plates all move; nothing stays `0xffffff`; text keeps ≥ 7:1 on its own card | F2 · F4–F7 |
| V3 | pending | Toggle the theme repeatedly on `story:designs/SchemaER` | — | No re-layout, no entrance replay, no camera jump — restyle only | F3 |
| V4 | **pass** | Headless (`sym:HeadlessRenderer` + `sym:GraphLayer.resolveEdgeStyle`): resolve a status resolver, publish a theme, re-assert the template | scratch vitest in `pkg:@invana/graph`, run then removed | **Confirmed all three steps**: the resolver returns its status hue (`0x5b3fd1`); after `theme.set({ palette: { muted: 0x94a3b8 } })` the same edge resolves `0x94a3b8` — the theme overwriting the author's template, T1 / D6 exactly; after `setOptions({ edge })` it returns `0x5b3fd1` again, which is what F3 does on mount and on every palette change | F3 · F8 |
| V5 | pending | **Control.** A story that re-renders for unrelated reasons (`story:canvas-ui/apps/GraphCanvasApp/*`) | — | No flicker, no lost per-item style, no redraw storm in the profiler | F3 |
| V6 | **pass** | `pnpm check-types` + `pnpm lint` (incl. `check-boundaries`, `check-api-surface`) | repo | Clean — 19/19 tasks, boundaries intact, all three api surfaces unchanged (`pkg:@invana/canvas-react` has no snapshot), no new lint warning in any touched file | F1 · F3 |
| V7 | pending | Hover a node / a table row in each story, in dark | — | Ring uses `hoverRing`, sub-part hit ids still fire `shape:partover` | F4–F7 |
| V8 | pending | `story:designs/IterationLoop` accept / escalate labels, theme live | — | Teal / crimson, not `palette.foreground` — the D6 override is gone | F3 · F7 |
| V10 | **pass** | Headless: mount a freeform structure with role chrome + a literal glyph, publish light then dark, read back the compiled composite | `file:packages/graph/tests/template/freeformTheme.test.ts` (kept) | Card body `0xffffff`→`0x1e293b`, outline `0x64748b`→`0x94a3b8`, title `0x0f172a`→`0xf8fafc`; the literal amber glyph **unmoved**; `hitId` / `fillAlpha` / rect `stroke` all present on the parts | F5 · F12 · F13 · F14 |
| V9 | pending | Mount a `designs/` story with the `ThemeBehaviour` removed | — | Fallback palette, still legible — F1 returning `null` is not a crash | F1 · F2 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Where does the story read the palette? | (a) `useCanvasTheme()` in `pkg:@invana/canvas-react`; (b) story-local `useCanvasEvent('theme:change')`; (c) read `@invana/themes`' `useTheme()` + `sym:BUILT_IN_THEMES` directly in the story | **(a)** — (c) makes the story a *second* reader of the host appearance, which `sym:ThemeBehaviour`'s docs explicitly claim as its sole job; (b) is (a) without the reuse, and `pkg:@invana/canvas-ui` wants the same hook | **accepted** |
| D-2 | How literally do the plate-book colours map to roles? The built-in `stroke` role (`0xcbd5e1` light) is a hairline the stories deliberately rejected as vanishing at zoom | (a) map `LINE` → `muted`, `RULE` → `divider`, keeping the contrast rule and changing light-mode pixels only for `RULE`; (b) map `LINE` → `stroke` and accept the softer outline; (c) keep `LINE` pinned | **(a)** — the contrast-first rule is the plate book's own content; `muted` is a mid-slate in both kinds and preserves it | **accepted** |
| D-3 | Where do the status hues (success / warn / danger / actor) come from? No role covers them | (a) a story-local light/dark pair table in `palette.ts`; (b) `categorical[i]`; (c) add `success`/`warning`/`danger` roles to `sym:ThemePalette` across six families | **(a)** now, with (c) as its own `feat/` RFC — (b) is semantically wrong (the ramp is unordered categories, and Gold/Rose ramps would paint success and failure the same hue) | **accepted** |
| D-4 | F3 changes a published prop contract from init-only to reactive | (a) do it, matching `data`'s documented semantics; (b) add a separate `styleVersion` prop; (c) leave init-only and remount by `key` in the stories | **(a)** — (c) reflows the diagram on every theme toggle (D4) and is exactly the freeze-on-mount shape `rfc:fix-2026-09-11-canvas-react-ui-stories-freeze-against-the-theme` already fixed one layer up | **accepted** |
| D-5 | Do these four stories wait for F7 of `rfc:feat-2026-09-11…`? | (a) land this now, relying on last-write-wins ordering (D7); (b) block on F7 | **(a)** — the stories are broken in dark today, and F7 only *simplifies* what lands here | **accepted** |

| D-6 | The whole approach: React reads the palette, or the engine resolves roles? | (a) `FreeformStructure` + `*Role`, as `story:usecases/by-casestudies/tasks-panel/*` already does — the engine recompiles on `theme:change`; (b) the React read-path of D-1 + D-4 | **(a)**, reversing D-1 and D-4. It is the corpus pattern, it needs no published-API change, and it removes the D6 clobber by never authoring a colour on the layer template. Cost: three additive template fields (F12–F14), and three marks parked until the role map grows | **accepted** |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-19 | Opened after "make the stories in design use the responsive theme colors" | proposed | Diagnosis found a second, unrelated live defect (D6 / S5): the theme is overwriting authored template colours in these stories today, and the workaround comments in two stories record the symptom under a wrong cause |
| 2026-09-19 | Approved whole — all rows, all five decisions as recommended | accepted | — |
| 2026-09-19 | F1–F9 implemented; V4 + V6 pass | proposed | (Superseded the same day — see the next row.) Three things the document did not know. (a) **V4 is provable headlessly** — `HeadlessRenderer` + `resolveEdgeStyle` reproduces the whole clobber-and-restore cycle without a browser, so T1 stopped being an inference. (b) **`Resolvable<T>` cannot express "unset"**, though the runtime skips `undefined` — hence the new F10 sentinel and the deferred F11. (c) F3's re-push must also fire **once on mount**, not only when the prop reference changes: the layer adopts the published theme *during* `layers.add`, so without that first assert an authored colour is already overwritten before React has done anything |
| 2026-09-19 | **Reversed.** Maintainer: *"other stories in `tasks-panel/` are working responsively based on the theme, why do you have to create `useCanvasTheme`"* | proposed | Correct. `story:usecases/by-casestudies/tasks-panel/*` already theme by **role**: `FreeformStructure` + `*Role` fields, recompiled by `sym:compileFreeform` against `themePalette` on every publish (`file:packages/graph/src/layer/GraphLayer.ts#L647-L668`). The whole React read-path (F1 · F2 · F3) was solving a problem the engine had already solved one level down — it only *looked* unsolvable because the plates built composites by hand. F1–F3 and F8 reverted; D-6 recorded |
| 2026-09-19 | F4–F7 rewritten onto structures + roles; F12–F14 added to carry what the template vocabulary could not express; V10 pass | proposed | What the second pass taught: the template path covers more than expected (a `frame` polygon gives the diamond, a structure's own box removes ELK's `nodeSize` callback) and slightly less (no `hitId`, no `fillAlpha`, no rect outline — hence F12–F14, all three of which the engine's `CompositePart` spec already supported; only the authoring vocabulary withheld them). Dropped with the pinned palette, pending the role map: the paper label halo, the node cut-out ring, and the per-plate hover ring |
