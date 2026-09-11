---
id: feat-2026-09-11-a-snapshot-stores-no-canvas-state
type: feat
title: A "snapshot" stores a picture and a date, not the canvas — and the picture is blurry
status: proposed
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@canvas/storybook, pkg:@invana/canvas-ui, pkg:@invana/canvas, pkg:@invana/renderer-pixijs]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-11-a-version-label-is-fixed-at-capture }
  - { predicate: depends-on, object: file:packages/canvas/src/io/stateExport.ts }
---

# A snapshot stores no canvas state

Two independent gaps behind one row of `sym:CanvasSnapshotsViewPanel`. **(A)** A capture
records a thumbnail and some metadata — no canvas state — so *restore* restores nothing,
and the word "snapshot" is not yet true. `sym:exportCanvasState` / `sym:importCanvasState`
already exist and are wired to nothing. **(B)** The thumbnail is rastered at 288px into a
frame that is ~800 device px wide, so it is a ~2× upscale; `sym:exportSVG` is the crisp
alternative, with one real cost.

| | |
|---|---|
| Gap A | The captured record is `{id, label, capturedAt, summary, by, thumbnail}` (`file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L183-L190`). Nothing in it can reconstruct a canvas |
| Gap A′ | Both hosts' `onRestore` set a "current" id and show a message. Neither loads anything — `file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L206-L213`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L453-L457` |
| Already built | `sym:CanvasStateSnapshot` = `{version, view.definition, view.interaction, data}` — the full self-contained document, with `sym:exportCanvasState` (`file:packages/canvas/src/io/stateExport.ts#L166`) and `sym:importCanvasState` (`#L234`). Zero callers outside `pkg:@invana/canvas` |
| Gap B | `maxSize: 288` (`file:…/CanvasSnapshotsViewPanel.stories.tsx#L140`) into an `aspect-video w-full` frame in a 320–420px panel ⇒ ~300–400 CSS px ⇒ 600–800 device px at DPR 2. The source is upscaled ~2× |
| SVG | `sym:exportSVG` serialises the live specs, takes an `aspectRatio` (the 16:9 frame, letterboxed not cropped) and is resolution-free. Its cost is real and measured below (R4) |
| Ownership | Unchanged. The state blob is a **host record**, not a panel prop — the panel never reads it (R1) |
| Non-goal | Snapshot persistence beyond React state, diffing two snapshots, a restore-into-new-canvas fork, thumbnail caching, and changing `sym:CanvasSnapshot`'s shape |
| Row status | rows: **implemented 6** (F1–F5, F7) · **deferred 1** (F6) · verification: **pass 2** (V1, V8) · **pending 7** (V2–V7, V9 — browser checks the implementing session can't run) · decisions: **accepted 4** (D-1 … D-4) |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | A capture stores pixels and prose, never state | `file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L183-L190` | The object literal is id / label / capturedAt / summary / by / thumbnail. `summary` is a *string* of counts — "20 nodes · 34 edges" — which is a description of state, not state |
| S2 | Restore is a message, not a restore | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L206-L213` | `setCurrentId(id); canvas?.showMessage('Restored "…" as a new canvas')`. The canvas is untouched. `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L453-L457` is the same shape |
| S3 | The capability exists, fully documented, and nothing calls it | `file:packages/canvas/src/io/stateExport.ts#L64-L90` | `sym:CanvasStateSnapshot` is described as "everything a fresh (structurally identical) canvas needs to re-render the same scene" — definition + interaction + per-layer data, versioned |
| S4 | The story's own prose claims more than the code does | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L11-L12` | "answers restore by loading the version's data back onto the canvas" — it does not. The doc describes the intended design; the code stops at the message |
| S5 | The thumbnail is rastered well below its display size | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L140` | `exportDataURL({format:'png', area:'viewport', background:'canvas', maxSize:288})`. The frame is `aspect-video w-full` inside a panel whose `defaultSize` is 320px and `maxSize` 420px |
| S6 | A vector projection of the same scene already ships | `file:packages/canvas/src/io/svgExport.ts#L58`, `file:packages/graph/src/layer/GraphLayer.ts` | `sym:exportSVG` walks visible layers' `toSVG()`; `sym:GraphLayer` implements it. `sym:ExportSvgOptions.aspectRatio` letterboxes the viewBox to a ratio — exactly the 16:9 the row reserves |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | `sym:CanvasSnapshot` should carry the state blob so the panel owns it | **No** | The panel would never read it — it renders label / time / thumbnail / restore. A `state: unknown` prop would add megabytes to a presentational type for nothing. The host keeps `Record<id, CanvasStateSnapshot>` and hands `onRestore` only the id, which is already the signature |
| R2 | The blur is the panel's CSS (`object-cover` on the `<img>`) | **No** | `object-cover` crops to fill, it does not resample softly. The source really is 288px against a 600–800 device-px box |
| R3 | `sym:exportCanvasState` needs work before it can back a snapshot | **No** | It is complete and versioned (`CANVAS_STATE_VERSION`), drops non-serialisable resolvers via `sym:jsonSafe`, and `sym:importCanvasState` takes `skipInteraction` for "restore the scene, keep my camera". The gap is purely that nobody calls it |
| R4 | SVG is strictly better than PNG for a thumbnail | **No — this is the one real trade-off** | `sym:PrimitivesRenderer.toSVG` (`file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L866-L879`) emits **every** instance in the maps, skipping only `visible === false`. There is no viewBox culling, so the document's size tracks the *graph*, not the thumbnail: trivial at 20 nodes, megabytes at 10k. F6 is the deferred fix |
| R5 | An SVG thumbnail will render with the app's fonts | **No** | A `data:image/svg+xml` in an `<img>` is an isolated document that loads no external resources — webfont labels fall back to generic families. Inlining the markup instead avoids this and costs sanitisation thinking (R6) |
| R6 | Inlining SVG markup risks injection from node labels | **No, already handled** | `file:packages/canvas-core/src/lib/svg/markup.ts#L19` escapes `& < > " '` in serialised text |
| R7 | Just raising `maxSize` is enough | **Yes, for the blur** | It removes the upscale with a one-line change and no size surprise. It does not make the thumbnail resolution-free, which is why F4 exists alongside |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | **Capture** calls `sym:exportCanvasState(canvas)` and the host stores the returned `sym:CanvasStateSnapshot` beside the row, keyed by snapshot id | `file:packages/canvas/src/io/stateExport.ts#L166` | The record becomes reconstructive. `summary` stops being the only evidence of what was captured |
| G2 | **Restore** calls `sym:importCanvasState(canvas, state)` | `file:packages/canvas/src/io/stateExport.ts#L234` | Restore restores. The message stays, but now it is true |
| G3 | The state lives in a **second host map** (`Record<string, CanvasStateSnapshot>`), not in the `sym:CanvasSnapshot` row | R1 | The panel's props are untouched — this RFC changes no `pkg:@invana/canvas-ui` type |
| G4 | `summary` is **derived from the captured state** rather than from the live layer at capture time | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L186` reads `store.nodeCount()` live | The line under the title describes the snapshot, not the canvas as it was a moment later |
| G5 | **Blur:** `maxSize` goes to `800` — 2× the panel's 420px `maxSize`, so the image is never upscaled at DPR 2 | S5 | The immediate complaint is gone at a cost of ~4× the bytes of a 288px PNG |
| G6 | **SVG:** a `snapshotSvg(canvas)` helper — `exportSVG(canvas, {area:'viewport', background:'canvas', aspectRatio: 16/9})` → `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent(markup)` | `sym:ExportSvgOptions` | Resolution-free at any panel width, and it drops through the existing `thumbnail` string prop with no panel change |
| G7 | The two flavours are **chosen by the host**, per capture, and the story demonstrates both | D-2 | No new engine API. The trade-off (R4) stays where the host can see it |
| G8 | F6 (deferred): `sym:PrimitivesRenderer.toSVG` gains an optional world-rect argument and skips instances whose bounds miss it | R4 | Would make SVG thumbnails O(visible) instead of O(graph) — the precondition for making SVG the default |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep -rn "exportCanvasState\|importCanvasState" apps packages --exclude-dir=node_modules` | Hits only inside `file:packages/canvas/src/io/stateExport.ts` and the barrel | S3 confirmed: the capability has no callers anywhere |
| T2 | Read `sym:PrimitivesRenderer.toSVG` | Two `for … of instances.values()` loops, `visible === false` the only filter | R4 confirmed: no viewport culling |
| T3 | Read `sym:exportSVG` | `captureRect(canvas, area, padding, aspectRatio)` sets the `viewBox`; layer fragments are appended whole | The viewBox crops *visually*; the markup still carries everything (R4) |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `file:packages/canvas/src/io/stateExport.ts` | depends-on | shipped | The whole of gap A is "call these two functions". No design needed |
| `file:packages/canvas/src/io/imageExport.ts#L22-L23` | relates-to | shipped | Its header already says SVG "is a separate projection of the store (Phase 2), not something `extract` can produce" — F4 is that phase arriving for thumbnails |
| `rfc:feat-2026-09-11-a-version-label-is-fixed-at-capture` | relates-to | proposed | Same surface, same hosts. Its S6 (an opt-in gate with no opted-in host is invisible) is why F1–F3 wire the stories rather than only adding capability |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx` | Capture calls `sym:exportCanvasState`; the document is held in a `Record<string, CanvasStateSnapshot>` beside the rows (G1, G3) | The capture is a snapshot | low — story-only | — |
| F2 | defect | implemented | same | `restore` calls `sym:importCanvasState(canvas, state)` before the message (G2) | Restore restores | **not low** — the first code path that mutates a live canvas from the panel; a bad document leaves a wrecked scene | F1 |
| F3 | defect | implemented | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx` | The same two changes, per board — capture and restore against `canvases[activeBoard.id]` | Both hosts honest | **not low** — per-board; restoring board A's document into board B must be impossible | F1, F2 |
| F4 | defect | implemented | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L140` | `maxSize: 288` → `800` (G5) | The blur is gone | low — larger data URLs in React state | — |
| F5 | defect | implemented | both stories | Add `snapshotSvg(canvas)` (G6) and capture SVG thumbnails, with the PNG path kept and the choice visible (G7, D-2) | Crisp at any size, and the vector path gets a real consumer | medium — document size tracks graph size (R4); fine for `dataset:microservices`, not a default for large graphs | F4 |
| F6 | defect | **deferred** | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L866` | Optional world-rect argument to `toSVG`, culling instances outside it; plumbed through `sym:exportSVG` (G8) | SVG export becomes O(visible) | **not low** — engine API + a contract change in `file:packages/canvas-core/src/contracts/IElementRenderer.ts`, and `sym:HeadlessRenderer` must follow | — |
| F7 | defect | implemented | `file:…/CanvasSnapshotsViewPanel.stories.tsx#L11-L12` | Correct the story header prose once F1–F2 make it true, and say where the state lives (S4) | The doc stops over-claiming | low | F1, F2 |

## 5 Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:CanvasStateSnapshot` / `CANVAS_STATE_VERSION` | F1 stores documents that F2 reads back | A version bump with no migration makes old rows unrestorable. The envelope is versioned precisely for this; the story should say what it does on a mismatch (D-3) |
| U2 | `sym:DataSerializableLayer` implementers | `data` only carries layers that implement it | A layer that doesn't serialise silently contributes nothing to the snapshot — the restore looks partial, not broken |
| U3 | `sym:exportSVG` + `sym:GraphLayer.toSVG` | F5's thumbnail is only as complete as the layers that implement `toSVG` | An overlay layer with no `toSVG` is absent from the SVG thumbnail but present in the PNG — the two flavours are not pixel-equivalent (D-2) |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Storybook host | Capture/restore become real; thumbnails change flavour | F1, F2, F4, F5, F7 |
| D2 | `story:canvas-ui/apps/AppLayoutV2` | Storybook host | Same, per board | F3 |
| D3 | `sym:CanvasSnapshotsViewPanel` public API | Published API | **None** — no prop, type or export changes (G3, R1) | — |
| D4 | Invana app (`canvas_snapshots`) — out of repo | Published pattern | The stories are the reference host; they currently model a snapshot as a picture. After this they model it as a document + a picture | Mirror the pattern when persisting |
| D5 | `pnpm check-api-surface` | Build gate | No engine surface changes while F6 stays deferred | V8 |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm --filter @canvas/storybook check-types` | build | clean | F1–F5, F7 |
| V2 | pending | Capture, move nodes / change layout / pan, then restore | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Positions, layout, camera and selection return to the captured scene | F1, F2 |
| V3 | pending | Restore a snapshot captured *before* a node was added | browser | The added node is gone — the document, not the live store, is the source | F1, F2 |
| V4 | pending | **Control** — rename, day grouping, Current badge, thumbnail slot, capture button | both stories | Unchanged from today | F1–F5 |
| V5 | pending | Capture on board A, switch to board B, restore A's snapshot | `story:canvas-ui/apps/AppLayoutV2` | Impossible from the UI, and if forced, board B is untouched | F3 |
| V6 | pending | Compare thumbnails at 320px and 420px panel width, DPR 2 | browser | PNG@800 sharp at both; SVG sharp at both and on zoom | F4, F5 |
| V7 | pending | Capture with a node label containing `<script>` | browser | The SVG thumbnail renders the text literally (R6) | F5 |
| V8 | **pass** | `pnpm --filter @invana/canvas-ui build && node scripts/check-api-surface.mjs` | build gate | No surface diff | D5 |
| V9 | pending | Log the byte size of both thumbnail flavours for `dataset:microservices` | browser | Recorded in §8 — the number that decides D-2 for larger graphs | F5, R4 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Does restore replace the current canvas, or fork into a new one as the copy claims? | replace in place · fork · replace + keep camera (`skipInteraction`) | **Replace in place** — `sym:Canvas.importState` loads in place and has no fork mode. Settled jointly with `rfc:feat-2026-09-11-snapshot-rows-wear-version-control-chrome`, which removed the fork copy | accepted |
| D-2 | PNG or SVG for the thumbnail? | PNG@800 only (F4) · SVG only (F5) · both, host's choice | **Both, host's choice, PNG the default** — implemented as a PNG/SVG switch above the panel in the story, and the captured size lands in the row summary so V9 is readable in the UI | accepted |
| D-3 | What does a restore do when `version` doesn't match `CANVAS_STATE_VERSION`? | throw · refuse with a message · attempt anyway | **Refuse with a message** — implemented for two cases: an envelope version mismatch, and a seeded row that carries no document at all (the seeded rows were the case the RFC missed) | accepted |
| D-4 | Land F6 (viewport culling in `toSVG`) now or later? | now · after F5 measures V9 | **After V9** — unchanged; F6 stays deferred | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Reported: a snapshot stores no store state so it is not yet a snapshot, and the thumbnail is blurry — could it be SVG? |
| 2026-09-11 | Approved | proposed | Approved with the two sibling RFCs; landed in dependency order (this → thumbnail → chrome) |
| 2026-09-11 | F1–F5, F7 implemented | proposed | Both hosts capture `sym:Canvas.exportState` beside the rows and restore with `sym:Canvas.importState`. V1 + V8 pass; V2–V7, V9 are browser checks |
| 2026-09-11 | Implementation note | proposed | The RFC's D-3 only anticipated a **version** mismatch. The commoner case is a **seeded** row that was never captured here and holds no document — it needed the same refuse-with-a-message path, or every seeded row in the demo would restore nothing silently |
| 2026-09-11 | Implementation note | proposed | Used the `sym:Canvas` instance methods (`exportState` / `importState` / `exportSVGString`) rather than the free `sym:exportCanvasState` / `sym:exportSVG` the RFC cited — same functions, and the story reads as the product would |
