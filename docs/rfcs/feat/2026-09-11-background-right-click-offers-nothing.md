---
id: feat-2026-09-11-background-right-click-offers-nothing
type: feat
title: Right-clicking the empty canvas offers nothing, and the selection mode is reachable only from a toolbar
status: proposed
opened: 2026-09-11
decided: null
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@invana/canvas-react]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-11-nothing-lists-what-is-selected }
---

# The background right-click offers nothing

Give `sym:GraphContextMenu` a **background** menu with a default **Select** item whose submenu is
**Click · Brush · Lasso** — the same mutually-exclusive mode switch `sym:GraphControlsToolbar`
already exposes, now reachable by right-clicking the empty canvas. Companion to
`rfc:feat-2026-09-11-nothing-lists-what-is-selected`: that RFC shows *what* is selected, this one
puts *how you select* one gesture away from the canvas.

| | |
|---|---|
| Gap | `sym:GraphContextMenu` mounts a node menu and an edge menu, each with batteries-included defaults, and explicitly tells you to "add the empty-canvas menu with a separate `sym:GraphBackgroundContextMenu`" (`file:packages/canvas-ui/src/menus/GraphContextMenu.tsx#L52`) — which has **no defaults at all** and requires a hand-written `items` builder. So right-clicking the background does nothing, in every app |
| Ask | A **Select** parent item with **Click / Brush / Lasso** children, switching the active selection mode |
| Mechanism | `MenuItem.children?: MenuItem[]` (`@invana/ui`) is already a submenu, and `sym:ContextMenuOverlay` renders it through `sym:NestedMenu` (`file:packages/canvas-ui/src/components/ContextMenuOverlay.tsx#L37`) — no new UI primitive |
| Convention to copy | `SELECT_MODE_IDS = { click: '', brush: 'brush-select', lasso: 'lasso-select' }` (`file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L66`). **`click` maps to no behaviour id** — click-select is never disabled; "Click" means brush *and* lasso are off |
| The trap | `sym:useSelectMode` **writes** the mode on mount (`file:packages/canvas-react/src/hooks/useSelectMode.ts#L75-L80`). Mounting this menu would silently disable a brush the consumer enabled through `config`. F4 is the row that stops it |
| Non-goal | A new selection behaviour, keyboard shortcuts for the modes, a background **Add node here** / **Paste** item (the obvious neighbours — separate rows, separate RFC), or wiring the menu into `sym:GraphCanvasApp`'s bundle (D-4) |
| Row status | rows: **proposed 7** · verification: **pending 8** · decisions: **open 4** |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | The background menu is the only one of the three with no default items — it is a bare shell around an `items` prop the consumer must write | `file:packages/canvas-ui/src/menus/GraphBackgroundContextMenu.tsx#L20` | `items: (ctx: GraphBackgroundMenuContext) => MenuItem[]` — required, no default |
| S2 | `sym:GraphContextMenu` — "the **standard, batteries-included** graph context menu … with **zero config**" — deliberately excludes it | `file:packages/canvas-ui/src/menus/GraphContextMenu.tsx#L33-L52` | Mounts `nodes`/`edges` only; the TSDoc ends "Add the empty-canvas menu with a separate `GraphBackgroundContextMenu`" |
| S3 | Nothing in the repo renders a background menu — not one app, not one story | `grep -rl GraphBackgroundContextMenu` | 7 hits: 6 are the package's own files + barrel, and the 3 story hits are all `sym:GraphContextMenu` (node/edge). Zero `items` builders exist |
| S4 | The selection mode is reachable **only** from a toolbar, so an app that renders no toolbar cannot switch it at all | `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L154-L157` + `file:packages/canvas-ui/src/toolbars/GraphLayoutToolbar.tsx#L70` | The two `sym:useSelectMode` call sites in the repo are both toolbars |
| S5 | `sym:GraphCanvasApp`'s bundle registers all three select behaviours and **no** context menu, so the capability is mounted but unreachable by right-click | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L347-L349` | `<ClickSelectBehaviour/>` `<BrushSelectBehaviour/>` `<LassoSelectBehaviour/>`, no menu component anywhere in `apps/` |
| S6 | `story:canvas-ui/apps/AppLayoutV2` now lists the selection in a panel but gives no way to change *how* you select without the toolbar | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | The Selection tab landed 2026-09-11 (`rfc:feat-2026-09-11-nothing-lists-what-is-selected`) |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Switching mode disables `sym:ClickSelectBehaviour`, which would break brush/lasso — they **delegate** selection mutations to it | **No — twice over** | (a) `click` maps to `''` in `SELECT_MODE_IDS`, so click-select is never in the patch and never disabled. (b) Even if it were, the delegation is a **registry lookup** (`ctx.behaviours.get(this.clickSelectId)`, `file:packages/graph/src/behaviours/BrushSelectBehaviour.ts#L444`) and `sym:ClickSelectBehaviour.applySelection` is **not gated on `_enabled`** — the only `_enabled` guard is the pointer handler at `file:packages/graph/src/behaviours/ClickSelectBehaviour.ts#L523`. Programmatic selection survives a disabled behaviour by design |
| R2 | The new `sym:SelectionViewPanel`'s ✕ / Clear would stop working in brush or lasso mode | **No** | Same mechanism as R1(b): `deselect` / `clearSelection` reach `applySelection` directly, never the pointer path |
| R3 | `@invana/ui`'s `MenuItem` needs extending for a submenu | **No** | `children?: MenuItem[]` already exists (`packages/canvas-ui/node_modules/@invana/ui/dist/index.d.ts#L1508`) and `sym:NestedMenu` renders it |
| R4 | `MenuItem` can show the active mode with a check | **No — and this is a real constraint** | The interface is `{ id, label, icon, shortcut, className, href, onClick, children }`. No `checked`, no `selected`. The active mode must be conveyed by `icon` / `className` (D-2) |
| R5 | The `items` builder can call `sym:useSelectMode` itself | **No** | `build(event, base)` runs inside the right-click handler, not in render (`file:packages/canvas-ui/src/menus/GraphContextMenuBase.tsx`). A hook must be called in the component and closed over |
| R6 | `sym:useSelectMode` can be dropped in as-is | **No** | Its mount effect *writes* (`setMode(options.initial ?? keys[0])`, `#L75-L80`). Mounting the menu would disable a `config`-enabled brush behind the consumer's back — the defect F4 exists to prevent |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | The background menu joins the **standard** menu: `sym:GraphContextMenu` gains `background?: boolean` (default `true`) alongside `nodes` / `edges`, plus `backgroundItems?: (ctx, defaults) => MenuItem[]` for extension | Mirrors the existing `nodeItems` / `edgeItems` contract exactly (`#L24-L30`) | One component still gives you every menu. S2's instruction to mount a second component becomes the *escape hatch*, not the default path |
| G2 | The default background item is a **parent with children**, not three top-level items: `Select ▸ Click / Brush / Lasso` | `MenuItem.children` (R3) | The empty-canvas menu stays one line long, leaving room for the obvious future neighbours (Add node here, Paste, Fit) without a flat list of five |
| G3 | Mode keys reuse `SELECT_MODE_IDS` verbatim, `click: ''` included | `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx#L66` | The menu and the toolbar are the same switch: flip it in either and the other follows, because both derive from `view.definition.behaviours[id].enabled` |
| G4 | Read + write through `sym:useSelectMode` with a **new `enforceInitial` option** (default `true`, so nothing existing moves); the menu passes `false` | The write path is already `canvas.update({ behaviours })` (`#L62-L70`) — one write path, store-derived mode | The menu **observes** the mode and never imposes one on mount (R6). A read-only consumer of a mode switch is a legitimate shape the hook cannot express today |
| G5 | The active child is marked with a **leading icon** (`Check` on the active one, the mode's own icon otherwise) and the parent's label reads `Select: Brush` | R4 — there is no `checked` field | The mode is legible without opening the submenu, and without inventing a `MenuItem` field that `@invana/ui` would have to ship |
| G6 | The menu is mounted where the panel it complements already lives — `story:canvas-ui/apps/AppLayoutV2` — not in `sym:GraphCanvasApp`'s bundle | S5; the bundle has never mounted a menu | Right-click gains a menu exactly where a reviewer will look for it, and no existing `sym:GraphCanvasApp` story silently changes its right-click behaviour (D-4) |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read `sym:ClickSelectBehaviour` for `_enabled` guards | **one** hit, at `#L523` (the pointer handler) | R1(b)/R2 confirmed — a disabled click-select still applies programmatic selections |
| T2 | Read both `sym:useSelectMode` call sites | Both are toolbars, both pass `initial` | S4 confirmed, and both would keep their mount-time enforcement under F4's default |
| T3 | `grep -rl GraphBackgroundContextMenu` across `packages` + `apps` | 7 files, none of them a consumer | S3 confirmed — F1 cannot break an existing `items` builder, because there isn't one |
| T4 | Read `sym:ContextMenuOverlay` | `<NestedMenu menuItems={items} />` | R3 confirmed — submenus render today with no change to the overlay |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-nothing-lists-what-is-selected` | relates-to | accepted | The selection panel; this RFC is its input side. Both read the same store state |
| `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx` | pattern source | shipped | `SELECT_MODE_IDS` + `SELECT_LABEL`, and the `click: ''` convention that makes the modes safe |
| `file:packages/canvas-ui/src/menus/GraphContextMenu.tsx` | extends | shipped | The `nodeItems` / `edgeItems` override contract F1 copies for `backgroundItems` |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/canvas-ui/src/menus/GraphContextMenu.tsx` | Add `background?: boolean` (default `true`) + `backgroundItems?: (ctx, defaults) => MenuItem[]`; mount `sym:GraphBackgroundContextMenu` with the default items | The standard menu covers all three targets | **medium** — every consumer of `<GraphContextMenu/>` gains a background menu where right-click did nothing (3 story files, D1) | — |
| F2 | defect | proposed | same file (or `menus/selectModeItems.ts`) | The default builder: a `Select` parent whose children are Click / Brush / Lasso, each `onClick` → `setMode(key)` + `close()` | The asked-for submenu | low | F1, F4 |
| F3 | defect | proposed | same | Mark the active mode: `Check` icon on the active child, parent label `Select: <Mode>` | The mode is readable without opening the submenu (R4) | low | F2, D-2 |
| F4 | defect | proposed | `file:packages/canvas-react/src/hooks/useSelectMode.ts` | Add `enforceInitial?: boolean` to `sym:UseSelectModeOptions`, default `true`; when `false`, skip the mount effect that writes the initial mode | The menu observes without imposing (R6). Both existing toolbars keep today's behaviour | **medium** — touches a shipped headless hook two toolbars depend on; the default makes it a no-op for them | — |
| F5 | defect | proposed | `file:packages/canvas-ui/src/menus/GraphBackgroundContextMenu.tsx` | Make `items` **optional**, falling back to the F2 defaults, so the standalone component is batteries-included too | S1 closed at the primitive, not only at the composite | low | F2 |
| F6 | defect | proposed | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Mount `<GraphContextMenu />` inside each board's `<GraphCanvasApp>` children | The menu is actually visible, beside the Selection tab it complements (G6, S6) | low | F1 |
| F7 | dressing | proposed | `file:packages/canvas-ui/src/toolbars/GraphControlsToolbar.tsx` | Export `SELECT_MODE_IDS` / `SELECT_LABEL` from one module instead of re-declaring them in the menu | One definition of the mode table | low — recommend **deferring** unless F2 lands in a separate file | F2 |

## 5 Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:MenuItem.children` + `sym:NestedMenu` (`@invana/ui`, external design kit) | The submenu itself | A design-kit change to the menu shape breaks the node/edge menus first |
| U2 | `SELECT_MODE_IDS`' `click: ''` convention | Correctness of the whole feature (R1) | If `click` ever maps to a real id, switching to Brush would disable click-select and `sym:SelectionViewPanel`'s row actions would still work (R2) but plain clicking would not select |
| U3 | `sym:useSelectMode`'s store derivation | Menu ⇄ toolbar agreement | Both read `view.definition.behaviours`; a change affects both identically |
| U4 | `sym:GraphContextMenuRoot.build` being called on right-click, not render | Why F2 closes over the hook result (R5) | If `build` moved into render, the closure becomes unnecessary but not wrong |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `story:canvas-ui/editors/CanvasSettingsEditorPanel`, `story:canvas-ui/view-panels/LayersViewPanel`, and `file:apps/storybook/stories/canvas-ui/editors/node-styles/_shared.tsx` | behavioural | All three render `<GraphContextMenu />`; each gains a background menu on empty-canvas right-click | Eyeball them (V6). `background={false}` opts out |
| D2 | `pkg:@invana/canvas-ui` public API | additive | `background` / `backgroundItems` props; `items` becomes optional on `sym:GraphBackgroundContextMenuProps` (a widening — no caller breaks) | None; canvas-ui is not covered by `pnpm check-api-surface` |
| D3 | `pkg:@invana/canvas-react` public API | additive | `sym:UseSelectModeOptions.enforceInitial` | None — optional, defaults to today's behaviour |
| D4 | `sym:GraphControlsToolbar` + `sym:GraphLayoutToolbar` | none | Keep `enforceInitial` defaulted `true` | Verify the toolbar still forces `click` on mount (V5, the control) |
| D5 | `sym:GraphCanvasApp` | none | The bundle is untouched (G6) | None unless D-4 reopens it |
| D6 | `sym:SelectionViewPanel` | complementary | Mode switched in the menu changes which gesture fills the panel | None — V7 is the end-to-end check |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | `check-types` + `lint` + `check-boundaries` across canvas-ui / canvas-react / storybook | repo | clean | F1–F7 |
| V2 | pending | Right-click empty canvas in `story:canvas-ui/apps/AppLayoutV2` | menu | A menu appears with one **Select** item | F1, F6 |
| V3 | pending | Hover **Select** | submenu | Click · Brush · Lasso, the active one marked | F2, F3 |
| V4 | pending | Choose **Brush**, then drag on empty canvas | canvas | A brush rectangle selects; the Selection tab fills | F2, D6 |
| V5 | pending | **Control:** the toolbar's select-mode picker | `sym:GraphControlsToolbar` | Still forces `click` on mount and still switches modes; the menu's label follows it | F4, D4 |
| V6 | pending | **Control:** right-click a **node** and an **edge** in `story:canvas-ui/view-panels/LayersViewPanel` | menus | Focus / Select / Hide unchanged; the new background menu appears only over empty canvas | F1, D1 |
| V7 | pending | Switch to Lasso in the menu, lasso some nodes, then ✕ a row in the Selection tab | panel + canvas | Row leaves the list and the highlight clears | D6, R2 |
| V8 | pending | Mount the menu on a canvas whose `config` enables `brush-select` | canvas | Brush stays enabled — the menu does **not** reset the mode on mount | F4, R6 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Does `background` default to `true`? | `true` (every `<GraphContextMenu/>` gains it) · `false` (opt-in) | **`true`** — "batteries-included" is the component's stated purpose, and no consumer has a background menu to conflict with (T3). The cost is D1's three stories gaining a right-click menu | open |
| D-2 | How is the active mode shown, given `MenuItem` has no `checked`? | `Check` icon on the active child + `Select: Brush` on the parent · only the parent label · a `className` highlight | **Icon + parent label** — legible closed *and* open, no design-kit change | open |
| D-3 | `enforceInitial` on the hook, or derive the mode locally in the menu? | Add the option (F4) · a private read-only derivation in canvas-ui | **Add the option** — the read-only shape is general, and duplicating the derivation puts a second reader of `view.definition.behaviours` in a different package | open |
| D-4 | Should `sym:GraphCanvasApp`'s bundle mount `<GraphContextMenu/>`? | No (F6 wires the story only) · yes | **No, for now** — it would change right-click in every `sym:GraphCanvasApp` story at once, and the bundle has never included a menu. Worth its own row once this one has been used | open |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened after "show bg context menu for select with click/brush/lasso as submenu items" | proposed | Four decisions open; F4 is the row that keeps the menu from silently resetting a configured mode |
