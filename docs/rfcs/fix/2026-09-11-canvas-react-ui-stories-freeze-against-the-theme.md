---
id: fix-2026-09-11-canvas-react-ui-stories-freeze-against-the-theme
type: fix
title: Hardcoded node/edge/background colours in `canvas-react` + `canvas-ui` stories override the published palette, so those stories don't follow the Theme × Variant toolbar
status: proposed
opened: 2026-09-11
decided: null
landed: null
packages: [pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode }
  - { predicate: caused-by, object: sym:GraphLayer.resolveNodeStyle }
  - { predicate: manifests-in, object: story:canvas-react/Canvas/Basic }
  - { predicate: manifests-in, object: story:canvas-ui/apps/GraphCanvasApp/CustomComposition }
---

# `canvas-react` + `canvas-ui` stories freeze against the theme

`rfc:fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers` made the toolbar reach every
mounted provider, and `sym:CanvasThemeSync` now pushes the host theme into `sym:ThemeBehaviour`
live. The palette *is* published. These ten stories still don't change, because each one writes
the same style fields the palette writes — and the layer template outranks the palette.

| | |
|---|---|
| Problem | Switching Theme → `forest` / `ocean`, or light ↔ dark, leaves node borders, node labels and edge strokes unchanged in 10 `pkg:@canvas/storybook` stories under `canvas-react/` and `canvas-ui/` |
| Root cause | `sym:ThemeBehaviour` publishes a palette that `sym:GraphLayer.applyTheme` writes as **layer defaults** (`sym:setNodeDefaults` / `sym:setEdgeDefaults`); `sym:GraphLayer.resolveNodeStyle` merges the **layer template** *over* those defaults, so any `node`/`edge` style the story authors wins permanently |
| Second cause | `story:canvas-ui/apps/GraphCanvasApp/CustomComposition` runs `bundle={false}`, which skips `sym:ThemeBehaviour` **and** `sym:CanvasThemeSync` entirely — there is no publisher at all, so nothing to override |
| Not the cause | The `light`/`dark` shorthand (absent from all 10) · `mode` (all 8 `canvas-react` files already carry `mode="document"`) · inner `<ThemeProvider>`s (all removed by the prior RFC) |
| Defect rows | F1 · F2 · F3 · F4 · F5 — F6 removes the *recurrence* cause |
| Row status | rows: **proposed 6 · deferred 4** · verification: **pending 7** · decisions: **open 3** |

## 1 Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Theme → `forest` retints the shell and the background, but node borders stay white and node labels stay dark slate | `story:canvas-react/Canvas/Basic` | `file:apps/storybook/stories/canvas-react/Canvas/Basic.stories.tsx#L52` `bgStrokeColor: 0xffffff`, `#L55` `labelColor: 0x1e293b` |
| S2 | Edge strokes never move off `0x94a3b8` in any theme or mode | `story:canvas-react/Canvas/*`, `story:canvas-react/GraphCanvas/*` | `file:apps/storybook/stories/canvas-react/Canvas/Basic.stories.tsx#L61`; identical line in 5 sibling files |
| S3 | In dark mode the node label is near-black on a mid-blue fill — the story is *less* legible after a switch than before | `story:canvas-react/GraphCanvas/Basic` | `file:apps/storybook/stories/canvas-react/GraphCanvas/Basic.stories.tsx#L65` `labelColor: 0x1e293b` pinned against `surface: 0x0f172a` |
| S4 | All three `sym:AppLayoutV2` boards keep their authored borders and edge colours through every switch | `story:canvas-ui/apps/AppLayoutV2` | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L169,#L203,#L214,#L250,#L255` |
| S5 | `CustomComposition` does not retint *at all* — background included — while its sibling `Default` does | `story:canvas-ui/apps/GraphCanvasApp/CustomComposition` | `file:apps/storybook/stories/canvas-ui/apps/GraphCanvasApp/CustomComposition.stories.tsx#L40` `bundle={false}`, `#L51` `backgroundColor="#0f172a"` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The `light`/`dark` single-layer shorthand is disabling the palette here, as it does in the layout stories | **No** | Zero matches for the shorthand across `canvas-react/` and `canvas-ui/`. It is real, and it *does* publish `palette: {}` (`file:packages/graph/src/behaviours/ThemeBehaviour.ts#L215-L223`), but it lives in `graph-layouts/` + `graph-layers/` — deferred row F7 |
| R2 | These stories are on `mode: 'system'`, so the OS overrides the toolbar | **No** | All 8 `canvas-react` files carry `<ThemeBehaviour id="theme" mode="document" />`; `cf1676a6` set them |
| R3 | A story-local `<ThemeProvider>` is shadowing the decorator's | **No** | Every `<ThemeProvider` match in these folders is inside a TSDoc comment (e.g. `file:apps/storybook/stories/canvas-ui/apps/GraphCanvasApp/Default.stories.tsx#L28`). The 44 real ones went in `rfc:fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers` |
| R4 | `story:canvas-ui/editors/TemplateStudio` mounts a `sym:ThemeBehaviour` with no `mode` and needs fixing | **No** | Both matches are comments (`#L12`, `#L91`); it rides the `sym:GraphCanvasApp` bundle |
| R5 | Deleting the node `bgFill` pin will make the fill themed | **No** | `sym:paletteToNodeDefaults` (`file:packages/graph/src/theme/roles.ts#L30-L35`) writes `labelColor` + `bgStrokeColor` only. `bgFill` gets a palette value for **group** nodes alone (`#L59` → `cardBg`). Deleting it yields the renderer's default fill, not a themed one — see F9 |

