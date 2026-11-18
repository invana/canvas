---
id: fix-2026-11-18-theme-applied-after-first-paint
type: fix
title: A dark Storybook story paints light first, then flips — the theme reaches `<html>` after first paint
status: accepted
opened: 2026-11-18
decided: 2026-11-18
landed: null
packages: [pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:Canvas Demos/By Casestudies/Geo Analyst/ZoneAnalysis" }
  - { predicate: caused-by, object: "pkg:@invana/themes" }
  - { predicate: relates-to, object: "file:packages/graph-layer-maplibre/src/MapLayer.ts#L339" }
---

| | |
|---|---|
| **What breaks** | Opening a dark-theme story shows a light page (and a light basemap) for a moment, then it flips to dark |
| **Root cause** | `applyTheme()` — the only writer of `data-theme` / `dark` on `<html>` — runs in a **passive `useEffect`** of `ThemeProvider`, i.e. after first paint; the CSS `:root` defaults are the light palette |
| **Compounding** | Canvas' `ThemeBehaviour` (`mode: 'document'`) reads `<html>` in a child passive effect, which runs **before** the provider's effect → publishes `light`, `MapLayer` mounts with the light style, then `theme:change` → `setStyle(dark)` |
| **Defect rows** | F1 (host ordering), F3 (kit, upstream) |
| **Not a defect** | The canvas engine itself — see §1 R1, §3 and F2 |
| **Row status** | proposed 1 · accepted 0 · implemented 2 · landed 0 · deferred 0 · rejected 1 |
| **Open decisions** | D1 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | White flash on load, then dark | `story:Canvas Demos/By Casestudies/Geo Analyst/ZoneAnalysis` | Reported by maintainer 2026-11-18 |
| S2 | Whole page flashes, not only the map (expected from the cause; **to be confirmed** by V1) | any story under a dark toolbar selection | Cause below is theme-agnostic |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `MapLayer` mounts before any theme is published (layer added in `onReady` before `ThemeBehaviour` enables) | **Wrong for this story** — retracts the earlier answer | `file:packages/canvas-ui/src/board/GraphBoard.tsx#L469` — `BoardReady` is the *last* child, so `ThemeBehaviour`'s register + enable effects run before `onReady`. A theme **is** published at map mount — it is just `light` |
| R2 | Storybook seeds the wrong mode | Ruled out | `file:apps/storybook/.storybook/preview.tsx#L151-L158` seeds `defaultMode`; the provider state is correct from render 1 — only the DOM write is late |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `:root` token defaults are the light palette (`--color-background:#f7f7f7`) | `@invana/themes/dist/styles.css` | Until `data-theme` is set, every token is light |
| 2 | `ThemeProvider` calls `applyTheme(variantId)` inside `useEffect` | `@invana/themes/dist/index.js#L106-L113` | The DOM write happens **after first paint** → light first frame |
| 3 | Effects run children-first: `ThemeBehaviour` (child) reads `<html>` before the provider's effect | `file:packages/graph/src/behaviours/ThemeBehaviour.ts` `readDocumentVariant` | No `data-theme`, no `dark` class → publishes `kind: 'light'` |
| 4 | `onReady` adds `MapLayer`; `resolveStyle()` sees `light` | `file:packages/graph-layer-maplibre/src/MapLayer.ts#L186-L190` | Map is created with `styleUrl` (Positron) |
| 5 | Provider effect finally runs → `<html data-theme>` changes → `ThemeBehaviour`'s `MutationObserver` re-publishes `dark` → `applyThemedStyle()` | `MapLayer.ts#L364` | Second visible flip: light basemap → dark basemap |

The canvas is **correct given its input**: it follows `<html>` faithfully, and did so in step 5. The input was late.

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Load a trivial non-canvas story under dark toolbar; sample `getComputedStyle(html).backgroundColor` at first paint | pending | If light → cause is steps 1–2 alone, independent of canvas |
| T2 | Load `ZoneAnalysis`; log `html.dataset.theme` and `ctx.theme.current()?.kind` inside `MapLayer.onMount` | pending | Expect `undefined` / `'light'` → confirms step 3–4 |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `file:apps/storybook/.storybook/preview.tsx#L22-L48` | relates-to | in force | "One writer of `data-theme`" and "no first-frame flash" comments — the second claim is untrue today |
| `rfc:fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers` | relates-to | landed | The provider-as-single-writer design stays; this RFC only moves *when* the write happens |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:apps/storybook/.storybook/preview.tsx` | In the decorator, apply the selected variant in a **`useLayoutEffect`** (inside `ToolbarThemeBridge`'s sibling, before children) via `applyTheme(...)` from `@invana/styling`. Layout effects run before first paint **and** before any passive effect, so `<html>` is correct when `ThemeBehaviour` reads it | Page paints dark from frame 1; `ThemeBehaviour` publishes `dark`; map mounts dark — one fix removes both flashes | Low. Two callers of `applyTheme` (provider re-applies idempotently) — keep the "single writer" comment honest | — |
| F2 | defect | rejected | `pkg:@invana/canvas` `Canvas` init | Seed `themeState` at construction from `config.behaviours.theme` | Would remove a *different* ordering trap (layer mounted before any publisher) | **Not this bug** (R1). Also a layering problem: palettes resolve in `pkg:@invana/graph` (`BUILT_IN_THEMES`), which `canvas` cannot import. Kept as the record; reopen only if a host actually hits the no-publisher ordering | — |
| F3 | defect | proposed | `pkg:@invana/themes` (design kit, **external repo**) | `ThemeProvider` applies the initial variant before paint (isomorphic `useLayoutEffect`, or an inline bootstrap script for SSR) | Fixes every consumer app, not just Storybook | Cross-repo; cannot land here — file upstream. Until it lands, F1 is a host workaround | — |
| F4 | dressing | implemented | `file:apps/storybook/.storybook/preview.tsx` comment | Correct the "no first-frame flash" claim to point at F1 | Stops the comment lying | None | F1 |

F1 is the defect fix *for this repo*; F3 is the defect fix *for everyone else*. Neither is dressing.

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `applyTheme` in `@invana/styling` | F1 calls it directly | Signature change in a kit bump breaks the decorator — type-checked, so loud |
| U2 | `ThemeProvider` re-applying the same variant | F1 + provider both write | Must stay idempotent (it is: same class/attr set) |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | Every story under `apps/storybook` | story | Dark/non-default themes stop flashing light first | None |
| D-2 | `selfThemed` stories | story | Mount their own provider and bypass the decorator → **still flash** | List them; decide in D1 |
| D-3 | Published packages (`canvas`, `graph`, `graph-layer-maplibre`, `canvas-react`, `canvas-ui`) | published API | **None** — no source change | — |
| D-4 | Consumer apps using `@invana/themes` | external | Flash persists until F3 lands upstream | Document; file upstream issue |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Playwright: dark toolbar, sample `html` bg colour on first paint (`PerformanceObserver` paint entry) | any story | `rgb` of dark `--color-background`, never `#f7f7f7` | F1 |
| V2 | pending | Playwright: record `MapLayer`'s first `styleUrl` | `story:…/ZoneAnalysis` | `styleUrlDark` | F1 |
| V3 | pending | **Control:** light toolbar selection | same story | Light from frame 1, no flip | F1 |
| V4 | pending | **Control:** switch theme from the toolbar after load | same story | Map + page still follow (MutationObserver path untouched) | F1 |
| V5 | pass | `pnpm check-types` + `pnpm lint` | `@canvas/storybook` | clean | F1, F4 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | `selfThemed` stories bypass the decorator — fix them too? | (a) apply the same layout-effect in each; (b) leave until F3 lands upstream | (b) — they pin their own provider on purpose; a shared helper is not worth it for a handful | open |
| D2 | File the F3 issue upstream now? | (a) yes, draft the issue text; (b) wait for V1 | (b) — confirm with V1 first so the issue carries evidence | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-18 | Maintainer approved F1 + F4 only; F3 stays proposed (upstream), F2 rejected | accepted | F1 = `ThemeFirstPaint` layout effect in `preview.tsx`; F4 = header comment |
| 2026-11-18 | F1 + F4 written. V5 pass (eslint clean, no tsc errors in `preview.tsx`, Vite serves the module). V1–V4 pending — need a browser run; rows stay `implemented`, not `landed` | implemented | |
| 2026-11-18 | Opened. Initial diagnosis (map mounts before theme publishes) **retracted** after reading `GraphBoard` effect order — the real cause is the late DOM write | proposed | F2 kept as rejected: it fixes a different, hypothetical ordering |
