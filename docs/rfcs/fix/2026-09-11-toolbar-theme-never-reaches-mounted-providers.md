---
id: fix-2026-09-11-toolbar-theme-never-reaches-mounted-providers
type: fix
title: A toolbar theme change never reaches a mounted `<ThemeProvider>`, so `GraphCanvasApp` stories only re-theme on a page refresh
status: accepted
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@canvas/storybook, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: caused-by, object: pkg:@invana/themes }
  - { predicate: depends-on, object: rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode }
  - { predicate: manifests-in, object: story:canvas-ui/apps/GraphCanvasApp/Default }
  - { predicate: relates-to, object: doc:docs/ui-consolidation-plan.md }
---

# A toolbar theme change never reaches a mounted `<ThemeProvider>`

The Theme × Variant toolbar landed (`rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode`)
and drives `document`. It does **not** drive the React context that `sym:GraphCanvasApp` and
`sym:CanvasThemeSync` read, so those stories re-theme only on a page refresh. This is D-2 **(c)**
of that RFC, opened as its own document.

| | |
|---|---|
| Problem | Switching Theme → `ocean` retints unscoped chrome instantly, but every `sym:GraphCanvasApp` story stays on the family/mode it mounted with, until a page reload |
| Root cause | `sym:ThemeProvider` is **uncontrolled-only**: state is seeded once in `useState` initialisers and can change only from inside via `setTheme`/`setMode`. The toolbar has no handle on it, so it writes `document` instead — which `sym:GraphCanvasApp`'s own scoped `theme-*` class then overrides |
| Not the cause | `sym:GraphCanvasApp`'s theme scoping (correct, and load-bearing for embedding) · the provider props on `story:canvas-ui/apps/AppLayoutV2` |
| Defect rows | F1 · F2 · F4 — F3 removes dressing that only existed to work around this |
| Row status | rows: **implemented 4 · deferred 2** · verification: **pass 1 · pending 6** (V1–V6 are browser checks the implementing session can't run) · decisions: **accepted 3** |

## 1 Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Toolbar Theme/Variant change does not retheme the story until a manual page refresh | `story:canvas-ui/apps/GraphCanvasApp/*`, `story:canvas-ui/editors/*`, `story:usecases/*` — 50 story files | Reported in session; reproduced by switching Theme → `ocean` |
| S2 | `story:canvas-ui/apps/AppLayoutV2` *does* retheme live, with no refresh | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L599` | The shell around the boards recolours immediately; the two `sym:GraphCanvasApp` boards inside it do **not** |
| S3 | The refresh "fix" is real but one-shot — the next switch is stale again | `file:apps/storybook/.storybook/preview.tsx#L81-L89` | `sym:persistThemeSelection` mirrors the selection to `localStorage`, which the provider reads only in its mount-time initialiser |
| S4 | The canvas pixels are stale too, not just the chrome | `file:packages/canvas-ui/src/apps/CanvasThemeSync.tsx#L34-L45` | `sym:CanvasThemeSync` derives `mode`/`active` from `sym:useThemeOptional`, so the `sym:ThemeBehaviour` patch it writes carries the mount-time theme |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `sym:GraphCanvasApp` is buggy — it should not scope the theme to its own root | **No** | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L256-L265`: scoping is deliberate so an app embedded in an `ocean` page isn't overridden by the page. It's stale *input*, not wrong *behaviour* |
| R2 | `story:canvas-ui/apps/AppLayoutV2` works because of its `defaultTheme="default" defaultMode="dark" storageKey={null}` provider props | **No** | Removing those props leaves the live retinting unchanged (maintainer's own test, T1) — the shell never consulted the provider |
| R3 | Adding a `<ThemeProvider>` inside `sym:GraphCanvasApp` would fix it | **No** | An inner provider inherits the same mount-only staleness, and it would break the documented contract that the **host** owns the theme (`file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L498-L509`) |
| R4 | Making `storageKey={null}` + `defaultMode="dark"` the provider defaults would fix it | **No** | That removes the only channel that works today (S3): stories would pin forever — no live switch *and* no switch on refresh |
| R5 | The decorator isn't running / isn't applying the theme | **No** | `file:apps/storybook/.storybook/preview.tsx#L216-L221` ran `sym:applyTheme` on every globals change and `documentElement` did carry `theme-ocean-*`. The write lands and is then overridden lower down (G4) |

## 2 Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | The kit has **two independent theme paths**: a document path (`sym:applyTheme` on `documentElement`) and a context path (`sym:useTheme` → consumer applies its own class) | `sym:applyTheme` swaps `theme-*` + `data-theme` on the root; `sym:ThemeProvider` exposes `theme`/`mode`/`isDark` via context | A fix that drives only one path leaves the other stale |
| G2 | The toolbar drove **only** the document path | `file:apps/storybook/.storybook/preview.tsx#L216-L221` — the decorator called `sym:applyTheme` directly; it never touched a provider | Context consumers never learn a switch happened |
| G3 | `sym:ThemeProvider` is uncontrolled-only, so there was nothing to drive | `@invana/themes@0.0.23/dist/index.js#L95-L103` seeds `theme`/`mode`/`accent` in `useState` **initialisers** (storage ?? `default*` props); `#L106-L113` applies on `[theme, mode, isDark]`; only `setTheme`/`setMode` (`#L116-L131`) mutate it | Props are a mount-time seed, not an input. A live host value can reach it only through `setTheme`/`setMode` or a remount |
| G4 | `sym:GraphCanvasApp` re-applies the **context** value as a scoped class on its own root, which overrides the inherited root tokens | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L578` `sym:shellThemeAttrs(theme.theme, themeKind)` → `#L588-L594` `data-theme` + `theme-<family>-<kind>`; the class blocks are real token definitions (`@invana/styling/src/themes/presets.css#L163`, `themes/default.css#L8,#L66`) | Inside the app, the document swap is **masked**. This is exactly S1 — the whole viewport of a `sym:GraphCanvasApp` story is that subtree |
| G5 | `story:canvas-ui/apps/AppLayoutV2` retints because its visible chrome is the bare `sym:AppLayoutV2` shell, which sets **no** theme class | No `data-theme`/`theme-*` write exists in `@invana/themes/dist/index.js` `sym:AppLayoutV2` (`#L556`) | S2 explained: the shell inherits `:root` and follows the document path; the boards inside it are scoped and don't. Same bug, minority of the pixels |
| G6 | The workaround that shipped only helped at mount | `sym:persistThemeSelection` (`file:apps/storybook/.storybook/preview.tsx#L81-L89`) + G3's initialiser read | S3: a refresh re-seeds the provider from storage; a switch without one changes nothing in the subtree |

### Compounding factor

| ID | Factor | Why it matters |
|---|---|---|
| C1 | 50 story files mounted their **own** `<ThemeProvider>` (78 tags; 44 bare, 5 pinned with `storageKey={null}`, the rest prose) | An outer provider added by the decorator is shadowed by every one of them. **No fix works until those inner providers go** — including the upstream one (D-2). This is what made D-1 the real decision |
| C2 | A keyed remount is not available as a shortcut | `beforeEach` drains `sym:onStoryTeardown` per *story*, not per remount (`file:apps/storybook/.storybook/preview.tsx#L74-L79`) | Remounting on every theme switch leaks a live `sym:Canvas` + pixi context each time |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Remove the provider props from `story:canvas-ui/apps/AppLayoutV2` and switch Theme | Shell still retints live; boards still don't | G5 confirmed — the working path is provider-independent (R2 falsified) |
| T2 | Switch to `ocean`, inspect the DOM | `<html class="theme-ocean-…">` while `sym:GraphCanvasApp`'s root `<div data-theme>` still reads the mount-time variant | G4 confirmed — the scoped class masks the document write |
| T3 | `grep -rln '<ThemeProvider' apps/storybook/stories \| wc -l` → 50; JSX tags → 44 bare + 5 pinned | — | C1 confirmed — the inner providers are the blocking population, not a long tail |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode` | depends-on | accepted | The toolbar itself (F1–F3), the `selfThemed` opt-out, and D-2's own verdict: (a) storage seeding now, **(c) delete the inner providers as a follow-up** — this RFC is that follow-up |
| `file:packages/canvas-ui/src/apps/CanvasThemeSync.tsx` | relates-to | shipped | The host-theme → `sym:ThemeBehaviour` bridge is correct and unchanged; it just needs current context |
| `sym:ThemeBehaviour` `mode: 'document'` | relates-to | shipped | Solves the same reach problem for **imperative** stories by reading `documentElement`. Not applicable here: the React path's truth is the scoped root, not the document |
| `@invana/themes` `sym:ThemeSelector` | relates-to | shipped | Already documents the target idiom — "State resolves per-field as **controlled prop › `<ThemeProvider>` › internal**" (`index.d.ts#L220`). D-2 is applying it one level up |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:apps/storybook/.storybook/preview.tsx` | Decorator mounts **one** `<ThemeProvider storageKey={null} defaultTheme defaultMode>` around `<Story/>`, plus a null-rendering `sym:ToolbarThemeBridge` child that pushes `setTheme` / `setMode` when the globals change. The last push is tracked in a ref, not compared against provider state, so an in-story `<ThemeSelector>` isn't reverted | The context every consumer reads is current — no remount, no leak (C2) | low — one app file; `storageKey={null}` also drops the design-kit key collision the storage mirror introduced | — |
| F2 | defect | implemented | same | Delete the decorator's direct `sym:applyTheme` call — the provider's own effect (`index.js#L106-L113`) owns the document write | One writer of `data-theme`, restoring the invariant `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode` F3 established | low | F1 |
| F3 | dressing | implemented | `file:apps/storybook/.storybook/preview.tsx#L81-L89` | Delete `sym:persistThemeSelection` and its call | Removes the storage mirror, which only ever existed to seed inner providers at mount (G6) and hid the defect behind "refresh and it works" | low — strictly superseded by F1 | F1 · F4 |
| F4 | defect | implemented | 44 story files | Delete the bare inner providers + their now-unused imports; keep the pinned `storageKey={null}` ones. **Scope correction on landing:** `story:canvas-ui/apps/AppLayoutV2` was pinned too (`defaultTheme="default" defaultMode="dark" storageKey={null}`), and that pinning *is* the S2 asymmetry — its provider is removed as well, so its boards now follow the toolbar along with the shell. 12 comment blocks describing the removed wrapper were rewritten | Unblocks F1 — without this the inner providers shadow the decorator's (C1) | **medium** — 45 story files; approved under rule 11 by D-1. Mechanical: delete the wrapper, dedent, drop the import | D-1 |
| F5 | — | rejected | `file:apps/storybook/.storybook/theme-provider.tsx` (new) + `file:apps/storybook/.storybook/main.ts` | **Alternative to F4:** alias `@invana/themes`' `ThemeProvider` inside the harness to a wrapper that mounts the real one + the bridge | Zero story edits; every current and future story works unchanged | **medium** — a harness-local shim: Storybook would then behave unlike production, and the defect stays live for every non-Storybook host | D-1 |
| F6 | — | deferred | `pkg:@invana/themes` (design-kit repo) | Add controlled `theme` / `mode` / `accent` props + `onSelectionChange`, resolving per-field `controlled prop › internal` — the idiom `sym:ThemeSelector` already documents | Removes the need for the bridge component in F1, and fixes the defect for every host, not just Storybook | medium — separate repo, version bump, touches every consumer of the kit. **Does not remove the need for F4** (C1) | D-2 |

## 5 Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pkg:@invana/themes@0.0.23` `setTheme`/`setMode` public API | F1's bridge drives the provider through them, exactly as `sym:ThemeSelector` does | A signature change breaks the bridge at build time (loud) |
| U2 | `sym:applyTheme` being called by the provider's effect | F2 removes the decorator's own call and relies on it | If the provider ever stops writing the document, every unscoped story loses its theme — V3 is the check |
| U3 | Storybook 10 `context.globals` in decorators | The bridge's only input | Core API, no addon |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | The 45 story files that mounted `<ThemeProvider>` (`story:canvas-ui/**`, `story:canvas-designer/**`, `story:usecases/**`) | stories | F4 deleted the wrapper; they inherit the decorator's provider instead | Done |
| D2 | `story:canvas/Export/ExportImage`, `story:canvas-store/Export/ExportState` | stories | `parameters: { selfThemed: true }` → decorator returns `<Story/>` untouched, no provider at all | None — still self-themed and still pinned |
| D3 | `story:usecases/tools/GraphModeller` (`#L433`), `story:usecases/by-casestudies/agent-harness/Architecture` (`#L342`) | stories | `storageKey={null}` without `selfThemed` → nested inside the decorator's provider; inner wins, so they stay pinned | D-3, still open |
| D4 | `sym:GraphCanvasApp`, `sym:SchemaViewPanel` (`file:packages/canvas-ui/src/view-panels/schema/SchemaViewPanel.tsx#L206`) | published API | **No code change.** They start receiving live context, which is what they were written for | Visual re-check only (V1 · V2) |
| D5 | `sym:CanvasThemeSync` → `sym:ThemeBehaviour` → `view.definition.behaviours.theme` | serialised state | A toolbar switch now writes a store patch per change instead of once at mount | None — the patch is the documented path; history will show `theme` updates during a switch |
| D6 | `localStorage['invana-theme']` on the Storybook origin | app state | F3 stops writing it; F1's provider stops reading it | A stale value from before this change is ignored, not migrated. Harmless |
| D7 | Any new story that mounts its own `<ThemeProvider>` | stories | Re-introduces the shadow for that story only | Rule added to `file:apps/storybook/CLAUDE.md` ("Theme — never mount your own `<ThemeProvider>`") |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Switch Theme → `ocean`, then `forest`, without reloading | `story:canvas-ui/apps/GraphCanvasApp/Default` | The app's scoped root `data-theme` follows each switch; panels + toolbar retint | F1 · F4 |
| V2 | pending | Same switch, watching the canvas | same | The **pixi** background / node / edge colours retint, via `sym:CanvasThemeSync` → `sym:ThemeBehaviour` | F1 · F4 |
| V3 | pending | **Control** — switch Theme on a story with no provider and no canvas | `story:canvas-ui/view-panels/StylingViewPanel` | Still retints exactly as before, proving F2 lost nothing by dropping the direct `sym:applyTheme` call | F2 |
| V4 | pending | **Control** — the pinned stories | `story:canvas/Export/ExportImage`, `story:usecases/tools/GraphModeller` | Unchanged: still `dark`/pinned regardless of the toolbar | F4 · D2 · D3 |
| V5 | pending | Switch to `ocean-dark`, reload, switch to `forest-light`, reload | `story:canvas-ui/apps/AppLayoutV2` | Shell **and** both boards agree at every step — the S2 asymmetry is gone in both directions | F1 · F3 · F4 |
| V6 | pending | `localStorage.getItem('invana-theme')` after several switches | devtools | Unchanged from before the session — nothing writes it any more | F3 |
| V7 | **pass** | `tsc --noEmit` + `eslint stories/ .storybook/` in `pkg:@canvas/storybook` | repo | 0 type errors, 0 lint errors. The 56 remaining `react-hooks/rules-of-hooks` warnings are pre-existing (hooks called in story `render` functions — verified against `HEAD`) | F1–F4 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | How do the inner `<ThemeProvider>`s stop shadowing (C1)? | (a) **F4** — delete them from the story files; the decorator's is the only one · (b) **F5** — alias `ThemeProvider` inside `.storybook/` so stories need no edit · (c) Do nothing; keep "refresh to re-theme" | **(a).** It's what D-2(c) of the prior RFC anticipated, it deletes duplication rather than adding a shim, and it keeps Storybook behaving like production. (b) is a harness-local workaround that leaves the defect live everywhere else | **accepted** — (a): 44 bare providers removed from 44 files, plus the pinned `story:canvas-ui/apps/AppLayoutV2`. F5 rejected, kept as the record |
| D-2 | Fix `sym:ThemeProvider` upstream (F6)? | (a) Yes, now — controlled props in the design-kit repo, then drop the bridge here · (b) Yes, later — F1's bridge is a legitimate use of the public API, so this is a cleanup not a blocker · (c) No | **(b).** F1 works today with no upstream change, and the bridge is exactly what `sym:ThemeSelector` does. But the defect is real for any host holding theme outside React (URL param, user profile, the studio's canvas view state) | **accepted** — (b): deferred; worth a `feat/` RFC in the design-kit repo when it is next touched |
| D-3 | Should `story:usecases/tools/GraphModeller` + `story:usecases/by-casestudies/agent-harness/Architecture` declare `selfThemed` (D3)? | (a) Yes — the toolbar shouldn't imply control it doesn't have · (b) No — leave them nested and pinned · (c) Unpin them entirely and let them follow the toolbar | **(a)** if they're meant to stay pinned, **(c)** if the pinning was incidental. (b) is the status quo and is merely untidy | **accepted** — (a): both declare `parameters: { selfThemed: true }`, so the decorator skips them and the toolbar leaves their pinned provider alone |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | D-3 answered + `mode: 'document'` pass | accepted | `story:usecases/tools/GraphModeller` and `story:usecases/by-casestudies/agent-harness/Architecture` declare `selfThemed`. Separately, the 27 imperative `sym:ThemeBehaviour` stories were switched from `mode: 'system'` to `'document'` so their **pixels** follow the toolbar too — that completes D-1 (b) of `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode`, recorded there |
| 2026-09-11 | F1–F4 implemented | accepted | D-1 (a) + D-2 (b) approved. 44 bare providers removed from 44 story files, imports cleaned, 12 stale wrapper comments rewritten; `story:canvas-ui/apps/AppLayoutV2` unpinned (scope correction, see F4). Rule added to `file:apps/storybook/CLAUDE.md`. V7 pass; V1–V6 need a browser. Not committed |
| 2026-09-11 | Opened | proposed | Split out of `rfc:feat-2026-09-11-storybook-cannot-switch-theme-or-mode` D-2(c). T1 was run by the maintainer mid-session (removing the AppLayoutV2 provider props), which falsified R2 and confirmed G5 |
