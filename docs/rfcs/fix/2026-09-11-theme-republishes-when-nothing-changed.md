---
id: fix-2026-09-11-theme-republishes-when-nothing-changed
type: fix
title: `ThemeBehaviour` publishes `theme:change` when the theme did not change
status: proposed
opened: 2026-09-11
decided: null
landed: null
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode }
---

# The theme republishes when nothing changed

`sym:ThemeBehaviour.apply` rebuilds the palette and calls `ctx.theme.set(...)` unconditionally.
Every caller — the document `MutationObserver`, the media query, and **every** `setOptions`,
whatever option it touched — therefore emits `theme:change`, and every theme-aware layer
re-renders. A three-line guard keyed on the resolved output makes the emission conditional.

| | |
|---|---|
| Problem | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L207-L238` ends in `ctx.theme.set(resolved)` with no comparison against what was last published |
| Cost per spurious emission | ~**2 × O(V+E)** style resolutions plus a GPU texture upload — see F-tables in §2 |
| Loudest trigger | `mode: 'document'`'s observer fires on **any** `class` mutation on `<html>`, not just theme ones |
| Quietest trigger | Every `setOptions` — patching `fallback`, `themes`, or `accentVar` republishes an identical palette |
| Non-goal | Changing when the theme *should* change, the palette contents, or any layer's recolour path |
| Row status | rows: **proposed 2** · verification: **pending 5** · decisions: **open 1** (D-1) |

## 1 Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | `apply()` always publishes | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L236-L237` | `const resolved: ResolvedTheme = {...}; ctx.theme.set(resolved);` — no prior-value comparison anywhere in the method |
| S2 | The signal itself never dedups either | `file:packages/canvas-core/src/state/theme/CanvasThemeState.ts` | `set()` assigns `_current` then emits — by design, it is a dumb container |
| S3 | In `'document'` mode any `<html>` class write republishes | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L320-L331` | The observer callback is `() => { if (this.mode === 'document' && this.isEnabled) this.apply(); }` — it never reads the mutation record |
| S4 | Every `setOptions` republishes, whatever changed | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L163-L175` | `setOptions` ends `this.wireSources(); this.apply();` — patching `fallback` or `themes` alone emits an identical palette |
| S5 | Startup publishes twice | `onEnable()` → `apply()`, then `sym:CanvasThemeSync`'s first effect → `setOptions` → `apply()` | With `mode: 'document'` in `sym:graphCanvasAppBaseConfig` both resolve to the *same* value, so the second is pure waste |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The `MutationObserver` itself is the cost | **No** | `subtree: false` + `attributeFilter: ['class','data-theme']` on one node; the browser enqueues nothing for unrelated DOM work, and callbacks are microtasks with batched records, so a burst inside one task is already one call |
| R2 | Layers mounting after a publish depend on the redundant emission | **No** | Every theme-aware layer reads `ctx.theme.current()` at mount: `file:packages/graph/src/layer/GraphLayer.ts#L546-L547`, `file:packages/canvas/src/layers/BackgroundLayer.ts#L317,#L481`, `file:packages/graph/src/layer/MiniMapLayer.ts#L370`. A late mount is already correct without one |
| R3 | This only matters in `'document'` mode | **No** | S4 makes it mode-independent — the guard belongs in `apply()`, not in the observer callback |