## 2 Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | `sym:ThemeBehaviour` publishes a role palette on every resolved change | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L228-L236` | `theme:change` carries `surface` / `foreground` / `muted` / `stroke` / … |
| G2 | `sym:GraphLayer` subscribes and translates roles into **layer defaults** | `file:packages/graph/src/layer/GraphLayer.ts#L544`, `#L579-L582` — `sym:setNodeDefaults(paletteToNodeDefaults(p))`, `sym:setEdgeDefaults(paletteToEdgeDefaults(p))` | The palette reaches the layer as a *default*, not as a per-item write |
| G3 | The palette only claims four fields | `file:packages/graph/src/theme/roles.ts#L30-L35` (`labelColor`, `bgStrokeColor`) and `#L41-L49` (`strokeColor`, `arrowTargetColor`, `arrowSourceColor`, `labelColor`) | Exactly the fields these stories pin — and `bgFill` is deliberately not among them (`#L28`: colour-by owns it) |
| G4 | `sym:GraphLayer.resolveNodeStyle` merges the layer template **over** the defaults | `file:packages/graph/src/layer/GraphLayer.ts#L980-L1000` | An authored `node.style.labelColor` beats the palette on every paint, forever. This is S1–S4 exactly: the *unpinned* fields (background, group frames) move on a switch and the pinned ones don't |
| G5 | With `bundle={false}`, `sym:GraphCanvasApp` mounts neither `sym:ThemeBehaviour` nor `sym:CanvasThemeSync` | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L327-L349` — both sit inside the `bundle ? (…) : null` block | S5: no publisher exists, so `story:…/CustomComposition` is un-themed rather than mis-themed. A different mechanism producing a *different* symptom (background frozen too), which is why it needs its own row |

### Why this is a story defect and not an engine one

| ID | Factor | Why it matters |
|---|---|---|
| C1 | G4 is correct behaviour — an author who writes `labelColor` means it | The engine cannot distinguish "dressing I copied from a sibling story" from "art direction". Only the story can |
| C2 | `cf1676a6` already solved the same problem for `sym:BackgroundLayer` with an `sym:INHERIT` sentinel | That vocabulary has not been extended to `NodeStyle` / `EdgeStyle`, so "defer to the theme" is expressible for a background and not for a label — see F9 |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Load `story:canvas-ui/apps/GraphCanvasApp/Default` (no pins) headless, switch Theme | Nodes, edges, labels and background all recolour | The publish path is healthy end-to-end; the pins are the only difference — control for V1 |
| T2 | Load `story:canvas-react/Canvas/Basic` with `globals=theme:forest`, read the rendered stroke | Border stays `0xffffff`, background follows `forest` | G4 confirmed: unpinned fields move, pinned ones don't, in the same story |
| T3 | `grep` the two folders for the `light`/`dark` shorthand and for `mode` | 0 shorthand · 8/8 `mode="document"` | R1 + R2 falsified; the diagnosis is the template-over-defaults merge, nothing upstream of it |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers` | `depends-on` | accepted | The provider fix + the 44 inner-provider deletions. This RFC is the residue it explicitly did not cover: stories that receive the theme correctly and then override it |
| `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode` | `relates-to` | landed | The Theme × Variant toolbar these stories are meant to answer to |
| commit `cf1676a6` | `relates-to` | landed | `sym:INHERIT` / `sym:Themed<T>` / `sym:resolveThemed` for `sym:BackgroundLayer`, and the 8 `canvas-react` stories' `mode="document"`. The pattern F9 would extend |
| `doc:apps/storybook/CLAUDE.md` | `relates-to` | current | The theme rule ("never mount your own `<ThemeProvider>`") and the imperative-story recipe that now says `mode: 'document'` |

