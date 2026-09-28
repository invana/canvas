# Handoff — canvas playbooks + one history

Paste the block below into a new session. Written 2026-09-28, right after the RFC was
accepted. Nothing has been implemented or committed yet.

---

Implement the accepted RFC docs/rfcs/feat/2026-09-28-an-analysis-cannot-be-recorded-or-replayed.md,
starting with PR 1. Read the whole RFC first; it is the contract. The long design discussion
behind it is the "Canvas Playbooks" design doc (claude.ai artifact FctDKaBeSwNxqmkFhWQY41,
revision 7); every decision from it is copied into the RFC's §7 (D-1 … D-15, all accepted).

STATE OF THE TREE

- Branch feat/commands-phases-a-b-c (last commit c3568fad, the command-palette work from a
  parallel session). A parallel session is active on this branch, so check `git log`
  before assuming anything.
- Uncommitted, from the playbook design session only: the new RFC, its index entry in
  docs/README.md, four 📋 rows in roadmap.md (State + Interactions tables), and this
  handoff file.
- BEFORE THE FIRST CODE CHANGE: ask the maintainer which branch PR 1 goes on. Don't switch
  branches or commit unasked.

THE MODEL (do not re-litigate; the maintainer went through seven revisions to get here)

- Playbook = SCRIPT. canvas.playbook is a list of JSON StepSpecs plus a position.
  addStep(json) only appends (the canvas does not change); next / previous / goTo play a
  step by calling the ordinary canvas methods. No function-taking API: step(fn), apply,
  mark and history.addStep were all rejected (RFC §1 R3, R4).
- History = RECORD. canvas.history becomes a view of ONE internal operation log (view +
  graph stacks merged, no limit), written only by the canvas, with a free-text `actor` on
  every entry (plus optional title, stepId). Undo is linear across actors.
- ONE data door: the EXISTING GraphStore.applyDelta({ added, updated, removed }) at
  packages/graph/src/store/GraphStore.ts:1377, extended with hidden / shown / pinned and
  an options arg { actor, coalesce }. Every other public writer becomes a wrapper.
  Behaviour-derived writes go through an unrecorded store.internal path.
- The canvas has NO lens / filter. Queries, filters and fetching belong to the Invana
  engine, which answers prompts in the StepSpec format.

PR 1 = rows F1–F6 + F17 (D-15). Useful on its own, no playbook yet.

- F1 canvas-core types (src/state/log/): LogPart, LogEntry, Delta, StepSpec, PlaybookSpec,
  OperationLog, HistoryView, Playbook, DataOpAdapter. Types only; core imports nothing.
- F2 canvas-store createOperationLog replacing createHistory
  (packages/canvas-store/src/port/createHistory.ts; keep createHistory as a deprecated
  wrapper). Classification (G5): definition patches undoable; selection / focus / inspect /
  camera intent recorded but skipped by plain undo; camera frames / hover / layout
  progress not recorded.
- F3 Canvas wiring (packages/canvas/src/engine/Canvas.ts:247, :361–391). KEEP the reconciler
  at :369 and the baseline write at :1120 — Studio undo depends on both (V1 is the control).
  New `actor` option on Canvas, default 'user'.
- F4 GraphHistory keeps its public API but records into the shared log; drop the two-stack
  "newer top" arbitration in the history.undo / history.redo overrides and
  GraphHistoryProvider; deprecate GraphCanvasOptions.history.limit.
- F5 applyDelta as the only recorded writer; wrappers for addNode / updateNode / removeNode /
  addData / hideNodes / showNodes / setPinned / clear / bulk / GraphLayer.setData; batch(fn)
  = one entry; forward / inverse move from GraphHistory into GraphStore. Keep applyDelta's
  existing order and skip-unknown-ids behaviour (V5). Hot path: V10 perf check.
- F6 store.internal for derived writes: Entrance, NodeCentrality, CollapseExpand,
  ParallelEdge, NodeResize behaviours and layout position writes.
- F17 regenerate API surface snapshots: pnpm build && node scripts/check-api-surface.mjs --write

Then PR 2 = F7–F12 (relayout on hide/show + onData throttle/preserveCamera at
GraphCanvas.ts:247; ClickSelectBehaviour follows interaction.selection; new FocusBehaviour
+ its canvas-ui editor + `kind`; interaction.inspect / cameraIntent + ClickViewBehaviour;
commands.runAsync; private whenSettled). PR 3 = F13–F16 (createPlaybook + validateStepSpec,
history read helpers, coalesce merging, usePlaybook / useHistoryEntries / useGraphStore).
F18–F23 are deferred.

HOW TO WORK

- Rule 15 lifecycle: after each PR's rows are written and building, set those rows to
  `implemented` (or `landed` once every covering §6 check passes), update the Row-status
  counts, and append §8 History with what the implementation taught the document. A row
  that turns out wrong gets `rejected` or `superseded`, never deleted.
- Rule 10: NO tests in packages/canvas. Log and playbook logic lives in canvas-store so it
  is testable there (packages/canvas-store/tests/log/…); graph tests under
  packages/graph/tests/.
- Rule 11: no Storybook story edits unless asked. Use existing stories as checks:
  graph/Layer/Streaming (V13 control), canvas-ui/editors/CanvasSettingsEditorPanel (V1).
- Rule 12: FocusBehaviour ships a canvas-ui editor (fields.ts + mapping.ts + panel) and
  `override readonly kind = 'focus'`.
- Rule 16: every export change needs the api/*.surface.txt snapshot regenerated in the
  same change.
- Boundaries: zustand / immer only inside canvas-store; canvas-core imports nothing.
- Storybook reads dist/, so rebuild a package after editing it; smoke-test in a VISIBLE tab.
- Gates: pnpm build && pnpm check-types && pnpm lint (lint runs check-boundaries and
  check-api-surface), plus the package tests.
- Commit or push only when the maintainer asks in that message.
