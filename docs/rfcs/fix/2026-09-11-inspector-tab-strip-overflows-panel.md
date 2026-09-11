---
id: fix-2026-09-11-inspector-tab-strip-overflows-panel
type: fix
title: The right inspector's tab strip sets the panel's minimum width, so narrowing it scrolls the whole section sideways
status: accepted
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@invana/ui, pkg:@invana/themes]
design_of_record: null
relations:
  - { predicate: depends-on, object: "rfc:feat-2026-09-11-nav-items-cannot-be-a-responsive-strip" }
  - { predicate: manifests-in, object: "story:canvas-ui/apps/AppLayoutV2" }
---

| | |
|---|---|
| **What breaks** | Narrowing `sym:AppLayoutV2`'s right inspector puts a horizontal scrollbar across the whole section; adding a tenth panel makes it permanent |
| **Root cause** | S3 — the tab strip is a flex item at its default `min-width:auto`, so it cannot compress below the sum of its triggers |
| **Defect rows** | F11, F12 |
| **Dressing rows** | F13 (upstream `overflow-auto`, hides the symptom for any over-wide child) |
| **Row status** | proposed 1 · accepted 0 · implemented 0 · landed 2 · deferred 0 · rejected 1 |
| **Open decisions** | D4 (F13 still unshipped upstream) |

## 1 · Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Dragging the right inspector narrower produces a horizontal scrollbar across the entire section, body included | `story:canvas-ui/apps/AppLayoutV2` | reported 2026-09-11 with the resize |
| S2 | Adding an eleventh panel makes it permanent — the strip exceeds even `maxSize` | same | 9 icon-only tabs ≈ 430 px; `maxSize` is 560 px |
| S3 | The panel's own `minSize` is already below the strip's width | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L897` | `minSize: '340px'`, `defaultSize: '400px'` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R4 | The panels' own content is too wide | **No** | the body is `sym:ScrollArea`-wrapped and reflows; removing the strip removes the scrollbar |
| R5 | `sym:ResizablePanel` mis-computes its size | **No** | it honours `minSize`; the child simply refuses to shrink |
| R6 | The story's `tabLabel` sr-only trick is insufficient and should be dropped | **No** — keep it | it removes the labels already; the icon-only floor is what overflows. Dropping it makes things worse (9 labelled tabs ≈ 810 px) |

## 2 · Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| C1 | `sym:AppLayoutV2` wraps the right section in `overflow-auto` — **both** axes | `file:design-kit/packages/themes/src/app-v2/…` (`rightPanel`, built output line 593) | anything wider than the panel yields a horizontal scrollbar rather than being clipped |
| C2 | `sym:TabbedPanel`'s header is `flex flex-row`; the strip inside it is `sym:TabsList`, `inline-flex gap-1`, with no `min-w-0`, no `overflow`, no `flex-wrap` | `file:design-kit/packages/ui/src/components/ui-extended/tabbed-panel.tsx#L88-L100` | a flex item's default `min-width:auto` pins the strip to its content width |
| C3 | Each trigger is `px-3` + a 14 px icon + `mr-1.5` ≈ 44 px icon-only; nine of them with `gap-1` ≈ 430 px, plus the active tab's label | `tabs.tsx` `TabsTrigger`, and the story's `tabLabel` | the strip's floor exceeds `minSize` (S3) at every width the user can drag to |
| C4 | C2 makes the strip the panel's minimum width; C1 turns that excess into a scrollbar on the *section*, not the strip | — | **exactly S1**: the body scrolls sideways too, because the scroll container is the section wrapper, not the header |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T4 | Prototype all seven candidate layouts at one driven width, measuring `scrollWidth` vs panel width | baseline reports `needs 487 px · has 340 px`; the folding layout reports `fits` at every width | C2–C4 confirmed; folding is sufficient |
| T5 | Reduce the tab count below 8 in the prototype | scrollbar disappears | C3 confirmed — it is tab *count* × trigger width, not content |

## 3 · Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-nav-items-cannot-be-a-responsive-strip` | depends-on | proposed | supplies `overflow`; this RFC only turns it on and migrates the second strip |
| `doc:docs/ui-consolidation-plan.md` | relates-to | in progress | unaffected |

## 4 · The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F11 | defect | **landed** | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L900` | Pass `overflow` (and `keepMounted`) to the inspector's `sym:TabbedPanel` | The strip folds instead of setting the panel's minimum width — S1 and S2 gone | low, once the feat RFC lands | `rfc:feat-…` F7, F9 |
| F12 | defect | **landed** | `sym:CanvasPagesViewPanel` | Replace the hand-rolled `Tab` + `PageMenu` with `sym:NavItems variant="folder" menuTrigger="caret"`; keep `sym:PagerControls` | One strip renderer in the repo; the page tabs gain overflow for free | **medium** — `sym:CanvasPage.tabStyle`/`tabClassName`/`activeTabClassName` are public and must keep working | `rfc:feat-…` F3–F7 |
| F13 | dressing | proposed | `sym:AppLayoutV2` (design-kit) | `overflow-auto` → `overflow-y-auto` on the section wrapper | Belt and braces: no future over-wide child scrolls the section sideways. **Does not remove the cause** — F11 does | low | — |
| F14 | defect | **rejected** | `file:…/AppLayoutV2.stories.tsx#L469` | Drop the `tabLabel` sr-only trick now that overflow exists | Rejected: keeping it means nine tabs fit at 400 px with nothing folded; dropping it folds six. The trick is a density choice, not a workaround (R6) | — | — |