## 4 The fix

Scope is `canvas-react/` + `canvas-ui/` only, per maintainer. The rule applied per field: **drop what
the palette owns, keep what it doesn't.** `bgFill` stays pinned (R5) with a comment saying why.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:apps/storybook/stories/canvas-react/Canvas/Basic.stories.tsx#L48-L61` + `Advanced#L63-L76` + `WithTelemetry#L64-L77` | Drop `bgStrokeColor`, `labelColor` from the `NODE` const and `strokeColor` from the `EDGE` const; keep `bgFill`, `strokeWidth`, shape + label geometry | Borders, labels and edges follow the palette in all 8 families × light/dark | low | — |
| F2 | defect | proposed | `file:apps/storybook/stories/canvas-react/GraphCanvas/Basic.stories.tsx#L58-L71` + `Advanced#L71-L84` + `WithTelemetry#L70-L83` | Same three fields | Same | low | — |
| F3 | defect | proposed | `file:apps/storybook/stories/canvas-react/behaviours/HoverElementPreviewBehaviour/HoverElementPreview.stories.tsx#L118-L130` + `HoverElementPreviewPerType.stories.tsx#L116-L132` | Same three fields, on the inline `node={{…}}` / `edge={{…}}` props. `PerType`'s `bgFill` resolver function (`#L123`) is the story's subject — keep | Same; the per-type fill demo is untouched | low | — |
| F4 | defect | proposed | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L169,#L203,#L214,#L250,#L255` | Drop `bgStrokeColor` + edge `strokeColor` from all three board templates; keep each board's `bgFill` (blue/green/amber **is** the per-board identity) and `arrowTargetShape` | Three boards retint together; they stay visually distinct | low | — |
| F5 | defect | proposed | `file:apps/storybook/stories/canvas-ui/apps/GraphCanvasApp/CustomComposition.stories.tsx#L47-L72` | Add `<ThemeBehaviour id="theme" mode="document" />` + `<CanvasThemeSync />` as children, **both imported from `pkg:@invana/canvas-react`** (see U4); drop `backgroundColor` / `color` from `sym:BackgroundLayer` (defaults are `sym:INHERIT`); drop node `bgStrokeColor` / `labelColor` and edge `strokeColor`. Keep the star shape + label geometry | The story starts responding to the toolbar **and** teaches that `bundle={false}` means hand-wiring the theme too — which is its stated subject | **medium** — changes how the story looks (dark-pinned → themed) and adds two children to a demo whose point is minimality | G5, U4 |
| F6 | defect | proposed | new `file:apps/storybook/stories/canvas/Conncepts/Behaviours/Theme/ThemeBehaviour.stories.ts`, title `story:canvas/concepts/Behaviours/Theme/ThemeBehaviour` | One imperative story with lil-gui exposing the whole `sym:ThemeBehaviourOptions` surface: `mode` (`system`/`document`/`light`/`dark`), `active` across the built-in families, `accent` / `accentVar`, and the `light`/`dark` single-layer shorthand shown as **the opt-out** it is | Gives the shorthand a canonical home, so the next story copies the palette path instead of copying the opt-out. Removes the recurrence cause behind F7 | low | D1 |
| F7 | defect | deferred | `graph-layouts/` (17) · `usecases/` (15) · layer demos (10) · `graph-layers/` (5) | Same sweep, plus removing the `light`/`dark` shorthand (19 files) and the `backgroundColor` pins (26) | Those stories follow the toolbar too | medium — 47 files, several wire the pinned fields to lil-gui colour pickers that would need seeding from the palette | maintainer widening scope |
| F8 | defect | deferred | `sym:ColorByBehaviour`, `sym:GraphCanvasApp` `BASE_CONFIG` | `palette` unset ⇒ inherit `sym:ResolvedTheme.categorical`; re-apply on `theme:change`; drop the hardcoded array at `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L232-L237` | Colour-by becomes theme-responsive, and the edge-field collision below stops silently dropping the tint | medium — engine behaviour change | out of stories-only scope |
| F9 | defect | deferred | `sym:NodeStyle` / `sym:EdgeStyle` | Extend `cf1676a6`'s `sym:Themed<T>` / `sym:INHERIT` past `sym:BackgroundLayer`, and decide whether a node **fill** gets a palette role at all | "Defer to the theme" becomes expressible for a node, and `bgFill` stops being the one field a story cannot hand back | medium — public config surface | D2, F8 |
| F10 | dressing | deferred | the 6 `canvas-react` files in F1 + F2 | Move the module-scope `NODE` / `EDGE` consts into `render`, per `doc:apps/storybook/CLAUDE.md` ("no module-level story logic") | Style compliance only — changes no pixels and fixes no theming | low | F1, F2 |

