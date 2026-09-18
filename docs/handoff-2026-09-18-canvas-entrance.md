# Handoff — canvas entrance / auto-fit work

Paste the block below into a new session. Written 2026-09-18, immediately after
commit `d43b6f88` (tree clean, all gates green at that point).

---

Continue the canvas entrance / auto-fit work. Last commit is d43b6f88 on main; tree
was clean and all gates green at that point.

WHAT IS ALREADY IN

- docs/rfcs/fix/2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs.md — landed.
  Canvas._armAutoFit no longer fits before the active layout runs (1.2s grace, all fits
  coalesced onto one rAF); canvas-react layout wrappers skip their own fit when
  Canvas.autoFitArmed; GraphStore has FLAG_PLACED + hasPosition(id) so
  OneShotPositionLayout snaps never-placed nodes instead of gliding them from (0,0).
  fitOnResize was REJECTED and must stay rejected: a resize must not override a camera
  the user panned.
- docs/rfcs/feat/2026-09-17-a-graph-has-no-entrance-on-first-load.md — mostly landed by a
  parallel session: FadeInEffect ('fade-in' shape effect), per-item effect projection in
  GraphLayer (NodeStyle.effects + the new EdgeStyle.effects now actually reach setEffect),
  EntranceBehaviour + canvas-ui editors + canvas-react wrapper, ISurface.setAlpha, and
  config.entrance / config.fitAnimation.
- docs/rfcs/fix/2026-09-17-effective-visibility-is-decided-outside-the-store.md — landed
  with packages/graph/tests/store/effectiveVisibility.test.ts.

FIRST TASK: RECONCILE THE RFCs WITH REALITY

Both 2026-09-17 RFCs were written before that parallel work landed, so their row statuses
and history are stale. Read the actual code, then update each RFC's §4 row Status, the
Row-status counts in the summary, §6 verification results, and append §8 history entries
saying what implementation taught the document. Do NOT start new RFCs for work already in.

THEN, IN PRIORITY ORDER

1. Verify the entrance actually reads well, and tune it. Nobody has watched it yet.
   Use a CDP screencast (Page.startScreencast, collapse consecutive identical frames) —
   NOT single headless screenshots; virtual-time budgets are not reproducible run to run
   and sent me down a wrong path once. Chrome:
   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome ; Storybook on :6006.
   Target story: usecases/by-casestudies/tasks-panel/RunFlow (+ the rose theme).
2. Decide whether the entrance belongs on the six tasks-panel stories, and which form
   (EntranceBehaviour vs config.entrance). Ask before editing stories — rule 11.
   I was mid-way through adding a reveal-connector decoration entrance to PlanFlow when
   we stopped; that edit was rejected and never applied. Decorations are wired end to end,
   so reveal-connector is a valid edge entrance independent of the effects path.
3. Open question D9 in the fix RFC, not yet actioned: config.fitOnLoad re-fits on every
   layout:run:tick / run:end, so a re-layout after a user pan moves the camera — the same
   principle that killed fitOnResize. Needs a "camera is user-owned" bit the engine lacks.
   Diagnose and propose; do not implement without approval.

HOUSE RULES THAT BIT LAST TIME

- Rule 15: RFC before code; update existing RFCs rather than opening new ones for the same
  area. Status is per row; a rejected row is kept, never deleted.
- Rule 11: never create or modify a Storybook story unless asked in that message.
- Rule 14: a pasted error is a request to diagnose and then ask, not to fix.
- Storybook reads dist/, so rebuild a package after editing it.
- Gates: pnpm build && pnpm check-types && pnpm lint (lint runs check-boundaries and
  check-api-surface). New exports mean regenerating api/*.surface.txt in the same change.
- Another session may be editing this repo concurrently — check git status before
  committing, and never commit unless asked in the current message.

The six stories at apps/storybook/stories/usecases/by-casestudies/tasks-panel/ are the test
surface. Their whole definition is literal JSON on purpose — keep it serialisable. Note
PlanFlow.stories.tsx carries a manual fitOnLoad: false that can go back to true now.
