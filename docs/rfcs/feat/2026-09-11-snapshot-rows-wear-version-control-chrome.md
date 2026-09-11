---
id: feat-2026-09-11-snapshot-rows-wear-version-control-chrome
type: feat
title: The panel wears version-control chrome — a Current badge, an "Open as new canvas" button, and a capture button that doesn't say what it captures
status: proposed
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-11-the-thumbnail-is-not-a-button }
  - { predicate: depends-on, object: rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-a-version-label-is-fixed-at-capture }
---

# Snapshot rows wear version-control chrome

Strip the row back to what a snapshot is. **Drop** the `Current` badge and the
`Open as new canvas` button; **rename** the capture button to **Take snapshot**; **add**
one line of help saying what a snapshot actually contains — selection and highlight,
element positions, viewport.

| | |
|---|---|
| Why | The chrome was written for *versions you fork*. `Current` marks a row nothing acts on, `Open as new canvas` promises a fork the engine never does (`sym:importCanvasState` loads **in place**), and `Save current state` names a mechanism ("state") without saying what is in it |
| Replacement for restore | The thumbnail, per `rfc:feat-2026-09-11-the-thumbnail-is-not-a-button` — which is why that RFC's R3 ("keep the button") is **reversed here**, deliberately, with a consequence that must be handled (R2 below) |
| The one real cost | With the button gone the picture is the **only** restore path. A row whose thumbnail hasn't loaded, or never had one, would have no way back at all — so the click target must cover those frames too (F3), reversing D-1 of that RFC |
| Help text | Derived from `sym:CanvasStateSnapshot`, not invented: definition + interaction (selection · hover · focus · camera · view mode) + per-layer data (nodes/edges **with positions**) — `file:packages/canvas/src/io/stateExport.ts#L64-L90` |
| Honesty gate | The help text describes what `sym:exportCanvasState` captures. Until F1–F3 of `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` land, the hosts capture none of it and the sentence is false (R1) |
| Non-goal | Changing how snapshots are captured or stored, a confirm-before-restore step, snapshot deletion, and `sym:CanvasSnapshot`'s shape |
| Row status | rows: **implemented 7** (F1–F7) · verification: **pass 1** (V1) · **pending 7** (V2–V8 — browser checks the implementing session can't run) · decisions: **accepted 4** (D-1 … D-4) |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | `Current` labels a row that behaves differently for a reason the user can't see | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L268-L272` | The badge's only companions are a tint (`#L236`) and the **suppression** of the restore button (`#L284`). So the badge's real message is "this row does less than the others" |
| S2 | Once restore loads in place, "current" is whatever you clicked last | `file:packages/canvas/src/io/stateExport.ts#L234` | `sym:importCanvasState` mutates the live canvas. Every restore moves the badge — it tracks the user's last click, which they already know |
| S3 | `Open as new canvas` promises a fork nothing implements | `#L54`, `#L320` | `restoreLabel` default. `sym:importCanvasState` has no fork mode; both hosts' restore is a `showMessage` (`file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L206-L213`). The words describe a product decision that was never built |
| S4 | `Save current state` names the mechanism, not the contents | `#L320` | "state" is engine vocabulary. It answers *what it does to the store*, not *what you get back* — which is the only question a user asks before clicking it |
| S5 | Nothing on the panel says what is captured | `#L340-L356` | The capture block is a bordered `<div>` with one `Button`. A snapshot that silently includes your selection and camera is a surprise in both directions — people expect less, then are surprised it restored their viewport, or expect more and lose work |
| S6 | The engine's answer to "what's in it" is precise and already written | `file:packages/canvas/src/io/stateExport.ts#L64-L90` | definition (scene / layer / behaviour / layout options, `activeLayout`, templates, theme) · interaction (`selection`, `hover`, `states`, `camera`, `focus`, `transientPins`, `viewMode`) · `data` (per-layer nodes/edges incl. positions). `runtime` is explicitly excluded |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | This can land before the snapshot RFC | **No** | Same gate as the thumbnail RFC: the help text would claim a capture that doesn't happen. Ordering is snapshot RFC → thumbnail RFC → this |
| R2 | Dropping the restore button is free once the thumbnail is clickable | **No — this is the trap** | `#L384` renders a `Skeleton` for `hasThumbnail` rows whose image hasn't arrived, and `null` for rows that never had one. With the button gone those rows become dead ends. F3 makes the whole frame — picture, skeleton **and** the empty case — the target |
| R3 | Removing `currentSnapshotId` is a safe prop removal | **No** | It is a published prop of `sym:CanvasSnapshotsViewPanelProps` and both stories pass it (`file:…/CanvasSnapshotsViewPanel.stories.tsx#L225`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L1053`). `pnpm check-api-surface` diffs **export names**, not members, so it will not catch the break (D-1) |
| R4 | "Take snapshot" needs no help text — the name is enough | **No** | The name says a picture is taken. The thing that surprises people is that it also restores *selection and camera* (S6), which no name can carry |
| R5 | The help text should list every field of `sym:CanvasStateSnapshot` | **No** | Seven interaction fields plus definition and data is a spec, not a hint. One sentence naming the three categories a user recognises — what's selected, where things are, where you're looking (D-3) |
| R6 | `restoreLabel` should be deleted along with the button | **Not yet** | It is a published prop. Its consumer disappears, so it becomes dead — but removal is the same break as R3 and belongs in the same decision (D-1) |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | Delete the `Current` badge (`#L268-L272`) and the `!isCurrent` gate on the restore path | S1, S2 | Every row offers the same action. The row stops explaining an exception that no longer exists |
| G2 | Keep `currentSnapshotId` driving **only** the quiet row tint (`#L236`) — "this is what's loaded", said in one pixel of border instead of a badge | D-1 | No prop removal, no break, and the useful half of the signal survives |
| G3 | Delete the restore `Button` block (`#L283-L293`) | S3 | The row is thumbnail + title + meta. Restore lives on the picture (thumbnail RFC F2) |
| G4 | The click target becomes the whole thumbnail **frame**, including the skeleton and the no-image case — which gets a placeholder frame rather than `null` | R2 | No row is a dead end. Reverses D-1 of the thumbnail RFC, which assumed the button was still there |
| G5 | `captureLabel` default: `'Save current state'` → `'Take snapshot'` | S4 | The button names the artefact |
| G6 | A help line under the capture button: one `<p className="text-xs text-muted-foreground">`, text from a new `captureHint?: string` prop, default *"Captures the whole canvas — what's selected and highlighted, where every element sits, and your current viewport."* | S5, S6, D-3 | The surprise is removed before the click, in the panel's own voice |
| G7 | `restoreHint` (thumbnail RFC F1) becomes the **only** words naming the restore action, so its default moves from a fork to a load: *"Click to load this snapshot onto the canvas"* | S3, R6 | One promise, in one place, matching what `sym:importCanvasState` does |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-the-thumbnail-is-not-a-button` | depends-on | proposed | Its F1/F2 provide the restore affordance this RFC leans on. **Its R3 and D-1 are reversed here** — recorded in both documents rather than silently diverging |
| `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` | depends-on | proposed | Its F1–F3 make the help text true. Its D-1 (replace vs fork) is **settled by this RFC**: replace in place, and the copy follows |
| `file:packages/canvas/src/io/stateExport.ts#L64-L90` | relates-to | shipped | The authoritative list of what a snapshot holds — G6 paraphrases it, never re-specifies it |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L268-L272` | Delete the `Current` badge; keep the tint (G1, G2) | The row stops flagging an exception | low | — |
| F2 | defect | implemented | same `#L283-L293` | Delete the restore `Button` (G3) | Restore is the picture | **not low** — removes the only labelled, keyboard-obvious restore path; safe **only** with thumbnail RFC F2 + this F3 | F3, thumbnail RFC F2 |
| F3 | defect | implemented | same `#L374-L386` | Frame is always rendered and always the click target — picture, skeleton, and an empty placeholder for rows with no image (G4) | No dead-end rows (R2) | medium — reverses a decision in the thumbnail RFC; that document must record it | thumbnail RFC F2 |
| F4 | defect | implemented | same `#L320` | `captureLabel` default → `'Take snapshot'` (G5) | The button names the artefact | low — a default string; hosts overriding it are unaffected | — |
| F5 | defect | implemented | same `#L340-L356` | Add `captureHint?: string` + the help line under the button (G6) | What's captured is stated before the click | low | — |
| F6 | defect | implemented | same, `restoreHint` default | Fork wording → load wording (G7) | One promise, matching the engine | low | thumbnail RFC F1 |
| F7 | defect | implemented | `file:…/CanvasSnapshotsViewPanel.stories.tsx`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Drop the "Restored … **as a new canvas**" message wording; keep `currentSnapshotId` (G2) | Story copy stops promising a fork | low — story-only | F1, F2 |

## 5 Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CanvasStateSnapshot`'s contents | F5's sentence is a paraphrase of it | A field added to the envelope (or a layer that stops serialising) silently makes the hint wrong. It names categories, not fields, to survive that (R5) |
| U2 | Thumbnail RFC F2 (the clickable picture) | F2 here deletes the alternative | If that row is rejected, **F2 here must be too** — otherwise the panel ships with no restore at all |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `sym:CanvasSnapshotsViewPanelProps` | Published API | `restoreLabel` keeps existing but drives nothing (R6); `captureHint` is new; two defaults change wording | D-1 decides whether `restoreLabel` is deprecated or kept |
| D2 | Invana app | Published API | A host passing `restoreLabel` loses its button silently — the string still type-checks | Release note: restore moved to the thumbnail; `restoreLabel` is inert |
| D3 | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel`, `story:canvas-ui/apps/AppLayoutV2` | Storybook hosts | Both pass `currentSnapshotId` (kept, G2); both show fork copy (F7) | F7 |
| D4 | `pnpm check-api-surface` | Build gate | Export names unchanged; **member changes are invisible to it** (R3) | V7 is a manual read of the props, not a gate |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm --filter @invana/canvas-ui check-types && pnpm --filter @canvas/storybook check-types` | build | clean | F1–F7 |
| V2 | pending | Read a row | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Thumbnail, title, time, meta. No badge, no button | F1, F2 |
| V3 | pending | Click the thumbnail of a row with **no** image, and one still loading | browser | Both restore — no dead ends (R2) | F3 |
| V4 | pending | Tab through a row | browser | The frame is reachable and Enter restores — the only restore path stays keyboard-complete | F2, F3 |
| V5 | pending | Read the capture block | browser | "Take snapshot" + one grey line naming selection/highlight, positions, viewport | F4, F5 |
| V6 | pending | Select 3 nodes, pan, capture, change everything, restore | browser | Selection, positions and viewport all come back — the hint is literally true (needs snapshot RFC F1–F2) | F5, U1 |
| V7 | pending | Read `sym:CanvasSnapshotsViewPanelProps` after the change | source | `restoreLabel` is either documented as inert or removed per D-1 — not silently dead | D1, D4 |
| V8 | pending | **Control** — rename, day grouping, capture, slot thumbnails, empty + loading states | both stories | Unchanged | F1–F7 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | What happens to `currentSnapshotId` and `restoreLabel`? | keep both (tint + inert string) · keep `currentSnapshotId`, delete `restoreLabel` · delete both | **Kept `currentSnapshotId` for the tint; `restoreLabel` is `@deprecated` in TSDoc and no longer destructured** — it type-checks for existing hosts and drives nothing. Delete in a later sweep | accepted |
| D-2 | Is the tint enough, or does "which snapshot is loaded" deserve words? | tint only · tint + a muted "Loaded" label on hover · nothing at all | **Tint only** — implemented | accepted |
| D-3 | Exact help text | the G6 sentence · a shorter "Captures everything on the canvas, including your selection and viewport." · a bulleted list | **The G6 sentence**, as the `captureHint` default; `''` draws no hint | accepted |
| D-4 | Should the capture button confirm when a snapshot with the same state already exists? | no · yes | **No** — unchanged | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Asked for: drop `Current`, drop "Open as new canvas", rename capture to "Take snapshot", and add help text saying a snapshot includes highlight/selection, positions and viewport |
| 2026-09-11 | Approved | proposed | Approved with the two sibling RFCs; landed last of the three |
| 2026-09-11 | F1–F7 implemented | proposed | Badge and restore button deleted, frame always rendered and always the target, `'Take snapshot'` + `captureHint`, load-wording on `restoreHint`, story copy corrected. V1 pass |
| 2026-09-11 | Implementation note | proposed | The `!isCurrent` gate had **two** consumers, not one: the restore button and (per the thumbnail RFC's G2) the thumbnail's interactivity. Removing the badge meant removing both, so the current row is now restorable like any other — the tint is all that distinguishes it |
| 2026-09-11 | Implementation note | proposed | The no-image case needed a real placeholder (a muted-fill frame with a centred `ImageOff` glyph), not just "render the frame anyway": an empty bordered box reads as a broken image rather than a control |
