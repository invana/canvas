---
id: feat-2026-10-21-the-board-cannot-show-what-people-noted-on-the-data
type: feat
title: The board shows annotations on its records — cards, highlights and groups that follow the data, a panel to read and act on them, and Legend switches to hide them
status: implemented
opened: 2026-10-21
decided: 2026-10-21
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-10-20-the-board-shows-every-tool-at-once }
  - { predicate: relates-to, object: rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed }
  - { predicate: verified-by, object: story:canvas-ui/view-panels/AnnotationsViewPanel/List }
---

| | |
|---|---|
| Motivation | Annotate is a mode with no tools (F15 deferred in rfc:feat-2026-10-20-the-board-shows-every-tool-at-once). A host that keeps annotations on records — Invana's 4.8 — has nowhere to draw them |
| Design | Annotations are **host data**, like `styling`: `GraphBoard` takes `annotations` and calls back on create, update and delete. One provider shares them with a DOM overlay (cards, rings, frames, badges, the format bar), an Annotations rail panel and a Legend section. Annotate's tools become Annotate · Highlight · Group |
| Rows | F1–F9 implemented; F10 deferred |
| Open decisions | none — D1–D5 accepted |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | Annotate's five tools are drawn disabled, *not built yet* | `file:packages/canvas-ui/src/board/presets.ts#L64-L83` | `ANNOTATE_TOOL_COMMAND` registered disabled in `sym:GraphBoard` |
| M2 | `LayerData` has an annotation slot nothing draws | `file:packages/canvas-core/src/state/data/LayerData.ts#L48` | only a telemetry counter reads it |
| M3 | A host whose annotations live on records (in its own backend) cannot show them, nor let a person write one, on the board | Invana Explorer 4.8 | the host's design canvas *Explorer · Annotate* |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `BoardAnnotation` is the shape: `id · kind (note·value·highlight·group) · records [{id, kind, label}] · prop · valueThen · text · label · color (amber·blue·green·red·grey) · author {id, name, initials, kind (person·assistant)} · meta · canEdit · canDelete` | new `sym:BoardAnnotation` | the board never knows a backend; the host maps its rows |
| 2 | `GraphBoard` takes `annotations`, `annotationView` (`{density: full·badges, hidden: {all, mine, others, assistant, highlight, group, ids}}`) with `onAnnotationViewChange`, `annotationActor` (`{canWrite, whyNot}`), and `onAnnotationCreate` · `onAnnotationUpdate` · `onAnnotationDelete`. Without them it keeps its own state, so a story plays | `sym:GraphBoardProps` | controlled like `styling`; the host persists |
| 3 | `AnnotationsProvider` (inside the canvas root) holds them and the selection — the annotation selected, the record open in the panel, the one open in detail | new | the overlay, the panel and the Legend agree without events |
| 4 | `AnnotationsOverlay` is a DOM layer over the canvas host: it reads node positions from the graph store and re-projects with `camera.toScreen` on `input:camera:pan` · `input:camera:zoom` and the layer's `positions:updated`, once per frame | `sym:HoverElementPreviewBehaviour` (camera), `sym:UnsavedGhostLayer` (positions) | cards follow layout, pan and zoom |
| 5 | It draws in screen space: an SVG for leaders, highlight rings and marked relationships, group frames and their labels; HTML for cards (kit `AnnotationCard`), badges and the format bar | kit `AnnotationCard` | no pixi code; nothing in the scene graph |
| 6 | Cards never cover cards: each keeps its offset beside its record unless that overlaps another card, a group's label, a node's label or the board's chrome (row, rail, open panel, dock, presenter); then it takes the nearest free spot, by a grid search weighted to stay near its record. The selected card reserves its format bar in the same pass | host design canvas | crowded boards stay readable |
| 7 | Annotate's tools are `tool.active` values `annotate` · `highlight` · `group`. With one active the overlay takes the pointer: Annotate hit-tests a node or relationship; Highlight takes a click or a drag; Group a drag around two or more nodes | `sym:BOARD_ROW_ITEMS` | Edit's tools are untouched |
| 8 | Outside Annotate the overlay never takes the pointer except a badge and a card's own buttons | — | a click reaches the graph |
| 9 | `AnnotationsViewPanel` is a rail panel: **list** (on this board · elsewhere, by author), **record** (its values, each annotatable), **detail** (what, on, from, value then and now, delete). `LegendViewPanel` gains an *Annotations* section: All · By you · By others · By the assistant · Highlights · Groups, each with an eye and a count, and *In full · Badges* | kit `LegendItem`, `PropertyList` | one place to read, one to hide |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| rfc:feat-2026-10-20-the-board-shows-every-tool-at-once | relates-to | landed | the mode, the row and the disabled command this replaces (F15) |
| rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed | relates-to | landed | the playbook; a step's annotations are a later row (F10) |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `board/annotations/types.ts` | `BoardAnnotation`, `AnnotationView`, `AnnotationDraft` | the public shape | medium — a public type | — |
| F2 | defect | implemented | `board/annotations/AnnotationsProvider.tsx` | state, selection, controlled/uncontrolled | — | low | F1 |
| F3 | defect | implemented | `board/annotations/AnnotationsOverlay.tsx` | projection, drawing, layout pass, format bar, tools' pointer | M1, M3 | medium — follows every camera move | F2 |
| F4 | defect | implemented | `board/presets.ts` | `ANNOTATE_TOOLS` = Annotate (A) · Highlight (H) · Group (G) on `tool.active`; mode line *Annotate the data* | M1 | medium — changes how BoardModes looks | — |
| F5 | defect | implemented | `board/GraphBoard.tsx` | the props; mounts provider and overlay; drops the disabled command | — | medium — public props | F2, F3 |
| F6 | defect | implemented | `view-panels/annotations/AnnotationsViewPanel.tsx` | list · record · detail | — | low | F2 |
| F7 | defect | implemented | `board/defaultBoardPanels.tsx` | the Annotations panel after Element | — | low | F6 |
| F8 | defect | implemented | `view-panels/legend/LegendViewPanel.tsx` | the Annotations section when a provider is present | — | low — absent without annotations | F2 |
| F9 | defect | implemented | stories | `canvas-ui/view-panels/AnnotationsViewPanel/{List,Record,Detail}`, `canvas-ui/view-panels/LegendViewPanel/Annotations`, `canvas-ui/apps/GraphCanvasApp/BoardAnnotate` | — | low | F1–F8 |
| F10 | defect | deferred | playbook | a step shows its own annotations whatever the Legend hides | unblocked by the host's slice 3 | — | F2 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| B1 | `story:canvas-ui/apps/GraphCanvasApp/BoardModes` | story | Annotate's tools change | none |
| B2 | Invana Studio `DataBoardPage` | host | new optional props | wire them |
| B3 | `pkg:@invana/ui` | dependency | needs `AnnotationCard`, `AnnotationRow`, `AuthorMark` | built in the kit first, with stories |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | story | `AnnotationsViewPanel/List` | on-board and elsewhere rows, author marks | F6 |
| V2 | pass | story | `GraphCanvasApp/BoardAnnotate` | cards follow a drag and a zoom; none overlap | F3, F5 |
| V3 | pass | story | `LegendViewPanel/Annotations` | an eye hides by author; the count stays | F8 |
| V4 | pass | typecheck | `pnpm -r check-types` | clean | F1–F8 |
| V5 | pass | control | `GraphCanvasApp/BoardPanels` without annotations | unchanged | F7, F8 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where do annotations draw | pixi layer · DOM overlay | DOM overlay: cards are text and buttons, and the kit's card is the card | superseded by rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph D1 |
| D2 | Who owns the data | the store's `LayerData.annotations` · the host | the host, like styling: they live in its backend, keyed by record | accepted |
| D3 | Free shapes, arrows, text | keep · drop | drop: an annotation is on data | accepted |
| D4 | Group frame | `BubbleSetsLayer` hull · rectangle | rectangle in the overlay: one labelled box, recomputed from members | superseded by rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph D3 |
| D5 | Stories, though rule 11 asks none unprompted | — | the maintainer asked for a story per panel | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-21 | opened, approved for F1–F9 by the maintainer with the host's 4.8 slice 1 | accepted | F10 waits for the host's authored walkthrough |
| 2026-10-21 | F1–F9 written; stories render (V1–V3), types clean (V4), BoardPanels unchanged (V5); exercised end to end in Invana Studio against a live engine | implemented | the layout pass searches outward in rings rather than the whole board, so it runs every camera frame. Image export does not include the overlay yet — a follow-up row |
| 2026-10-21 | D1 and D4 superseded: annotations draw in the graph, laid out with the data (rfc:feat-2026-10-21-an-annotation-is-part-of-the-graph); this session handed the canvas side over | superseded-in-part | F3's drawing and `layout.ts` are replaced there |
