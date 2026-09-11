---
id: feat-2026-09-11-nav-items-cannot-be-a-responsive-strip
type: feat
title: NavItems grows overflow, variants, controlled selection and tab semantics, so one strip renderer serves the whole kit
status: proposed
opened: 2026-09-11
decided: null
landed: null
packages: [pkg:@invana/ui, pkg:@invana/canvas-ui]
design_of_record: null
external_repo: invana/design-kit   # `file:design-kit/…` paths below are relative to that repo's root
relations:
  - { predicate: blocks, object: "rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel" }
  - { predicate: relates-to, object: "doc:docs/ui-consolidation-plan.md" }
---

| | |
|---|---|
| **What this adds** | One strip renderer — `sym:NavItems` — that can fold what does not fit, wear any of the kit's three tab treatments, take controlled selection, and announce itself as a tab list |
| **Why here** | The kit draws three strips through three unrelated renderers; none of them can do any of the four |
| **Row status** | proposed 11 · accepted 0 · implemented 0 · landed 0 · deferred 0 · rejected 0 |
| **Open decisions** | D1 (keyboard ownership — recommended accepted in conversation 2026-09-11) |

## 1 · Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Three strips, three renderers, no shared code | `pkg:@invana/ui`, `pkg:@invana/canvas-ui` | `sym:TabbedPanel` uses Radix `TabsList`; `sym:CanvasPagesViewPanel` hand-rolls `role="tablist"`; `sym:NavItems` renders everything else |
| M2 | None can fold overflow | whole kit | no `offsetWidth` / `scrollWidth` / overflow logic anywhere in `file:design-kit/packages/ui/src` |
| M3 | The `…` menu already exists — only the measuring is missing | `sym:NavItemConfig.menuItems` | `file:design-kit/packages/ui/src/components/ui-extended/nav-base.tsx#L73`, rendered at `#L197-L238` |
| M4 | `sym:NavItems` cannot express "this one is selected" from outside | — | internal `useState` keyed by `name`, `nav-base.tsx#L107`; `sym:NavItemConfig` has `activeClass` but no `active` |
| M5 | A tab cannot host a caret menu | `sym:CanvasPagesViewPanel` | `menuItems` makes the whole item the trigger, so the tab would open a menu instead of selecting |
| M6 | Radix `TabsContent` unmounts inactive panels | `sym:TabbedPanel` | the stated reason `sym:CanvasPagesViewPanel` refused to use it — `file:packages/canvas-ui/src/view-panels/canvas-pages/CanvasPagesViewPanel.tsx#L198` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Overflow belongs on `sym:NavItems` alone and the tab strips get it for free | **No** | `sym:NavItems` renders only `headerActions` inside `sym:TabbedPanel` (`tabbed-panel.tsx#L102`), not the tabs (`#L88`) |
| R2 | A CSS-only fix (container queries collapsing labels) is enough | **No** | icon-only floor is ~44px × N; nine tabs ≈ 430px against a 340px `minSize` |
| R3 | Make the strip scroll instead | **Partial** | fixes the container overflow but hides tabs with no affordance; kept as the rejected alternative in D2 of `rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel` |

## 2 · Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| S1 | The measuring is not a tabs concern — it is arithmetic over a container and its children | three renderers share no markup (M1) | it lives in a hook, `sym:useOverflowItems`, exported publicly |
| S2 | A folded item has no box to measure | `offsetWidth` is 0 for an unrendered node | the hook caches each item's natural width while laid out and plans from the cache |
| S3 | Folding changes the DOM, which re-fires the observers | ResizeObserver on container + items | results reach React only when the index list differs; widths are cached only from laid-out items |
| S4 | The reserve for the `…` trigger is only owed once one is drawn | — | fit against full width first; charge the reserve only on the second pass |
| S5 | The active item must never fold | a strip with no lit tab reads as having no selection | `pinnedIndex` is excluded from the fold, and arrowing onto a folded item pins it, which un-folds it |
| S6 | The three looks are data, not components | see the three active treatments in §4 F3 | one `VARIANT` table in `sym:NavItems` |
| S7 | Dropping Radix triggers means `sym:TabbedPanel` switches content itself | M6 | `keepMounted` becomes possible — the constraint that forced a second tab strip disappears |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `story:UI/UI Extended/TabbedPanel/With overflow` — drag width 240→720 with 9–11 tabs | strip folds and unfolds; panel never scrolls sideways | S1–S4 hold |
| T2 | Select a folded tab from the `…` menu | it moves onto the strip | S5 holds |
| T3 | Focus a tab, press → repeatedly past the fold | selection follows focus, folded tab returns and receives focus | S5 + the deferred-focus pass hold |