### Known residual after F1–F6

| ID | Residual | Why it stays |
|---|---|---|
| N1 | Node **fills** still don't follow the theme in any story | No palette role for `bgFill` (R5). F8 or F9 is the only honest route; until then a pinned `bgFill` is more truthful than deleting it and getting an engine default |
| N2 | `sym:ColorByBehaviour` remains theme-blind, and its edge colouring is still clobbered on every theme switch | `sym:paletteToEdgeDefaults` (`file:packages/graph/src/theme/roles.ts#L41-L47`) writes the same `strokeColor` / `arrowTargetColor` fields colour-by writes, and re-applies later — F8 |

## 5 Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:paletteToNodeDefaults` / `sym:paletteToEdgeDefaults` role map | These four field names are precisely what F1–F5 delete from the stories | If the role map gains a field (e.g. `bgFill`), the stories that kept a pin silently start fighting it again |
| U2 | `sym:GraphLayer.resolveNodeStyle` precedence (template over defaults) | The whole fix assumes an *absent* field falls through to the palette | Invert it and every remaining deliberate pin in the repo stops working |
| U3 | `sym:CanvasThemeSync` + the decorator's single `<ThemeProvider>` | F5 mounts `sym:CanvasThemeSync` by hand | Already exercised by the bundle in 30+ stories; low |
| U4 | `sym:CanvasThemeSync` moved `pkg:@invana/canvas-ui` → `pkg:@invana/canvas-react` (`file:packages/canvas-react/src/CanvasThemeSync.tsx`), with a `@deprecated` re-export left behind at `file:packages/canvas-ui/src/apps/index.ts#L23-L29` | F5 imports it. The move also makes it legal in a `canvas-react` story, which the headless-only rule would otherwise forbid | Low — the deprecated alias keeps old imports working. Landed in the same branch, before this RFC is implemented |
| U5 | `sym:BASE_CONFIG` theme default moved `mode: 'system'` → `'document'` (`file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L250`) | Every bundled story now follows the toolbar rather than the OS on first paint | None for this RFC — it fixes *which kind* is published, not *which fields* the template overrides (G3, G4). The pins in F1–F5 are unaffected by it |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | 10 story files | visual | They will **look different** — pale borders instead of white, theme-coloured labels, and `CustomComposition` no longer dark-pinned | Eyeball each in light + dark before calling a row landed |
| D-2 | `story:canvas-ui/apps/AppLayoutV2` | visual | The file the maintainer has open; three boards change together | Confirm the boards stay mutually distinguishable after F4 |
| D-3 | The 4 deliberately pinned stories — `story:canvas/Export/ExportImage`, `story:canvas-store/Export/ExportState`, `story:usecases/tools/GraphModeller`, `story:usecases/by-casestudies/agent-harness/Architecture` | none | They keep their own providers and pins by design (`doc:apps/storybook/CLAUDE.md`, `selfThemed`) | **Do not touch.** None is in scope |
| D-4 | `doc:apps/storybook/CLAUDE.md` | docs | No rule today says "don't pin a field the palette owns" — which is why 10 files did | Add one line under the Theme section, naming the four fields |
| D-5 | Published API | none | Stories only; no package source changes in F1–F6 | — |
| D-6 | Serialised state | none | No `view.definition` shape change | — |

