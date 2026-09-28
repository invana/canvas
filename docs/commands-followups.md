# Commands — follow-ups

Open work left by the control-panel / command refactor (`CommandRegistry`, control panels,
toolbars drawn from control specs). Written 2026-09-28, after the seven control-panel
RFCs merged and the three `feat/view-history` RFCs were implemented.

**Why commands exist:** a control panel is saved in `view.definition`, so it's JSON and
can't hold closures. Buttons name an action and `canvas.commands` resolves it. That is the
one thing only commands give; everything else (overrides reaching every button, running
without React, `list()` + arg descriptors for editors) is a bonus.

**Rule** (in `packages/canvas-react/CLAUDE.md` since item 8):

| Layer | Role |
|---|---|
| Plain engine functions / methods | The logic. Typed, reusable, testable |
| Hooks (`@invana/canvas-react`) | The typed React API over those functions — for bespoke UI |
| Commands (`canvas.commands`) | A thin named adapter over the same functions — for **saved** controls (panels, headers, later shortcuts / menus) |

Status: 📋 open · 🚧 in progress · ✅ done.

## 1. Close out what's built

| # | Item | Status |
|---|---|---|
| 1 | Commit + merge `feat/view-history`; set its three RFCs (`canvas-definition-edits-cannot-be-undone`, `control-panel-command-args-are-raw-json`, `app-header-controls-do-not-save-with-the-canvas`) to `landed` | ✅ merged 2026-09-28 |
| 2 | `control-panels-cannot-be-edited-in-the-studio` and `the-modeller-tool-lives-outside-the-canvas` stay `accepted` until their story rows (E9, S1) are done or rejected | ✅ recorded — both stay `accepted`, E9 / S1 deferred (stories only when asked) |
| 3 | `docs/README.md` still labels `canvas-core-structure`, `renderer-preference-canvas…`, `label-measurement…` as "🚧 implemented on `feat/control-panels`" — stale | ✅ relabelled from git (B1, B2 of `rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic`) |

## 2. Remove the duplicate paths (the main risk to reuse)

| # | Item | Status |
|---|---|---|
| 4 | `useSelectMode` and the `select.mode` command implement the same rule separately → one shared function, both call it | ✅ `resolveSelectMode` / `selectModePatch` in `@invana/graph` |
| 5 | `useHistory` / `useClipboard` read the React context directly, beside the `history.*` / `clipboard.*` commands → pick one path | ✅ shared functions in `@invana/graph` (`cutSelection` …, `undoNewest` …); `useHistory` stays graph-only until item 16 |
| 6 | Section hooks (`useViewSection`, `useHistorySection`, `useLayoutsSection`, `useEditorSection`, `useStyleEditorSection`) are exported but no canvas-ui toolbar uses them → deprecate or keep (needs an RFC) | ✅ deprecated (TSDoc only) |
| 7 | `GraphControlsToolbar`'s private `toolbar.layout#<id>` / `toolbar.layoutRun#<id>` commands are a workaround → back to the layout hook | ✅ built from `useLayout` |
| 8 | Write the rule above into `packages/canvas-react/CLAUDE.md` | ✅ |

## 3. Unfinished toolbar conversion