## 3 · Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/ui-consolidation-plan.md` | relates-to | in progress | headless/pixels split; unaffected — this is upstream of both |
| design-kit `CLAUDE.md` | depends-on | current | "a component without a story is not done" → F8 |

## 4 · The fix

Rows F1–F8 land in `invana/design-kit`; `file:design-kit/…` is relative to that repo.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:design-kit/packages/ui/src/hooks/use-overflow-items.ts` | New `sym:useOverflowItems` — container + item refs → `hiddenIndices` | The measuring exists, once, for any renderer | low — new file, no consumer yet | — |
| F2 | defect | proposed | `file:design-kit/packages/ui/src/index.ts` | Export the hook from the package root | `pkg:@invana/canvas-ui` can use it from npm | low | F1 |
| F3 | defect | proposed | `sym:NavItems` | `variant: 'nav' \| 'underline' \| 'folder'` | The kit's three treatments become one table | **medium** — touches how every nav item is classed; `nav` must be byte-identical to today | — |
| F4 | defect | proposed | `sym:NavItems` | `activeKey` + `onActiveChange` — controlled selection, uncontrolled unchanged when absent | A strip can be driven from outside (M4) | low — additive | — |
| F5 | defect | proposed | `sym:NavItems` | `selectionMode="tabs"` — `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, roving tabindex, ← → ↑ ↓ Home End | Tab semantics without Radix (D1) | **medium** — hand-written a11y the kit now owns | F4 |
| F6 | defect | proposed | `sym:NavItemConfig` | `disabled`, `style`, `labelClassName`, `menuTrigger: 'item' \| 'caret'` | A tab can host a caret menu and still select (M5) | low — all optional | — |
| F7 | defect | proposed | `sym:NavItems` | `overflow` + `overflowLabel`; returns a container only when `overflow` or `selectionMode` is set | Opt-in folding; bare fragment otherwise, so no existing consumer moves | **medium** — changes the returned DOM when opted in | F1, F3 |
| F8 | defect | proposed | `story:UI/UI Extended/NavBase/With overflow`, `story:UI/UI Extended/TabbedPanel/With overflow` | Two stories: three variants on one draggable width; a nine-panel inspector | The kit's rule that a component ships with a story | low | F1–F7, F9 |
| F9 | defect | proposed | `sym:TabbedPanel` | Strip → `sym:NavItems variant="underline"`; body → plain `active === value`; add `overflow`, `keepMounted`; `h-[calc(100%-30px)]` → `flex-1 min-h-0` | The panel narrows cleanly and stops tearing its tabs down (M6, S7) | **high** — every `sym:TabbedPanel` consumer in three repos re-renders through new markup | F3–F7 |
| F10 | dressing | proposed | `sym:TabbedPanel` | Keep `Card`/`CardFooter`, drop `CardHeader`/`CardContent` wrappers | Header/body geometry is the flex column, not padding overrides | low | F9 |
| F15 | defect | proposed | `sym:NavItems` | Render its own `sym:TooltipProvider` on both return paths | A strip works outside an app shell — a page tab bar, a story — without the caller owing it a provider. Matches `sym:PanelContent`, `sym:PanelStack`, `sym:TabbedPanel`, `sym:RichSelect` | low — a context provider emits no DOM, so the bare-fragment promise in F7 still holds | F7 |

