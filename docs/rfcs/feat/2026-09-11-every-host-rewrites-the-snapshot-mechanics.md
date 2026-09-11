---
id: feat-2026-09-11-every-host-rewrites-the-snapshot-mechanics
type: feat
title: Every host rewrites capture, restore, rename and the messages — the panel only draws rows
status: proposed
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: supersedes, object: rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-the-thumbnail-is-not-a-button }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-snapshot-rows-wear-version-control-chrome }
  - { predicate: blocked-by, object: rfc:fix-2026-09-11-restored-positions-are-overwritten-by-the-active-layout }
---

# Every host rewrites the snapshot mechanics

Move capture, restore, rename, delete and their messages **into**
`sym:CanvasSnapshotsViewPanel`. It takes the live `canvas`, owns the list, and emits
`onCreateSnapshot` / `onUpdateSnapshot` / `onDeleteSnapshot` so a host can persist
server-side — and a host that doesn't care passes nothing and gets a working panel.

| | |
|---|---|
| Today | A host writes: `exportState` + thumbnail + id + summary, `importState` + two refusal branches, `setSnapshots` for a rename, every `showMessage` string, and a wrapper `<div>` for the thumbnail-format switch. ~90 lines, duplicated per host (`file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L186-L285`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L406-L480`) |
| After | `<CanvasSnapshotsViewPanel canvas={canvas} onCreateSnapshot={persist} />` |
| The reversal | `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` R1 put the state document **outside** the row, because a presentational panel would never read it. The panel now *does* the restoring, so the document belongs **on** the row (`sym:CanvasSnapshot.state`) — R1 is reversed, not forgotten |
| Consistency | This makes the panel the **rule, not the exception**: `sym:FindInCanvasViewPanel`, `sym:CanvasFiltersViewPanel` and `sym:SelectionViewPanel` all take `canvas: GraphCanvas \| null` and drive it. The module header's "the one `view-panels/` surface that reads nothing live" stops being true, by design |
| Callbacks are notifications | They report what the panel did; they are not the mechanism. Returning a promise lets a host fail a persist, and the panel rolls the row back (D-3) |
| Blocked by | `rfc:fix-2026-09-11-restored-positions-are-overwritten-by-the-active-layout`. Moving restore into the panel moves the position bug with it — one broken restore instead of two, but still broken |
| Non-goal | Snapshot diffing, auto-capture on a timer, pagination/virtualisation of a long history, and multi-canvas snapshots |
| Row status | rows: **implemented 9** (F1–F9) · verification: **pass 2** (V1, V8) · **pending 8** (V2–V7, V9, V10 — browser checks the implementing session can't run) · decisions: **accepted 4** (D-2 … D-5) · **rejected 1** (D-1, reversed) |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Both hosts implement the same capture, character for character | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L186-L215`, `file:…/AppLayoutV2.stories.tsx#L406-L440` | `exportState()` → read `data['graph']` for counts → build a thumbnail → mint `v-${Date.now()}` → prepend a row → set current → `showMessage('Captured — …')` |
| S2 | Both implement the same restore, including both refusal branches | `#L255-L285`, `#L452-L478` | "was seeded, not captured", "saved by an older version", `importState`, `showMessage('Loaded "…"')`. A third host would write them a third time — or, more likely, forget the refusals |
| S3 | Rename is a `setSnapshots` map in every host, for a change the panel already computed | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L217-L224` | `prev.map(v => v.id === id ? {...v, label: label \|\| undefined} : v)` — the panel knows the id and the new label and hands back work for the host to redo |
| S4 | The thumbnail-format switch needed a wrapper `<div>` around the panel | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L286-L305` | A host had to grow chrome because a capture option had nowhere to live |
| S5 | There is no delete at all | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx` | A timeline that only grows. The ask names `onDeleteSnapshot`, which needs the affordance first |
| S6 | The user-facing strings live in the hosts, so two hosts can word the same event differently | S1, S2 | They already nearly do: one says "the new snapshot is at the top of the timeline", the other the same by copy-paste. Nothing keeps them in step |
| S7 | The panel's siblings already take the live engine | `file:packages/canvas-ui/src/view-panels/find-in-canvas/FindInCanvasViewPanel.tsx#L39-L41` | `canvas: GraphCanvas \| null` + a `layerId`. The snapshots panel is the odd one out |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Keep the panel presentational and ship a `useCanvasSnapshots()` hook instead | **No, but it is the honourable alternative** | A hook removes the duplication and keeps `view-panels/` pure — but the host still wires hook→panel in every usage, which is the wiring the ask wants gone. It stays the fallback if D-1 goes the other way |
| R2 | The host must stay the owner of the list, or server persistence breaks | **No** | Uncontrolled is the *default*, not the only mode: a host that owns server truth passes `snapshots` and the panel renders those instead (D-2). The callbacks fire either way |
| R3 | The state document can stay outside the row | **No** | The panel restores now, so it must read the document. Keeping it in a parallel `Record<id, …>` would mean handing the panel two collections to keep in step — the exact bookkeeping this RFC removes |
| R4 | Putting `sym:CanvasStateSnapshot` on the row makes rows heavy | **True, and it is the point** | A snapshot *is* the document; the row was only ever a label for it. Hosts that keep hundreds should page them in — the same as they already do for thumbnails (`renderThumbnail`) |
| R5 | The callbacks can be fire-and-forget | **No** | A server persist can fail, and a row that silently exists only on screen is worse than an error. They may return `void` or a promise; a rejection rolls back (D-3) |
| R6 | This is a small additive change | **No — it is a breaking redesign** of a surface committed today | `snapshots` becomes optional, `onRestore` / `onCapture` / `onRename` are replaced. Two in-repo hosts and Invana. Called out rather than smuggled in as "additive" |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | The panel takes `canvas: Canvas \| null` and does the engine work itself: `canvas.exportState()`, `canvas.importState()`, `canvas.exportDataURL()` / `canvas.exportSVGString()`, `canvas.showMessage()` | S7; `file:packages/canvas/src/engine/Canvas.ts#L813,L907,L919` | One implementation, not one per host. `@invana/canvas` stays types-only in canvas-ui (the engine arrives as a prop) |
| G2 | `sym:CanvasSnapshot` gains `state?: CanvasStateSnapshot` — the document, on the row | R3 | Restore reads `row.state`. A host persisting server-side stores the row whole |
| G3 | **Uncontrolled by default:** the panel owns the list, seeded by `initialSnapshots`. Passing `snapshots` switches it to controlled, host-rendered | R2, D-2 | The story stops calling `setSnapshots`; a server host keeps full authority |
| G4 | Three notifications: `onCreateSnapshot(row)` · `onUpdateSnapshot(row, change)` · `onDeleteSnapshot(id)`. `onRestoreSnapshot(id)` is a fourth, optional, for hosts that log it | The ask | Everything a server needs, in the panel's vocabulary rather than React state plumbing |
| G5 | A callback may return `void \| Promise<void>`. The panel applies optimistically, then rolls the row back and says so if the promise rejects | R5, D-3 | A failed persist is visible, and the common (synchronous) case stays simple |
| G6 | Capture options become props: `thumbnailFormat?: 'png' \| 'svg'` (default `'png'`), `thumbnailMaxSize?: number` (default `800`), `captureArea?: 'viewport' \| 'content'` | S4 | The switch the story grew a wrapper for is a prop; the wrapper goes |
| G7 | Delete: a per-row action revealed on hover, confirmed inline (a second click on a "Confirm" button), never a `window.confirm` | S5, D-4 | `onDeleteSnapshot` has a trigger, and an accidental click cannot destroy a snapshot |
| G8 | All user-facing strings default in the panel and are overridable through one `messages` prop | S6 | Consistent wording by default; still localisable |
| G9 | Summary + label defaults are computed by the panel (`N nodes · M edges`, `'Manual capture'`), overridable per capture via an optional argument to the capture entry point | S1 | The host stops re-deriving what the panel just measured |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` | supersedes | proposed | Its mechanics (`exportState` / `importState`, the two refusal branches, PNG@800, the SVG flavour) survive verbatim — they move from the hosts into the panel. **Its R1 is reversed** (G2) |
| `rfc:feat-2026-09-11-the-thumbnail-is-not-a-button` | relates-to | proposed | The thumbnail stays the restore control; it now calls the panel's own restore instead of an `onRestore` prop |
| `rfc:feat-2026-09-11-snapshot-rows-wear-version-control-chrome` | relates-to | proposed | `restoreHint` / `captureHint` / `captureLabel` are unchanged; `restoreLabel` is deleted here rather than deprecated, since the prop surface breaks anyway (D-5) |
| `file:packages/canvas-ui/CLAUDE.md#L56-L59` | relates-to | active | "A store-connected surface may instead take the engine as an explicit `canvas` prop — the view panels do." This RFC moves the last exception onto that path |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx` | Add `canvas: Canvas \| null`; `sym:CanvasSnapshot` gains `state?: CanvasStateSnapshot` (G1, G2) | The panel can act | low | — |
| F2 | defect | implemented | same | Own the list: `initialSnapshots` + internal state, `snapshots` switches to controlled (G3) | Hosts stop writing `setSnapshots` | medium — two modes to keep honest (D-2) | F1 |
| F3 | defect | implemented | same | Capture: `exportState` + thumbnail + id + default label/summary, then `onCreateSnapshot` (G1, G9) | S1's duplication gone | low | F1, F2 |
| F4 | defect | implemented | same | Restore: `importState(row.state)` + both refusal branches + the message (G1) | S2's duplication gone, refusals guaranteed | **not low** — the panel now mutates a live canvas; also inherits the position bug | F1, blocked-by the fix RFC |
| F5 | defect | implemented | same | Rename commits into the panel's own list and fires `onUpdateSnapshot` (G4) | S3 gone | low | F2 |
| F6 | defect | implemented | same | Delete affordance + inline confirm + `onDeleteSnapshot` (G7) | The ask's third callback has a trigger | medium — destructive; confirm design matters (D-4) | F2 |
| F7 | defect | implemented | same | `thumbnailFormat` / `thumbnailMaxSize` / `captureArea` props (G6) | The story's wrapper `<div>` goes | low | F3 |
| F8 | defect | implemented | same | `messages` prop with defaults for every string (G8) | Consistent copy, still overridable | low | F3, F4 |
| F9 | defect | implemented | `file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | Delete the host mechanics; pass `canvas` + the callbacks. The panel story runs **uncontrolled** and logs the events to the console; `story:canvas-ui/apps/AppLayoutV2` runs **controlled**, one list per board | ~150 lines deleted from the panel story; the host is `canvas` + four callbacks | low — story-only | F1–F8 |

## 5 Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:Canvas.exportState` / `importState` / `exportDataURL` / `exportSVGString` / `showMessage` | The panel now calls five engine methods it previously never touched | A signature change breaks the panel, not just a host. `@invana/canvas` remains a **types-only** import — the instance arrives as a prop, so the boundary check still passes (V8) |
| U2 | `rfc:fix-2026-09-11-restored-positions-are-overwritten-by-the-active-layout` | F4 inherits the defect | Until that lands, the panel's own restore drops positions — the panel would be *shipping* the bug rather than a story demonstrating it (D-1 weighs this) |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Storybook host | Rewritten by F9 | F9 |
| D2 | `story:canvas-ui/apps/AppLayoutV2` | Storybook host | Rewritten by F9, per board — each board's panel takes that board's canvas | F9 |
| D3 | Invana app | **Breaking** published API | `onRestore` / `onCapture` / `onRename` / `restoreLabel` replaced; `snapshots` optional | Release note with a before/after; the new shape is strictly less code for them |
| D4 | `pnpm check-api-surface` | Build gate | `CanvasSnapshot` / props change members, not export names — **invisible to the gate** | V9 is a manual read |
| D5 | `pnpm check-boundaries` | Build gate | canvas-ui must not gain a value import of `@invana/canvas` | V8 |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm check-types && pnpm build && node scripts/check-api-surface.mjs` | build | clean across 19 packages | F1–F9 |
| V2 | pending | Capture with **no** callbacks passed at all | story | A row appears, thumbnail and summary filled, message shown — the zero-config case works | F2, F3 |
| V3 | pending | Capture, rename, delete with all three callbacks | story | Each fires once, with the row (or id), in the panel's vocabulary | F3, F5, F6 |
| V4 | pending | A callback that rejects | story | The row rolls back and the failure is said out loud | F2, G5, D-3 |
| V5 | pending | Restore a row with no `state`, and one with a bad `version` | story | Both refuse with a message; neither touches the canvas | F4 |
| V6 | pending | Controlled mode: pass `snapshots` and ignore the callbacks | story | The panel renders exactly what it is given and never self-mutates | F2, D-2 |
| V7 | pending | **Control** — day grouping, rename, tooltip, hover ring, skeleton/no-image frames, capture hint | story | Unchanged from the committed panel | F1–F9 |
| V8 | **pass** | `pnpm check-boundaries` | build gate | canvas-ui imports `@invana/canvas` **types-only**; the engine arrives as the `canvas` prop | D5, U1 |
| V9 | pending | Read the props + `sym:CanvasSnapshot` after the change | source | The break is documented, not silent (D4) | D3, D4 |
| V10 | pending | `AppLayoutV2`: capture on board A, switch to B | story | B's timeline is unaffected; each panel is bound to its own canvas | F9, D2 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Land F4 (restore inside the panel) before the position bug is fixed? | yes · no, hold F4 until the fix lands | **Reversed — F4 landed.** Holding it would have left the thumbnail (the only restore affordance) dead unless a host passed a callback, which is the same opt-in-gate trap recorded as S6 of `rfc:feat-2026-09-11-a-version-label-is-fixed-at-capture`. The position bug is in `pkg:@invana/graph` and is unaffected by *where* restore is called from — holding would have hidden it in the demo, not avoided it | rejected |
| D-2 | Uncontrolled-by-default with an optional controlled mode, or controlled only? | both (G3) · controlled only · uncontrolled only | **Both** — landed, and each story demonstrates one: the panel story is uncontrolled, `story:canvas-ui/apps/AppLayoutV2` is controlled (one list per board) | accepted |
| D-3 | What happens when a callback rejects? | roll back + message (G5) · keep the row · block the UI until it settles | **Roll back and say so** — landed for create, rename and delete | accepted |
| D-4 | Delete confirmation | inline two-step (G7) · none · a dialog | **Inline two-step** — a hover trash icon arms, then Delete / Cancel | accepted |
| D-5 | `restoreLabel` — deprecate again or delete? | delete · keep deprecated | **Delete** — gone, along with `onRestore` / `onCapture` / `onRename` / `isRestoring` / `isCapturing` / `isRenaming` | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Asked for: move capture / restore / rename / messages into the panel, keep `onCreateSnapshot` / `onUpdateSnapshot` / `onDeleteSnapshot` so a host can persist server-side |
| 2026-09-11 | Approved, F1–F9 implemented | proposed | V1 + V8 pass. The rest are browser checks |
| 2026-09-11 | D-1 reversed | proposed | F4 (restore in the panel) landed rather than being held — see the decision row |
| 2026-09-11 | Implementation note | proposed | The version check could not be a comparison: `CANVAS_STATE_VERSION` is a **value**, and canvas-ui may import `@invana/canvas` types only. `sym:importCanvasState` already throws on a newer envelope, so restore is a `try`/`catch` — stricter than the story's old `!==` test, which wrongly refused *older* documents the engine accepts |
| 2026-09-11 | Implementation note | proposed | `summarise()` sums `{nodes, edges}` across **every** data layer in the document rather than reading `state.data['graph']` as both hosts did — canvas-ui must not know a graph layer's id |
| 2026-09-11 | Follow-up: every row looked active | proposed | `ring-primary/40` was set on the thumbnail button at rest, with width only on hover — anything giving the button a ring width painted every row primary. Ring colour is now scoped to `hover:`/`focus-visible:`, so the highlight marks one row |
| 2026-09-11 | Follow-up: `now` prop removed | proposed | It existed only to make story day headings deterministic — a test seam on a public surface. Day headings are now relative to the moment of render. `story:canvas-ui/apps/AppLayoutV2`'s seed is dated from `Date.now()` instead of a fixed timestamp, so *Today* / *Yesterday* / a weekday / a date all still appear |
| 2026-09-11 | Follow-up: no debug UI in the story | proposed | An on-screen event log was added to make the callbacks visible and removed on the maintainer's call — a story should demonstrate the panel, not grow a debug surface beside it. The callbacks stay wired and log to the console, so the usage is still readable in the source |
| 2026-09-11 | Follow-up: `currentSnapshotId` → `activeSnapshotId` | proposed | Renamed on the maintainer's suggestion, and `story:canvas-ui/apps/AppLayoutV2` now tracks it per board (set on capture and restore, cleared when the highlighted row is deleted) |