| # | Item | Status |
|---|---|---|
| 9 | `SchemaToolbar` is still callback-based → convert it, or record that it stays | ✅ Fit converted; the three pickers stay callbacks (state is `SchemaViewPanel`'s) |
| 10 | `GraphToolbar` / `GraphLayoutToolbar` are deprecated with no users → remove in the next breaking release | ✅ recorded (G1 `deferred`) — removal still due in the next breaking release |

## 4. Weak spots in commands

| # | Item | Status |
|---|---|---|
| 11 | No type safety: names are strings, args `unknown` → a typed `run<'camera.fit'>(…)` driven by a name → args map | 📋 |
| 12 | Buttons go stale if someone forgets `invalidate()` → audit non-store state commands read (edge defaults, layer visibility, clipboard, both histories), or move it into the store | ✅ owner-side bridges, nothing moved into the store (I1–I5, `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently`) |
| 13 | A saved panel naming an unregistered command (`history.undo` without `GraphHistoryProvider`, `theme.toggle` without the theme bundle) shows a silently disabled button → flag it in the UI | ✅ "(unavailable)" label + dev warning (R1, R2) |
| 14 | No `scene:behaviour:unregister` event, so the editor's behaviour picker can list a removed behaviour | ✅ event added; picker listens (N1, N2) |
| 15 | Arg descriptors are documentation only → optional dev-mode validation in `run` | ✅ `validateArgs`, on in dev builds, warn-only (A1) |

## 5. Deferred RFC rows

| # | Item | Source | Status |
|---|---|---|---|
| 16 | Combined undo state (`canUndo` across both stacks) through `useHistory` | H9, `rfc:feat-2026-09-28-canvas-definition-edits-cannot-be-undone` | ✅ `useHistory` is two-stack; hook Undo now also undoes definition edits (H1, H2) |
| 17 | Descriptors for widget options and choice options (the last two JSON fields in the editor) | A8, `rfc:feat-2026-09-28-control-panel-command-args-are-raw-json` | 🚧 implemented, unmerged — widget `optionsSpec` + choice option rows (B1–B3, `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels`) |
| 18 | Footer placement for panels | P7, `rfc:feat-2026-09-28-app-header-controls-do-not-save-with-the-canvas` | 🚧 implemented, unmerged — `footer-*` placements, `RegionControlPanels`, footer auto-shows (P1–P4, `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels`) |
| 19 | `GraphCanvas` owns history + clipboard instead of React providers (also fixes item 13 for undo) | D1-B, `rfc:feat-2026-09-28-graph-toolbar-actions-cannot-be-saved` | 🚧 implemented, unmerged — `GraphCanvas.graphHistory` / `.clipboard` per layer; providers bridge (C1–C5, `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels`) |
| 20 | Close D4 (spec-valued header slots) — covered by header placement | D4, `rfc:feat-2026-09-28-toolbars-and-control-panels-draw-controls-twice` | ✅ superseded by `rfc:feat-2026-09-28-app-header-controls-do-not-save-with-the-canvas` (history row) |

## 6. Found along the way (not caused by commands)

Items 12–16, 21 and O1–O2 landed through `rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently`; O3–O4 were found there.

| # | Item | Status |
|---|---|---|
| 21 | Several behaviours override `setOptions` without `super` (e.g. `BrushSelectBehaviour`), so `getOptions()` goes stale and `CanvasSettingsEditorPanel` can show old values | ✅ 11 behaviours call `recordOptions` (F1, F2) |
| O1 | `useLock` re-implements `view.lock` | ✅ `isViewLocked` / `setViewLocked` in `@invana/canvas` (L1, L2) |
| O2 | `useEdgeType` goes through the `graph.edgeType` command | ✅ `edgePathType` / `setEdgePathType` in `@invana/graph` (E1, E2) |
| O3 | Base `Behaviour.setOptions` enables directly, so `canvas.update({ behaviours: { id: { enabled } } })` on a behaviour without its own `setOptions` fires no `scene:behaviour:enable` / `disable` | 🚧 implemented, unmerged — routed through the registry when mounted (A1, A2, `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels`) |
| O4 | `useHoverElementPreview`, `useViewTarget`, `ElementInspectorViewPanel` re-attach on `scene:behaviour:register` but never detach on the new `scene:behaviour:unregister` | 🚧 implemented, unmerged — `useBehaviourInstance` (A3, A4, `rfc:feat-2026-09-29-commands-stop-at-saved-control-panels`) |

## 7. Stories — only when asked (root rule 11)

| # | Item | Status |
|---|---|---|
| 22 | E9: a `ControlPanelsEditor` story | 📋 |
| 23 | S1: modeller stories from `enabled={tool===…}` to `modes` | 📋 |
| 24 | P8: story headers to saved header panels | 📋 |

## 8. Planned uses that justify the registry

| # | Item | Status |
|---|---|---|
| 25 | Keyboard shortcuts bound to command names | 📋 |
| 26 | Context menus and a command palette from `commands.list()` | 📋 |

If 25–26 aren't planned soon, items 4–8 come next: they stop hooks and commands drifting
apart.

Items 3–10 landed through `rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic`. It also recorded, out of scope: `useLock` re-implements `view.lock`, and `useEdgeType` goes through its command — the same drift as items 4–5.
