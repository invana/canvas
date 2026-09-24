---
id: feat-2026-09-25-collapsed-count-is-a-centred-label-not-a-badge
type: feat
title: A collapsed group's hidden-member count is a label in its centre, not a badge
status: accepted
opened: 2026-09-25
decided: 2026-09-25
landed: null
packages: [pkg:@invana/graph, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: "rfc:feat-2026-09-25-group-frame-toggle-cannot-be-hidden" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
---

## Summary

| | |
|---|---|
| **What's wrong** | `GroupOptions.showCollapsedCount` draws the number as a white text **label** at `inside-center` — on a `tabbed-rect` folder that routes into the tab, on top of the folder's own title (its TSDoc already warns about this, which is why it's off by default). |
| **Proposal** (revised) | Keep `showCollapsedCount` as the on/off switch and its centred label as the default. Add **`collapsedCountDisplay?: 'center' \| 'badge'`** (default `'center'`). `'badge'` draws the count as a small pill on the collapsed frame's top-right corner, half-overhanging it (`origin: 'center'`), coloured from the theme (`accent` fill, `surface` text, `cardBg` ring). GlobalModel switches to `'badge'`. |
| **Row status** | proposed 0 · accepted 0 · implemented 5 · landed 0 · deferred 0 · rejected 0 · superseded 0 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The count is a `label` decoration placed `inside-center`, white 14 px bold text | `file:packages/graph/src/layer/GraphLayer.ts#L3047-L3068` | read |
| M2 | Its TSDoc already concedes it lands on a `tabbed-rect`'s title | `file:packages/graph/src/layer/types.ts#L963-L971` | read |
| M3 | The engine has badges with corner placements and text (`NodeBadge.labelText`) — e.g. the red count chip in `story:graph/Nodes/Badges/Multiple` | `file:apps/storybook/stories/graph/Nodes/Badges/Multiple.stories.ts#L60-L72` | read |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | implemented | `file:packages/graph/src/layer/types.ts` (`GroupOptions`) | New `readonly collapsedCountDisplay?: 'center' \| 'badge'` next to `showCollapsedCount`; default `'center'` (today) | Chooses how the count is drawn; `showCollapsedCount` still turns it on/off | Low: additive, optional; existing configs unchanged | — |
| F1b | feature | implemented | `file:packages/graph/src/layer/GraphLayer.ts` (`syncGroupSyntheticDecorations`) | `'center'` → today's `group-count` label decoration. `'badge'` → `renderer.setBadge(id, 'group-count', nodeBadgeToCanvasOptions({ placement: 'top-right', origin: 'center', shape: pill sized to the digits, fill: accent, stroke: cardBg, labelText: count, labelColor: surface }))`. Whichever form isn't in use (or both, when expanded / off) is cleared, so switching at runtime leaves nothing stale | Count reads as a notification badge on the corner, never over the title | Medium: synthetic badge slot must not collide with `NodeStyle.badges` diffing — `syncNodeBadges` only touches slots it mounted (`nodeBadgeSlots`), and `group-count` isn't one of its generated ids | F1 |
| F2 | docs | implemented | `file:packages/graph/src/layer/types.ts#L963-L971` (`showCollapsedCount` TSDoc) | Point to `collapsedCountDisplay: 'badge'` as the way to keep the count off a `tabbed-rect`'s title | Doc matches behaviour | Low | F1 |
| F3 | feature | implemented | `file:apps/storybook/stories/usecases/by-casestudies/global-model/settings.json` (group style) | `"collapsedCountDisplay": "badge"` — in `settings.json` **and** each of the three levels in `detail-templates.json` (each level carries its own copy of the folder's group style; `"showToggle": false` from `rfc:feat-2026-09-25-group-frame-toggle-cannot-be-hidden` was missing from them too and is added alongside) | GlobalModel shows the badge at every Detail level | Low — requested | F1b |
| F4 | defect | implemented | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts` (`groupUnder`) | If the double-click's hit is not a store node (a badge — its own small shape), hit-test again excluding it (the `exclude` set `IElementRenderer.hitTest` already takes), until a node or nothing is hit. As built, when nothing is left under the point (a corner badge half-overhangs its frame), fall back to the smallest group whose box grown by `BADGE_REACH` (16 world units) contains it | Double-clicking the count badge opens / closes its frame, like the tab around it. Member cards are nodes, so a double-click on one still belongs to the card | Low: behaviour-local; no renderer-id format assumed | F1b |


## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:usecases/by-casestudies/global-model/GlobalModel` (only `showCollapsedCount` user in the repo; `settings.json` + `detail-templates.json`) | story | Count moves from the tab centre to a corner badge | visual check |
| C2 | Any consumer with `showCollapsedCount: true` | published API | None — the default stays the centred label | none |
| C3 | Hover / hit-testing | interaction | A badge is its own small shape; double-clicking it should still reach the frame | check (V3) |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Collapse a folder | GlobalModel | Pill badge with the member count at the tab's top-right corner; title unobstructed | F1 |
| V2 | pass | Expand it again | GlobalModel | Badge gone | F1 |
| V3 | pass | Double-click the collapsed tab (incl. on the badge) | GlobalModel | Still expands | F1, F4 |
| V4 | pass | Dark theme | GlobalModel | Badge colours follow the theme | F1 |
| V5 | pass | types · lint · build · graph tests | repo | green | F1–F3 |
| V6 | pass (by code) | **Control**: `collapsedCountDisplay` unset | any `showCollapsedCount` frame | Centred label exactly as today — the `'center'` branch is the previous code unchanged | F1b |
| V7 | pass | Detail switch Medium → High with a folder collapsed | GlobalModel | Badge still on the collapsed tab; no `+` / `−` on any folder | F3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Placement of the badge | `top-right` (notification style) · `top-left` · configurable | **`top-right`**, not configurable for now | accepted |
| D2 | Shape of the new option | `collapsedCountDisplay: 'center' \| 'badge'` · a second boolean `showCollapsedCountBadge` | **The enum** — one switch (`showCollapsedCount`) plus one choice; two booleans would allow "both" and "neither" states that mean nothing | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Opened | proposed | Maintainer: "the count that we are showing in the center of the collapsed group, can you show that number as badge instead" |
| 2026-09-25 | Revised | proposed | Maintainer: "along with showCollapsedCount, can we add another flag/option which shows the count as badge" — the centred label stays the default; the badge becomes an opt-in `collapsedCountDisplay: 'badge'` |
| 2026-09-25 | Approved; F1–F3 implemented | implemented | Maintainer: "approve". Collapsed AirRoutes shows a pill badge on the tab's top-right; expand removes it; dark theme follows; Detail → High keeps it and keeps the toggle hidden. Types, graph tests (193) green. **V3 fails for the badge itself**: a double-click on it hits the badge shape (`AirRoutes:group-count`), not the group, so nothing toggles — `F4` proposed. At 36 % zoom the pill is small (world-sized, like every badge) |
| 2026-09-25 | F4 approved and implemented | implemented | Maintainer: "yes". First version (exclude-and-retry only) still failed: at the badge's centre half of it hangs outside the tab, so nothing is underneath — added the `BADGE_REACH` fallback. Double-clicking the badge now expands the folder. Found while verifying (not this RFC's defect): after collapse → Detail switch → expand, the frame re-opens around its members' stale pre-switch positions and the anchored re-flow drags the graph there — recorded on `rfc:feat-2026-09-24-toggling-a-group-leaves-the-layout-stale` |
