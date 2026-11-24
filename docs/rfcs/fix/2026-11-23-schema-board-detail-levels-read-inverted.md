---
id: fix-2026-11-23-schema-board-detail-levels-read-inverted
type: fix
title: The schema board's Detail levels read inverted — "High" draws the least, "Low" the most
status: proposed
opened: 2026-11-23
decided: null
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/canvas-ui/src/board/schema/presets.ts#L219-L228" }
  - { predicate: manifests-in, object: "sym:SchemaBoard" }
  - { predicate: manifests-in, object: "story:canvas-ui/apps/SchemaBoard/SchemaBoard" }
  - { predicate: relates-to, object: "rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story" }
---

| | |
|---|---|
| **What breaks** | `<SchemaBoard>`'s Detail select offers *High — circles · Medium — cards · Low — schema cards*: "High detail" draws bare circles, "Low detail" draws every property. Users read it upside down |
| **Root cause** | `sym:SCHEMA_DETAIL` names the levels `high`/`medium`/`low` and prints those words in front of what each level draws; the select's own label is "Detail", so the words read as *amount of detail* — the opposite of what they do |
| **Was it a decision?** | **No record.** The names arrived in the first GlobalModel story (commit `dbd36245`, 2026-09-24) with no rationale, were lifted unchanged into canvas-ui (`23923844`, 2026-10-21), and no doc or RFC chose them (§1 R1–R2, §3) |
| **Defect rows** | F1 (label, user-facing), F3 (value names, developer-facing), F5 (an unknown level fails silently — makes any rename loud) |
| **Recommended** | F1 + F3 + F5 + F6 — name the levels by what they draw (`circles` · `cards` · `schema`), no alias |
| **Row status** | proposed 6 · accepted 0 · implemented 0 · landed 0 · deferred 0 · rejected 0 |
| **Open decisions** | D1, D2, D3 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | "Detail: High — circles" draws an icon circle per type: name only, no properties | Invana Studio › Model › Global model (`pkg:@invana/canvas-ui` 0.0.18) | screenshot `02-global-high.png` (maintainer, 2026-11-23) |
| S2 | "Detail: Low — schema cards" draws a card per type with every property, key and type | same | screenshot `02-global-low.png` |
| S3 | A host that wants the most detail writes `initialDetail="low"` — the code reads inverted too, not just the UI | `file:../invana/studio/apps/web/src/model/ModelPage.tsx#L147` · `file:apps/storybook/stories/canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail.stories.tsx#L22` | — |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Recorded LOD convention — "high" = far / zoomed out, as in level-of-detail rendering | **Ruled out.** No doc or RFC states it; the repo's own LOD tiers run the other way (higher tier = closer = more detail); and these levels are not zoom-driven at all — a manual switcher | `file:packages/graph/src/behaviours/TextResolutionLODBehaviour.ts#L52` ("Highest `minZoom` ≤ current zoom wins") · `dbd36245` message lists the levels with no rationale · `grep` of `docs/` for high/low detail: nothing |
| R2 | Intended as "high-level view" (abstraction), not "amount of detail" | **Possible intent, unrecorded** — and defeated by the select's own label "Detail" | `file:packages/canvas-ui/src/board/schema/SchemaBoard.tsx#L344-L347` (`label: 'Detail'`) |
| R3 | Invana Studio mislabels the levels | **Ruled out** — Studio passes no `detail`; the labels are canvas-ui's defaults | `file:packages/canvas-ui/src/board/schema/SchemaBoard.tsx#L162` (`detail = SCHEMA_DETAIL`) |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `sym:SchemaDetailLevel` is `'high' \| 'medium' \| 'low'` | `file:packages/canvas-ui/src/board/schema/presets.ts#L31` | Level ids carry a magnitude word |
| 2 | `sym:SCHEMA_DETAIL` maps `high → labelDot` (circle), `low → schema:*` (full card) and labels them `'High — circles'` … `'Low — schema cards'` | `file:packages/canvas-ui/src/board/schema/presets.ts#L219-L228` | The magnitude word runs opposite to the information drawn |
| 3 | `<SchemaBoard>` renders `detail.options` in a select labelled "Detail" | `file:packages/canvas-ui/src/board/schema/SchemaBoard.tsx#L305` · `#L344-L347` | The button reads "Detail: High — circles" → read as "high detail" → S1/S2 |
| 4 | `initialDetail?: string` is typed `string`, not the level union | `file:packages/canvas-ui/src/board/schema/SchemaBoard.tsx#L99-L100` | A host picks a level by the inverted id (S3); a misspelt or renamed id is not a type error |
| 5 | An unknown level indexes `detail.templates[level]` → `undefined`, passed on to `sym:detailConfig` | `file:packages/canvas-ui/src/board/schema/detailTemplates.ts#L128-L138` · `#L66-L68` | A rename that misses one consumer draws the wrong thing **silently** (to confirm, T2) |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Open `story:canvas-ui/apps/SchemaBoard/SchemaBoard`, switch Detail High → Low | pending (S1/S2 already show it in Studio) | Labels inverted relative to drawn content |
| T2 | Render `<SchemaBoard initialDetail="bogus" />` | pending | Expect no error and a board with no Detail patch, select showing no value → justifies F5 |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| commit `dbd36245` (2026-09-24) — GlobalModel story, "High (circles) · Medium (cards) · Low (schema cards)" | caused-by | superseded by canvas-ui | Origin of the names; no rationale given |
| `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story` F25/F26 | relates-to | landed | `sym:DetailTemplates` mechanism stays — level ids are arbitrary strings; only the schema preset's ids and labels move |
| `story:canvas-demos/by-casestudies/workflow/WorkflowPlan` — DAG levels `circles` · `cards` | relates-to | in force | **Precedent**: the sibling board already names levels by what they draw (`…/WorkflowPlan.stories.tsx#L49-L50`) |
| `story:canvas-ui/apps/DetailTemplates/DetailTemplates` — `dots` · `cards` · `perType` | relates-to | in force | Same precedent (`…/DetailTemplates.stories.tsx#L29` · `#L46`) |
| `doc:../invana/docs/docs/architecture/ontology.md` L353 | relates-to | in force (Invana repo) | Copies the canvas labels verbatim; a consumer, not a decision |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/canvas-ui/src/board/schema/presets.ts#L226` | Labels → `'Circles'` · `'Cards'` · `'Schema cards'`; drop High/Medium/Low from the text. Values unchanged | User symptom S1/S2 gone; select reads "Detail: Schema cards" | Low — labels only; no API change; Studio's `initialDetail="low"` keeps working | — |
| F2 | defect | proposed | `presets.ts` + `file:packages/canvas-ui/src/board/schema/SchemaBoard.tsx` | **Alternative to F3.** Rename ids to `circles` · `cards` · `schema`; keep `high`/`medium`/`low` as deprecated aliases (map in `SchemaBoard`, dev `console.warn`, widen `SchemaDetailLevel` with `@deprecated` members) | S3 fixed with no break | Medium — an alias table and a widened public type to carry and later remove; against the repo's no-shim stance for a 0.0.x package with one external consumer | F1 |
| F3 | defect | proposed | `presets.ts#L31` · `#L219-L228` | Rename ids to `circles` · `cards` · `schema` outright (`SchemaDetailLevel = 'circles' \| 'cards' \| 'schema'`), `initial: 'cards'`. No alias | S3 fixed; ids match DAG and DetailTemplates precedent (§3) | **Not low — breaking published API** of `pkg:@invana/canvas-ui` (union members of `sym:SchemaDetailLevel`, keys of `sym:SCHEMA_DETAIL`, accepted `initialDetail` values). `initialDetail` is `string`, so consumers do **not** fail to compile — F5 is what makes it loud | F1 |
| F4 | defect | proposed | `presets.ts#L219-L228` | Keep the words, invert the mapping: `high → schema cards`, `low → circles` | Labels read right | **High** — silently flips every existing `initialDetail` (Studio's `"low"` would open on circles, no error). Listed for the record; recommend reject | — |
| F5 | defect | proposed | `file:packages/canvas-ui/src/board/schema/detailTemplates.ts#L128` | `useDetailTemplates`: an `initial` not in `detail.templates` falls back to `detail.initial` and `console.warn`s the unknown id and the valid ones | A missed rename or typo is visible, not a silently wrong board (T2) | Low — affects only invalid input; also covers `sym:LayeredDagBoard` | — |
| F6 | dressing | proposed | stories + JSDoc (D-6, D-7) | Update prose and ids: presets header table, `SchemaBoard` JSDoc, `SchemaBoard.stories` L8, `GlobalModel.stories` L10–11, `SchemaBoardConnect` `initialDetail="high"` → `"circles"`, `SchemaBoardLowDetail` → `"schema"` (and its title, D3) | Docs match code | Low; a story-title rename moves its Storybook URL | F1, F3 |

F1 alone removes the user-visible symptom; F3 removes the cause in the API. F2 and F3 are mutually exclusive; F4 is the trap.

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:DetailTemplates` / `sym:useDetailTemplates` | Level ids are arbitrary strings; option order = key order | None — no change to the mechanism |
| U2 | `pnpm check-api-surface` (root rule 16) | Pins export **names** of the engine barrels only (`canvas-core`, `canvas-store`, `canvas`); `pkg:@invana/canvas-ui` has no snapshot, and F3 changes union members, not export names | Passes unchanged — so the break is **not** caught by tooling; the version bump and release note must carry it |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D-1 | `sym:SchemaDetailLevel`, `sym:SCHEMA_DETAIL` (`file:packages/canvas-ui/src/index.ts#L1084` · `#L1100`) | published API | F3: members/keys change | Release `pkg:@invana/canvas-ui` > 0.0.18, note the rename |
| D-2 | Invana Studio `file:../invana/studio/apps/web/src/model/ModelPage.tsx#L147` (`initialDetail="low"`) | external app | F1: none. F3: wrong board until changed to `"schema"`; no compile error | Change in the same Studio bump to the new canvas-ui |
| D-3 | Invana Studio `GlobalModelPage.tsx` (default level) | external app | Label text only | None |
| D-4 | `doc:../invana/docs/docs/architecture/ontology.md` L353 (and its built site) | external doc | States the old labels | Update in the Invana repo with D-2 |
| D-5 | Invana Studio e2e | external tests | None — no spec selects by Detail label (grep clean) | None |
| D-6 | `story:canvas-ui/apps/SchemaBoard/SchemaBoardConnect` (L51 `"high"`) · `story:canvas-ui/apps/SchemaBoard/SchemaBoardLowDetail` (L2, L14, L22 `"low"`) · `story:canvas-ui/apps/SchemaBoard/SchemaBoard` (L8 prose) · `story:canvas-demos/by-casestudies/global-model/GlobalModel` (L10–11 prose) | stories | F3: ids invalid | F6 |
| D-7 | `presets.ts` header table L8–L12, `SchemaBoard.tsx` JSDoc | JSDoc | Stale prose | F6 |
| D-8 | Serialised state | — | **None** — the level is React `useState` only (`detailTemplates.ts#L128`), not in `view.definition`, export, or URL | None |
| D-9 | `sym:LayeredDagBoard`, `story:…/WorkflowPlan`, `story:canvas-ui/apps/DetailTemplates/DetailTemplates` | sibling | Already named by what they draw; F5 applies to them too (valid ids, no change) | None |
| D-10 | `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story` V4 ("High · Medium · Low") | RFC history | Historical record | None — append-only, not edited |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Playwright: open the Detail select | `story:canvas-ui/apps/SchemaBoard/SchemaBoard` | Lists Circles · Cards · Schema cards, in that order; default Cards | F1 |
| V2 | pending | Playwright: the schema-cards story opens on schema cards | `SchemaBoardLowDetail` (or its renamed title) | One schema card per type, select shows "Schema cards" | F3, F6 |
| V3 | pending | `<SchemaBoard initialDetail="low" />` after F3 | unit test on `useDetailTemplates` | Falls back to `cards`, one `console.warn` naming valid ids | F5 |
| V4 | pending | **Control:** switch levels live | `story:…/SchemaBoard`, `story:canvas-demos/by-casestudies/workflow/WorkflowPlan` | Re-lays out, nothing remounts, no console errors; DAG Circles/Cards unchanged | F1, F3, F5 |
| V5 | pending | `pnpm check-types` + `pnpm lint` (incl. `check-api-surface`) | repo | Clean; surface snapshots unchanged (U2) | F1, F3, F5, F6 |
| V6 | pending | Invana Studio e2e: one model's board | `ModelPage` with `initialDetail="schema"` on the new canvas-ui | Opens on schema cards | F3 (D-2) |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | How far to go? | (a) F1 relabel only; (b) F1 + F2 rename with deprecated aliases; (c) F1 + F3 rename outright; (d) F4 invert | **(c)** — canvas-ui is 0.0.x, its one external consumer passes one prop (D-2) and Invana carries no back-compat; ids then match the DAG precedent. (a) leaves the inverted ids in every host's code (S3). (d) is a silent behaviour flip — reject | open |
| D2 | Keep the select's label "Detail"? | (a) keep "Detail"; (b) "Show" / "Draw as" | **(a)** — once levels are named by what they draw, "Detail: Schema cards" reads correctly; the word was never the problem | open |
| D3 | Rename the story `SchemaBoardLowDetail`? | (a) → `SchemaBoardSchemaCards`; (b) keep title, change only the prop | **(a)** — the title repeats the inverted word; its Storybook URL moves, no known external link to it | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-11-23 | Opened from Invana Studio screenshots (S1/S2). Origin traced to `dbd36245`; no recorded decision chose high/low; repo LOD convention runs the other way (R1) | proposed | F4 listed only to record why inverting the mapping is rejected-in-waiting |
