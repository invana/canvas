---
id: feat-2026-10-21-an-annotation-is-part-of-the-graph
type: feat
title: An annotation is part of the graph — a card node beside its record, laid out with the data, hidden in one click
status: implemented
opened: 2026-10-21
decided: 2026-10-21
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas, pkg:@invana/canvas-react, pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: supersedes-part-of, object: rfc:feat-2026-10-21-the-board-cannot-show-what-people-noted-on-the-data }
  - { predicate: depends-on, object: rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story }
---

| | |
|---|---|
| Motivation | Annotations draw as a DOM overlay over the canvas: the layout never sees them, a separate pass dodges them every camera frame, and a PNG export leaves them out |
| Design | An annotation is drawn **in the graph**: a card node of the reserved type `annotation` beside its record, joined by a dashed `annotates` edge. Layouts place cards like any node, export carries them, the theme colours them. The host's data, the provider, the panel, the Legend and the `GraphBoard` props do not change |
| Rows | F1–F4, F6–F14, F15–F20 implemented · F5 superseded by F15 |
| Open decisions | none — D1–D5 accepted on 2026-10-21 |

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The layout does not know a card exists; overlaps are avoided after the fact by a grid search re-run on every camera frame | `file:packages/canvas-ui/src/board/annotations/layout.ts` (`sym:placeCards`) | rfc:feat-2026-10-21-the-board-cannot-show-what-people-noted-on-the-data §2 step 6 |
| M2 | A PNG export captures the canvas's pixels only — annotations are missing | same RFC §8, 2026-10-21 | follow-up row there |
| M3 | Cards are a second drawing of the board's look (kit `AnnotationCard`), outside the theme and LOD the graph has | `file:packages/canvas-ui/src/board/annotations/AnnotationsOverlay.tsx` | D1 there |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `BoardAnnotation`, `AnnotationView`, `AnnotationsProvider`, `AnnotationsViewPanel`, the Legend section and the `GraphBoard` annotation props stay as they are | prior RFC F1, F2, F5–F8 | a host (Invana Studio `DataBoardPage`) changes nothing |
| 2 | The provider **projects** each visible note or value annotation into the graph store: node `annotation:<id>` of type `annotation`, edge `annotates:<id>:<record>` to each record | `sym:GraphStore.applyDelta` | layouts, hit-testing, export and the minimap see cards |
| 3 | Projection writes as actor `annotations`, which `sym:UnsavedChangesBehaviour` counts as saved | `savedActors` | annotating never marks the board unsaved |
| 4 | One guard, `sym:isAnnotationElement`, keeps cards out of data: edit ops, the Legend's type list and counts, Element, expand, search and data export skip them | `sym:unsavedToEditOps`, `sym:LegendViewPanel` | a card never reaches the host's database as a record |
| 5 | A card is a freeform structure, `sym:annotationCardStructure` (graph): colour strip, author mark, text (3 lines), *value then → now*, meta; colours from palette keys `warning` · `primary` · `success` · `destructive` · `muted` the token sync publishes | `sym:schemaCardStructure` (same mechanism) | the card follows the theme with no host read |
| 6 | A new annotation is **placed beside its record without moving anything else**: the write is marked `relayout: false`, and the card takes the nearest free spot by the graph's own bounds. The next layout run lays every card out with the data | `sym:GraphCanvas.wireActiveLayout` re-runs on `data:changed` today | writing a note never makes the graph jump |
| 7 | Highlight is the records' `highlighted` state; group is a **member frame** — a frame drawn round its members' bounds without re-parenting them (new in graph) | `sym:GraphLayer` group frames | a group never moves a record into a folder |
| 8 | `density: 'badges'` projects one count pill per annotated record instead of its cards | step 2 | one projection, two densities |
| 9 | The Legend's *All* eye hides every annotation — cards, edges, highlights, frames — in one click by removing the projection; the counts stay | prior RFC F8 | one click, and a hidden card takes no layout space |
| 10 | Editing stays DOM, canvas-ui's: the selected card gets the format bar and an in-place text editor positioned over its node; nothing else is DOM | `sym:camera.toScreen` | one projected element, not every card every frame |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| rfc:feat-2026-10-21-the-board-cannot-show-what-people-noted-on-the-data | supersedes-part-of | implemented, uncommitted | the data shape, provider, panel, Legend, props, tools (F1, F2, F4–F9); its D1 (DOM overlay) and D4 (overlay rectangle) are superseded, F3's drawing and `layout.ts` go |
| rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story | depends-on | P0–P4a implemented | `sym:GraphBoard`, the token sync, freeform structures |

