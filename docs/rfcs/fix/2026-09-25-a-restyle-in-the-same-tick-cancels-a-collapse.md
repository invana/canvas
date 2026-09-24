---
id: fix-2026-09-25-a-restyle-in-the-same-tick-cancels-a-collapse
type: fix
title: A group restyled in the same tick as it collapses keeps its members on screen
status: accepted
opened: 2026-09-25
decided: 2026-09-25
landed: null
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:graph/Groups/RectGroup" }
  - { predicate: relates-to, object: "rfc:feat-2026-09-25-collapsed-count-badge-is-hardcoded-in-graphlayer" }
---

## Summary

| | |
|---|---|
| **What breaks** | A group collapsed with `setNodeState(id, 'collapsed', true)` in the same tick as a `style` write to it closes its frame but leaves every member visible. A group authored closed (`states: ['collapsed']`) also loads with its members visible. |
| **Root cause** | `sym:GraphLayer.syncGroupSyntheticDecorations`, a drawing helper, also writes `lastCollapsedByGroup`, the "already applied" marker that `sym:GraphLayer.syncGroupCollapse` compares against. Any re-render that runs first marks the flip as applied, so the cascade that hides the members never runs. |
| **Fix** | F1 removes the write; F2 and F3 apply the collapse at mount and on add, which the write had been standing in for. |
| **Row status** | proposed 0 · accepted 0 · implemented 3 · landed 0 · deferred 0 · rejected 0 · superseded 0 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Ticking "collapsed (programmatic)" draws the closed frame with node1–node3 still on screen; double-clicking the frame hides them | `story:graph/Groups/RectGroup` | headless-Chrome screenshots, 2026-09-25 |
| S2 | Same with `countBadge` off, so no behaviour writes are involved | same | screenshot |
| S3 | A group loaded with `states: ['collapsed']` reports its members visible | `file:packages/graph/tests/layer/collapseHidesMembers.test.ts` | failing test before F1–F3 |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `CollapseExpandBehaviour`'s count-badge writes re-open the group | No: reproduces with `countBadge` off (S2) | screenshot |
| R2 | The presence state is applied late | No: `nodeStatesOf('g')` already reads `collapsed` when `node:update` fires | trace in the repro test |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | The story's `apply` calls `store.updateNode('group-a', { style })`, then `store.setNodeState('group-a', 'collapsed', true)` | `file:apps/storybook/stories/graph/Groups/RectGroup.stories.ts#L241` | One flush carries both |
| 2 | `doFlush` emits `node:update` before `node:state` | `file:packages/graph/src/store/GraphStore.ts#L1850-L1860` | The update handler runs first |
| 3 | The update handler re-renders the group (`updateNodeShape` → `rerenderNode` → `syncGroupSyntheticDecorations`), which sets `lastCollapsedByGroup('g') = true` | `file:packages/graph/src/layer/GraphLayer.ts` (`syncGroupSyntheticDecorations`) | The flip is recorded before it is applied |
| 4 | `syncGroupCollapse` then sees `was === now` and returns, so `publishCollapseHidden` never runs | trace: `lastCollapsedByGroup` true, `setCollapseHidden` never called | Members stay visible (S1) |
| 5 | At mount, `installNodeShape` runs the same helper, so an authored-closed group is also marked applied without a cascade | `file:packages/graph/src/layer/GraphLayer.ts` (`onMount` initial sync) | S3 |

| Test | Action | Result | Inference |
|---|---|---|---|
| Control | `setNodeState` alone | members hidden | The cascade works when it runs before any re-render |
| Repro | `updateNode(style)` + `setNodeState`, same tick | members visible | Step 3 pre-empts step 4 |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `sym:GraphLayer.syncGroupSyntheticDecorations` | Stop writing `lastCollapsedByGroup`; only read the collapsed state | `syncGroupCollapse` is the marker's only writer | Medium: the marker also covered load (F2, F3) | — |
| F2 | defect | implemented | `GraphLayer.onMount` (initial sync) | After `drainDirtyGroups`, run `syncGroupCollapse` for each group | A group authored closed hides its members from the first paint | Low | F1 |
| F3 | defect | implemented | `GraphLayer` `node:add` handler | Run `syncGroupCollapse` for an added group | A group added closed hides its members; the store already holds the whole batch, so members in the same flush are covered | Low: no-op for an open group | F1 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:graph/Groups/RectGroup`, `story:graph/Groups/AllOptions` (programmatic collapse) | story | Members now hide | none |
| C2 | Any dataset with `states: ['collapsed']` on a group | data | Members now start hidden, as documented on `sym:GraphLayer.isCollapsedGroup` | none |
| C3 | `sym:CollapseExpandBehaviour` expand path (`centreOpeningMembers` reads the marker) | behaviour | Unchanged: the marker is still written by `syncGroupCollapse` on every flip | verified (V3) |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Repro + load tests | `file:packages/graph/tests/layer/collapseHidesMembers.test.ts` | members hidden in all three cases | F1–F3 |
| V2 | pass | Tick / untick "collapsed (programmatic)" | `story:graph/Groups/RectGroup` | Members hide, badge shows; unticking restores them | F1 |
| V3 | pass | **Control**: toggle inner then outer, re-open | `story:graph/Groups/CircleNestedGroups` | Same as before the fix | F1 |
| V4 | pass | **Control**: double-click collapse → expand | GlobalModel | Same as before the fix | F1 |
| V5 | pass | graph tests (196), types | repo | green | F1–F3 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Opened, approved, implemented | implemented | Found while verifying `rfc:feat-2026-09-25-collapsed-count-badge-is-hardcoded-in-graphlayer`. Maintainer: "fix the bug please". Also noticed, not fixed: on the programmatic path the closed tab isn't centred on the frame it replaces (`centreCollapsedFrame` measures after the same-tick re-render already drew the tab), and a member added *later* under an already-closed group is not re-hidden (no cascade on a leaf add) |
