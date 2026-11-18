---
id: feat-2026-11-18-map-and-canvas-follow-every-design-kit-theme
type: feat
title: The canvas and its basemap follow every design-kit theme family (and any future one) in light, dark and system
status: accepted
opened: 2026-11-18
decided: 2026-11-18
landed: null
packages: [pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-react, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: "rfc:fix-2026-11-18-theme-applied-after-first-paint" }
  - { predicate: relates-to, object: "file:packages/canvas-react/src/CanvasThemeSync.tsx" }
---

| | |
|---|---|
| **Motivation** | Under a non-default kit family (Rose, Ocean, …) the canvas pixels can follow, but the MapLayer basemap is one of two fixed grey URLs; every geo story repeats those URLs and its own theme wiring |
| **Approach** | Tokens are the contract (any family that defines the kit's `--color-*` works, nothing registered per family); the map gets a `basemap` option incl. a palette-tinted `themed` mode; `GraphCanvasApp` can mount the theme publisher without the bundle |
| **Row status** | accepted 0 · implemented 8 · landed 0 · deferred 1 · rejected 1 |
| **Open decisions** | none (D1–D3 decided in chat 2026-11-18) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Rose family selected, basemap stays grey Positron | `story:Canvas Demos/By Casestudies/Geo Analyst/ZoneAnalysis` | Maintainer screenshot 2026-11-18 |
| M2 | `source: 'library'` knows 6 families; Tailwind and Vite (and every future family) fall back to default | `file:packages/graph/src/theme/themes.ts` | Dropdown lists 8 |
| M3 | `ThemeBehaviour` + `CanvasThemeSync` are mounted only inside the `bundle` branch, so `bundle={false}` apps (every map demo) get no theme | `file:packages/canvas-ui/src/apps/GraphCanvasAppRoot.tsx#L280-L298` | Story comment: "`bundle={false}` brings no theme publisher" |
| M4 | ~25 geo stories each repeat the tile URLs | `story:graph-layers/maplibre/*` | grep `styleUrl` |

## 2. Design

| Step | Mechanism | Consequence |
|---|---|---|
| 1 | `CanvasThemeSync` defaults to `source: 'tokens'`; it reads the tokens synchronously when `<html data-theme>` already equals the provider's variant, else waits a frame | Any family works with no engine registry |
| 2 | `MapLayerOptions.basemap: 'light' \| 'dark' \| 'auto' \| 'themed'` picks built-in OpenFreeMap Positron / Dark; explicit `styleUrl` / `styleUrlDark` still win | Stories carry no tile URLs |
| 3 | `'themed'` = `'auto'` + a tint pass (`setPaintProperty`) driven by the published palette, re-run on `style.load` and `theme:change`; layers a style lacks are skipped | The basemap takes the family's colours |
| 4 | `GraphCanvasApp` gets `theme?: boolean` (default = `bundle`) mounting the publisher + sync outside the bundle | `bundle={false}` demos opt in with one prop |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:fix-2026-11-18-theme-applied-after-first-paint` | relates-to | accepted | First-paint ordering; token reads depend on it |
| `file:packages/canvas-react/src/CanvasThemeSync.tsx` | relates-to | in force | The `tokens` source already exists — this RFC makes it the default |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| T1 | defect | implemented | `file:packages/canvas-react/src/CanvasThemeSync.tsx` | Default `source` → `'tokens'`; synchronous read when `<html>` is already themed | Every kit family, present and future | **Medium.** Changes a default: a saved `definition` now carries the host palette under `themes.host` (only for apps under a `<ThemeProvider>`; without one the component already no-ops). Apps passing `source` explicitly are unaffected | — |
| T2 | defect | implemented | `file:packages/canvas-ui/src/apps/GraphCanvasAppRoot.tsx` + `GraphCanvasApp.tsx` | New `theme?: boolean` prop, default = `bundle`; when on without the bundle, mount `<ThemeBehaviour mode="document" accent="css-var">` + `<CanvasThemeSync>` | `bundle={false}` demos follow the kit | **Medium.** Public prop. Deliberately **not** default-on for `bundle={false}`: an app that registers its own `ThemeBehaviour` id `theme` would throw on the duplicate | — |
| T3 | defect | implemented | `file:packages/graph-layer-maplibre/src/MapLayer.ts`, `types.ts` | `basemap` option + `OPENFREEMAP_STYLES` | No tile URLs in stories; `auto` follows light/dark | Low. New optional field; defaults unchanged | — |
| T4 | defect | implemented | `file:packages/graph-layer-maplibre/src/basemapTint.ts` (new), `MapLayer.ts` | Palette → paint-property tint; applied on `style.load` + `theme:change` | Basemap follows the family | **Not low.** Keyed on OpenFreeMap layer ids (`background`, `water`, landcover/landuse fills, road lines, symbols); an upstream style change silently skips layers → one-time `console.warn` when none match | T3 |
| T5 | defect | implemented | `file:packages/canvas-ui/src/editors/layers/map-layer/{fields,mapping,types}.ts` | Expose `basemap` in the MapLayer editor (rule 12) | State editor stays complete | Low | T3 |
| T6 | dressing | implemented | `story:graph-layers/maplibre/*`, `story:canvas-demos/by-casestudies/geo-*`, `bubble-sets/*` | Use `basemap: 'themed'` + the theme publisher; drop per-story tile URLs | Visible adoption | Low (look changes) | T1–T4 |
| T7 | defect | implemented | `story:graph-layers/maplibre/Basemap*` | One story per basemap mode (rule 11) | Each state viewable | Low | T3, T4 |
| T8 | defect | implemented | `file:packages/graph-layer-maplibre/tests/basemapTint.test.ts` | Unit tests for the tint mapping with a stub layer list | Tint pinned | Low | T4 |
| T10 | defect | deferred | `pkg:@invana/graph` `file:packages/graph/src/behaviours/ThemeBehaviour.ts` + new `theme/tokens.ts` | **Non-React hosts follow any kit family.** `ThemeBehaviour` gains `source?: 'library' \| 'tokens'` (+ `tokens?`): in `apply()` it reads the page's CSS tokens (the `readCssColor` it already has), with per-role fallback to the resolved library theme, and the existing `document` observer also watches `style`. `DESIGN_KIT_TOKENS` / `ThemeTokenMap` / `readTokenPalette` move down from `canvas-react`, which re-imports them. Optional follow-up row: `CanvasThemeSync` then just sets `source: 'tokens'` and stops pushing a `host` palette into the saved definition | The imperative stories (no React, no `ThemeProvider`) and any plain-DOM embed follow any family, present and future — today they know six built-in palettes and keep `default` for the rest | **Not low.** Published `@invana/graph` gains exports + an option (not in the `check-api-surface` set, still public); default must stay `'library'` (a non-kit page has no `--color-*` tokens); first read still depends on the host having written the theme (kit F3); a family defining only some tokens mixes with library fallbacks. Also needs a `source` select in the ThemeBehaviour editor (rule 12) and unit tests | T1 |
| T9 | dressing | rejected | `api/*.surface.txt` | Regenerate API snapshots | — | Not needed: `check-api-surface` covers canvas-core / canvas-store / canvas only; none of these packages is in it | — |

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | OpenFreeMap `positron` / `dark` / `liberty` layer ids | T4 tints by id | An id rename skips that layer (warns once), map still renders |
| U2 | Kit CSS tokens (`--color-background`, `--color-primary`, `--color-data-1…8`, …) | T1 reads them | A family omitting tokens falls back to `FALLBACK` defaults |
| U3 | `rfc:fix-2026-11-18-theme-applied-after-first-paint` | token read ordering | Until the kit's F3 lands, apps without a first-paint writer read one frame late |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | Apps under `@invana/themes` `ThemeProvider` using `<CanvasThemeSync/>` with no `source` | published API | Palette now from tokens, not the engine's 6 families | Pass `source="library"` to keep the old behaviour. In-repo: `LayeredDagBoard` / `SchemaBoard` (`theme: true` meant library) now pass `source="library"` explicitly so their contract is unchanged; `GraphBoard` already did; `SchemaViewPanel` and `GraphCanvasApp` move to tokens |
| D-2 | `GraphCanvasApp` users | published API | New optional `theme` prop; default unchanged | None |
| D-3 | Saved canvas definitions | serialised state | Now include `behaviours.theme.themes.host` when synced from tokens | Document |
| D-4 | `canvas-ui` MapLayer editor / `CanvasSettingsEditorPanel` | UI | New `basemap` field | None |
| D-5 | ~25 geo stories + 2 bubble-set stories | stories | Basemap follows theme | Eyeball all eight families |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Unit: tint mapping for light/dark + a sparse palette + a style missing layers | `tests/basemapTint.test.ts` | Right paint props; missing layers skipped; empty palette = no-op | T4, T8 |
| V2 | pass | `pnpm --filter @invana/graph-layer-maplibre test` | package | green | T3, T4 |
| V3 | pass | `check-types` (maplibre, canvas-react, canvas-ui, storybook) + eslint on touched files + `check-boundaries`. Root `pnpm lint` not run | touched packages | clean | all |
| V4 | pending | Browser: every family × light/dark/system on ZoneAnalysis | story | map + chrome + pixels agree; labels legible | T1–T4, T6 |
| V5 | pending | **Control:** `GraphCanvasApp` with default `bundle` | any story | unchanged theme behaviour | T2 |
| V6 | pending | **Control:** explicit `styleUrl` + `styleUrlDark`, no `basemap` | `story:graph-layers/maplibre/ThemedBasemap` | unchanged | T3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Default `CanvasThemeSync` source | `tokens` / keep `library` | `tokens` | accepted |
| D2 | Tint in scope | yes / separate | yes (T4 separately reviewable) | accepted |
| D3 | Prop name for the preset | `basemap` | `basemap` | accepted |
| D5 | Make `ThemeBehaviour` token-aware (T10) now? | now / later | later — maintainer, 2026-11-18: no changes at graph level for now. React apps already follow any family via `CanvasThemeSync`; only the ~19 imperative stories lack it, and they follow the 8 families that exist today | deferred |
| D4 | `theme` prop default for `bundle={false}` | on / follow `bundle` | follow `bundle` (the plan said on; implementation found the duplicate-id break) | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-18 | T1–T8 written. Implementation notes: (a) `styleUrl` / `styleUrlDark` accept `null` = unset, needed so a picker can go from a fixed style back to `basemap` (a JSON patch cannot carry `undefined`); (b) `AirRoutes` keeps its picker, with *Themed* as the default; (c) `ThemedBasemap` left as-is — it pins its own mode from a GUI and is the V6 control. V1–V3 pass: 10 tint tests + 119 package tests, `check-types` for maplibre / canvas-react / canvas-ui / storybook, boundaries intact, eslint clean on touched files. V4–V6 need a browser — rows stay `implemented` | implemented | |
| 2026-11-18 | T10 recorded as `deferred` (D5): imperative / non-React hosts do not follow a **new** kit family — `ThemeBehaviour` `document` mode resolves the family against its six built-in palettes only. No `@invana/graph` change for now. Cost of the eventual fix: no new listener (it reuses the existing `<html>` `MutationObserver`); a token read of ~18 variables per theme switch, none per frame | deferred | Maintainer decision |
| 2026-11-18 | Opened; approved in chat ("implement the changes") | accepted | T9 rejected on inspection — the surface check does not cover these packages. D4 refines the earlier plan |
