---
id: fix-2026-09-11-folded-tabs-have-no-label-in-the-overflow-menu
type: fix
title: A folded tab's row in the `…` menu renders its strip label, so a tab whose label is a node shows an icon and no text
status: accepted
opened: 2026-09-11
decided: 2026-09-12
landed: null
packages: [pkg:@invana/ui, pkg:@canvas/storybook]
design_of_record: null
external_repo: invana/design-kit   # `file:design-kit/…` paths below are relative to that repo's root
relations:
  - { predicate: caused-by, object: "rfc:feat-2026-09-11-nav-items-cannot-be-a-responsive-strip" }
  - { predicate: manifests-in, object: "story:canvas-ui/apps/AppLayoutV2" }
  - { predicate: relates-to, object: "rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel" }
---

| | |
|---|---|
| **What breaks** | Every row of the right inspector's `…` overflow menu shows an icon and blank text |
| **Root cause** | C3 — the overflow row renders `item.label`, the node built for the *strip*, and only falls back to the plain-text `name` when `label` is absent |
| **Defect rows** | F1 · F4 |
| **Dressing rows** | F2 (scope the sr-only to the strip; hides the symptom, cause stays) — **rejected**, F4 removes the node instead |
| **Row status** | proposed 1 · accepted 0 · implemented 1 · landed 0 · deferred 1 · rejected 1 |
| **Open decisions** | D1 (F1, upstream) |

## 1 · Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | The `…` menu at the end of the inspector's tab strip lists one row per folded tab, each with its icon and **no visible text** | `story:canvas-ui/apps/AppLayoutV2` right section | reported 2026-09-11 after `rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel` F11 landed |
| S2 | The rows are not empty elements — the text is present and readable to assistive tech, just visually hidden | same | the label node carries `sr-only`, which clips rather than removes |
| S3 | `sym:CanvasPagesViewPanel`'s own overflow menu is unaffected | `story:canvas-ui/view-panels/CanvasPagesViewPanel/*` | it passes `label: page.title`, a plain string |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The overflow menu doesn't render a label at all | **No** | `file:design-kit/packages/ui/src/components/ui-extended/nav-base.tsx` renders `<span class="truncate">{item.label ?? item.name}</span>` per row — S3 shows it working |
| R2 | `sym:TabConfig.name` already covers this and the story just doesn't set it | **No** | `name` is only consulted when `label` is nullish; `sym:TabbedPanel` always sets `label: tab.label`, so `name` can never win |
| R3 | The active tab is folding and taking its label with it | **No** | `pinnedIndex` is the active index, so the active tab never folds — every folded row is by definition an inactive one |
| R4 | Stale Vite dep cache again (the 0.0.23 `sym:NavItems`) | **No** | 0.0.23 has no overflow menu to be blank; the rows exist, so the running bundle is 0.0.24 |

## 2 · Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| C1 | The story gives each tab a **node** label that is `sr-only` unless that tab is the active one — nine panels share one 30px header, so only the active tab spells its name | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L468-L470` | on the strip: icon-only tabs, names kept for assistive tech |
| C2 | `sym:TabbedPanel` maps a tab to a nav item as `{ name: tab.name ?? (typeof tab.label === 'string' ? tab.label : tab.value), label: tab.label }` | `pkg:@invana/ui` `0.0.24` built output, `TabbedPanel` | `label` is **always** set — the node travels on untouched, and `name` is only a fallback for the tooltip |
| C3 | The overflow row renders `item.label ?? item.name` | `sym:NavItems` overflow `sym:DropdownMenuItem` | the sr-only node wins over the plain-text `name`, and renders clipped |
| C4 | A folded tab is never the active tab (C3 of the sibling RFC pins it), so *every* row in the menu carries the inactive — i.e. `sr-only` — branch of C1 | `pinnedIndex: activeIndex` in `sym:useOverflowItems` | **exactly S1**: not one blank row, all of them |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Read the built `0.0.24` overflow row and `sym:TabbedPanel`'s item mapping | `label` set unconditionally; row prefers `label` | C2, C3 confirmed without running anything |
| T2 | **Control** — `sym:CanvasPagesViewPanel`, same `sym:NavItems`, string label | rows show their page titles | isolates the defect to the *node* label, not the menu |

## 3 · Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-nav-items-cannot-be-a-responsive-strip` | caused-by | proposed | F7 introduced the `…` menu; `sym:TabConfig.name` was added in the same release *for this class of problem* and stops one step short |
| `rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel` | relates-to | accepted | F14 rejected dropping the sr-only trick — that decision stands and is why this is not fixed story-side |

## 4 · The fix

