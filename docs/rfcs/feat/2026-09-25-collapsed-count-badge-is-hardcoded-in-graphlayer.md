---
id: feat-2026-09-25-collapsed-count-badge-is-hardcoded-in-graphlayer
type: feat
title: The collapsed-count badge is written by CollapseExpandBehaviour into node style, not hard-coded in GraphLayer
status: accepted
opened: 2026-09-25
decided: 2026-09-25
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: supersedes, object: "rfc:feat-2026-09-25-collapsed-count-is-a-centred-label-not-a-badge" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-24-toggling-a-group-leaves-the-layout-stale" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
---

## Summary

| | |
|---|---|
| **What's wrong** | The collapsed-count badge (`GroupOptions.collapsedCountDisplay: 'badge'`) is a synthetic badge slot hard-coded in `sym:GraphLayer.syncGroupSyntheticDecorations`, outside the normal `NodeStyle.badges` path, with its own visibility patch and its own theme read. |
| **Principle** (D1) | A node's **`.data` is the only field persisted to the graph backend.** `style`, `states` and badges are presentation, so a behaviour may write **derived presentation** into a node's `style`, as long as it owns a named slot, keeps it in step with the state it derives from, and removes it when switched off. |
| **Proposal** | `sym:CollapseExpandBehaviour` gains `countBadge` / `countBadgePlacement`. While on, it reconciles a `'collapsed-count'` entry in each collapsed frame's `style.badges` on every flush and theme change. GraphLayer loses the badge form entirely. `syncNodeBadges` stops drawing badges for hidden nodes, fixing the leak for every badge. |
| **Row status** | proposed 0 · accepted 0 · implemented 8 · landed 0 · deferred 1 · rejected 0 · superseded 0 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The badge form is a separate code path: `setBadge(id, 'group-count', …)` beside the `NodeStyle.badges` diff | `file:packages/graph/src/layer/GraphLayer.ts#L3099-L3128` | read |
| M2 | It needed its own `isNodeVisible` check because badges do not hide with their host, a gap that `NodeStyle.badges` still has | `file:packages/graph/src/layer/GraphLayer.ts#L3100-L3105`, `rfc:feat-2026-09-25-collapsed-count-is-a-centred-label-not-a-badge` §8 | read |
| M3 | The badge path already takes badges from per-node `style` **and** state overlays; nothing count-specific is needed there | `file:packages/graph/src/layer/GraphLayer.ts#L2334-L2352` (`sym:GraphLayer.syncNodeBadges`) | read |
| M4 | GraphLayer already writes derived presentation into node records: `applyTheme` writes palette colours into each group node's own `style` | `file:packages/graph/src/layer/GraphLayer.ts#L635-L660` | read |
| M5 | Only `.data` reaches the graph backend; `style` does not (maintainer) | maintainer, 2026-09-25 | stated |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A behaviour's `style` write lands in undo history | No: only writes through the history wrapper are recorded; a direct `store.updateNode` is not | `file:packages/graph/src/history/GraphHistory.ts#L171-L176` |
| R2 | Writing a badge from a `data:changed` listener re-enters the flush unsafely | No: `doFlush` snapshots and clears its queues first, so listener-induced writes build the next batch | `file:packages/graph/src/store/GraphStore.ts#L1806-L1807` |
| R3 | A computed binding (`bind: '$collapsedCount'`) is required | Not required: it would work, but adds a new binding concept to the template system for one value | discussion 2026-09-25 |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Every collapse (click, dataset `states: ['collapsed']`, `setNodeState`), member add/remove and re-import ends in a store flush, after which the layer emits `data:changed` | `file:packages/graph/src/layer/GraphLayer.ts#L562-L600` | One subscription sees every cause |
| 2 | On `data:changed`, `theme:change`, enable/disable and option changes, the behaviour reconciles: for each group frame, desired = `enabled && countBadge && collapsed` → a pill badge labelled with `descendantsOf(id)` count, else none | new | Stateless; a stale badge from a re-import is removed on the first flush |
| 3 | The write replaces only the entry with `id: 'collapsed-count'` in `node.style.badges`, keeps any other badges, and is skipped when the entry is already equal | new | The write converges: the next flush finds nothing to change |
| 4 | `syncNodeBadges` resolves no badges for a node that is not visible | `file:packages/graph/src/layer/GraphLayer.ts#L2334` | A nested collapsed frame's badge hides with the frame, as do authored badges on hidden nodes |
| 5 | Colours default to theme roles (`accent` fill, `cardBg` ring, `surface` text) read from `ctx.theme` | `file:packages/graph/src/layer/GraphLayer.ts#L3145-L3160` | Same look as today; follows the theme |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-25-collapsed-count-is-a-centred-label-not-a-badge` | supersedes (badge half) | landed as `c561ed09` | `showCollapsedCount` + the centred label; F4's badge hit-through in `sym:CollapseExpandBehaviour.groupUnder`; the pill's look |
| `rfc:feat-2026-09-21-per-type-presentation-is-only-expressible-as-callbacks` | relates-to | — | Behaviour options stay plain JSON (`countBadge`, `countBadgePlacement`) |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | implemented | `file:packages/graph/src/behaviours/CollapseExpandBehaviour.ts` | Options `countBadge?: boolean` (default `false`), `countBadgePlacement?: BadgePlacement` (default `'top-right'`); exported slot id `COLLAPSED_COUNT_BADGE_ID = 'collapsed-count'` | Badge is opt-in on the behaviour | Low: additive | — |
| F2 | feature | implemented | same | Reconcile on `data:changed`, `theme:change`, `onEnable`/`onDisable`/`onOptionsChanged`; clear on `onDestroy` | Badge follows every collapse cause and the theme; switching off removes it | Medium: writes node `style`; mitigated by the equality skip (step 3) | F1 |
| F3 | defect | implemented | `file:packages/graph/src/layer/GraphLayer.ts` (`syncNodeBadges`) | No badges while `!store.isNodeVisible(id)` | Badges of hidden or collapsed-away nodes no longer float over the canvas | Medium: changes how hidden nodes with authored badges look (they disappear, which is correct) | — |
| F4 | cleanup | implemented | `file:packages/graph/src/layer/GraphLayer.ts`, `file:packages/graph/src/layer/types.ts` | Remove `GroupOptions.collapsedCountDisplay`, `collapsedCountBadge()`, the `group-count` badge slot and its visibility patch | One badge path | **Breaking** for configs using `collapsedCountDisplay: 'badge'` (all in-repo, see C1–C3) | F1–F3 |
| F5 | feature | implemented | `file:packages/canvas-ui/src/editors/behaviours/collapse-expand/` | `countBadge` + `countBadgePlacement` fields / mapping / types (root rule 12) | Editable in `CanvasSettingsEditorPanel` | Low | F1 |
| F6 | migration | implemented | `story:graph/Groups/*` (C2), GlobalModel JSON (C1) | `showCollapsedCount: true, collapsedCountDisplay: 'badge'` → behaviour `countBadge: true`; the stories' `'center' \| 'badge'` GUI keeps working by switching `showCollapsedCount` and `countBadge` together | Same pictures as today | Medium: seven stories + one case study touched | F4 |
| F7 | docs | implemented | `file:packages/graph/CLAUDE.md` | Record D1 as a package rule | The principle is findable | Low | — |
| F8 | docs | implemented | `sym:CollapseExpandBehaviour.groupUnder` TSDoc | Point at `countBadge` instead of `collapsedCountDisplay` | Doc matches code | Low | F1 |
| F9 | feature | deferred | `sym:GraphLayer.syncGroupSyntheticDecorations` | Move the centred label (`showCollapsedCount`) to the behaviour too | One owner for all collapse chrome | Medium | D3 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:usecases/by-casestudies/global-model/GlobalModel` (`settings.json`, `detail-templates.json` × 3 levels) | story / serialised config | `collapsedCountDisplay` no longer exists | Move to `behaviours.<collapse id>.countBadge` (F6) |
| C2 | `story:graph/Groups/AllOptions`, `CircleGroup`, `CircleNestedGroups`, `GroupWithEdges`, `NestedGroups`, `RectGroup`, `RelayoutOnToggle` | story | Same | F6 |
| C3 | Published `GroupOptions` type | published API | `collapsedCountDisplay` removed (added one commit earlier, unreleased) | none outside the repo |
| C4 | `sym:GraphLayer.exportData` | serialised state | A collapsed frame's `style.badges` now carries the count entry | Harmless: on import the group is open and the first flush removes it (step 2) |
| C5 | Any node with authored `NodeStyle.badges` that is hidden | rendering | Its badges now hide with it (F3) | none, this is the fix |
| C6 | `story:graph/Groups/HackerStyle` | story | Uses the centred label only | none (control) |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | types · build · graph tests · lint (incl. `check-api-surface`) | repo | green | F1–F5 |
| V2 | pass | Collapse a frame with `countBadge: true` | `story:graph/Groups/RectGroup` | Pill with the member count on the top-right corner; gone on expand | F1, F2 |
| V3 | pass | Collapse inner, then outer | `story:graph/Groups/CircleNestedGroups` | Only the outer badge shows; re-opening restores the inner's | F2, F3 |
| V4 | skipped | Switch GUI `center` ↔ `badge` | `story:graph/Groups/AllOptions` — skipped: the same GUI wiring was checked on `story:graph/Groups/RectGroup` (V2) | Swaps between the label and the badge, nothing left behind | F2, F6 |
| V5 | pass | Collapse a folder; switch Detail level | GlobalModel | Badge shows at every level | F6 |
| V6 | pass | Double-click the badge | GlobalModel | The folder toggles | F8 |
| V7 | pass | **Control**: centred label | `story:graph/Groups/HackerStyle` | White centred count, as before | F4 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | May a behaviour write presentation into a node's `style`? | yes, into a named slot it keeps in step and removes · no, presentation must be derived by the layer | **Yes.** Only `.data` is persisted to the graph backend; `style` is presentation (maintainer, 2026-09-25) | accepted |
| D2 | Which frames get the badge? | every group frame in the target layer · per-frame opt-in on `GroupOptions` | **Every frame** the behaviour drives; a per-frame opt-out can be added when a case needs it | accepted |
| D3 | Does the centred label move too? | move now · keep on `GraphLayer` | **Keep for now** (F9 deferred); it is a decoration that already hides with its host and has no bug | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Opened and approved | accepted | Maintainer: "update this to design doc, that behaviours can update the styling, badges etc, and graph data is safe in .data field and yes cleanup the code" |
| 2026-09-25 | F1–F8 implemented | implemented | Types (graph, canvas-ui, storybook), graph build, graph tests (193), `check-boundaries`, `check-api-surface` green; eslint adds no warnings. Headless-Chrome checks: RectGroup badge appears on collapse (by double-click **and** by the story's programmatic `setNodeState`), `center` ↔ `badge` swaps cleanly, expand removes it; CircleNestedGroups shows only the outer `4` with the inner collapsed, re-opening restores the inner `2`; GlobalModel shows `4` on the AirRoutes tab, keeps it on Detail → High, and a double-click on the badge re-opens the folder; HackerStyle's centred label unchanged. **Found, not caused here:** RectGroup's "collapsed (programmatic)" checkbox leaves the members visible. It reproduces with `countBadge` off (no behaviour writes), so it comes from the story's `apply` doing a `style` write and a `setNodeState` in the same tick. Not investigated further |
