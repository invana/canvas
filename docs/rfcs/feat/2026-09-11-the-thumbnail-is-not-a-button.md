---
id: feat-2026-09-11-the-thumbnail-is-not-a-button
type: feat
title: The thumbnail shows the snapshot but cannot open it — the only way back is a button underneath
status: proposed
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: depends-on, object: rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-a-version-label-is-fixed-at-capture }
---

# The thumbnail is not a button

Make a row's thumbnail the **primary restore affordance** in `sym:CanvasSnapshotsViewPanel`:
click the picture and the snapshot loads onto the canvas, with a tooltip that says so before
the click. The existing restore button stays — the picture is a shortcut, not a replacement.

| | |
|---|---|
| Gap | The thumbnail is inert markup — `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L375-L386` builds an `<img>` or a slot `<div>` with no handler, no tooltip, no focus |
| Why it reads as clickable | It is a picture of a state, in a list, above a button that loads that state. Every timeline UI (Figma, Google Docs, Time Machine) opens a version from its preview. The one thing it looks like it does is the one thing it doesn't |
| Shape | The row wraps the thumbnail node in a flat ghost `Button` + the package's shared `sym:Tooltipped`, firing the same `onRestore` the button below already fires |
| Inert where restore is | No click on the **Current** row — the restore button is already hidden there (`#L283`) — and disabled while `isRestoring` |
| Hard dependency | `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` F1–F3. Until restore actually restores, clicking the picture produces a toast and nothing else — a worse lie than an inert image (R1) |
| Non-goal | Removing the restore button, a hover preview/scrub, click-to-zoom the thumbnail, and any change to how thumbnails are produced (that is F4/F5 of the other RFC) |
| Row status | rows: **implemented 5** (F1–F5) · verification: **pass 2** (V1, V5) · **pending 4** (V2, V3, V4, V6) · **superseded 1** (V7) · decisions: **accepted 3** (D-2 … D-4) · **superseded 1** (D-1, by the chrome RFC) |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | The thumbnail has no interaction of any kind | `file:…/CanvasSnapshotsViewPanel.tsx#L374-L386` | `const slot = renderThumbnail?.(v)` → a `<div>` or an `<img alt="" loading="lazy">`. No `onClick`, no `title`, no `tabIndex` |
| S2 | Restore is reachable only from a full-width button below the row's text | `file:…/CanvasSnapshotsViewPanel.tsx#L283-L293` | `{!isCurrent && <Button variant="outline" …>{restoreLabel}</Button>}` — correct, but the least glanceable part of the row |
| S3 | The picture is the only part of the row that identifies the snapshot | `file:…/CanvasSnapshotsViewPanel.tsx#L1-L20` | Labels are host-generated ("Manual capture"), summaries are counts. The thumbnail is what tells two snapshots apart — and it is the one element you cannot act on |
| S4 | The row already spends its largest area on the thumbnail | `#L376` — `aspect-video w-full` | ~55% of the row's height is a click target that isn't one |
| S5 | The panel has a house tooltip wrapper, and no `view-panels/` surface uses it yet | `file:packages/canvas-ui/src/components/Tooltipped.tsx#L38-L50`; `grep Tooltipped packages/canvas-ui/src/view-panels/` → no hits | `sym:Tooltipped` renders the child unwrapped when `label` is empty, so it costs nothing when unused. `file:packages/canvas-ui/CLAUDE.md#L108` makes it the standard for every interactive control |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | This can land before the snapshot RFC | **No** | Both hosts' `onRestore` currently just set a current id and show a message (`file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L206-L213`). A tooltip promising "loads this snapshot onto the canvas" over a click that loads nothing is a *new* false claim, not a missing one |
| R2 | Make the whole **row** clickable instead | **No** | The row holds a rename field, a rename button and a restore button. A row-level handler would fire on every click that misses them, and `event.stopPropagation()` on three children is the shape of a bug |
| R3 | Drop the restore button once the picture is clickable | **No** | The button is the labelled, keyboard-obvious path and the only thing that names the action in words. A picture is a shortcut for people who already know |
| R4 | Reuse `restoreLabel` as the tooltip text | **No** | Its default is `'Open as new canvas'` — a *fork*, which is a different promise from "load this onto the canvas", and D-1 of the other RFC has not settled which one restore is. A separate optional prop lets the two stay honest (D-2) |
| R5 | A wrapping `Button` is safe for the `renderThumbnail` slot too | **Mostly — with one written constraint** | The slot exists for a lazily-loading image (`#L15-L19`), which is non-interactive. But nesting a host's own button inside ours is invalid HTML, so the prop's doc must say the slot is presentational (D-3) |
| R6 | A `title` attribute would do instead of a real tooltip | **No** | `file:packages/canvas-ui/CLAUDE.md#L108` requires the Radix tooltip via `sym:Tooltipped`; a native `title` is slow, unstyled, and invisible to touch |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | The wrap happens in `sym:SnapshotRow`, not at the build site — the row is where `onRestore` / `isCurrent` / `isRestoring` already are | `#L374-L386` builds the node; `#L283` holds the restore logic | The parent keeps composing the thumbnail; the row decides whether it is a control |
| G2 | Interactive only when `!isCurrent`; otherwise the node renders exactly as today | S2, and symmetry with the hidden restore button | The snapshot you are already looking at is never a target |
| G3 | The control is a flat ghost `Button` (`h-auto w-full p-0 overflow-hidden`) containing the thumbnail node | root rule 13 + the house "no raw `<button>`" precedent in `sym:PropertiesEditor` | Focusable, Enter/Space-activatable, no new DOM primitives |
| G4 | Wrapped in `sym:Tooltipped` with `side="left"` (the panel docks right) and the panel's `restoreHint` text | S5, `file:packages/canvas-ui/src/components/Tooltipped.tsx#L38` | The promise is visible **before** the click, which is the half of the ask that prevents surprise |
| G5 | New optional prop `restoreHint?: string`, default `'Click to load this snapshot onto the canvas'` | R4 | Host-overridable, and independent of `restoreLabel`'s fork-flavoured wording |
| G6 | Hover affordance on the frame: `ring-2 ring-primary/40` + `cursor-pointer` via the row's existing `group` | The `group` class is already on the row root (added for the rename pencil) | The picture announces itself as a control on hover, matching the pencil's behaviour |
| G7 | `aria-label` = `${restoreHint}: ${title}` | The `<img>` is `alt=""` — decorative — so the button must carry the name | A screen reader gets "Click to load this snapshot onto the canvas: Payments slice", not "button" |
| G8 | Disabled while `isRestoring`, like the restore button | `#L287` | Two affordances, one in-flight state — no double-restore |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` | depends-on | proposed | Its F1–F3 make restore real. This RFC is inert (and harmful, R1) without them |
| `rfc:feat-2026-09-11-a-version-label-is-fixed-at-capture` | relates-to | proposed | Same row, same pattern: a flat ghost `Button` wrapping presentational content, revealed on `group-hover`. G3/G6 reuse it verbatim |
| `file:packages/canvas-ui/CLAUDE.md#L107-L108` | relates-to | active | Tooltip-every-control, and `ACTIVE_CLASS`-style shared classes over per-component styling |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx` | Add `restoreHint?: string` to `sym:CanvasSnapshotsViewPanelProps` (G5) and thread it to the row | The tooltip text exists and is host-overridable | low — additive optional prop | — |
| F2 | defect | implemented | same, `sym:SnapshotRow` | Wrap `thumbnail` in `sym:Tooltipped` + a flat ghost `Button` when `!isCurrent`, with `aria-label` and `disabled={isRestoring}` (G1–G4, G7, G8) | Clicking the picture restores | medium — first interactive element the panel puts around host-supplied content (R5) | F1 |
| F3 | dressing | implemented | same | Hover ring + `cursor-pointer` on the frame (G6) | The picture looks clickable before it is hovered-and-guessed | low — droppable alone | F2 |
| F4 | defect | implemented | same, `renderThumbnail` TSDoc + module header | State that the slot must be presentational (R5) and that the frame is a restore control | The constraint is written where a host reads it | low | F2 |
| F5 | defect | implemented | `file:packages/canvas-ui/src/components/index.ts` (or the barrel path `sym:Tooltipped` is exported from) | Confirm `sym:Tooltipped` is importable from within `view-panels/` without a cycle; adjust the import if not | The first `view-panels/` tooltip lands cleanly | low — intra-package import (D-4) | — |

