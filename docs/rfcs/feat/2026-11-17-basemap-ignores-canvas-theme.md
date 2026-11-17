---
id: feat-2026-11-17-basemap-ignores-canvas-theme
type: feat
title: MapLayer basemap follows the canvas light/dark theme
status: accepted
opened: 2026-11-17
decided: 2026-11-17
landed: null
packages: [pkg:@invana/graph-layer-maplibre, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis" }
  - { predicate: relates-to, object: "sym:ThemeState" }
---

# MapLayer basemap follows the canvas light/dark theme

| Item | Value |
|---|---|
| What breaks | Canvas is dark, MapLibre basemap stays light (positron) |
| Root cause | `MapLayer` never reads `ctx.theme`; one fixed `styleUrl` |
| Row status | proposed 0 · accepted 0 · implemented 4 · landed 0 · deferred 0 · rejected 0 |
| Open decisions | none (D1 accepted in chat) |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Dark canvas over a light basemap | `story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis` | story pins `styleUrl: …/styles/positron` at `file:apps/storybook/stories/canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis.stories.tsx#L79` |
| S2 | No `theme` reference in the package | `pkg:@invana/graph-layer-maplibre` | grep of `packages/graph-layer-maplibre/src` finds none |

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | MapLibre has no theme support, so it cannot follow | Ruled out as a blocker | look is pure style JSON; `map.setStyle` swaps live (`file:packages/graph-layer-maplibre/src/MapLayer.ts#L166`); OpenFreeMap serves `/styles/dark` (HTTP 200) |
| R2 | The theme signal is missing | Ruled out | `sym:ThemeState` with `current()` and `theme:change` at `file:packages/canvas-core/src/abstracts/CanvasContext.ts#L76` |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Add optional `styleUrlDark` to `sym:MapLayerOptions`; `styleUrl` stays the light/default style | `file:packages/graph-layer-maplibre/src/types.ts#L38` | Explicit pair, no URL guessing; no `styleUrlDark` ⇒ behaviour identical to today |
| 2 | On mount, pick the style from `ctx.theme.current()?.kind` for the initial `new maplibregl.Map({ style })` | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L317` | No light flash on a dark canvas |
| 3 | Subscribe to `theme:change`; when the resolved style differs from the applied one, `map.setStyle(...)`; unsubscribe on unmount | `sym:ThemeState` | Live switch with the canvas toggle |
| 4 | Track the applied style so `setOptions({ styleUrl / styleUrlDark })` re-resolves against the current theme, not blindly | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L166` | Editing the light URL while dark doesn't flip the map to light |

Caveat to confirm in V3: `setStyle` drops anything added to MapLibre directly. Grep found no `addSource`/`addLayer` in the maplibre package; geo features render via Pixi.

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/rfcs/README.md` | process | n/a | format |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph-layer-maplibre/src/types.ts` + `MapLayer.ts` | `styleUrlDark` option; resolve style by theme at mount, on `theme:change`, and in `setOptions`; TSDoc | Basemap follows the theme | Medium: public option surface (new optional field); `setStyle` re-fetch/flicker on toggle | none |
| F2 | defect | implemented | `file:packages/canvas-ui/src/editors/layers/map-layer/{types,fields,mapping}.ts` | `styleUrlDark` text field + mapping (rule 12) | Editable in `GraphCanvasApp` / settings editor | Low | F1 |
| F3 | defect | implemented | story `story:graph-layers/maplibre/*` (new theme story) | One story: light/dark basemap switching with the canvas theme (rule 11) | Pieces own their states | Low | F1 |
| F4 | dressing | implemented | `file:apps/storybook/stories/canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis.stories.tsx#L79` | Add `styleUrlDark: …/styles/dark` to the story config | Fixes the reported story; only shows the fix, doesn't make it, so it depends on F1 | Low: changes how this story looks in dark | F1 |

Surface snapshot: if `check-api-surface` diffs (types only, likely none), regenerate in the same change (rule 16).

## 5. Blast radius

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:ThemeState` / `theme:change` | Trigger for the switch | Event rename ⇒ silent no-follow |
| U2 | `maplibre-gl` `setStyle` | Swaps style live | Re-fetches tiles; brief blank |

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | Every story using `MapLayer` (13 files, e.g. `AirRoutes`, `LiveTracking`, `GeoAnnotations`, `Airports`) | story | None unless `styleUrlDark` is set | none |
| D2 | `pkg:@invana/canvas-ui` map-layer editor | published API | New optional field | F2 |
| D3 | Serialised canvas config / state export | serialised state | New optional key; old configs load unchanged | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` + `pnpm build` + `pnpm lint` (incl. check-api-surface) | repo | green | F1–F4 |
| V2 | pass | Toggle Storybook theme in ZoneAnalysis, in a visible tab (new story `story:graph-layers/maplibre/ThemedBasemap` passed headless: requests `styles/positron` → `styles/dark` → `styles/positron` on mode flips) | `story:canvas-demos/by-casestudies/geo-analyst/ZoneAnalysis` | basemap switches positron ↔ dark; features/draw/measure still render | F1, F4 |
| V3 | pending | After a switch, drawn zones, markers and tracking overlays still present | same story | no lost overlays | F1 |
| V4 | pass | Control: a `MapLayer` story with no `styleUrlDark` (e.g. `AirRoutes`) | `story:canvas-demos/by-casestudies/geo-air-routes/AirRoutes` | unchanged on theme toggle | F1 |
| V5 | pending | Editor shows and edits `styleUrlDark` | map-layer editor in `GraphCanvasApp` | patch applies | F2 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Light/dark style config shape | explicit `styleUrlDark` · auto-map positron→dark · `styleByTheme` object | explicit `styleUrlDark` | accepted (chat, 2026-11-17) |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-17 | Opened on branch `feat/map-follows-theme` | proposed | D-1 accepted in chat; rows await approval |
| 2026-11-17 | F1–F4 approved whole and implemented | accepted | V1 pass (check-types, build, boundaries, api-surface, 0 lint errors). New story verified headless via network style requests. V2–V5 still need a visual check in a visible tab, so rows stay `implemented`, not `landed` |
| 2026-11-17 | Story defects found on first review: ZoneAnalysis uses `bundle={false}` so no `ThemeBehaviour` published a theme (F4 incomplete); ThemedBasemap added a `BackgroundLayer` that hid the basemap (F3). Both fixed in the stories; `MapLayer` unchanged | accepted | Headless screenshots: ZoneAnalysis dark → `styles/dark`, light → `positron`; ThemedBasemap flips positron → dark. V2, V4 pass (V4 = ZoneAnalysis in light). V3, V5 still need a hands-on check |
