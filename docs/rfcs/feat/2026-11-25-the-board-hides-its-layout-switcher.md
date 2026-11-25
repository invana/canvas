---
id: feat-2026-11-25-the-board-hides-its-layout-switcher
type: feat
title: The board's top-left row carries the layout switcher in every work mode
status: accepted
opened: 2026-11-25
decided: 2026-11-25
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-10-20-the-board-shows-every-tool-at-once }
  - { predicate: relates-to, object: rfc:feat-2026-10-19-a-layout-switch-moves-nodes-but-not-edges-or-labels }
  - { predicate: relates-to, object: rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story }
---

| | |
|---|---|
| Motivation | Coming from the old Studio Explorer, the user can't find a layout switcher on `sym:GraphBoard`. It exists, but only on right-click → *Layout…* |
| Design | Add the existing `layout-presets` widget (glyph ▾ → preset cards) to `sym:BOARD_ROW_ITEMS`, after the pointer tools; the row already shows only in Explore · Edit · Annotate |
| Reverses | Part of `rfc:feat-2026-10-20-the-board-shows-every-tool-at-once` M1, which moved layout off the row onto right-click. Right-click *Layout…* stays |
| Row status | proposed 0 · accepted 0 · implemented 4 · landed 0 · deferred 0 · rejected 0 (all checks pass; `landed` once in `main`) |
| Open decisions | none — D1–D3 accepted |
| Found while building | F4: the widget's raw `Tooltip` crashed any host without a `TooltipProvider` — `sym:GraphBoard` is one |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The old Studio Explorer had the layout switcher always visible in its header (Force · Layered · Stress icon toggle group) | `invana/_studio/packages/explorer/src/chrome/ExplorerHeaderToolbar.tsx` (L311–L353) | that file is exported but imported nowhere; the live Explorer already ran on `sym:GraphBoard` (`invana/_studio/packages/explorer/src/ExplorerCanvas.tsx`) |
| M2 | `sym:GraphBoard` has no layout control on its row; the only route is right-click → *Layout…* | `file:packages/canvas-ui/src/board/presets.ts#L89-L101`, `file:packages/canvas-ui/src/board/boardMenus.ts#L110` | `story:canvas-ui/apps/GraphBoard/GraphBoard` |
| M3 | Changing layout is a main act when exploring (look at the same result as a network, a tree, a flow); right-click doesn't make that discoverable | user report, 2026-11-25 | — |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Canvas lacks a layout switcher and the old one must be ported | false | `sym:LayoutPresetsWidget` registered as `'layout-presets'` at `file:packages/canvas-ui/src/control-panels/chromeWidgets.tsx#L262`, mounted in `story:canvas-ui/view-panels/LayoutPresetsViewPanel/Default` and `story:canvas-ui/apps/GraphCanvasApp/BoardChrome` |
| R2 | Port the old inline icon toggle group (`layoutIcons` on `sym:GraphControlsToolbar`) | rejected for this RFC | a second switcher beside the presets would drift; it offers no per-preset options. Option B in chat, not chosen |
| R3 | The row needs a new mode filter | false | the row panel already declares `modes={[...WORK_MODES]}` (`file:packages/canvas-ui/src/board/GraphBoard.tsx#L412-L419`); an item with no `modes` follows it |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `sym:BOARD_ROW_ITEMS` gains `{ type: 'divider' }, { type: 'widget', widget: 'layout-presets' }` right after `pointer-tools` | `file:packages/canvas-ui/src/board/presets.ts#L89-L93` | the switcher sits with the always-on tools, before Edit's / Annotate's own |
| 2 | The row panel shows only in `WORK_MODES` (explore · edit · annotate) | `file:packages/canvas-ui/src/board/GraphBoard.tsx#L412-L419`, `file:packages/canvas-ui/src/board/presets.ts#L42` | hidden in Focus / Present with no new code (D2) |
| 3 | The widget reads and writes the `layout.preset` / `layout.presetRun` commands through `sym:useLayoutPresetCards` | `file:packages/canvas-ui/src/control-panels/chromeWidgets.tsx#L51-L67` | the row button and right-click *Layout…* share one binding and always agree; the pick sits in `definition.layoutPreset`, so undo / import / a playbook step show on the button |
| 4 | `sym:GraphBoard` already calls `setLayoutPresets(BOARD_LAYOUT_PRESETS)` | `file:packages/canvas-ui/src/board/GraphBoard.tsx#L275` | the cards are Network · Tree ↓ · Flow → · Radial with no extra wiring |
| 5 | TSDoc tables that list the row's contents gain "Layout ▾" | `file:packages/canvas-ui/src/board/presets.ts#L12`, `file:packages/canvas-ui/src/board/GraphBoard.tsx#L16`, `file:apps/storybook/stories/canvas-demos/tools/CanvasExplorer.stories.tsx#L13` | docs match the drawing |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-10-20-the-board-shows-every-tool-at-once` | relates-to (partly reverses M1) | accepted | modes, rail, dock and right-click menus all stay; only *layout* comes back to the row. Its step 7 already anticipated "the toolbar popover and the menu card share one binding" |
| `rfc:feat-2026-10-19-a-layout-switch-moves-nodes-but-not-edges-or-labels` | relates-to | landed F1–F12 | the presets, the `layout.preset` command and the cards this row button opens |
| `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story` | relates-to | accepted | `sym:GraphBoard` as the one board Studio's Explorer configures; Studio picks this up by bumping `pkg:@invana/canvas-ui` |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/board/presets.ts` `sym:BOARD_ROW_ITEMS` | add divider + `layout-presets` widget after `pointer-tools` | Layout ▾ on the row in Explore · Edit · Annotate | **medium**: changes how every `sym:GraphBoard` story and the Studio Explorer look (row about 40px wider) | — |
| F2 | dressing | implemented | TSDoc in `presets.ts`, `GraphBoard.tsx`; the doc comment of `story:canvas-demos/tools/CanvasExplorer` | name the switcher in the row tables | docs match the board | low | F1 |
| F3 | defect | implemented | `story:canvas-ui/apps/GraphBoard/GraphBoardLayoutSwitcher`, `story:canvas-ui/apps/GraphBoard/GraphBoardLayoutSwitcherFocus` | one story with the switcher open (play opens the popover); one in Focus showing it gone | rule 11 — the row's new state has its own story | low | F1 |
| F4 | defect | implemented | `file:packages/canvas-ui/src/control-panels/chromeWidgets.tsx` `sym:LayoutPresetsWidget` | raw `Tooltip`/`TooltipTrigger` → the kit-wide `sym:Tooltipped` wrapper, which brings its own `TooltipProvider` (as `sym:PointerTools` does) | the widget renders in any host; without it F1 crashes every `sym:GraphBoard` with "`Tooltip` must be used within `TooltipProvider`" | low: same tooltip text, same trigger | — |