## 6 Verification

No snapshot or visual-regression harness exists in `pkg:@canvas/storybook` (`scripts` are `dev` ·
`build` · `lint` · `check-types`), so V2–V5 are browser checks.

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | **Control** — switch Theme → `forest` → `ocean`, light ↔ dark | `story:canvas-ui/apps/GraphCanvasApp/Default` | Recolours on every switch, exactly as it does today (T1) | the publish path itself |
| V2 | pending | Same switches, read node border + label + edge stroke | the 6 `canvas-react` stories in F1 + F2 | All three follow the family and the mode; `bgFill` unchanged | F1, F2 |
| V3 | pending | Same switches, hover a node to raise the preview card | the 2 stories in F3 | Card and graph agree; `PerType`'s per-type fills still differ | F3 |
| V4 | pending | Same switches with all three boards mounted | `story:canvas-ui/apps/AppLayoutV2` | Boards retint together and stay distinguishable | F4 |
| V5 | pending | Switch Theme with no page refresh | `story:canvas-ui/apps/GraphCanvasApp/CustomComposition` | Background **and** graph retint — currently neither does (S5) | F5 |
| V6 | pending | Open the sidebar | `story:canvas/concepts/Behaviours/Theme/ThemeBehaviour` | One **flat** leaf, not a nested `ThemeBehaviour ▸ …` node (`name` === last title segment) | F6 |
| V7 | pending | `pnpm --filter @canvas/storybook check-types` + `lint` | repo | 0 errors; no new warnings | F1–F6 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where does the new ThemeBehaviour story sit? The maintainer wrote `canvas/Behaviours/ThemeBehaviour`; the on-disk convention is `canvas/Conncepts/Behaviours/<Group>/`, titled `canvas/concepts/Behaviours/<Group>/<Class>` (`story:canvas/concepts/Behaviours/Camera/DragPanBehaviour`) | (a) `canvas/concepts/Behaviours/Theme/ThemeBehaviour` · (b) ungrouped `canvas/concepts/Behaviours/ThemeBehaviour` | **(a)** — matches the two existing groups (`Camera/`, `Shapes/`). `sym:ThemeBehaviour` ships in `pkg:@invana/graph` but files by concept, same deliberate exception as `story:canvas/concepts/Layers/GraphLegendLayer` | open |
| D2 | Keep the `bgFill` pins? | (a) keep, with a comment naming the gap · (b) delete and accept the renderer default · (c) block on F9 | **(a)** — (b) makes the stories look worse and *still* isn't themed (R5); (c) stalls a 10-file cleanup on a public-surface change | open |
| D3 | Should F5 add theme wiring to a `bundle={false}` demo? | (a) add `sym:ThemeBehaviour` + `sym:CanvasThemeSync` · (b) leave it unthemed and say so in the TSDoc | **(a)** — the story's subject is "compose the bundle by hand", and the theme publisher is part of what the bundle gives you. (b) leaves one story permanently off the toolbar | open |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened after a session tracing why `story:canvas-ui/editors/node-styles/SimpleNodeStyleEditorPanel` and its neighbours ignored the toolbar | proposed | Scope narrowed by the maintainer from 162 candidate files → `canvas-react` + `canvas-ui` only (10 files); F7–F9 recorded as deferred rather than dropped |
| 2026-09-11 | F6 (new `sym:ThemeBehaviour` story) approved in principle | proposed | Explicitly requested; rule 11 satisfied. Path still open as D1 |
| 2026-09-11 | F5 + §5 corrected for the in-flight `sym:CanvasThemeSync` move (U4) and the `sym:BASE_CONFIG` `mode: 'document'` default (U5) | proposed | Both landed on this branch after the RFC was written. Neither changes the diagnosis — G4 is still the cause |