## 4. The change

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `pkg:@invana/graph` `sym:annotationCardStructure` | the card as a freeform structure | M3 | how cards look | F2 |
| F2 | defect | implemented | `pkg:@invana/canvas-react` `sym:DESIGN_KIT_TOKENS` | publish `warning` · `success` · `destructive` · `primary` palette keys | colour by annotation colour | none for hosts without the tokens — fallbacks | — |
| F3 | defect | implemented | `pkg:@invana/graph` `sym:isAnnotationElement` | the reserved type and edge type, one guard | step 4 | a consumer that reads every node and is missed | — |
| F4 | defect | implemented | `sym:unsavedToEditOps`, `sym:UnsavedChangesBehaviour` | skip annotation elements; `annotations` among saved actors | never saved as data | — | F3 |
| F5 | defect | superseded | `pkg:@invana/graph` store write option | `relayout: false` on a delta; `wireActiveLayout` skips it | step 6 | engine — every layout | — |
| F6 | defect | implemented | `pkg:@invana/graph` placement | place a new card beside its record in free space | step 6 | — | F5 |
| F7 | defect | implemented | `pkg:@invana/graph` member frame | a frame round members' bounds, no re-parenting; follows them | group without folders | engine — drawn per frame like groups | — |
| F8 | defect | implemented | canvas-ui `board/annotations/projection.ts` | provider → store: cards, edges, highlight states, member frames, badge pills; hidden ones removed | steps 2, 8, 9 | the core of the change | F1–F7 |
| F9 | defect | implemented | canvas-ui `AnnotationsOverlay` | down to the selected card's format bar and text editor | step 10 | — | F8 |
| F10 | defect | implemented | canvas-ui `board/annotations/layout.ts` | deleted | M1 | — | F8 |
| F11 | defect | implemented | canvas-ui Legend, Element, expand, export | skip annotation elements | step 4 | — | F3 |
| F12 | defect | implemented | canvas-ui Annotate tools | hit-test cards as nodes; a click on a card opens its detail | — | — | F8 |
| F13 | defect | implemented | stories | `graph/Nodes/AnnotationCard`, `graph/Groups/MemberFrame`, `canvas-ui/apps/GraphCanvasApp/BoardAnnotate` (rewritten), `…/BoardAnnotationsHideAll`, `…/BoardAnnotationsLayout` | rule 11 | — | F1–F12 |
| F14 | dressing | implemented | `pkg:@invana/ui` `AnnotationCard` | no longer drawn on the board; kept for off-board surfaces (D4) | — | — | F8 |

**Found while building**

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F15 | defect | implemented | `pkg:@invana/graph` `sym:GraphCanvas.wireActiveLayout` | a card added with a place, or any annotation element removed, never re-runs the active layout; a card added while a layout runs joins a run. Replaces F5: a new card is added **pinned** (an existing rule: hand-placed adds never re-run) and unpinned a frame later | hiding and showing annotations leaves every record where it is | engine — every layout | F6 |
| F16 | defect | implemented | `sym:AnnotationsProvider.commit` | the save runs outside a state updater | under StrictMode the updater ran twice — every annotation written on the board was created twice | — | — |
| F17 | defect | implemented | `sym:AnnotationsProjection` | templates and highlight rings installed per layer instance | a StrictMode remount's layer drew frames as default circles | — | F8 |
| F18 | defect | implemented | `sym:NodeCentralityBehaviour` · `sym:EraseBehaviour` · `sym:GraphLayer.exportData` · `sym:deriveSchema` | skip annotation elements; a record's annotation links never count to its size; erasing a record drops its links unrecorded | cards are never resized, erased as data, exported or typed | — | F3 |
| F19 | defect | implemented | `sym:GraphLayer` member frames | tracked on every add, including a replayed one | a replayed add left the frame wrapping nothing | — | F7 |
| F20 | defect | implemented | `sym:recordsOnly` (graph) | the records among any element list | one helper for every panel that lists the data | — | F3 |

## 5. Blast radius

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | Invana Studio `DataBoardPage` | host | props unchanged | none; its e2e reads cards from the canvas, not the DOM |
| X2 | Studio `useDataBoards` (`itemsFromStore`, `capturePositions`) and `ExplorerViewPanel` | host | read every store node | skip `sym:isAnnotationElement` — done |
| X3 | `story:canvas-ui/apps/GraphCanvasApp/BoardAnnotate` · `…/BoardAnnotationBadges` · `…/BoardAnnotationsViewer` | stories | drawing moves into the canvas | rewritten |
| X4 | `pkg:@invana/ui` `AnnotationCard` | kit | unused on the board | kept (D4) |
| X5 | layouts (ELK, force, tree) | engine | a card is a node with one edge | ELK layered puts it one column right of its record; force beside it |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | tests | graph: guard, edit ops skip, member frame not placeable, `placeBeside` (4 tests; 405 total) | annotation elements never in ops; a frame never placed | F3, F4, F6, F7 |
| V2 | pass | story walk | `BoardAnnotationsLayout` on *Flow →* (ELK) after *Run the layout* | no card overlaps a node or a card. Under *Network* (force) cards can still touch nodes — force separates circles, not rectangles | F1, F6, F8 |
| V3 | pass | story walk | `BoardAnnotationsHideAll` | one click on *All annotations* hides cards, links, rings and the frame, counts stay; a second click restores them; records do not move | F8, F15 |
| V4 | pass | Studio e2e (`zz-annotations-probe`, live engine) | Explorer: engine annotations drawn, listed, deleted; one written on the board with the Annotate tool | written once; undo stays empty; nothing unsaved | X1, X2, F16 |
| V5 | pass | control | `GraphBoard`, `CanvasExplorer`, the panel stories | unchanged, no console errors | all |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Where cards draw | DOM overlay · a separate canvas layer · nodes in the graph | nodes in the graph — the only one the layout sees without new layout code | accepted |
| D2 | A new card | full relayout · placed beside its record | placed beside; the next layout run includes it — the graph never jumps under a note | accepted |
| D3 | Group | member frame (new) · drop groups | member frame — a group never re-parents a record | accepted |
| D4 | The kit's `AnnotationCard` | delete · keep for off-board surfaces | keep until the session view (Invana slice 2) is designed | accepted |
| D5 | A hidden annotation | stays in the store, invisible · removed from the projection | removed — it takes no layout space | accepted |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-21 | Opened at the maintainer's request: annotations belong to the canvas, and the layout must consider them; one click in the Legend hides them all | proposed | the prior RFC's author session was asked to hand over |
| 2026-10-21 | Implemented: annotations drawn in the graph; F15–F20 found while building; verified in Storybook and in Invana Studio against the live engine | implemented | a card is placed clear of nodes, not of the board's chrome — a re-shown card can sit under an open panel |