F1 lands in `invana/design-kit`; `file:design-kit/…` is relative to that repo.

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `sym:NavItems` overflow row | Render the plain-text name when the label is not a string: `typeof item.label === 'string' ? item.label : item.name ?? item.label` | Every folded row reads its name. Honours what `name` is documented to be — "plain-text name for when `label` is a node" — in the one place a strip-tuned node is wrong | low — a string label is unaffected, which is every existing consumer bar this one | — |
| F2 | dressing | rejected | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L468` | Scope the hiding to the strip: `<span className="[[role=tablist]_&]:sr-only">` so the node is only clipped inside the tab list, not in the menu | Rows read correctly **without** the kit release. **Does not remove the cause** — the next node label hits it again | low, but it is a CSS trick in a story that exists to demonstrate the component | — |
| F4 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L465-L475` | Replace `tabLabel()` with `tab(value, text)` → `{ value, name: text, label: activeTab === value ? text : undefined }`. The inactive tab carries **no label node at all**, so the strip stays icon-only and `sym:NavItems` falls through to `name` in both the strip tooltip and the `…` menu | Every folded row reads its name **without** the kit release and **without** F2's CSS trick — it feeds `name` the flat form the prop was documented for, which is C3's own remedy applied caller-side | low — story-local, 9 tabs, no kit change. **Trade-off:** the inactive tab's text leaves the DOM, so the strip's accessible name now rests on the tooltip `name` rather than an `sr-only` span (V4) | — |
| F3 | defect | proposed | `sym:TabbedPanel` docs, `sym:TabConfig.name` | State that `name` is what the overflow menu shows for a node label | The prop's contract matches F1 | low | F1 |

## 5 · Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pkg:@invana/ui` `0.0.24` | F1 and F3 live there; canvas consumes from npm, so landing them needs a `0.0.25` | **blocked** on a design-kit release — F2 is what unblocks the story in the meantime |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `story:canvas-ui/apps/AppLayoutV2` | story | The reported case | V1 |
| D-2 | `sym:CanvasPagesViewPanel` | component | None — string labels take the unchanged branch | V2 (control) |
| D-3 | Every other `sym:TabbedPanel` / `sym:NavItems` consumer with a string label | component | None — same branch | none |
| D-4 | Published API of `pkg:@invana/ui` | api | No signature change; `sym:TabConfig.name` gains a documented second duty | none |
| D-5 | Serialised state | — | none | none |

## 6 · Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Narrow the right inspector until tabs fold, open `…` | `story:canvas-ui/apps/AppLayoutV2` | every row reads its panel name | F1, F4 |
| V2 | pending | **Control** — fold the page tabs | `story:canvas-ui/view-panels/CanvasPagesViewPanel/ScrollableWithPager` | rows read their page titles, unchanged | F1 |
| V3 | pending | **Control** — the active tab still spells its name on the strip while the others stay icon-only | `story:canvas-ui/apps/AppLayoutV2` | unchanged density; nine tabs still fit at 400px | F4 |
| V4 | pending | Screen reader over a folded row **and over an inactive strip tab** | VoiceOver | the folded row announces its name once; the icon-only strip tab still announces one, via the tooltip `name` rather than the removed `sr-only` span | F1 · F4 |
| V5 | **pass** | `pnpm check-types` | canvas | clean — 19/19 turbo tasks | F4 |

## 7 · Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Does the row prefer `name` over a node label, or does the kit stop rendering nodes in the menu entirely? | prefer `name` / strings only | **Prefer `name`** — a node label is legitimate on a strip (a badge, a count); the menu is simply a different context, and `name` already exists to be the flat form | **open** — F4 sidesteps it caller-side, but the kit still misrenders a node label in the menu for the next consumer |
| D2 | Do we take F2 now, or wait for the `0.0.25` release? | F2 now / wait / **F4** | **F4** — neither. Dropping the label beats hiding it: it needs no kit release (unlike F1) and no CSS trick in the story that demonstrates the component (unlike F2), and it is what `sym:TabConfig.name` was added for | **accepted** — F4 implemented, F2 rejected and kept as the record |

## 8 · History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-12 | F4 implemented, F2 rejected, D2 answered | accepted | The story drops the inactive tab's label node instead of hiding it, so `name` carries both the tooltip and the `…` row. F1/F3 stay `proposed` against the design kit — D1 is still open and the kit still misrenders a node label in the menu. V5 pass; V1–V4 need a browser |
| 2026-09-11 | Reported: the inspector's `…` menu shows icons with no text | proposed | immediately after F11 of `rfc:fix-2026-09-11-inspector-tab-strip-overflows-panel` landed |
| 2026-09-11 | Diagnosed C1–C4 from the built `0.0.24` output; `sym:CanvasPagesViewPanel` isolated as the control | proposed | no repro run needed — T1 is a read |
