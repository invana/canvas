---
id: feat-2026-09-11-storybook-cannot-switch-theme-or-mode
type: feat
title: Storybook has no theme/mode switcher — it follows the OS and only ever shows `default-light`/`default-dark`
status: accepted
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@canvas/storybook, pkg:@invana/graph, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/ui-consolidation-plan.md }
---

# Storybook cannot switch theme or mode

Adopt the design-kit Storybook's two toolbar globals (**Theme** × **Variant**) in
`file:apps/storybook/.storybook/preview.ts`, replacing the hand-rolled OS-only bootstrap.
The open question is not the toolbar (F1–F4, mechanical parity) but **how far the selection
travels**: document tokens only, or through to the canvas pixels (F5–F7).

| | |
|---|---|
| Problem | `sym:bootstrapOsTheme` (`file:apps/storybook/.storybook/preview.ts#L28-L41`) hardcodes `default-light`/`default-dark` off `prefers-color-scheme`. The 8 registered theme families (`default`·`tailwind`·`vite`·`gold`·`ocean`·`forest`·`rose`·`minimal`) are all compiled into the CSS (`file:apps/storybook/.storybook/tailwind.css#L25-L32`) and **unreachable from the UI** |
| Reference | `file:/Users/ravi.merugu/Projects/invana/design-kit/apps/storybook/.storybook/preview.tsx` — `globalTypes.theme` (from `sym:themes`) × `globalTypes.variant` (light/dark/system), a decorator calling `sym:applyTheme`, `backgrounds.disable`, and a `selfThemed` parameter opt-out |
| Non-goal | A new theme, a new token, or any change to `pkg:@invana/styling` — the themes already exist and already compile here |
| The hard part | Canvas stories are **two populations**: 50 story files mount their own `<ThemeProvider>` (which re-applies the document theme itself), and 28 register `sym:ThemeBehaviour` with `mode: 'system'` — the engine's only `prefers-color-scheme` reader. Neither sees a Storybook global |
| Row status | rows: **implemented 7** · verification: **pass 2 · pending 7** (V1–V8 are browser checks the implementing session can't run) · decisions: **accepted 3** (D-1 · D-2 · D-3, all as recommended) |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | No theme picker in the toolbar; the only control is the OS appearance setting | `file:apps/storybook/.storybook/preview.ts#L28-L41` | `apply()` writes `data-theme` = `default-dark`/`default-light` and nothing else; no `globalTypes` block exists in the file |
| S2 | 6 of 8 theme families are dead weight — compiled, shipped to the browser, unreachable | `file:apps/storybook/.storybook/tailwind.css#L30-L32` imports `presets-base.css` + `presets.css`, which define `.theme-{gold,ocean,forest,rose,minimal}-{light,dark}` | `grep -o 'theme-[a-z-]*' presets.css` → 10 classes, none ever applied |
| S3 | Mode is not pinnable — a light/dark screenshot pair requires changing the OS setting | same as S1 | `apply(mq.matches)`: the media query is the sole input |
| S4 | `sym:GraphCanvasApp` cannot show a non-default family even when one is applied | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L260-L265` | `sym:shellThemeAttrs` returns a hardcoded `default-dark`/`default-light` on the app's own scoped root, overriding whatever `<html>` carries |
| S5 | The `backgrounds` toolbar is a second, conflicting appearance control | `file:apps/storybook/.storybook/preview.ts#L109-L128` | Three literal hexes (`#ffffff`/`#242426`/`#f5f5f5`) with `initialGlobals.backgrounds.value: 'dark'` — independent of, and able to contradict, the theme's `--color-background` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A Storybook addon is missing (`@storybook/addon-toolbars` / `@storybook/addon-themes`) | **No** | Toolbar globals are core in Storybook 10; both repos are on `^10.4`/`^10.5`, and design-kit's working toolbar lists neither addon in `main.ts` |
| R2 | `@invana/styling/themes` isn't importable here (it's raw TS behind `exports`) | **No** | `"./themes": "./src/themes/index.ts"` is exported; `pkg:@invana/styling@0.0.23` is a direct dependency of `pkg:@canvas/storybook`, and Vite compiles the TS |
| R3 | The preset CSS isn't loaded, so picking `gold` would be a no-op | **No** | `presets-base.css` + `presets.css` are both imported (S2); only `data-palette.css` is absent, and no current story reads it |
| R4 | Theme switching is already possible per-story via the inner `<ThemeProvider>` | **Partly — and it's the problem** | 50 story files mount one, each re-applying its own variant to `document.documentElement` via `sym:applyTheme`; there is no global control, and those providers will fight a toolbar (see G4) |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | Two orthogonal globals — `theme` (family) × `variant` (mode) — instead of one flat variant list | design-kit `preview.tsx#L14-L18, #L36-L62`; 8 families × 3 modes = 24 flat entries is an unusable dropdown | Toolbar stays short; `${theme}-${variant}` composes the variant id, falling back to the family's first variant when the pair doesn't exist |
| G2 | The decorator calls `sym:applyTheme(variantId)` in a `useEffect` — no provider, no remount | `sym:applyTheme` (`file:…/@invana/styling/src/themes.config.ts`) owns the whole document mutation: swaps every `theme-*` class, sets `data-theme`, adds `light`/`dark`, and arms/disarms its own `prefers-color-scheme` listener for `system` | CSS custom properties inherit into Radix portals, and **imperative `.stories.ts` stories get themed chrome for free** — no story edits |
| G3 | `sym:bootstrapOsTheme` is deleted, not kept alongside | It writes the same attributes `sym:applyTheme` writes, from a narrower input | Two writers of `data-theme` would race on OS change; one writer, one source of truth |
| G4 | The 50 inner `<ThemeProvider>`s are seeded through storage, not through context | `ThemeProvider` reads `localStorage['invana-theme']` in its `useState` **initialisers** (mount only) and `persist: 'change'` writes on every change; props lose to a stored value | Mirroring the toolbar selection into that key makes every inner provider **mount on the toolbar's choice**. It still won't re-read on a later toolbar change (D-2) |
| G5 | Inner providers don't corrupt the selection on mount | React runs child effects before parent effects; the inner provider's `applyTheme` fires first, the decorator's last | The toolbar wins on mount even before G4 — G4 is what stops the inner provider from *reverting* on its own next state change |
| G6 | Reaching the canvas pixels needs an engine-side input, not a preview-side one | `sym:ThemeBehaviour.resolveKind` (`file:packages/graph/src/behaviours/ThemeBehaviour.ts#L217-L221`) takes `mode` or the media query and nothing else; there is **no registry of live `sym:Canvas` instances** to push to from `preview.tsx` | Either `sym:ThemeBehaviour` learns to follow the host document, or the 28 imperative stories stay OS-driven (D-1) |
| G7 | `sym:CanvasThemeSync` already solves this for React stories — via context, not the document | `file:packages/canvas-ui/src/apps/CanvasThemeSync.tsx#L33-L42`: `sym:useThemeOptional` → `canvas.update({ behaviours: { theme: { mode, active } } })` | The React path needs no new bridge; it needs the provider it reads to be current (D-2) |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep -o 'theme-[a-z-]*' @invana/styling/src/themes/presets.css \| sort -u` | 10 preset classes present | S2 confirmed: the CSS for every family is already in the bundle |
| T2 | Read `@invana/themes/dist/index.js` `ThemeProvider` | `useState(() => readStorage(storageKey)?.theme ?? defaultTheme)` | G4 confirmed: storage beats props, and only at mount |
| T3 | `grep -rln ThemeProvider apps/storybook/stories \| wc -l` / `ThemeBehaviour` | 50 / 28 of 332 story files | The two populations are large enough that "just edit the stories" is not the fix |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `file:/Users/ravi.merugu/Projects/invana/design-kit/apps/storybook/.storybook/preview.tsx` | reference implementation | shipped | The whole toolbar shape: `globalTypes`, the `${theme}-${variant}` + fallback composition, `backgrounds.disable`, the `selfThemed` opt-out |
| `doc:docs/ui-consolidation-plan.md` | relates-to | in progress | Pixels live in `pkg:@invana/canvas-ui`; a story shouldn't hand-roll theme chrome |
| `file:packages/canvas-ui/src/apps/CanvasThemeSync.tsx` | depends-on | shipped | The host-theme → `sym:ThemeBehaviour` bridge. F6 is its document-level twin, not a replacement |

## 4 The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | new | implemented | `file:apps/storybook/.storybook/preview.ts` → `preview.tsx` | Rename to `.tsx` (a JSX decorator is required) and add `globalTypes.theme` (items from `sym:themes`, icon `paintbrush`, `dynamicTitle`) + `globalTypes.variant` (light/dark/system; default `system`) | Both controls appear in the toolbar | low — rename only; Storybook resolves `preview.{ts,tsx}` | — |
| F2 | new | implemented | same | Decorator: compose `` `${themeId}-${variant}` ``, fall back to `getThemeById(themeId).variants[0].id` when absent, call `applyTheme` in a `useEffect`. Honour a `selfThemed` story parameter by returning `<Story/>` untouched | All 8 families × 3 modes reachable; every story's chrome follows | low | F1 |
| F3 | fix | implemented | `file:apps/storybook/.storybook/preview.ts#L16-L41` | Delete `sym:bootstrapOsTheme` and its call | One writer of `data-theme` (G3); `system` mode keeps OS-following, now via `sym:applyTheme`'s own listener | low — strictly superseded | F2 |
| F4 | new | implemented | same | Mirror the selection into `localStorage['invana-theme']` (`{theme, mode, accent: null}`) on every change | The 50 inner-`<ThemeProvider>` stories mount on the toolbar's choice instead of `default`/`system` (G4) | **medium** — writes a key the design-kit apps also own; scoped to the Storybook origin, and `storageKey={null}` stories opt out by construction | F2 |
| F5 | dressing | implemented | `file:apps/storybook/.storybook/preview.ts#L109-L128` + `file:apps/storybook/.storybook/global.css` | Retire the `backgrounds` toolbar + `initialGlobals.backgrounds.value: 'dark'`; give `#storybook-root` the theme's `bg-background`/`text-foreground` | Removes the second appearance control that can contradict the theme (S5) | **medium** — every story's backdrop changes; stories relying on the `dark` default over a transparent canvas will look different | F2 · D-3 |
| F6 | new | implemented | `file:packages/graph/src/behaviours/ThemeBehaviour.ts` | Add `mode: 'document'`: resolve the kind from `documentElement` (`data-theme` suffix / `dark` class) and observe it with a `MutationObserver` on the `class`/`data-theme` attributes; optionally resolve `active` from the family prefix | The 28 imperative stories' **canvas pixels** follow the toolbar, not the OS (G6) | **high** — engine surface change in `pkg:@invana/graph`; touches the documented "only `prefers-color-scheme` reader" invariant and needs a `sym:ThemeBehaviourOptions` editor field (rule 12) | D-1 |
| F7 | fix | implemented | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L260-L265` | `sym:shellThemeAttrs` takes the family from `sym:useTheme().theme` instead of hardcoding `default` | A `gold`/`ocean` selection is visible inside `sym:GraphCanvasApp`, not just around it (S4) | medium — changes how every `sym:GraphCanvasApp` story looks under a non-default family; no effect under `default` | — |

## 5 Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pkg:@invana/styling@0.0.23` `./themes` (`sym:themes`, `sym:applyTheme`, `sym:getThemeById`, `sym:getThemeVariantById`) | The toolbar items and the document mutation both come from here | A renamed export or a changed variant-id shape breaks the decorator at build time (loud, not silent) |
| U2 | `pkg:@invana/themes@0.0.23` `ThemeProvider` storage contract (`invana-theme`, `{theme,mode,accent}`, read-at-mount) | F4 depends on the exact key and payload | A changed key or shape makes F4 a silent no-op — V5 is the check that catches it |
| U3 | `presets-base.css` before `presets.css` ordering | `presets-base` registers the tokens, `presets` overrides per theme | Reordering blanks the preset families; already documented in `tailwind.css#L29-L32` |
| U4 | Storybook 10 core toolbar globals | No addon backs F1 | A major Storybook bump could move `globalTypes` |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | The 50 story files mounting their own `<ThemeProvider>` (`story:canvas-ui/**`, `story:canvas-designer/**`, `story:canvas-ui/editors/**`) | stories | Mount on the toolbar selection after F4; **do not** re-theme on a later toolbar change without a story switch | None for F1–F4; a follow-up strips the inner providers (D-2) |
| D2 | `story:canvas/Export/ExportImage` + `story:canvas-store/Export/ExportState` | stories | Pass `storageKey={null}` deliberately → immune to F4, pinned `defaultMode="dark"` | Mark `parameters: { selfThemed: true }` so the toolbar doesn't imply control it doesn't have |
| D3 | The 28 story files registering `sym:ThemeBehaviour` (`story:graph/Layer/WithThemedBackground`, `story:canvas/Concepts/Layers/ThemedBackgroundLayer`, `story:graph-layers/**`, `story:graph-layouts/**`) | stories | Chrome follows the toolbar, **pixels keep following the OS** until F6 | Accept the split (D-1), or land F6 |
| D4 | `sym:GraphCanvasApp` — every story and the Invana studio | published API | F7 changes the scoped root's `data-theme`; behaviour under `default` is identical | Visual re-check of the `sym:GraphCanvasApp` stories |
| D5 | `sym:ThemeBehaviourOptions` + its `canvas-ui` editor, and serialised `view.definition.behaviours.theme` | published API + serialised state | F6 adds a `mode` enum member — forward-compatible (old state never says `'document'`), but the editor's mode field must list it (rule 12) | Editor field update in the same change as F6 |
| D6 | `file:apps/storybook/.storybook/global.css`, `story:Welcome` (MDX) | docs/app | F5 repaints the backdrop of every story including the docs pages | Read the Welcome page in both modes |
| D7 | `sym:resolveAccentVar` / `accent: 'css-var'` consumers | engine | Each family ships a different `--color-primary`; switching family now legitimately recolours the canvas accent | None — this is the feature working |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | `pnpm --filter @canvas/storybook dev`, pick each of the 8 families × light/dark | `story:canvas-ui/view-panels/StylingViewPanel` | `documentElement` carries `theme-<family>-<mode>` + `data-theme`; panel chrome recolours; no console warning from `sym:applyTheme` | F1 · F2 |
| V2 | pending | Set Variant → `system`, flip the OS appearance | any story | Chrome follows within a frame, from `sym:applyTheme`'s listener — proving F3 lost nothing | F3 |
| V3 | pending | **Control** — default toolbar state (`default` × `system`), compare against `main` | `story:graph/Layer/WithThemedBackground` | Pixel-identical to today: the default selection reproduces `sym:bootstrapOsTheme`'s behaviour exactly | F1 · F2 · F3 |
| V4 | pending | Pick `ocean-dark`, then open a story from D1 | `story:canvas-ui/editors/CanvasSettingsEditorPanel` | Mounts in `ocean-dark`, not `default-system` | F4 |
| V5 | pending | `localStorage.getItem('invana-theme')` after a toolbar change | devtools | `{"theme":"ocean","mode":"dark","accent":null}` — the shape `ThemeProvider` reads (U2) | F4 |
| V6 | pending | Toggle every family; inspect the story backdrop | `story:Welcome` + one fullscreen canvas story | Backdrop is the theme's `--color-background`; no `backgrounds` control remains in the toolbar | F5 |
| V7 | pending | With F6: `mode: 'document'` on a themed-background story, switch family + mode | `story:canvas/Concepts/Layers/ThemedBackgroundLayer` | The **pixi background and node/edge colours** change with the toolbar, OS setting untouched | F6 |
| V8 | pending | Pick `gold-dark` on a `sym:GraphCanvasApp` story | `story:canvas-ui/editors/HoverPreviewCardEditorPanel` | The app's own root reads `data-theme="gold-dark"`; panels are gold-tinted | F7 |
| V9 | **pass** | `pnpm check-types && pnpm lint` | repo | 18/19 packages clean; `pnpm lint` 0 errors, and `check-boundaries` · `check-api-surface` · `node-import` all intact (F6 adds a `pkg:@invana/graph` type member, not a barrel export). The 3 remaining `tsc` errors are **pre-existing and unrelated** — `labelProperty` missing from `sym:NodeTypeStyling`, in the untracked `file:apps/storybook/stories/canvas-ui/view-panels/StylingViewPanel.stories.tsx` | F1–F7 |