## 5 · Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `@radix-ui/react-tabs` | `sym:TabbedPanel` stops using it; `sym:Tabs` primitive stays for direct consumers | none — the primitive is untouched |
| U2 | `@radix-ui/react-dropdown-menu` | Carries both the item menu and the new `…` | none — same component, more callers |
| U3 | Tailwind v4 important syntax | `!hidden` is v3 and silently generates nothing in v4 | hit during implementation; avoided by not setting `display` on the panel |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | 9 existing `story:UI/UI Extended/TabbedPanel/*` | story | Re-render through `sym:NavItems`; must look unchanged | visual check, V4 |
| D-2 | `sym:PanelContent`, `sym:PanelStack` header actions | component | Use `sym:NavHorizontalItems`; unchanged while `overflow` is unset | none |
| D-3 | `sym:NavHorizontal`, `sym:NavVertical` | component | Props widened to forward the new surface | none — additive |
| D-4 | `pkg:@invana/canvas-ui` · `sym:AppLayoutV2` right inspector | app | The reason this exists | `rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel` |
| D-5 | Invana Studio | app | Consumes `sym:TabbedPanel` from npm | version bump only; behaviour unchanged unless it opts in |
| D-6 | Published API surface of `pkg:@invana/ui` | api | `sym:useOverflowItems`, `sym:NavItemsVariant` are new exports | none — additions only |

## 6 · Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm --filter @invana/ui exec tsc --noEmit` | design-kit | clean | F1–F7, F9, F10 |
| V2 | pass | Storybook index resolves both new stories | `localhost:6009/index.json` | both ids present | F8 |
| V3 | pending | Drag `story:UI/UI Extended/TabbedPanel/With overflow` 240→720 px | design-kit SB | folds/unfolds; no horizontal scrollbar | F1, F7, F9 |
| V4 | pending | **Control** — the 9 pre-existing `TabbedPanel` stories | design-kit SB | pixel-unchanged from `0.0.23` | F3, F9, F10 |
| V5 | pending | Keyboard: focus a tab, ← → Home End past the fold | design-kit SB | selection follows focus; folded tab returns and takes focus | F5 |
| V6 | pending | Screen reader announces "tab N of M, selected" | VoiceOver | announced | F5 |
| V7 | pending | **Control** — `story:UI/UI Extended/NavBase/Default` and the nav rails | design-kit SB | unchanged; still a bare fragment in the DOM | F3, F7 |
| V8 | pending | `keepMounted`: type in Find, switch tab, return | design-kit SB | text still there | F9 |
| V16 | pass | `story:UI/UI Extended/NavBase/With overflow` renders with no ambient provider | design-kit SB | no `Tooltip must be used within TooltipProvider` | F15 |

## 7 · Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Own tab keyboard/ARIA in `sym:NavItems`, or keep borrowing Radix's? | own it / keep Radix and fix only `sym:NavItems` | **Own it** — one implementation for three strips; ~40 lines | accepted 2026-09-11 |
| D2 | Where does the `…` sit? | end of strip / merged into `headerActions` | **End of strip** — overflow belongs to the tabs, actions to the panel | accepted 2026-09-11 (implemented as recommended) |
| D3 | Does a folded item keep its `menuItems` submenu in the `…`? | nested submenu / flat row that selects | **Flat row** — a submenu inside an overflow menu is two levels of hiding | accepted 2026-09-11 |
| D6 | Does `sym:NavItems` require an ambient `sym:TooltipProvider`, or supply its own? | story wraps it / component supplies it | **Component supplies it** — four kit components already settle it this way, and `sym:NavItems` is now the entry point for strips rendered outside an app shell | accepted 2026-09-11 |

## 8 · History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened after seven layouts were prototyped and option B chosen | proposed | prototype: artifact `Inspector Tab Strip Bench` |
| 2026-09-11 | D1–D3 settled in conversation | proposed | maintainer accepted owning keyboard/ARIA |
| 2026-09-11 | F1–F10 implemented in `invana/design-kit` ahead of approval, at maintainer's explicit request | proposed | V1, V2 pass; V3–V8 pending a look in Storybook |
| 2026-09-11 | `story:UI/UI Extended/NavBase/With overflow` threw `Tooltip must be used within TooltipProvider` — a pre-existing requirement of `sym:NavItems`, not a regression; D6 settled, F15 added and implemented | proposed | V16 pass |
| 2026-09-11 | Published as `pkg:@invana/ui` `0.0.24` — the built `.d.ts` carries F1–F7, F9, F10, F15; `pkg:@invana/canvas-ui` bumped to it and consumed it (D-4) | proposed | V3–V8 still owed a look in design-kit's Storybook |
