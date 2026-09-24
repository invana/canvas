---
id: feat-2026-09-25-group-frame-toggle-cannot-be-hidden
type: feat
title: A group frame's +/− toggle cannot be hidden
status: accepted
opened: 2026-09-25
decided: 2026-09-25
landed: null
packages: [pkg:@invana/graph, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
---

## Summary

| | |
|---|---|
| **What's missing** | Every group frame gets a `+` / `−` toggle button; a visualisation can move it (`togglePlacement`) but not remove it. GlobalModel wants the folders to read as plain containers, with no expand/collapse affordance. |
| **Proposal** | New `GroupOptions.showToggle?: boolean` (default `true`). `false` → `GraphLayer` mounts no toggle decoration for that group. Set it in GlobalModel's group style. |
| **Decisions** | `D1` → **(a)**: hide the button, keep double-click |
| **Row status** | proposed 0 · accepted 0 · implemented 3 · landed 0 · deferred 0 · rejected 0 · superseded 0 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The toggle is attached unconditionally — "present on every group" | `file:packages/graph/src/layer/GraphLayer.ts#L3020-L3040` | read |
| M2 | `GroupOptions` exposes only where it sits (`togglePlacement`), not whether it exists | `file:packages/graph/src/layer/types.ts#L1031-L1049` | read |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Hide it from the story alone (e.g. `togglePlacement` far off the frame) | **No** — dressing | The button would still exist and be clickable somewhere off-frame; a `state.collapsed` overlay can't remove a synthetic decoration |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | implemented | `file:packages/graph/src/layer/types.ts` (`GroupOptions`) | `readonly showToggle?: boolean` — default `true`; TSDoc says collapse still works through double-click (`CollapseExpandBehaviour.doubleClickToToggle`) and the API | The option | Low: additive, optional | — |
| F2 | feature | implemented | `file:packages/graph/src/layer/GraphLayer.ts#L3020-L3040` (`syncGroupSyntheticDecorations`) | When `group.showToggle === false`, set the `group-toggle` slot to `null` instead of mounting the toggle | No button drawn; `CollapseExpandBehaviour.findToggleHit` finds no decoration, so clicks there do nothing | Low: only groups that opt out change | F1 |
| F3 | feature | implemented | `file:apps/storybook/stories/usecases/by-casestudies/global-model/settings.json` (the group style, `#L6091-L6097`) | `"showToggle": false` (D1 (a): `collapse-expand` stays enabled, double-click still toggles) | GlobalModel folders show no `+` / `−` | Low — story edit requested | F1, F2 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | Every group frame in every story / consumer | style | None — default `true` keeps today's button | none |
| C2 | `CollapseExpandBehaviour` | behaviour | Unchanged; with no decoration its button path simply never hits | none |
| C3 | Serialised group styles | persisted state | Additive optional key | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Screenshot | GlobalModel | No `+` / `−` under any folder, expanded or collapsed | F2, F3 |
| V2 | pass | Double-click a folder (if `D1` keeps it) | GlobalModel | Still collapses / expands | F3 |
| V3 | pass | **Control** | `story:graph/Behaviours/CollapseExpand` | Button still drawn and clickable | F2 |
| V4 | pass | types · lint · build · graph tests | repo | green | F1–F3 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | In GlobalModel, should folders still collapse at all? | (a) hide the button, keep double-click (a hidden power-user gesture) · (b) no collapsing — also set `"collapse-expand": { "enabled": false }` | **(a)** if you still want to toggle while exploring; **(b)** if "not expandable" is the point. Your wording ("I don't want it to show it's expandable") reads like (a) | accepted — (a) |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Opened | proposed | Maintainer: "in the story model story remove the plus icon for the folder, i dont [want] that to show its expandable or collapsible". No existing option could do it |
| 2026-09-25 | D1 (a) approved; F1–F3 implemented | implemented | Maintainer: "a". V1 no toggle under any GlobalModel folder; V2 double-click still collapses AirRoutes (re-flow, camera still); V3 `graph/Behaviours/CollapseExpand` keeps its button; V4 types, graph tests (193), boundaries, API surface green |