| V10 | **pass** | Derive kind + family from every variant `sym:applyTheme` can write (16 combinations), through the real `sym:themeFamily` | `file:packages/graph/src/behaviours/ThemeBehaviour.ts` `sym:readDocumentVariant` + `sym:resolveActiveName` logic | All 16 correct; `tailwind`/`vite` have no engine theme and correctly keep `active` rather than falling to `fallback` | F6 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Should the toolbar reach the **canvas pixels**, or only the surrounding chrome? | (a) Chrome only — F1–F5, F7; the 28 imperative stories keep reading the OS · (b) Land F6 (`mode: 'document'`) so every canvas follows · (c) Edit the 28 stories to read a Storybook global (rule 11 forbids unprompted story edits, and it scales with every new story) | **(b), as a second step.** Land F1–F5 + F7 first and verify with V1–V6 — they touch one app file plus one `canvas-ui` helper. F6 is an engine surface change to the documented single theme publisher and deserves its own review; (c) is the wrong layer | **accepted** — approved whole, so F6 landed in the same pass, sequenced after F1–F5 + F7 |
| D-2 | What to do about the 50 stories that mount their own `<ThemeProvider>`? | (a) Storage seeding only (F4) — correct at mount, stale until the next story switch · (b) Also key the decorator on the selection to force a remount · (c) Follow-up: delete the inner providers and let the decorator's provider be the only one | **(a) now, (c) as a follow-up RFC.** (b) is a trap here: `beforeEach` drains `sym:onStoryTeardown` per *story*, not per remount, so a keyed remount re-runs `play()` and leaks a live `sym:Canvas` + pixi context per theme switch | **accepted** — (a) implemented as `sym:persistThemeSelection`; (c) still open as a follow-up |
| D-3 | Retire the `backgrounds` toolbar (F5)? | (a) Retire it — the theme owns the backdrop · (b) Keep it as an override · (c) Retire the toolbar but keep `#storybook-root` transparent | **(a).** Two appearance controls that can disagree is exactly S5; the theme token is the single source. Flagged `medium` because every story's backdrop moves — if you'd rather not re-eyeball 332 stories in one pass, take (c) and land F5 separately | **accepted** — (a) implemented |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | `mode: 'document'` adopted by the stories | implemented | F6 shipped the capability but no story used it — 27 registered `sym:ThemeBehaviour`, 0 on `'document'`, so their pixels still followed the OS while their chrome followed the toolbar. 20 imperative config blocks switched to `mode: 'document'`, plus both lil-gui theme stories (default + picker option). Completes D-1 (b). See `rfc:fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers` |
| 2026-09-11 | Opened | implemented | Written against design-kit `preview.tsx` as the reference; T1–T3 run before drafting. F6/F7 split out because the toolbar is mechanical and the reach is not |
