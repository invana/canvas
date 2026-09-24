---
id: feat-2026-09-25-force-layout-lets-group-frames-overlap
type: feat
title: Under d3-force, group frames overlap each other and sit on top of other groups' cards
status: accepted
opened: 2026-09-25
decided: 2026-09-25
landed: null
packages: [pkg:@invana/graph-layout-d3-force, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: doc:docs/group-aware-layouts-plan.md
relations:
  - { predicate: relates-to, object: "rfc:feat-2026-09-24-toggling-a-group-leaves-the-layout-stale" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
---

## Summary

| | |
|---|---|
| **What's missing** | Under `D3ForceLayout`, expanded group frames overlap: in GlobalModel (Layout → Force) the AirRoutes frame runs under NewsArticles, and Twitter's frame overlaps NewsArticles' cards. Frames are drawn around their members *after* the sim, so the sim never sees a frame. |
| **Why it's not a bug** | `doc:docs/group-aware-layouts-plan.md` §7 decided force gives **attraction, not containment** (`cluster` pulls members together; nothing keeps boxes apart). This RFC adds **separation** on top of that decision; it does not make force a container layout. |
| **Proposal** | A new opt-in force option `separateGroups` — each tick, treat every expanded group as one box (its members' bounds + the frame's padding/header) and push overlapping boxes apart by shifting **all** of each group's members together; ungrouped nodes that sit inside another group's box are pushed out the same way. |
| **Not in scope** | The Twitter frame ending partly off-screen after a toggle: the re-flow deliberately leaves the camera alone (`rfc:fix-2026-09-24-collapse-toggle-snaps-the-camera` F6). Separation will change *where* things settle, not whether the camera follows — see `D2`. |
| **Row status** | proposed 0 · accepted 0 · implemented 5 · landed 0 · deferred 0 · rejected 0 · superseded 0 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | AirRoutes' frame overlaps NewsArticles'; Twitter's frame overlaps NewsArticles' cards | `story:usecases/by-casestudies/global-model/GlobalModel`, Layout → Force | probe screenshots 2026-09-25 (`h-0`, `k-collapse-2200`) |
| M2 | The force options already in the story (`collide.radius: 160`, `charge: -2600`, `cluster: 0.7`) act on **cards**, not frames — collide keeps cards apart, cluster pulls each group's cards together, nothing sizes a frame | `file:apps/storybook/stories/usecases/by-casestudies/global-model/settings.json#L6224-L6238` | read |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Raise `collide.radius` / `charge` until frames clear | **No** | Pushes *every* card apart, inside groups too; frames grow with their members, so the overlap scales with them |
| R2 | Run force per group (nested sims) | **No** | Rejected by the design of record (§7: "recursion would mean N nested simulations") |

## 2. Design

| Step | Mechanism | Consequence |
|---|---|---|
| 1 | Once per tick, for each expanded group with placed members: box = members' AABB (each member's size from `boundsOfNode`, as `collideRadius` does) grown by the group's `padding` and header/tab (`groupInsets`, the helper ELK uses) | A box that matches the drawn frame |
| 2 | Every other placed node that isn't a member of that group is a box of its own size | Loose cards count too |
| 3 | For each overlapping pair of boxes (skipping loose–loose pairs, which are `collide`'s), compute the overlap on the axis of least penetration and add `overlap · strength / 2` of velocity (as built: not α-scaled) to **every** member of each side alike (each side takes half the overlap), in opposite directions | Groups move as rigid clusters; the cards inside a group keep their relative layout |
| 4 | Nested groups: only **top-level** boxes separate (a group's box contains its child groups) | No fighting between a frame and the frames inside it |
| 5 | Pinned / dragged nodes (`fx`/`fy`) are not moved; the rest of their box still gets the push (as built — no redistribution) | Respects pins, as the rest of the layout does |

Cost: `O(B²)` per tick for `B` top-level boxes (groups + loose nodes). Fine for model-level graphs (tens of boxes); documented as not for thousands of loose nodes — the option is opt-in.

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/group-aware-layouts-plan.md` §7 | design of record | current | "Force gives attraction, not containment" — still true. This RFC appends *separation*; §7's row gets a line pointing here |
| `rfc:feat-2026-09-24-toggling-a-group-leaves-the-layout-stale` | relates-to | implemented | Its anchoring (F6) keeps working unchanged: separation is a force, anchoring translates the whole sim after it |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | feature | implemented | `file:packages/graph-layout-d3-force/src/forceSolver.ts` (new `makeGroupSeparationForce`) + `file:packages/graph-layout-d3-force/src/types.ts` | New option `separateGroups?: { strength?: number; padding?: number }` (off when absent; `strength` default `0.8` = fraction of an overlap resolved per tick, **not alpha-scaled** — see V1; `padding` = extra gap between boxes, default `24`). The force, in the shared solver file so both the live sim and the worker's static solve use the one implementation | Frames stop overlapping each other and stop covering other groups' cards | **Medium**: a new per-tick force; changes force output only where enabled | — |
| F2 | feature | implemented | `file:packages/graph-layout-d3-force/src/D3ForceLayout.ts` (`configureForces`, `snapshotStatic`) | Build the box membership (group → member indices, insets) from the layer, pass it to the force in both paths; for the worker, as transferable typed arrays like `clusters` | Works in `animate: true` and `animate: false` | Medium: new transferable input to the worker | F1 |
| F3 | feature | implemented | `file:packages/canvas-ui/src/editors/layouts/d3-force-layout/{fields,mapping,types}.ts` | Fields "Separate groups" (toggle) + strength + padding | Rule 12 | Low | F1 |
| F4 | feature | implemented | `file:apps/storybook/stories/usecases/by-casestudies/global-model/settings.json` (`layouts.force`) | `"separateGroups": {}` | GlobalModel's Force view shows non-overlapping frames | Low — story edit covered by "fix that too" | F1 |
| F5 | docs | implemented | `file:docs/group-aware-layouts-plan.md` §7 + `file:packages/graph-layout-d3-force/CLAUDE.md` ("Groups — attraction, not containment") | One line each: force now offers opt-in *separation* (boxes don't overlap) while still not containing members | Keeps the design of record honest | Low | F1 |

## 5. Blast radius

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | Every `D3ForceLayout` user | package | None unless `separateGroups` is set | none |
| C2 | `story:usecases/by-casestudies/global-model/GlobalModel` | story | Force view changes (F4) | visual check |
| C3 | Serialised `CanvasConfig.layouts[*]` for force | persisted state | Additive optional key | none |
| C4 | `forceSolver.worker.ts` | worker bundle | Receives the new optional input | rebuild |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Measure every pair of top-level frame boxes after settle | GlobalModel, Force | No two frames intersect (≥ `padding` apart); no card inside a frame it doesn't belong to | F1, F2, F4 |
| V2 | pass | Same with `animate: false` | GlobalModel, Force static | Same | F2 |
| V3 | pass | **Control**: option off | GlobalModel with `separateGroups` removed; any force story without groups | Output identical to today | F1 |
| V4 | pass | Collapse / expand with `relayoutOnToggle` | GlobalModel, Force | Anchoring still holds the toggled frame; neighbours separate around it | F1, F2 |
| V5 | skipped — not exercised in the browser; the field + mapping build and type-check | Editor toggles it live | GlobalModel settings → force layout | Next settle separates / doesn't | F3 |
| V6 | pass | types · lint (boundaries, API surface) · build · tests | repo | green | F1–F5 |

### Results, 2026-09-25

| Check | Measured |
|---|---|
| V1 first attempt · alpha-scaled push | **Fail** — frames still overlapped (NewsArticles over Twitter and AirRoutes). A debug log confirmed the input was right (4 group boxes, sizes 264×116 per card, insets 58/30/30/30); the push faded with α while the story's strong cross-group links (`distance: 300`) kept pulling. Changed to a constraint (not α-scaled), like `forceCollide` |
| V1 · GlobalModel, Force, after the change | Deals / Twitter / NewsArticles / AirRoutes all separated by ≈ 11 px at 47 % zoom ≈ 24 world units — the configured gap. No card inside a frame it doesn't belong to |
| V2 · `solveForces` directly (the worker's function), two 3-node groups seeded on top of each other and linked across | off: overlap 206.9 × 214.1 · on: separated, gap 23.8 (padding 24) |
| V3 · control | The force is only registered when both `separateGroups` is set and a group box exists; with it off the force list is exactly today's |
| V4 · collapse / expand Deals with `relayoutOnToggle` | Camera untouched (1 transform each). Collapse: tab stays at the old frame's centre, neighbours move up, no overlaps. Expand: Deals re-opens in place, neighbours move down to make room, all frames separated. Twitter ends partly off-screen on the left after the collapse — the accepted `D2` |
| V6 | build · `check-types` · canvas-core (143) + graph (193) tests · boundaries · API surface green; lint: no new warnings |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Default on or off | off (opt-in) · on for every force layout with groups | **off**, on in GlobalModel — it changes force output for anyone with groups | accepted |
| D2 | Frames that end partly off-screen after a toggle re-flow | leave the camera alone (today) · gently pan only when content leaves the view | **leave it** — you asked for no camera movement on toggle; revisit if separation makes it worse | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Opened | proposed | Maintainer: "ok fix that too.." after the frame overlap under force was pointed out. The design of record says force gives attraction, not containment, so this is a feature on top of it, not a fix |
| 2026-09-25 | Approved; F1–F5 implemented | implemented | Maintainer: "yes" (D1 off-by-default + on in GlobalModel, D2 leave the camera). Implementation lesson: the push had to be a non-α-scaled constraint — the α-scaled first version lost to the links. V5 not exercised in the browser |