## 2 Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | `apply()` is the single funnel; every input path ends there | `wireSources()` / `setOptions()` / observer / media-query listener all call it | One guard at the funnel covers every trigger; a guard in the observer would fix only S3 |
| G2 | The emission fans out to O(V+E) work **twice** | `sym:GraphLayer.applyTheme` → `setNodeDefaults` → `for (const node of store.nodes()) rerenderNode(id)` (`#L804-L812`), and `rerenderNode` (`#L1699-L1713`) is 5 passes + connector re-routing; `setEdgeDefaults` (`#L824-L834`) does the edges; `sym:MiniMapLayer` then re-resolves every style again in `repaint()` | ~100 nodes: invisible. ~1,000: a dropped frame. 5,000+ with a minimap: a visible hitch |
| G3 | Plus one texture upload | `sym:BackgroundLayer.render` drops `patternTile`, so `createPatternTile()` builds a fresh offscreen canvas and the surface — which caches on object identity — uploads a new texture | Constant cost, but GPU-side and per emission |
| G4 | Plus a forced style read | `resolveAccent()` → `sym:resolveAccentVar` → `getComputedStyle(document.documentElement)`; `sym:graphCanvasAppBaseConfig` sets `accent: 'css-var'`, so this runs on every emission | Cheap in isolation, but it is a synchronous style read on a hot path |
| G5 | The guard key must include the **accent** | `accent: 'css-var'` reads a live CSS variable, so the published palette can differ while `kind` and `activeName` are unchanged | A key of `${kind}|${activeName}` alone would swallow a genuine accent change — the one way this fix could cause a *missed* recolour |
| G6 | The shorthand path publishes an empty palette plus a layer patch | `#L215-L225` — `layer.setOptions(patch)` then `ctx.theme.set({..., palette: {}})` | The guard must not skip the **layer patch**; it may only skip the `theme.set`. Simplest correct form: guard the `set` calls, not the method body (D-1) |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read `apply()` end-to-end | No comparison, no memo field on the class | S1 confirmed |
| T2 | Read the three call sites of `apply()` | observer, media-query listener, `setOptions` | G1 confirmed — one funnel |
| T3 | Read every `theme:change` subscriber | `sym:BackgroundLayer`, `sym:GraphLayer`, `sym:MiniMapLayer`, `sym:GraphLegendLayer` | G2/G3 confirmed; all four do full re-resolution, none diff the payload |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both` | relates-to | accepted (F1–F6 landed) | Same family: work done because a value was *republished*, not because it changed |
| `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode` | relates-to | accepted | Introduced `mode: 'document'` (F6) — the trigger that makes S3 reachable |
| `sym:CanvasThemeSync` | reference | shipped | Its `useEffect` deps `[mode, active]` are exactly this guard, one layer up. The engine should not depend on a React component for it |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/graph/src/behaviours/ThemeBehaviour.ts#L207-L238` | Memoise the last published identity as `` `${kind}\|${name}\|${accent ?? ''}\|${paletteIsEmpty}` `` and return before `ctx.theme.set(...)` when it is unchanged. Guard **both** `set` call sites; never guard the shorthand's `layer.setOptions` (G6) | `theme:change` fires only when the published theme actually differs. Removes S3/S4/S5 entirely | **medium** — it changes an observable event's frequency; a consumer relying on a redundant emission as a "tick" would stop receiving it (R2 says none in-repo does) | D-1 |
| F2 | defect | proposed | same | Reset the memo in `onDisable()` / `onDestroy()` | A disable→enable cycle republishes rather than silently skipping, so re-enabling always repaints | low | F1 |

## 5 Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:resolveAccentVar` returning `undefined` for an unparseable value | The accent segment of the key must distinguish "no accent" from a real one | An unstable return would flip the key each call and defeat the guard |
| U2 | `sym:ResolvedTheme` being a plain value | The key stands in for deep equality of the payload | A future non-scalar role (a gradient, a ramp) would need adding to the key |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `sym:BackgroundLayer` · `sym:GraphLayer` · `sym:MiniMapLayer` · `sym:GraphLegendLayer` | engine | Receive strictly fewer events, all of them real. All read `current()` at mount (R2), so none needs the redundant ones | None — V3 is the control |
| D2 | `sym:CanvasThemeSync` | published API | Its patches become no-ops when they resolve to the current theme — which is the startup case (S5) | None; its own dedup stays useful for skipping the `canvas.update` entirely |
| D3 | `sym:graphCanvasAppBaseConfig` with `mode: 'document'` + `accent: 'css-var'` | app | The most-affected configuration: an `<html>` class toggle stops costing a recolour | Visual re-check under a theme switch (V1) |
| D4 | Any consumer calling `canvas.update({ behaviours: { theme: … } })` expecting a repaint side-effect | published API | An update that changes nothing observable no longer repaints | Named here as the one behaviour change; if a repaint is wanted, ask the layer for it |
| D5 | `story:usecases/**` and the 28 `sym:GraphCanvasApp` stories | stories | Fewer emissions, identical pixels | V1 · V3 |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Switch family + variant in the Storybook toolbar | `story:canvas/concepts/Layers/Themed Background` | Every switch still recolours — the guard never swallows a real change | F1 |
| V2 | pending | Toggle an unrelated class on `<html>` from devtools (`document.documentElement.classList.toggle('x')`) with `mode: 'document'` | any `sym:GraphCanvasApp` story | **No** repaint; before the fix, a full recolour | F1 |
| V3 | pending | **Control** — mount a `sym:GraphLayer` *after* a theme is published | scratch story | It still paints themed, from `ctx.theme.current()` at mount (R2) | F1 |
| V4 | pending | `accent: 'css-var'`, change `--color-primary` on `:root`, then trigger a republish | scratch story | The accent updates — proving the accent is in the key (G5) | F1 |
| V5 | pending | Disable then re-enable the behaviour | scratch story | Re-enabling republishes and repaints (F2) | F2 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Where does the guard sit? | (a) Around the two `ctx.theme.set(...)` calls, leaving the rest of `apply()` to run · (b) At the top of `apply()`, skipping the whole method · (c) Inside `sym:CanvasThemeState.set` | **(a)**. (b) would skip the shorthand path's `layer.setOptions` patch, which is a real side-effect and not idempotent-by-accident (G6). (c) puts policy in a dumb container shared by every future publisher, and hides it from the one class that knows what "changed" means | open |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Found while costing `mode: 'document'` against `sym:CanvasThemeSync`: the observer is cheap, the unconditional republish behind it is not — and S4 showed the same defect on every other input path |