## 5. Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:LayoutPresetsWidget` / `sym:useLayoutPresetCards` | the widget drawn | renamed widget key ⇒ the row item draws nothing |
| U2 | `layout.preset`, `layout.presetRun` commands | what a pick runs | none new: already used by right-click |
| U3 | `ControlPanelSpec.modes` / `sym:itemsInMode` | hides the row in view modes | none new |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `story:canvas-ui/apps/GraphBoard/GraphBoard`, `…/GraphBoardDense`, `…/GraphBoardHostExtensions` | story | row gains a button | visual check only |
| D-2 | `story:canvas-demos/tools/CanvasExplorer` | story | same | update its doc comment (F2) |
| D-3 | Studio Explorer (`invana/_studio/packages/explorer/src/ExplorerCanvas.tsx`, `pkg:@invana/canvas-ui` `^0.0.17`) | external host | gets the button on its next canvas-ui bump; no opt-out today (D3) | none |
| D-4 | `sym:BOARD_ROW_ITEMS` (published const) | public API | value changes, name doesn't — `check-api-surface` unaffected; a host spreading it gets the button too | none |
| D-5 | Right-click *Layout…* (`sym:BoardLayoutPopover`) | sibling UI | unchanged; shares state with the button | covered by V3 |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `canvas-ui` build + `check-types`; storybook `tsc`; eslint on the changed files; `check-boundaries`; `check-api-surface` | repo | clean; no surface snapshot change | F1, F2, F4 |
| V2 | pass | headless Chromium against the running Storybook, `board.mode` run through the canvas handle: the button is present in explore / edit / annotate, absent in present / focus | `story:canvas-ui/apps/GraphBoard/GraphBoardLayoutSwitcher` | as stated | F1, F3, F4 |
| V3 | pass | pick *Tree ↓* on the row → button reads `Layout · Tree ↓`; `history.undo` → back to the starting label | same | one binding, undoable | F1 |
| V4 | pass | **control**: right-click the empty board → menu holds *Layout…* → its cards are Network · Tree ↓ · Flow → · Radial → picking Tree there sets the row button to `Layout · Tree ↓`; rail and dock as before (screenshot) | `story:canvas-ui/apps/GraphBoard/GraphBoard` | unchanged, and shares state with the row | F1 |
| V5 | pass | both new stories render; the play step opens the popover; Focus shows only the mode picker (screenshots) | F3 stories | pass | F3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Undo part of the 2026-10-20 "every other verb is on right-click" choice for layout? | yes (row + right-click) · no (right-click only) | **yes**: layout is a main act when exploring, not a rare verb; one button, same binding, no new surface | accepted |
| D2 | Which modes show it? | Explore only · Explore · Edit · Annotate (the row's modes) · all | **the row's modes**: no per-item `modes`, so it follows the row; re-laying out while editing is common | accepted |
| D3 | Can a host turn it off? | no · a `policies` / row-items prop | **no** for now: no host has asked; `sym:GraphBoard` has no row override today and adding one is its own change | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-25 | Opened after the user picked option A (put the existing widget on the board row) over porting the old Studio icon toggle group | proposed | F1–F3 proposed; D1–D3 open |
| 2026-11-25 | Approved whole; D1–D3 accepted | accepted | — |
| 2026-11-25 | F1–F3 written. V2 caught a crash: the widget's raw `Tooltip` needs a provider `sym:GraphBoard` doesn't mount; F4 added and written. V1–V5 pass | implemented | Not fixed here: before any pick, nothing has set `definition.layoutPreset`, so the tooltip reads *Layout · Layout* while the Network card shows as selected — the board's own force run doesn't record a preset. Worth its own row if it bothers anyone |