## 5 · Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U4 | `pkg:@invana/ui` at `0.0.24` | F11 and F12 need the new surface | **resolved** 2026-09-11 — 0.0.24 ships F1–F10 + F15 of the feat RFC; bumped in `chore(deps): design kit 0.0.23 → 0.0.24` |
| U5 | `pkg:@invana/themes` `sym:AppLayoutV2` | F13 lives there, same release train | **missed the train** — themes `0.0.24` still carries 4× `overflow-auto`, no `overflow-y-auto`. F13 stays open |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-7 | `story:canvas-ui/apps/AppLayoutV2` | story | The reported case; visibly fixed | visual check, V9 |
| D-8 | Every consumer of `sym:CanvasPagesViewPanel` | component | Page tabs re-render through `sym:NavItems` | V10 — the folder look must be unchanged |
| D-9 | `sym:CanvasPage` public type (`tabStyle`, `tabClassName`, `activeTabClassName`, `disabled`, `icon`) | api | Must map onto `sym:NavItemConfig` without loss | F12 maps each one explicitly; V11 |
| D-10 | Serialised state | — | none — no persisted shape changes | none |
| D-11 | `pkg:@invana/canvas-ui` published API | api | `sym:CanvasPagesViewPanelProps` unchanged | none |

## 6 · Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V9 | pending | Drag the right inspector 340→560 px with 9, then 11 panels | `story:canvas-ui/apps/AppLayoutV2` | no horizontal scrollbar at any width; `…` appears only when needed | F11 |
| V10 | pending | **Control** — the main-area page tabs | same story | folder tabs, caret menu and pager look and behave as before | F12 |
| V11 | pending | A page with `tabStyle` + `tabClassName` + `disabled` | same story | all three still applied | F12 |
| V12 | pending | `keepMounted` on the inspector: scroll a panel, switch tab, return | same story | scroll position kept | F11 |
| V13 | pending | **Control** — the left section's `sym:TabbedPanel` (no `overflow` passed) | same story | unchanged | F11 |
| V14 | **pass** | `pnpm check-types` | canvas | clean | F11, F12 |
| V15 | **pass** | `pnpm check-api-surface` | canvas | unchanged, or regenerated in the same change | F12 |

## 7 · Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D4 | Does F13 land in design-kit's release, or is F11 enough? | both / F11 only | **Both** — F11 removes the cause, F13 stops the next over-wide child doing it again. They are separate rows precisely because F13 alone would hide the symptom | open |
| D5 | Does the left section's `sym:TabbedPanel` get `overflow` too? | yes / leave it | **Leave it** — it carries three tabs and is not user-resizable. Revisit when either changes | open |

## 8 · History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Reported: resizing the right section with more menu items creates a horizontal scrollbar | proposed | |
| 2026-09-11 | Diagnosed C1–C4; seven layouts prototyped and measured; option B (fold into a `…` menu) chosen | proposed | artifact `Inspector Tab Strip Bench` |
| 2026-09-11 | Split: the capability moved to `rfc:feat-2026-09-11-nav-items-cannot-be-a-responsive-strip` | proposed | per `doc:docs/rfcs/README.md` — a fix links to the feature it needs |
| 2026-09-11 | F14 rejected — keeping the sr-only label trick folds fewer tabs, not more | proposed | rejection kept as the record |
| 2026-09-11 | `pkg:@invana/ui` `0.0.24` published with F1–F10 + F15; U4 resolved, rows accepted | accepted | `forms`/`styling` version-only; `themes` changed persistence internals only |
| 2026-09-11 | F11 landed — `overflow` + `keepMounted` on the inspector's `sym:TabbedPanel` | accepted | one prop pair, no other story change |
| 2026-09-11 | F12 landed — `sym:CanvasPagesViewPanel` rebuilt on `sym:NavItems variant="folder"`; 457 → 388 lines, `Tab` + `PageMenu` + the scroll-into-view effect deleted | accepted | `menuLabel` deprecated (the kit labels the caret `"<title> menu"`); new `overflow`/`overflowLabel` props, default on |
| 2026-09-11 | V14, V15 pass; V9–V13 pending a visual pass in `story:canvas-ui/apps/AppLayoutV2` | accepted | RFC stays `accepted` until V9–V13 and F13 close |