## 5 Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:Tooltipped` → `TooltipProvider` per instance | One provider per thumbnail, one per row | A long timeline mounts N providers. `sym:Tooltipped` is already used this way across the toolbars, so this is the house cost, not a new one (V6 measures it) |
| U2 | `onRestore` semantics — replace vs fork (D-1 of the other RFC) | The tooltip's wording claims one of them | If restore forks, `restoreHint`'s default sentence is wrong and must change with it |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Storybook host | Thumbnails become clickable; its `renderThumbnail` returns a plain `<img>`, so R5's constraint holds | None |
| D2 | `story:canvas-ui/apps/AppLayoutV2` | Storybook host | Same, per board; it passes no `renderThumbnail` | None |
| D3 | `sym:CanvasSnapshotsViewPanelProps` | Published API | One new optional prop; export names unchanged, so no surface snapshot diff | V5 |
| D4 | Invana app | Published API | Hosts whose `renderThumbnail` returns something interactive get nested interactives | F4 documents it; call it out in the release note |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm --filter @invana/canvas-ui check-types` | build | clean | F1–F5 |
| V2 | pending | Hover a thumbnail, then click it | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Tooltip reads the hint; click loads that snapshot onto the canvas (needs the other RFC's F1–F2) | F2, F3 |
| V3 | pending | Tab to a thumbnail, press Enter | browser | Restores — same path as the click | F2, G7 |
| V4 | pending | **Control** — a row while `isRestoring` | browser | Thumbnail disabled. (The Current half of this check is **superseded**: the chrome RFC removed the badge and the `!isCurrent` gate, so the current row is restorable like any other) | F2, G8 |
| V5 | **pass** | `pnpm --filter @invana/canvas-ui build && node scripts/check-api-surface.mjs` | build gate | No surface diff | D3 |
| V6 | pending | A timeline of 50 rows, hover/scroll | browser | No perceptible delay from the per-row `TooltipProvider` (U1) | F2 |
| V7 | **superseded** | A row with `hasThumbnail` but no loaded image | browser | Reversed by `rfc:feat-2026-09-11-snapshot-rows-wear-version-control-chrome` F3: with the restore button gone the skeleton **must** be clickable, or the row is a dead end. Re-checked there as its V3 | F2 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Does the skeleton / no-thumbnail row get the click too? | picture only · any frame · whole thumbnail area incl. skeleton | **Superseded — every frame is clickable.** The recommendation held only while the restore button existed; the chrome RFC removed it, so "the button is right there" stopped being true and a picture-only target would strand rows with no image | superseded |
| D-2 | Tooltip text: new `restoreHint` prop or reuse `restoreLabel`? | new prop (G5) · reuse | **New prop** — and `restoreLabel` is now inert and deprecated: the hint is the only wording that names the restore action | accepted |
| D-3 | Wrap the `renderThumbnail` slot as well, or only the plain `<img>`? | both (+ document the constraint) · plain only | **Both, documented** (F4) — the constraint is written on `renderThumbnail` and in the component TSDoc | accepted |
| D-4 | Is a `components/` import from `view-panels/` acceptable here? | yes · keep the panel `@invana/ui`-only and inline a tooltip | **Yes** — imported directly from `file:packages/canvas-ui/src/components/Tooltipped.tsx` (not the barrel, so no cycle). The panel header's "import-clean" line was reworded to say it means *cross-package* | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Asked for: clicking the thumbnail loads the snapshot onto the canvas, with a tooltip saying so |
| 2026-09-11 | Approved | proposed | Approved with the two sibling RFCs |
| 2026-09-11 | F1–F5 implemented | proposed | Thumbnail wrapped in `sym:Tooltipped` + a flat ghost `Button`, hover/focus ring, `aria-label`. V1 + V5 pass |
| 2026-09-11 | D-1 and V7 superseded | proposed | By the chrome RFC's F2/F3 — with the restore button deleted, **every** frame must be clickable (skeleton and no-image included), not just a loaded picture. G2's `!isCurrent` gate went the same way |
